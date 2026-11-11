// Reading history, bookmarks, notes and reflections built on top of the local store.
import * as store from "./store.js";
import { getCanon, formatRef, rangesText, bookName } from "./bible.js";

/* ---------- reading log ---------- */

export function logRead({ book, chapter, verse_start = null, verse_end = null, mode }) {
  const now = Date.now();
  // Skip duplicates of the same passage within 10 minutes (e.g. revisiting a page).
  const dupe = store.all("reading_log").some(
    (r) =>
      r.book === book &&
      r.chapter === chapter &&
      (r.verse_start ?? null) === verse_start &&
      (r.verse_end ?? null) === verse_end &&
      now - new Date(r.read_at).getTime() < 10 * 60 * 1000
  );
  if (dupe) return null;
  const rec = { id: store.uid(), book, chapter, mode, read_at: new Date(now).toISOString() };
  if (verse_start != null) rec.verse_start = verse_start;
  if (verse_end != null) rec.verse_end = verse_end;
  return store.put("reading_log", rec);
}

export function logs() {
  return store.all("reading_log").sort((a, b) => (a.read_at < b.read_at ? -1 : 1));
}

export function logsBetween(fromDate, toDateExclusive) {
  return logs().filter((r) => {
    const d = store.localDate(r.read_at);
    return d >= fromDate && d < toDateExclusive;
  });
}

export function dayCounts() {
  const m = new Map();
  for (const r of store.all("reading_log")) {
    const d = store.localDate(r.read_at);
    m.set(d, (m.get(d) || 0) + versesIn(r));
  }
  return m;
}

export function versesIn(r) {
  if (r.verse_start == null) {
    const b = getCanon().byId[r.book];
    return b ? b.vc[r.chapter - 1] || 0 : 0;
  }
  return (r.verse_end ?? r.verse_start) - r.verse_start + 1;
}

// Merge log entries into readable passages: "Genesis 1", "Psalm 23:1–4, 6"
export function passages(entries) {
  const groups = new Map();
  for (const r of entries) {
    const key = r.book + "." + r.chapter;
    if (!groups.has(key)) groups.set(key, { book: r.book, chapter: r.chapter, whole: false, verses: new Set(), first: r.read_at });
    const g = groups.get(key);
    if (r.verse_start == null) g.whole = true;
    else for (let v = r.verse_start; v <= (r.verse_end ?? r.verse_start); v++) g.verses.add(v);
  }
  const canon = getCanon();
  return [...groups.values()]
    .sort((a, b) => (a.first < b.first ? -1 : 1))
    .map((g) => {
      const total = canon.byId[g.book]?.vc[g.chapter - 1] || 0;
      const whole = g.whole || g.verses.size >= total;
      const nums = [...g.verses].sort((a, b) => a - b);
      const name = g.book === "PSA" ? "Psalm" : bookName(g.book);
      return {
        book: g.book,
        chapter: g.chapter,
        whole,
        count: whole ? total : nums.length,
        firstVerse: whole ? null : nums[0],
        label: whole ? `${name} ${g.chapter}` : `${name} ${g.chapter}:${rangesText(nums)}`,
      };
    });
}

// Chapters you've finished at least once: "GEN.1" etc.
export function chaptersRead() {
  const canon = getCanon();
  const whole = new Set();
  const partial = new Map();
  for (const r of store.all("reading_log")) {
    const key = r.book + "." + r.chapter;
    if (r.verse_start == null) whole.add(key);
    else {
      if (!partial.has(key)) partial.set(key, new Set());
      const s = partial.get(key);
      for (let v = r.verse_start; v <= (r.verse_end ?? r.verse_start); v++) s.add(v);
    }
  }
  for (const [key, s] of partial) {
    const [b, c] = key.split(".");
    const total = canon.byId[b]?.vc[+c - 1] || Infinity;
    if (s.size >= total) whole.add(key);
  }
  return whole;
}

export function lastRead(modes) {
  const all = logs().filter((r) => !modes || modes.includes(r.mode));
  return all[all.length - 1] || null;
}

export function streak() {
  const days = new Set(store.all("reading_log").map((r) => store.localDate(r.read_at)));
  let d = store.localDate();
  if (!days.has(d)) d = store.addDays(d, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = store.addDays(d, -1);
  }
  return n;
}

export function readToday(book, chapter) {
  const today = store.localDate();
  return store
    .all("reading_log")
    .some((r) => r.book === book && r.chapter === chapter && r.verse_start == null && store.localDate(r.read_at) === today);
}

/* ---------- bookmarks & highlights ---------- */

export const COLORS = ["gold", "rose", "sage", "sky"];

export function bookmarkId(book, chapter, verse) {
  return `${book}.${chapter}.${verse}`;
}

export function bookmark(book, chapter, verse) {
  return store.get("bookmarks", bookmarkId(book, chapter, verse));
}

export function bookmarksFor(book, chapter) {
  return store.all("bookmarks").filter((b) => b.book === book && b.chapter === chapter);
}

export function setBookmark(book, chapter, verse, on, color) {
  const id = bookmarkId(book, chapter, verse);
  if (!on) return store.remove("bookmarks", id);
  const existing = store.get("bookmarks", id);
  const rec = { id, book, chapter, verse, deleted: false };
  if (color !== undefined) rec.color = color;
  else if (existing) rec.color = existing.color;
  return store.put("bookmarks", rec);
}

/* ---------- notes & reflections ---------- */

export function notes() {
  return store.all("notes").sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function notesFor(book, chapter) {
  return store
    .all("notes")
    .filter((n) => n.kind === "note" && n.book === book && n.chapter === chapter)
    .sort((a, b) => (a.verse_start || 0) - (b.verse_start || 0) || (a.created_at < b.created_at ? -1 : 1));
}

export function saveNote({ id, book, chapter, verse_start, verse_end, body }) {
  return store.put("notes", {
    id: id || store.uid(),
    kind: "note",
    book,
    chapter,
    verse_start,
    verse_end: verse_end ?? verse_start,
    body,
    deleted: false,
  });
}

export function reflectionId(week) {
  return "reflection." + week;
}

export function reflection(week) {
  return store.get("notes", reflectionId(week));
}

export function saveReflection(week, body) {
  const id = reflectionId(week);
  if (!body.trim()) {
    if (store.get("notes", id)) store.remove("notes", id);
    return null;
  }
  return store.put("notes", { id, kind: "reflection", week_start: week, body, deleted: false });
}

export function noteRef(n) {
  if (n.kind === "reflection") return "Week of " + formatWeek(n.week_start);
  return formatRef(n.book, n.chapter, n.verse_start, n.verse_end);
}

export function formatWeek(week) {
  const d = store.parseDate(week);
  const e = store.parseDate(store.addDays(week, 6));
  const sameMonth = d.getMonth() === e.getMonth();
  const f = (x, opts) => x.toLocaleDateString(undefined, opts);
  return sameMonth
    ? `${f(d, { month: "short", day: "numeric" })}–${e.getDate()}, ${e.getFullYear()}`
    : `${f(d, { month: "short", day: "numeric" })} – ${f(e, { month: "short", day: "numeric" })}, ${e.getFullYear()}`;
}
