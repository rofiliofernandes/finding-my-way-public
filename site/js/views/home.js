import * as bible from "../bible.js";
import * as act from "../activity.js";
import * as store from "../store.js";
import { esc, icon } from "../ui.js";
import { TOPICS } from "../topics.js";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Peace be with you";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Same "verse for today" on every device: a hash of the date picks a verse.
async function verseOfDay() {
  const canon = bible.getCanon();
  const d = store.localDate();
  let h = 2166136261;
  for (const ch of "lectio" + d) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  // favour the Psalms, Wisdom books and New Testament for a daily verse
  const pool = canon.books.filter((b) => b.t === "NT" || b.g === "Wisdom" || b.id === "ISA");
  const total = pool.reduce((a, b) => a + b.total, 0);
  let r = h % total;
  for (const b of pool) {
    if (r >= b.total) {
      r -= b.total;
      continue;
    }
    for (let ci = 0; ci < b.vc.length; ci++) {
      if (r >= b.vc[ci]) {
        r -= b.vc[ci];
        continue;
      }
      const ch = await bible.loadChapter(b.id, ci + 1);
      const v = ch.v[r];
      return { book: b.id, chapter: ci + 1, verse: v.n, text: v.t };
    }
  }
}

export async function renderHome(main) {
  const canon = bible.getCanon();
  const lastCh = act.lastRead(["chapter"]);
  const nextCh = lastCh ? bible.nextChapter(lastCh.book, lastCh.chapter) : { book: "GEN", chapter: 1 };
  const lastV = act.lastRead(["verse"]);
  const nextV = lastV ? await bible.stepVerse(lastV.book, lastV.chapter, lastV.verse_start, 1) : null;
  const vod = await verseOfDay();

  const today = store.localDate();
  const ws = store.weekStart(today);
  const counts = act.dayCounts();
  const weekLogs = act.logsBetween(ws, store.addDays(ws, 7));
  const weekPassages = act.passages(weekLogs);
  const weekVerses = weekLogs.reduce((a, r) => a + act.versesIn(r), 0);
  const chaptersThisWeek = weekPassages.filter((p) => p.whole).length;
  const streak = act.streak();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = store.addDays(ws, i);
    const on = counts.has(d);
    const label = store.parseDate(d).toLocaleDateString(undefined, { weekday: "narrow" });
    return `<div class="d">${label}<div class="dot ${on ? "on" : ""} ${d === today ? "today" : ""}">${on ? icon("check") : ""}</div></div>`;
  });

  // An older note to revisit
  const older = act.notes().filter((n) => n.kind === "note" && store.localDate(n.created_at) < store.addDays(today, -6));
  const revisit = older.length ? older[Math.abs([...today].reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % older.length] : null;

  let nextVText = "";
  if (nextV) {
    const ch = await bible.loadChapter(nextV.book, nextV.chapter);
    const v = ch.v.find((x) => x.n === nextV.verse);
    nextVText = v ? bible.plainVerse(v.t) : "";
    if (nextVText.length > 140) nextVText = nextVText.slice(0, 140).replace(/\s+\S*$/, "") + "…";
  }

  main.innerHTML = `
    <div class="hello">
      <div class="eyebrow">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
      <h1 style="margin-top:4px">${greeting()}</h1>
    </div>

    <a class="card" href="#/read/${vod.book}/${vod.chapter}?v=${vod.verse}" style="padding:24px">
      <div class="eyebrow">Verse for today</div>
      <div class="quote" style="font-size:20px;line-height:1.6;margin-top:10px">${vod.text
        .split("\n")
        .map((l) => bible.verseHTML(l.replace(/^\t/, "")))
        .join("<br>")}</div>
      <div class="muted small" style="margin-top:10px;font-weight:600">${esc(bible.formatRef(vod.book, vod.chapter, vod.verse))}</div>
    </a>

    <section class="section" style="margin-top:22px">
      <div class="section-head"><h2>How are you feeling?</h2><a href="#/topics" class="small" style="font-weight:600">All topics →</a></div>
      <div class="feel">${TOPICS.slice(0, 10).map((t) => `<a class="chip" href="#/topics?t=${t.id}">${esc(t.name)}</a>`).join("")}</div>
    </section>

    <div class="grid2 section" style="margin-top:22px">
      ${
        nextCh
          ? `<a class="card" href="#/read/${nextCh.book}/${nextCh.chapter}">
              <div class="eyebrow">${lastCh ? "Continue reading" : "Start reading"}</div>
              <div class="ref">${esc(bible.formatRef(nextCh.book, nextCh.chapter))}</div>
              <div class="muted small">${lastCh ? `Last: ${esc(bible.formatRef(lastCh.book, lastCh.chapter))}, ${esc(new Date(lastCh.read_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }))}` : "From the beginning — or pick any book"}</div>
            </a>`
          : ""
      }
      <a class="card" href="${nextV ? `#/verse/${nextV.book}/${nextV.chapter}/${nextV.verse}` : "#/verse/MAT/1/1"}">
        <div class="eyebrow">Verse by verse</div>
        <div class="ref">${nextV ? esc(bible.formatRef(nextV.book, nextV.chapter, nextV.verse)) : "Matthew 1:1"}</div>
        <div class="muted small">${nextV ? esc(nextVText) : "One verse at a time, slowly"}</div>
      </a>
      <a class="card" href="#/random">
        <div class="eyebrow">Random verse</div>
        <div class="ref">${icon("shuffle").replace("<svg", '<svg style="width:22px;height:22px;display:inline;vertical-align:-3px;fill:none;stroke:currentColor;stroke-width:1.8"')} Surprise me</div>
        <div class="muted small">From ${esc(bible.scopeLabel(store.pref("randomScope") || "all"))}</div>
      </a>
      <a class="card" href="#/books">
        <div class="eyebrow">Browse</div>
        <div class="ref">All ${canon.books.length} books</div>
        <div class="muted small">Old and New Testament, Catholic canon</div>
      </a>
    </div>

    <section class="section card">
      <div class="section-head"><h2>This week</h2><a href="#/history" class="small" style="font-weight:600">Weekly review →</a></div>
      <div class="week-strip">${days.join("")}</div>
      <div class="stat-row">
        <div class="stat"><b>${streak}</b><span>day streak</span></div>
        <div class="stat"><b>${chaptersThisWeek}</b><span>chapters</span></div>
        <div class="stat"><b>${weekVerses}</b><span>verses</span></div>
        <div class="stat"><b>${act.notes().filter((n) => n.kind === "note" && store.localDate(n.created_at) >= ws).length}</b><span>notes</span></div>
      </div>
    </section>

    ${
      revisit
        ? `<section class="section">
            <div class="eyebrow" style="margin-bottom:8px">From your journal</div>
            <a class="card" href="#/read/${revisit.book}/${revisit.chapter}?v=${revisit.verse_start}" style="color:inherit">
              <div class="muted small" style="font-weight:600">${esc(act.noteRef(revisit))} · ${esc(new Date(revisit.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }))}</div>
              <div class="quote" style="white-space:pre-wrap">${esc(revisit.body)}</div>
            </a>
          </section>`
        : ""
    }`;
}
