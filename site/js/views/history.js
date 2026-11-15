import * as bible from "../bible.js";
import * as act from "../activity.js";
import * as store from "../store.js";
import { esc, icon, $, confirmBox } from "../ui.js";
import * as fight from "../fight.js";

const WEEKS_IN_HEATMAP = 26;

export function renderHistory(main, _params, query) {
  const today = store.localDate();
  const thisWeek = store.weekStart(today);
  let week = query.get("week") ? store.weekStart(query.get("week")) : thisWeek;
  if (week > thisWeek) week = thisWeek;
  const weekEnd = store.addDays(week, 7);

  const logs = act.logsBetween(week, weekEnd);
  const notes = act.notes().filter((n) => n.kind === "note");
  const counts = act.dayCounts();
  const passages = act.passages(logs);
  const verses = logs.reduce((a, r) => a + act.versesIn(r), 0);
  const daysRead = new Set(logs.map((r) => store.localDate(r.read_at))).size;
  const weekNotes = notes.filter((n) => {
    const d = store.localDate(n.created_at);
    return d >= week && d < weekEnd;
  });

  // ----- day by day -----
  const dayRows = Array.from({ length: 7 }, (_, i) => {
    const d = store.addDays(week, i);
    const dt = store.parseDate(d);
    const dayLogs = logs.filter((r) => store.localDate(r.read_at) === d);
    const dayNotes = weekNotes.filter((n) => store.localDate(n.created_at) === d).reverse();
    const ps = act.passages(dayLogs);
    const future = d > today;
    const empty = !ps.length && !dayNotes.length;
    return `
      <div class="day ${empty ? "empty" : ""}">
        <div class="when">${dt.toLocaleDateString(undefined, { weekday: "long" })}<small>${dt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}${d === today ? " · today" : ""}</small></div>
        <div class="what">
          ${
            ps.length
              ? `<div class="passages">${ps
                  .map((p) => `<a class="passage" href="#/read/${p.book}/${p.chapter}${p.firstVerse ? "?v=" + p.firstVerse : ""}">${esc(p.label)}</a>`)
                  .join("")}</div>`
              : `<span class="small">${future ? "" : "No reading"}</span>`
          }
          ${dayNotes
            .map(
              (n) => `<div class="inline-note"><a href="#/read/${n.book}/${n.chapter}?v=${n.verse_start}">${esc(act.noteRef(n))}</a>${esc(n.body)}</div>`
            )
            .join("")}
        </div>
      </div>`;
  }).join("");

  // ----- heatmap (last N weeks, Monday-first columns) -----
  const firstWeek = store.addDays(thisWeek, -7 * (WEEKS_IN_HEATMAP - 1));
  let cells = "";
  for (let w = 0; w < WEEKS_IN_HEATMAP; w++) {
    const ws = store.addDays(firstWeek, 7 * w);
    for (let i = 0; i < 7; i++) {
      const d = store.addDays(ws, i);
      const n = counts.get(d) || 0;
      const lvl = n === 0 ? 0 : n < 10 ? 1 : n < 30 ? 2 : n < 80 ? 3 : 4;
      const title = `${store.parseDate(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}: ${n} verse${n === 1 ? "" : "s"}`;
      cells += `<a href="#/history?week=${ws}" title="${title}"><span class="cell l${lvl} ${ws === week ? "sel" : ""} ${d > today ? "future" : ""}"></span></a>`;
    }
  }

  // ----- book progress -----
  const read = act.chaptersRead();
  const canon = bible.getCanon();
  const prog = (t) =>
    canon.books
      .filter((b) => b.t === t)
      .map((b) => {
        let done = 0;
        for (let c = 1; c <= b.chapters; c++) if (read.has(b.id + "." + c)) done++;
        return { b, done };
      });
  const progHTML = (rows) =>
    rows
      .map(
        ({ b, done }) => `<a class="prog" href="#/books/${b.id}" style="color:inherit"><span>${esc(b.name)}</span><span class="n">${done}/${b.chapters}</span>
          <div class="progress-bar"><span style="width:${(done / b.chapters) * 100}%"></span></div></a>`
      )
      .join("");
  const ot = prog("OT");
  const nt = prog("NT");
  const totalCh = canon.books.reduce((a, b) => a + b.chapters, 0);
  const doneCh = [...ot, ...nt].reduce((a, x) => a + x.done, 0);

  const refl = act.reflection(week);
  // prayers: the ones made this week, plus earlier ones (up to 8 weeks back) that are still waiting for "How did it go?"
  const prayers = act
    .notes()
    .filter((n) => n.kind === "prayer")
    .filter((n) => {
      const d = store.localDate(n.created_at);
      if (d >= week && d < weekEnd) return true;
      return week === thisWeek && d < week && d >= store.addDays(week, -56) && !fight.prayerData(n).followup;
    })
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const isThisWeek = week === thisWeek;

  main.className = "wide";
  main.innerHTML = `
    <div class="weeknav">
      <a class="btn icon" href="#/history?week=${store.addDays(week, -7)}" title="Previous week">${icon("left")}</a>
      <h1><small class="eyebrow" style="display:block;margin-bottom:4px">${isThisWeek ? "This week" : "Week of"}</small>${esc(act.formatWeek(week))}</h1>
      <a class="btn icon" ${isThisWeek ? 'style="visibility:hidden"' : `href="#/history?week=${store.addDays(week, 7)}"`} title="Next week">${icon("right")}</a>
    </div>

    <div class="stat-row" style="justify-content:center;margin-top:14px">
      <div class="stat"><b>${daysRead}/7</b><span>days read</span></div>
      <div class="stat"><b>${passages.filter((p) => p.whole).length}</b><span>chapters</span></div>
      <div class="stat"><b>${verses}</b><span>verses</span></div>
      <div class="stat"><b>${weekNotes.length}</b><span>notes</span></div>
      <div class="stat"><b>${act.streak()}</b><span>day streak</span></div>
    </div>

    <section class="section card">
      <div class="section-head"><h2>Day by day</h2></div>
      ${dayRows}
    </section>

    ${
      prayers.length
        ? `<section class="section card" id="prayers">
            <div class="section-head"><h2>Given to Him</h2><span class="muted small">${prayers.length} prayer${prayers.length === 1 ? "" : "s"}</span></div>
            <p class="muted small" style="margin:0 0 6px">What you gave Him to fight for you. How did it go?</p>
            ${prayers.map((n) => fight.prayerHTML(n, { compact: true })).join("")}
          </section>`
        : ""
    }

    <section class="section card">
      <div class="section-head"><h2>Weekly reflection</h2><span class="muted small" id="reflState">${refl ? "Saved" : ""}</span></div>
      <p class="muted small" style="margin:0 0 10px">${
        passages.length
          ? `This week you read ${esc(
              passages
                .slice(0, 6)
                .map((p) => p.label)
                .join(", ")
            )}${passages.length > 6 ? ` and ${passages.length - 6} more` : ""}. What stayed with you? What is God asking of you?`
          : "Look back on the week. What stayed with you? What would you like to carry into next week?"
      }</p>
      <textarea id="refl" placeholder="Write your reflection…">${esc(refl?.body || "")}</textarea>
    </section>

    <section class="section card">
      <div class="section-head"><h2>Your rhythm</h2><span class="muted small">last ${WEEKS_IN_HEATMAP} weeks · tap a week</span></div>
      <div class="heatmap">${cells}</div>
    </section>

    <section class="section card">
      <details>
        <summary class="section-head" style="margin:0"><h2><span class="chev">›</span> Through the Bible</h2><span class="muted small">${doneCh} of ${totalCh} chapters</span></summary>
        <div class="progress-bar" style="margin:14px 0 18px"><span style="width:${(doneCh / totalCh) * 100}%"></span></div>
        <div class="eyebrow" style="margin-bottom:6px">Old Testament</div>
        <div class="progress-list">${progHTML(ot)}</div>
        <div class="eyebrow" style="margin:18px 0 6px">New Testament</div>
        <div class="progress-list">${progHTML(nt)}</div>
      </details>
    </section>`;

  const pr = $("#prayers", main);
  if (pr) fight.wirePrayers(pr, () => renderHistory(main, _params, query), confirmBox);
  const ta = $("#refl", main);
  const state = $("#reflState", main);
  let t;
  ta.addEventListener("input", () => {
    state.textContent = "Saving…";
    clearTimeout(t);
    t = setTimeout(() => {
      act.saveReflection(week, ta.value);
      state.textContent = ta.value.trim() ? "Saved" : "";
    }, 700);
  });

  return {
    cleanup: () => {
      clearTimeout(t);
      if (state.textContent === "Saving…") act.saveReflection(week, ta.value);
      main.className = "";
    },
    refresh: () => document.activeElement !== ta,
  };
}
