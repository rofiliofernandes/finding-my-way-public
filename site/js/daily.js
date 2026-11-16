// "Verse for today": where it comes from, and remembering what you've already been shown.
//
// Modes (pref "daily"):
//   reading  — from the book you've been reading this past week (chapters you've read first), else falls back to anywhere
//   book     — from a book (or one chapter) you choose, in order or as a surprise, never repeating until it's done
//   anywhere — the old way: picked from the date, same on every device
//
// When a chosen book or chapter has shown every verse, the Today card says so and offers to start again or choose another.
import * as bible from "./bible.js";
import * as act from "./activity.js";
import * as store from "./store.js";
import { esc, openModal, toast } from "./ui.js";
import * as synced from "./synced.js";

const DEFAULT = { mode: "reading", book: "MRK", chapter: 0, order: "order" };
// The choice and the "already shown" record both sync across devices (see synced.js).
export const settings = () => ({ ...DEFAULT, ...(store.pref("daily") || {}), ...(synced.get("daily") || {}) });
export const setSettings = (v) => synced.set("daily", v);

const EMPTY = { day: null, pick: null, t: 0, seen: {}, pos: {}, round: {} };
// Merge this device's record with the synced one. For each book: only the newest "round" counts
// (Start again begins a new round); within it, verses seen on either device count as seen and the
// furthest position wins. The most recent pick wins, so all devices show the same verse today.
function merge(a, b) {
  a = { ...EMPTY, ...(a || {}) };
  b = { ...EMPTY, ...(b || {}) };
  const out = (a.t || 0) >= (b.t || 0) ? { ...a } : { ...b };
  out.seen = {};
  out.pos = {};
  out.round = {};
  const keys = new Set([...Object.keys(a.seen), ...Object.keys(b.seen), ...Object.keys(a.pos), ...Object.keys(b.pos), ...Object.keys(a.round), ...Object.keys(b.round)]);
  for (const k of keys) {
    const ra = a.round[k] || 0, rb = b.round[k] || 0, r = Math.max(ra, rb);
    const from = [ra === r ? a : null, rb === r ? b : null].filter(Boolean);
    out.round[k] = r;
    out.seen[k] = [...new Set(from.flatMap((x) => x.seen[k] || []))];
    out.pos[k] = Math.max(0, ...from.map((x) => x.pos[k] || 0));
  }
  return out;
}
const state = () => merge(store.meta("dailyState"), synced.get("dailyState"));
const saveState = (s) => {
  s.t = Date.now();
  store.meta("dailyState", s);
  synced.set("dailyState", s);
};

/* ---------- which verses make sense on their own ---------- */

