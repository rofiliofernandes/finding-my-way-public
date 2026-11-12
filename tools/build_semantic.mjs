// Build the "search by meaning" index: embeds every 3-verse passage of the Bible.
// Usage (from the finding-my-way folder, after `npm i onnxruntime-node@1.21.0`):
//   node tools/build_semantic.mjs <model.onnx> <vocab.txt> <cls|mean> "<query prefix>" [precomputed-dir]
// The shipped index used all-MiniLM-L6-v2 (int8 ONNX) with mean pooling and no prefix:
//   node tools/build_semantic.mjs all-MiniLM-L6-v2-q8.onnx vocab.txt mean ""
// (model + vocab: Hugging Face "sentence-transformers/all-MiniLM-L6-v2", or the npm package
//  @clay-design-system/embeddings, folder model/). Takes about 5 minutes on a laptop.
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const ort = require(process.env.ORT_NODE || "onnxruntime-node");
import { WordPiece, embedBatch } from "../site/js/embed.js";
import { TOPICS } from "../site/js/topics.js";

const [modelPath, vocabPath, pooling, queryPrefix = "", pre] = process.argv.slice(2);
const SITE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../site");
const OUT = SITE + "/data/semantic/";
const SCALE = 127;
const PART = 20 * 1024 * 1024; // Cloudflare Pages allows files up to 25 MiB

const tok = new WordPiece(fs.readFileSync(vocabPath, "utf8"));
const sess = await ort.InferenceSession.create(modelPath);
const canon = JSON.parse(fs.readFileSync(SITE + "/data/canon.json"));
const plain = (t) => t.replace(/\n\t?/g, " ").replace(/\s+/g, " ").trim();

// 1. passages: windows of 3 verses, stepping by 2 (each verse appears in one or two windows)
const chunks = [];
for (const [bi, b] of canon.books.entries()) {
  const d = JSON.parse(fs.readFileSync(`${SITE}/data/books/${b.id}.json`));
  for (const ch of d.chapters) {
    const v = ch.v;
    for (let i = 0; i < v.length; i += 2) {
      const w = v.slice(i, i + 3);
      chunks.push({ bi, b: b.id, c: ch.c, s: w[0].n, e: w[w.length - 1].n, text: w.map((x) => plain(x.t)).join(" ") });
      if (i + 3 >= v.length) break;
    }
  }
}
console.log("passages:", chunks.length);

// 2. embed (or reuse vectors computed earlier with the same model and passages)
const D = 384;
let vecs;
if (pre && fs.existsSync(pre + "/vecs.f32")) {
  vecs = new Float32Array(fs.readFileSync(pre + "/vecs.f32").buffer.slice(0));
  const preChunks = JSON.parse(fs.readFileSync(pre + "/chunks.json"));
  if (preChunks.length !== chunks.length || preChunks.some((c, i) => c.b !== chunks[i].b || c.c !== chunks[i].c || c.s !== chunks[i].s))
    throw new Error("precomputed vectors don't match the passages");
  console.log("reusing vectors from", pre);
} else {
  vecs = new Float32Array(chunks.length * D);
  const order = chunks.map((_, i) => i).sort((a, b) => chunks[a].text.length - chunks[b].text.length);
  const t0 = Date.now();
  for (let i = 0; i < order.length; i += 32) {
    const idx = order.slice(i, i + 32);
    const vs = await embedBatch(ort, sess, tok, idx.map((k) => chunks[k].text), pooling);
    idx.forEach((k, j) => vecs.set(vs[j], k * D));
    if (i % 3200 === 0) console.log(`${i}/${chunks.length}  ${Math.round((Date.now() - t0) / 1000)}s`);
  }
}

// 3. write compact files
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const q8 = new Int8Array(vecs.length);
for (let i = 0; i < vecs.length; i++) q8[i] = Math.max(-127, Math.min(127, Math.round(vecs[i] * SCALE)));
fs.writeFileSync(OUT + "vectors.bin", Buffer.from(q8.buffer));
const meta = new Uint16Array(chunks.length * 4);
chunks.forEach((c, i) => meta.set([c.bi, c.c, c.s, c.e], i * 4));
fs.writeFileSync(OUT + "meta.bin", Buffer.from(meta.buffer));
fs.copyFileSync(vocabPath, OUT + "vocab.txt");
const model = fs.readFileSync(modelPath);
const parts = [];
for (let o = 0, n = 0; o < model.length; o += PART, n++) {
  const name = `model.part${n}.bin`;
  fs.writeFileSync(OUT + name, model.subarray(o, o + PART));
  parts.push(name);
}

// 4. sub-topic vectors, so a question can suggest a matching topic
const topics = [];
const entries = [];
for (const t of TOPICS) {
  // topics with sub-topics are matched through their subs; the others through their own description
  if (t.subs?.length) for (const s of t.subs) entries.push({ topic: t.id, sub: s.id, q: s.q });
  else if (t.q) entries.push({ topic: t.id, sub: null, q: t.q });
}
for (const e of entries) {
  const [v] = await embedBatch(ort, sess, tok, [queryPrefix + e.q], pooling);
  topics.push({ topic: e.topic, sub: e.sub, v: Array.from(v, (x) => Math.round(x * SCALE)) });
}

const ortWasm = fs.statSync(SITE + "/vendor/ort/ort-wasm-simd-threaded.wasm").size;
const info = {
  model: path.basename(modelPath),
  dims: D,
  count: chunks.length,
  scale: SCALE,
  pooling,
  queryPrefix,
  keywordWeight: 0.1,
  topicThreshold: pooling === "cls" ? 0.7 : 0.45, // show "related topic" chips above this similarity
  inlineThreshold: pooling === "cls" ? 0.78 : 0.55, // show that topic's hand-picked verses first above this
  vocab: "vocab.txt",
  meta: "meta.bin",
  vectors: "vectors.bin",
  modelParts: parts,
  downloadBytes: model.length + q8.length + meta.byteLength + fs.statSync(vocabPath).size + ortWasm,
  topics,
};
fs.writeFileSync(OUT + "index.json", JSON.stringify(info));
console.log("wrote", OUT, "download ≈", Math.round(info.downloadBytes / 1e6), "MB");
