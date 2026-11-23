import * as bible from "../bible.js";
import * as act from "../activity.js";
import * as store from "../store.js";
import { esc, icon } from "../ui.js";
import { TOPICS } from "../topics.js";
import * as daily from "../daily.js";
import * as goals from "../goals.js";
import * as synced from "../synced.js";
import { alongHTML } from "./companions.js";
import { seasonToday, playHoly } from "../eggs.js";

// "Take a moment to pray": light a candle (with an optional intention, kept on this device); it stays lit all day
const PRAY_KEY = "fmw:candle:today";
function litToday() {
  try { const v = JSON.parse(localStorage.getItem(PRAY_KEY) || "null"); return v && v.day === store.localDate() ? v : null; } catch { return null; }
}
function prayHTML() {
  const lit = litToday();
  if (lit) return `<div class="pray-lit"><span class="candle-lit"><span class="cf"></span></span><div><b>Your candle is lit today</b>
      ${lit.for ? `<div class="muted small">For ${esc(lit.for)}</div>` : `<div class="muted small">“Let my prayer be set before you like incense.” Psalm 141:2</div>`}</div>
      <span class="spacer"></span><button class="btn ghost small" data-pray-again>Light another</button></div>`;
  return `<div class="eyebrow">Take a moment to pray</div>
    <div class="pray-row"><input id="prayFor" maxlength="60" placeholder="Who or what are you praying for? (optional)" autocomplete="off">
    <button class="btn primary" data-pray>🕯 Light a candle</button></div>`;
}
function wirePray(main) {
  const box = main.querySelector("#prayCard");
  if (!box) return;
  const light = () => {
    const f = box.querySelector("#prayFor")?.value.trim().slice(0, 60) || "";
    try { localStorage.setItem(PRAY_KEY, JSON.stringify({ day: store.localDate(), for: f })); } catch {}
    playHoly("candle", { intention: f }).then(() => { if (box.isConnected) { box.innerHTML = prayHTML(); wirePray(main); } });
  };
  box.querySelector("[data-pray]")?.addEventListener("click", light);
  box.querySelector("#prayFor")?.addEventListener("keydown", (e) => e.key === "Enter" && light());
  box.querySelector("[data-pray-again]")?.addEventListener("click", () => { try { localStorage.removeItem(PRAY_KEY); } catch {} box.innerHTML = prayHTML(); wirePray(main); box.querySelector("#prayFor")?.focus(); });
}

// Ash Wednesday: a small cross of ash stays beside the greeting all day (tap it to see the ashes again)
const ASH_MARK = `<button class="ash-mark linkish" data-ash title="Ash Wednesday" aria-label="Ash Wednesday: see the ashes again" style="border:0;background:none;padding:0;cursor:pointer"><svg viewBox="0 0 22 30" aria-hidden="true">
  <filter id="ashy"><feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .14  0 0 0 0 .12  0 0 0 0 .1  0 0 0 -1.6 1.25"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <path d="M11 2v26M3 10h16" stroke="#2a2522" stroke-width="5.5" stroke-linecap="round" opacity=".55"/>
  <path d="M11 2v26M3 10h16" stroke="#000" stroke-width="7" stroke-linecap="round" filter="url(#ashy)"/></svg></button>`;

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Peace be with you";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
const named = (g) => { const n = String(synced.get("name") || "").trim(); return n ? `${g}, ${esc(n)}` : g; };


