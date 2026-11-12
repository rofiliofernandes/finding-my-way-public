// Loads books on demand and searches their verses.
import { getCanon, loadBook, plainVerse } from "./bible.js";

const flat = new Map(); // book id -> [{ b, c, n, t, s }]

async function versesOf(id) {
  if (!flat.has(id)) {
    const data = await loadBook(id);
    const out = [];
    for (const ch of data.chapters)
      for (const v of ch.v) {
        const p = plainVerse(v.t);
        out.push({ b: id, c: ch.c, n: v.n, t: v.t, s: p.toLowerCase().replace(/[’‘]/g, "'") });
      }
    flat.set(id, out);
  }
  return flat.get(id);
}

// scope: { testament: "all"|"OT"|"NT", book: id|null, chapter: n|null }
export function scopeBookIds(scope) {
  const canon = getCanon();
  if (scope.book) return [scope.book];
  return canon.books.filter((b) => scope.testament === "all" || b.t === scope.testament).map((b) => b.id);
}

export async function loadScope(scope, onProgress) {
  const ids = scopeBookIds(scope);
  let done = 0;
  const queue = [...ids];
  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const id = queue.shift();
      await versesOf(id);
      done++;
      onProgress?.(done, ids.length);
    }
  });
  await Promise.all(workers);
  const out = [];
  for (const id of ids) {
    for (const v of flat.get(id)) if (!scope.chapter || v.c === scope.chapter) out.push(v);
  }
  return out;
}

export function isLoaded(scope) {
  return scopeBookIds(scope).every((id) => flat.has(id));
}

// Free-text search: every word must appear (in any order).
export function queryRegexes(q) {
  const words = q
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .split(/\s+/)
    .map((w) => w.replace(/^[^\w']+|[^\w']+$/g, ""))
    .filter((w) => w.length > 1 || /\d/.test(w));
  return words.map((w) => new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
}

export function matchAll(verses, regexes) {
  if (!regexes.length) return [];
  return verses.filter((v) => regexes.every((re) => re.test(v.s)));
}

export function matchTopic(verses, re) {
  return verses.filter((v) => {
    re.lastIndex = 0;
    return re.test(v.s);
  });
}

export function cachedVerses(id) {
  return flat.get(id);
}