const OPENERS = /^(and|now|then|for|but|so|therefore|because|or|nor|that|which|who|whom|whose|when|while|after|as|also|again|thus|yet|moreover|furthermore|likewise|wherefore|until|unless|if|lest|since|than|these|those|this|it|they|he answered|they answered|and he|saying|namely)\b/i;
export function standsAlone(raw) {
  const t = bible.plainVerse(raw).replace(/^[^A-Za-z“"‘']+/, "");
  if (t.length < 28 || t.length > 330) return false;
  if (OPENERS.test(t.replace(/^[“"‘']/, ""))) return false;
  if (!/[.!?][”"’')\]]*$/.test(t)) return false; // ends mid-sentence
  const open = (t.match(/[“]/g) || []).length, close = (t.match(/[”]/g) || []).length;
  if (open !== close) return false; // a quote that starts or ends elsewhere
  if (/^\d|^[a-z]/.test(t)) return false;
  return true;
}

/* ---------- scopes ---------- */

const canonBook = (id) => bible.getCanon().byId[id];
const scopeKey = (book, chapter) => (chapter ? `${book}.${chapter}` : book);
export function scopeName(book, chapter) {
  const b = canonBook(book);
  return b ? (chapter ? `${b.name} ${chapter}` : b.name) : book;
}

// The book you've been reading in the past 7 days (most recent first)
function readingBook() {
  const since = store.addDays(store.localDate(), -7);
  const recent = act.logs().filter((r) => store.localDate(r.read_at) >= since);
  return recent.length ? recent[recent.length - 1].book : null;
}

// All standalone verses in a scope, in Bible order: [{c, n, t}]
async function candidates(book, chapter, preferChapters) {
  const data = await bible.loadBook(book);
  const chs = chapter ? [data.chapters[chapter - 1]] : data.chapters;
  let all = [];
  for (const ch of chs) for (const v of ch.v) all.push({ c: ch.c, n: v.n, t: v.t });
  const good = all.filter((v) => standsAlone(v.t));
  if (good.length >= Math.min(5, all.length)) all = good;
  if (preferChapters?.size) {
    const first = all.filter((v) => preferChapters.has(v.c));
    if (first.length) return { list: all, first };
  }
  return { list: all, first: null };
}

const hash = (s) => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
};

/* ---------- the pick ---------- */

// Returns { book, chapter, verse, text, source, finished? }
export async function today({ another = false } = {}) {
  const s = state();
  const day = store.localDate();
  const cfg = settings();
  const cfgKey = JSON.stringify(cfg);
  if (!another && s.day === day && s.cfg === cfgKey && s.pick) return s.pick;

  let pick = null;
  if (cfg.mode === "book" && canonBook(cfg.book)) pick = await fromScope(s, cfg.book, cfg.chapter || 0, cfg.order, "chosen", another);
  else if (cfg.mode === "reading") {
    const book = readingBook();
    if (book) {
      const readChs = new Set(act.passages(act.logs().filter((r) => r.book === book)).map((p) => p.chapter));
      pick = await fromScope(s, book, 0, "random", "reading", another, readChs);
    }
  }
  if (!pick) {
    const bump = another ? (s.anyBump || 0) + 1 : 0;
    pick = await anywhere(bump);
    s.anyBump = bump;
  }

  s.day = day;
  s.cfg = cfgKey;
  s.pick = pick;
  saveState(s);
  return pick;
}

async function fromScope(s, book, chapter, order, source, another, preferChapters) {
  const key = scopeKey(book, chapter);
  const { list, first } = await candidates(book, chapter, preferChapters);
  const seen = new Set(s.seen[key] || []);
  const id = (v) => v.c + ":" + v.n;
  let v = null;
  if (order === "order") {
    const pos = s.pos[key] || 0;
    if (pos >= list.length) return finished(book, chapter, source);
    v = list[pos];
    s.pos[key] = pos + 1;
  } else {
    let pool = (first || list).filter((x) => !seen.has(id(x)));
    if (!pool.length && first) pool = list.filter((x) => !seen.has(id(x)));
    if (!pool.length) return finished(book, chapter, source);
    v = pool[hash(store.localDate() + key + seen.size + (another ? "x" : "")) % pool.length];
  }
  seen.add(id(v));
  s.seen[key] = [...seen];
  const done = order === "order" ? s.pos[key] : seen.size;
  return { book, chapter: v.c, verse: v.n, text: v.t, source, scope: { book, chapter }, progress: { done, total: list.length } };
}

function finished(book, chapter, source) {
  return { finished: true, source, scope: { book, chapter }, name: scopeName(book, chapter) };
}

// The old way, from the date (same on every device), moved forward to a verse that stands on its own
async function anywhere(bump = 0) {
  const canon = bible.getCanon();
  const pool = canon.books.filter((b) => b.t === "NT" || b.g === "Wisdom" || b.id === "ISA");
  const total = pool.reduce((a, b) => a + b.total, 0);
  let r = (hash("lectio" + store.localDate()) + bump * 7919) % total;
  for (const b of pool) {
    if (r >= b.total) {
      r -= b.total;
      continue;
    }
    const data = await bible.loadBook(b.id);
    const flat = [];
    for (const ch of data.chapters) for (const v of ch.v) flat.push({ c: ch.c, n: v.n, t: v.t });
    for (let k = 0; k < flat.length; k++) {
      const v = flat[(r + k) % flat.length];
      if (k > 60 || standsAlone(v.t)) return { book: b.id, chapter: v.c, verse: v.n, text: v.t, source: "anywhere" };
    }
  }
}

// Start a scope over (after finishing it, or by choice)
export function restart(book, chapter) {
  const s = state();
  const key = scopeKey(book, chapter);
  s.round[key] = (s.round[key] || 0) + 1;
  s.seen[key] = [];
  s.pos[key] = 0;
  s.day = null;
  saveState(s);
}
export function forgetToday() {
  const s = state();
  s.day = null;
  saveState(s);
}

export function sourceLine(pick) {
  if (pick.source === "chosen") {
    const p = pick.progress;
    return `From ${esc(scopeName(pick.scope.book, pick.scope.chapter))}${p ? ` · ${p.done} of ${p.total}` : ""}`;
  }
  if (pick.source === "reading") return `From ${esc(scopeName(pick.scope.book))}, what you're reading`;
  return "From anywhere in the Bible";
}

export function describe() {
  const c = settings();
  if (c.mode === "anywhere") return "Anywhere in the Bible";
  if (c.mode === "reading") return "From what you're reading";
  return `${scopeName(c.book, c.chapter)} · ${c.order === "order" ? "in order" : "surprise me"}`;
}

/* ---------- the chooser ---------- */

export function choose(onDone) {
  const cfg = settings();
  const canon = bible.getCanon();
  const books = canon.books;
  openModal(
    `<div class="eyebrow">Verse for today</div>
     <h2 style="margin:4px 0 14px">Where should it come from?</h2>
     <div class="daily-opts">
       <label class="daily-opt"><input type="radio" name="dm" value="reading"><div><b>What I'm reading</b><span>From the book you've read this past week, the chapters you've read first. Anywhere if you haven't read lately.</span></div></label>
       <label class="daily-opt"><input type="radio" name="dm" value="book"><div><b>A book I choose</b><span>A new verse from it every day, until you've seen them all.</span></div></label>
       <div class="daily-book" hidden>
         <div class="daily-row"><select id="dBook">${["OT", "NT"]
           .map((t) => `<optgroup label="${t === "OT" ? "Old Testament" : "New Testament"}">${books.filter((b) => b.t === t).map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join("")}</optgroup>`)
           .join("")}</select><select id="dCh"></select></div>
         <div class="seg" id="dOrder"><button type="button" data-o="order">In order</button><button type="button" data-o="random">Surprise me</button></div>
       </div>
       <label class="daily-opt"><input type="radio" name="dm" value="anywhere"><div><b>Anywhere</b><span>A verse picked for the day, the same on all your devices.</span></div></label>
     </div>
     <div class="actions"><button class="btn ghost" data-cancel>Cancel</button><button class="btn primary" data-ok>Save</button></div>`,
    (dlg, close) => {
      let order = cfg.order;
      const bookSel = dlg.querySelector("#dBook"), chSel = dlg.querySelector("#dCh"), bookBox = dlg.querySelector(".daily-book");
      const fillCh = () => {
        const b = canon.byId[bookSel.value];
        chSel.innerHTML = `<option value="0">Whole book</option>` + b.vc.map((_, i) => `<option value="${i + 1}">Chapter ${i + 1}</option>`).join("");
      };
      bookSel.value = cfg.book;
      fillCh();
      chSel.value = String(cfg.chapter || 0);
      bookSel.onchange = fillCh;
      const segs = dlg.querySelectorAll("#dOrder button");
      const drawSeg = () => segs.forEach((b) => b.classList.toggle("on", b.dataset.o === order));
      segs.forEach((b) => (b.onclick = () => ((order = b.dataset.o), drawSeg())));
      drawSeg();
      const radios = dlg.querySelectorAll('input[name="dm"]');
      const sync = () => (bookBox.hidden = dlg.querySelector('input[name="dm"]:checked').value !== "book");
      radios.forEach((r) => ((r.checked = r.value === cfg.mode), (r.onchange = sync)));
      sync();
      dlg.querySelector("[data-cancel]").onclick = close;
      dlg.querySelector("[data-ok]").onclick = () => {
        const mode = dlg.querySelector('input[name="dm"]:checked').value;
        setSettings({ mode, book: bookSel.value, chapter: +chSel.value, order });
        forgetToday();
        close();
        toast(mode === "book" ? `Verse for today: ${scopeName(bookSel.value, +chSel.value)}` : "Saved");
        onDone?.();
      };
    }
  );
}