function vodHTML(vod) {
  const head = `<div class="vod-head"><div class="eyebrow">Verse for today</div><button class="btn icon ghost small" data-vod-set title="Where it comes from" aria-label="Where the verse for today comes from">⋯</button></div>`;
  if (vod.finished)
    return `<div class="card vod vod-done" style="padding:24px">${head}
      <div class="vod-done-title">You've finished ${esc(vod.name)}</div>
      <p class="muted" style="margin:6px 0 16px">One verse a day, all the way through. What would you like next?</p>
      <div class="vod-acts"><button class="btn primary" data-vod-again>Start ${esc(vod.name)} again</button><button class="btn" data-vod-set>Choose another</button>${
        vod.source === "chosen" ? `<button class="btn ghost" data-vod-reading>Follow what I'm reading</button>` : ""
      }</div></div>`;
  if (vod.story) {
    const st = vod.story;
    return `<div class="card vod vod-story" style="padding:24px">${head}
      <div class="vod-story-eyebrow">The story</div>
      <a class="vod-story-title" href="#/read/${vod.book}/${st.start[0]}?v=${st.start[1]}">${esc(st.title)}</a>
      <div class="muted small" style="font-weight:600;margin-top:2px">${esc(st.range)}</div>
      <blockquote class="quote vod-text">${bible.verseHTML(vod.text.replace(/\n\t?/g, " "))}
        <span class="muted small" style="font-style:normal;font-weight:600"> ${esc(bible.formatRef(vod.book, vod.chapter, vod.verse))}</span></blockquote>
      <p class="vod-question">${esc(st.question)}</p>
      <div class="vod-foot"><a class="btn small" href="#/read/${vod.book}/${st.start[0]}?v=${st.start[1]}">${icon("book")} Read the story</a>
        <span class="muted small">${daily.sourceLine(vod)}</span><span class="spacer"></span>
        <button class="btn ghost small" data-vod-another>Next</button></div></div>`;
  }
  return `<div class="card vod" style="padding:24px">${head}
      <a class="quote vod-text" href="#/read/${vod.book}/${vod.chapter}?v=${vod.verse}">${vod.text
        .split("\n")
        .map((l) => bible.verseHTML(l.replace(/^\t/, "")))
        .join("<br>")}</a>
      <div class="vod-foot"><a class="small" style="font-weight:600" href="#/read/${vod.book}/${vod.chapter}?v=${vod.verse}">${esc(bible.formatRef(vod.book, vod.chapter, vod.verse))}</a>
        <span class="muted small">${daily.sourceLine(vod)}</span><span class="spacer"></span>
        <button class="btn ghost small" data-vod-another>Another</button></div></div>`;
}

function wireVod(main) {
  const box = main.querySelector("#vod");
  if (!box) return;
  const redraw = async (opts) => {
    box.innerHTML = vodHTML(await daily.today(opts));
    wireVod(main);
  };
  box.querySelectorAll("[data-vod-set]").forEach((b) => (b.onclick = () => daily.choose(() => redraw())));
  box.querySelector("[data-vod-another]")?.addEventListener("click", () => redraw({ another: true }));
  box.querySelector("[data-vod-again]")?.addEventListener("click", async () => {
    const c = daily.settings();
    const sc = (await daily.today()).scope;
    daily.restart(sc?.book || c.book, sc?.chapter || 0);
    redraw();
  });
  box.querySelector("[data-vod-reading]")?.addEventListener("click", () => {
    daily.setSettings({ ...daily.settings(), mode: "reading" });
    daily.forgetToday();
    redraw();
  });
}

export async function renderHome(main) {
  const canon = bible.getCanon();
  const lastCh = act.lastRead(["chapter"]);
  const nextCh = lastCh ? bible.nextChapter(lastCh.book, lastCh.chapter) : { book: "GEN", chapter: 1 };
  const lastV = act.lastRead(["verse"]);
  const nextV = lastV ? await bible.stepVerse(lastV.book, lastV.chapter, lastV.verse_start, 1) : null;
  const vod = await daily.today();

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
      <h1 style="margin-top:4px">${named(greeting())}${seasonToday() === "ashes" ? ASH_MARK : ""}</h1>
    </div>

    <div id="vod">${vodHTML(vod)}</div>
    <div id="along"></div>

    <section class="section" style="margin-top:22px">
      <div class="section-head"><h2>How are you feeling?</h2><a href="#/topics" class="small" style="font-weight:600">All topics →</a></div>
      <div class="feel">${TOPICS.slice(0, 10).map((t) => `<a class="chip" href="#/topics?t=${t.id}">${esc(t.name)}</a>`).join("")}</div>
    </section>

    <section class="section card pray-card" id="prayCard">${prayHTML()}</section>

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

    ${goals.cardHTML()}

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
  wireVod(main);
  alongHTML().then((h) => { const a = main.querySelector("#along"); if (h && a?.isConnected) a.innerHTML = h; }); // Journey with
  main.querySelector("[data-ash]")?.addEventListener("click", () => playHoly("ash"));
  wirePray(main);
  goals.wire(main, () => renderHome(main));
}
