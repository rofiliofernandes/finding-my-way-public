// Build site/data/daily.json: the verses "Verse for today" may choose from.
// Every verse is scored once, ahead of time, for how much it reads like a promise, a prayer, comfort,
// wisdom, praise or a teaching of Jesus (part A), then nudged by simple rules (part B):
// favour verses that speak to "you" or to God, skip lists of names, numbers, travel and battles.
// Only verses that make sense on their own are kept, and from each book the best quarter.
//
// Usage (from the finding-my-way folder, with onnxruntime-node installed):
//   node tools/build_daily.mjs <model.onnx> <vocab.txt>
// (the model is site/data/semantic/model.part0.bin + model.part1.bin joined together)
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const ort = require(process.env.ORT_NODE || "onnxruntime-node");
import { WordPiece, embedBatch } from "../site/js/embed.js";

const [modelPath, vocabPath] = process.argv.slice(2);
const SITE = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../site");
const tok = new WordPiece(fs.readFileSync(vocabPath, "utf8"));
const sess = await ort.InferenceSession.create(modelPath);
const canon = JSON.parse(fs.readFileSync(SITE + "/data/canon.json"));
const plain = (t) => t.replace(/\n\t?/g, " ").replace(/\s+/g, " ").trim();

// the same "makes sense on its own" test the app uses
const { standsAlone } = await import("../site/js/daily-rules.js");

const GOOD = [
  "a promise from God to protect and care for you",
  "a prayer asking God for help and mercy",
  "words of comfort for someone who is hurting or afraid",
  "wisdom about how to live a good life",
  "Jesus teaching how to love God and one another",
  "praise and thanksgiving to God for his goodness",
  "God's love, mercy and forgiveness",
  "encouragement to be strong and courageous and not afraid",
  "hope and peace that comes from trusting God",
  "God is faithful and his word lasts forever",
];
const BAD = [
  "a list of names and family genealogy",
  "measurements of a building in cubits and materials",
  "a king fought a battle and captured cities",
  "they traveled from one town to another place",
  "rules about animal sacrifices and offerings at the altar",
  "the number of people counted in each tribe",
  "the boundaries of the land given to each tribe",
  "a man possessed by an unclean spirit",
  "laws about skin disease, mildew and uncleanness",
  "he went and did what he was told and came back",
  "God angrily punishes and destroys a sinful nation",
  "a list of goods, riches and merchandise",
  "the priest offers a lamb as a sin offering",
];

const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const embedAll = async (texts) => {
  const out = new Array(texts.length);
  const order = texts.map((_, i) => i).sort((a, b) => texts[a].length - texts[b].length);
  for (let i = 0; i < order.length; i += 32) {
    const idx = order.slice(i, i + 32);
    const vs = await embedBatch(ort, sess, tok, idx.map((k) => texts[k]), "mean");
    idx.forEach((k, j) => (out[k] = vs[j]));
    if (i % 6400 === 0) console.log(`  ${i}/${texts.length}`);
  }
  return out;
};
const good = await embedAll(GOOD), bad = await embedAll(BAD);

// part B: simple rules
const NUM = /\b(\d+|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty|thirty|forty|fifty|sixty|seventy|hundred|hundreds|thousand|thousands|cubits?|shekels?|talents?)\b/i;
const TRAVEL = /\b(went|came|departed|journeyed|traveled|travelled|arrived|camped|encamped|crossed over|went up|went down)\b/i;
const WAR = /\b(struck|smote|slew|killed|destroyed|fought|captured|besieged|sword|spoil|plunder)\b/i;
const NAMES = (t) => (t.match(/(?<![.!?“"]\s)(?<!^)\b[A-Z][a-z]{2,}\b/g) || []).filter((w) => !/^(God|Lord|LORD|Jesus|Christ|Spirit|Father|Son|You|Your|He|His|Him|I|Israel|Jerusalem|Kingdom|Heaven)$/.test(w)).length;
function rules(t, book) {
  let s = 0;
  if (/\b(you|your|yours)\b/i.test(t)) s += 0.03;
  if (/\b(God|LORD|Lord|Father)\b/.test(t)) s += 0.02;
  if (/\b(O LORD|O God|my God|Lord,)\b/.test(t)) s += 0.03; // prayer
  if (["MAT", "MRK", "LUK", "JHN"].includes(book) && /[“"]/.test(t)) s += 0.02; // often Jesus speaking
  if (NUM.test(t)) s -= 0.08;
  if (TRAVEL.test(t)) s -= 0.04;
  if (WAR.test(t)) s -= 0.05;
  const n = NAMES(t);
  if (n >= 2) s -= 0.03 * Math.min(4, n - 1);
  if (/\b(demon|demons|unclean spirit)\b/i.test(t)) s -= 0.06;
  return s;
}

// pass 1: score every verse that stands alone
const all = [];
let total = 0;
for (const b of canon.books) {
  const d = JSON.parse(fs.readFileSync(`${SITE}/data/books/${b.id}.json`));
  const vs = [];
  for (const ch of d.chapters) for (const v of ch.v) { total++; if (standsAlone(v.t)) vs.push({ c: ch.c, n: v.n, t: plain(v.t) }); }
  if (!vs.length) continue;
  const emb = await embedAll(vs.map((v) => v.t));
  vs.forEach((v, i) => {
    const g = Math.max(...good.map((a) => dot(a, emb[i]))), w = Math.max(...bad.map((a) => dot(a, emb[i])));
    v.score = g - 0.6 * w + rules(v.t, b.id);
  });
  all.push({ id: b.id, vs });
}
// pass 2: one quality bar for the whole Bible (the best fifth overall), but at least 10 verses per book
const scores = all.flatMap((b) => b.vs.map((v) => v.score)).sort((a, b) => b - a);
const bar = scores[Math.floor(scores.length * 0.2)];
const books = {};
let kept = 0;
for (const { id, vs } of all) {
  const ranked = [...vs].sort((a, b) => b.score - a.score);
  let best = ranked.filter((v) => v.score >= bar);
  if (best.length < 10) best = ranked.slice(0, Math.min(10, ranked.length));
  best.sort((a, b) => a.c - b.c || a.n - b.n);
  books[id] = best.map((v) => `${v.c}:${v.n}`).join(",");
  kept += best.length;
  console.log(`${id}: ${best.length} of ${vs.length}  top: ${ranked[0].c}:${ranked[0].n} ${ranked[0].t.slice(0, 70)}`);
}
fs.writeFileSync(SITE + "/data/daily.json", JSON.stringify({ v: 1, note: "Verses for 'Verse for today', built by tools/build_daily.mjs", books }));
console.log(`kept ${kept} of ${total} verses`);
