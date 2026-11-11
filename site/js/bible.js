// Bible text: canon metadata, lazy-loaded books, references and navigation.

let canon = null;
const bookCache = new Map();

export async function loadCanon() {
  if (canon) return canon;
  const res = await fetch("data/canon.json");
  canon = await res.json();
  canon.byId = {};
  canon.books.forEach((b, i) => {
    b.index = i;
    b.chapters = b.vc.length;
    b.total = b.vc.reduce((a, n) => a + n, 0);
    canon.byId[b.id] = b;
  });
  canon.totalVerses = canon.books.reduce((a, b) => a + b.total, 0);
  return canon;
}

export function getCanon() {
  return canon;
}

export function book(id) {
  return canon.byId[id];
}

export function loadBook(id) {
  if (!bookCache.has(id)) {
    const p = fetch(`data/books/${id}.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load " + id);
        return r.json();
      })
      .catch((e) => {
        bookCache.delete(id);
        throw e;
      });
    bookCache.set(id, p);
  }
  return bookCache.get(id);
}

export async function loadChapter(id, c) {
  const data = await loadBook(id);
  return data.chapters[c - 1];
}

/* ---------- references ---------- */

export function bookName(id) {
  const b = canon.byId[id];
  return b ? b.name : id;
}

function chapterWord(id) {
  return id === "PSA" ? "Psalm" : bookName(id);
}

export function formatRef(id, c, vs, ve) {
  const name = chapterWord(id);
  if (vs == null) return `${name} ${c}`;
  if (ve == null || ve === vs) return `${name} ${c}:${vs}`;
  return `${name} ${c}:${vs}–${ve}`;
}

// Turn a sorted list of verse numbers into "1–4, 7, 9–10"
export function rangesText(nums) {
  const out = [];
  let start = null;
  let prev = null;
  for (const n of nums) {
    if (start === null) {
      start = prev = n;
    } else if (n === prev + 1) {
      prev = n;
    } else {
      out.push(start === prev ? `${start}` : `${start}–${prev}`);
      start = prev = n;
    }
  }
  if (start !== null) out.push(start === prev ? `${start}` : `${start}–${prev}`);
  return out.join(", ");
}

/* ---------- navigation ---------- */

export function nextChapter(id, c) {
  const b = canon.byId[id];
  if (c < b.chapters) return { book: id, chapter: c + 1 };
  const nb = canon.books[b.index + 1];
  return nb ? { book: nb.id, chapter: 1 } : null;
}

export function prevChapter(id, c) {
  const b = canon.byId[id];
  if (c > 1) return { book: id, chapter: c - 1 };
  const pb = canon.books[b.index - 1];
  return pb ? { book: pb.id, chapter: pb.chapters } : null;
}

// Next / previous verse across chapter and book boundaries.
export async function stepVerse(id, c, n, dir) {
  const ch = await loadChapter(id, c);
  const idx = ch.v.findIndex((v) => v.n === n);
  const j = idx + dir;
  if (idx !== -1 && j >= 0 && j < ch.v.length) return { book: id, chapter: c, verse: ch.v[j].n };
  const nc = dir > 0 ? nextChapter(id, c) : prevChapter(id, c);
  if (!nc) return null;
  const nch = await loadChapter(nc.book, nc.chapter);
  const v = dir > 0 ? nch.v[0] : nch.v[nch.v.length - 1];
  return { book: nc.book, chapter: nc.chapter, verse: v.n };
}

/* ---------- scopes & random ---------- */

export const SCOPES = [
  { id: "all", label: "Whole Bible" },
  { id: "OT", label: "Old Testament" },
  { id: "NT", label: "New Testament" },
  { id: "Gospels", label: "Gospels" },
  { id: "Wisdom", label: "Psalms & Wisdom" },
  { id: "Prophets", label: "Prophets" },
  { id: "Letters", label: "Letters" },
];

export function scopeBooks(scope) {
  if (!scope || scope === "all") return canon.books;
  if (scope === "OT" || scope === "NT") return canon.books.filter((b) => b.t === scope);
  if (scope.startsWith("book:")) return canon.books.filter((b) => b.id === scope.slice(5));
  return canon.books.filter((b) => b.g === scope);
}

export function scopeLabel(scope) {
  const s = SCOPES.find((x) => x.id === scope);
  if (s) return s.label;
  if (scope && scope.startsWith("book:")) return bookName(scope.slice(5));
  return "Whole Bible";
}

export async function randomVerse(scope) {
  const books = scopeBooks(scope);
  const total = books.reduce((a, b) => a + b.total, 0);
  let r = Math.floor(Math.random() * total);
  for (const b of books) {
    if (r >= b.total) {
      r -= b.total;
      continue;
    }
    for (let ci = 0; ci < b.vc.length; ci++) {
      if (r >= b.vc[ci]) {
        r -= b.vc[ci];
        continue;
      }
      const ch = await loadChapter(b.id, ci + 1);
      const v = ch.v[r];
      return { book: b.id, chapter: ci + 1, verse: v.n, text: v.t };
    }
  }
  return null;
}

/* ---------- text rendering helpers ---------- */

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// LORD / GOD (the divine name) are shown in small capitals, as in printed Bibles.
export function verseHTML(text) {
  return esc(text)
    .replace(/\bLORD\b/g, '<span class="sc">Lord</span>')
    .replace(/\bGOD\b/g, '<span class="sc">God</span>');
}

export function plainVerse(text) {
  return text.replace(/\n\t?/g, " ").replace(/\s+/g, " ").trim();
}
