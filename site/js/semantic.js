// Meaning-based search, fully on this device: a small open-source embedding model runs in the
// browser (onnxruntime-web), compares your words with a pre-computed index of every Bible passage.
import { WordPiece, embedBatch } from "./embed.js";
import { getCanon } from "./bible.js";

const BASE = "data/semantic/";
let state = { status: "idle", progress: 0, error: null };
let loading = null;
let ort, session, tok, info, meta, vecs, topicVecs;
const listeners = new Set();

export function onProgress(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  listeners.forEach((fn) => fn(state));
}
export function status() {
  return state;
}

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error("Could not load " + src));
    document.head.appendChild(s);
  });
}

// fetch with byte progress, so the first-time download can show a progress bar
async function fetchBytes(url, onBytes) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download ${url} (${res.status})`);
  if (!res.body || !res.body.getReader) {
    const buf = new Uint8Array(await res.arrayBuffer());
    onBytes(buf.length);
    return buf;
  }
  const reader = res.body.getReader();
  const parts = [];
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    n += value.length;
    onBytes(value.length);
  }
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export function ensureLoaded() {
  if (loading) return loading;
  loading = (async () => {
    state = { status: "loading", progress: 0, error: null };
    emit();
    info = await (await fetch(BASE + "index.json")).json();
    const total = info.downloadBytes;
    let got = 0;
    const tick = (n) => {
      got += n;
      state.progress = Math.min(0.99, got / total);
      emit();
    };
    if (!window.ort) await loadScript("vendor/ort/ort.wasm.min.js");
    ort = window.ort;
    ort.env.wasm.wasmPaths = new URL("vendor/ort/", location.href).href;
    ort.env.wasm.numThreads = 1;
    const [vocabBytes, metaBytes, vecBytes, ...modelParts] = await Promise.all([
      fetchBytes(BASE + info.vocab, tick),
      fetchBytes(BASE + info.meta, tick),
      fetchBytes(BASE + info.vectors, tick),
      ...info.modelParts.map((p) => fetchBytes(BASE + p, tick)),
    ]);
    // the wasm runtime itself counts toward progress too (it's fetched by onnxruntime)
    tick(0);
    tok = new WordPiece(new TextDecoder().decode(vocabBytes));
    meta = new Uint16Array(metaBytes.buffer, metaBytes.byteOffset, metaBytes.byteLength / 2);
    vecs = new Int8Array(vecBytes.buffer, vecBytes.byteOffset, vecBytes.byteLength);
    const modelLen = modelParts.reduce((a, p) => a + p.length, 0);
    const model = new Uint8Array(modelLen);
    let o = 0;
    for (const p of modelParts) {
      model.set(p, o);
      o += p.length;
    }
    session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] });
    topicVecs = info.topics || [];
    state = { status: "ready", progress: 1, error: null };
    emit();
  })().catch((e) => {
    console.error(e);
    state = { status: "error", progress: 0, error: e.message || String(e) };
    loading = null;
    emit();
    throw e;
  });
  return loading;
}

export async function embedQuery(text) {
  await ensureLoaded();
  const [v] = await embedBatch(ort, session, tok, [info.queryPrefix + text], info.pooling);
  return v;
}

const STOP = new Set(
  "a an the and or but of to in on for with my me i im i'm is are be am was so too can't cant how what why when who someone something feel feeling very really about because even though do does not no your you our we us it this that from at by as".split(" ")
);
const stem = (w) => w.replace(/(ing|ed|es|s)$/, "").slice(0, 6);
export function queryWords(q) {
  return [...new Set(q.toLowerCase().replace(/[^a-z' ]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)).map(stem))];
}

// Search the index. scope = { books: Set(ids) | null, chapter: n | null }
// textOf(b, c, s, e) returns the passage text (lower case) for the keyword re-rank.
export async function search(q, scope, textOf, k = 30) {
  const qv = await embedQuery(q);
  const canon = getCanon();
  const D = info.dims;
  const n = meta.length / 4;
  const qi = new Float32Array(D);
  for (let h = 0; h < D; h++) qi[h] = qv[h] / info.scale;
  const cand = [];
  for (let i = 0; i < n; i++) {
    const bid = canon.books[meta[i * 4]].id;
    if (scope.books && !scope.books.has(bid)) continue;
    if (scope.chapter && meta[i * 4 + 1] !== scope.chapter) continue;
    let s = 0;
    const o = i * D;
    for (let h = 0; h < D; h++) s += qi[h] * vecs[o + h];
    cand.push([s, i]);
  }
  cand.sort((a, b) => b[0] - a[0]);
  // re-rank the best candidates with a light keyword bonus (helps phrases like "love your enemies")
  const qw = queryWords(q);
  const top = cand.slice(0, 400).map(([s, i]) => {
    const r = { b: canon.books[meta[i * 4]].id, c: meta[i * 4 + 1], s: meta[i * 4 + 2], e: meta[i * 4 + 3], score: s };
    if (qw.length) {
      const words = new Set(textOf(r.b, r.c, r.s, r.e).replace(/[^a-z' ]/g, " ").split(/\s+/).map(stem));
      r.score += info.keywordWeight * (qw.filter((w) => words.has(w)).length / qw.length);
    }
    return r;
  });
  top.sort((a, b) => b.score - a.score);
  // drop overlapping passages (the index uses overlapping 3-verse windows)
  const out = [];
  for (const r of top) {
    if (out.some((x) => x.b === r.b && x.c === r.c && r.s <= x.e && r.e >= x.s)) continue;
    out.push(r);
    if (out.length >= k) break;
  }
  return { results: out, topics: matchTopics(qv) };
}

// Which curated sub-topics is this question closest to?
function matchTopics(qv) {
  const scored = topicVecs.map((t) => {
    let s = 0;
    for (let h = 0; h < t.v.length; h++) s += qv[h] * t.v[h];
    return { topic: t.topic, sub: t.sub, score: s / info.scale };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter((s, i) => i < 3 && s.score >= info.topicThreshold)
    .map((s) => ({ ...s, strong: s.score >= info.inlineThreshold }));
}
