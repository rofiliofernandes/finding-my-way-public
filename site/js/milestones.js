// Weekly badges and the monthly Tree of Life.
//
// A week's badge is earned the moment your reading reaches your weekly goal (Your goals → each week).
// It's named for that week of the Church year and coloured for its season.
// A month counts when you read on every day of it but at most 3 (three grace days, for the three days
// before He rose). Each month you complete adds a fruit to your Tree of Life and plays the next of twelve
// scenes; after twelve, a second year in gold. Missing a week or a month never takes anything away.
//
// Both play once, on whichever device you're using: what's been earned syncs (synced.js), so other
// devices don't play it again. Everything can be replayed from the You page.
import * as store from "./store.js";
import * as act from "./activity.js";
import * as synced from "./synced.js";
import * as goals from "./goals.js";
import * as social from "./social.js";
import * as lit from "./liturgy.js";
import * as scenes from "./scenes.js";
import { esc, toast } from "./ui.js";

const GRACE = 3;
const FRUIT = ["#e0473c", "#f08a2c", "#f3c13a", "#7a3b8f", "#e26a9a", "#8cc63f", "#4a79d0", "#b5283e", "#f6a37a", "#5a3e8f", "#efe05a", "#9a5f45"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const badges = () => synced.get("badges") || {}; // { weekStart: { mark, name, season, days, goal, at } }
const months = () => synced.get("months") || {}; // { "YYYY-MM": { n, at } } where n = 1, 2, 3… in order earned

/* ---------- reading days ---------- */

const readDays = (from, toExcl) => new Set(act.logsBetween(from, toExcl).map((r) => store.localDate(r.read_at)));
const pad = (n) => String(n).padStart(2, "0");
const monthKey = (d) => d.slice(0, 7);
const monthStart = (key) => key + "-01";
const nextMonth = (key) => { const [y, m] = key.split("-").map(Number); return m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`; };
const prevMonth = (key) => { const [y, m] = key.split("-").map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`; };
const daysIn = (key) => { const [y, m] = key.split("-").map(Number); return new Date(y, m, 0).getDate(); };
const missedIn = (key) => daysIn(key) - readDays(monthStart(key), monthStart(nextMonth(key))).size;

/* ---------- checking (after each reading, and when the app opens) ---------- */

let timer = 0, playing = false;
const queue = [];

export function init() {
  store.onChange((table, source) => {
    if (table === "reading_log" && source !== "remote") schedule(1600);
  });
  schedule(2500); // catch up on a month that ended while the app was closed
}
function schedule(ms) {
  clearTimeout(timer);
  timer = setTimeout(check, ms);
}

export function check() {
  if (!act.logs().length) return;
  const today = store.localDate();
  // the month: on its last day once it's safely complete, or afterwards when the app next opens
  const m = months();
  const first = monthKey(store.localDate(act.logs()[0].read_at));
  for (let k = prevMonth(monthKey(today)), n = 0; k >= first && n < 2; k = prevMonth(k), n++) {
    if (!m[k] && !store.meta("monthChecked:" + k)) {
      if (missedIn(k) <= GRACE) earnMonth(k);
      else store.meta("monthChecked:" + k, true);
    }
  }
  const cur = monthKey(today);
  const lastDay = `${cur}-${pad(daysIn(cur))}`;
  if (today === lastDay && !m[cur] && readDays(today, store.addDays(today, 1)).size && missedIn(cur) <= GRACE) earnMonth(cur);
  // the week
  const ws = store.weekStart(today);
  if (!badges()[ws]) {
    const days = readDays(ws, store.addDays(ws, 7)).size, goal = goals.get().weekly;
    if (days >= goal) earnWeek(ws, days, goal);
  }
  playNext();
}

function earnWeek(ws, days, goal) {
  const w = lit.weekOf(ws);
  const b = badges();
  b[ws] = { mark: lit.badgeMark(w), name: w.name, season: w.season, days, goal, at: store.nowISO() };
  synced.set("badges", b);
  social.moment("week", ws, w.name); // Along the way, for companions
  queue.push(() => playWeek(ws, true));
}

function earnMonth(key) {
  const m = months();
  const n = Object.keys(m).length + 1;
  m[key] = { n, at: store.nowISO() };
  synced.set("months", m);
  social.moment("month", key, social.monthTitle(n));
  queue.unshift(() => playMonth(key, true)); // a month goes before a week if both arrive together
}

function playNext() {
  if (playing || !queue.length) return;
  queue.shift()();
}

/* ---------- the player: a full-screen canvas, scaled to fit ---------- */

const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function player({ dur, edge, draw, after }) {
  playing = true;
  const el = document.createElement("div");
  el.className = "milestone";
  el.style.background = `linear-gradient(${edge[0]}, ${edge[1]})`;
  el.innerHTML = `<canvas></canvas><button class="ms-skip" type="button">Skip</button>`;
  document.body.appendChild(el);
  const cv = el.querySelector("canvas"), c = cv.getContext("2d");
  const size = () => {
    const d = Math.min(2, devicePixelRatio || 1), s = Math.min(innerWidth / 390, innerHeight / 760);
    cv.width = innerWidth * d; cv.height = innerHeight * d;
    c.setTransform(d * s, 0, 0, d * s, d * (innerWidth - 390 * s) / 2, d * (innerHeight - 760 * s) / 2);
  };
  size();
  addEventListener("resize", size);
  requestAnimationFrame(() => el.classList.add("in"));
  let raf = 0, done = false;
  const t0 = performance.now();
  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    removeEventListener("resize", size);
    el.classList.remove("in");
    setTimeout(() => {
      el.remove();
      playing = false;
      after?.();
      setTimeout(playNext, 600);
    }, 400);
  };
  el.querySelector(".ms-skip").onclick = finish;
  el.addEventListener("click", (e) => { if (e.target === cv && performance.now() - t0 > 1500) finish(); });
  document.addEventListener("keydown", function k(e) { if (e.key === "Escape") (document.removeEventListener("keydown", k), finish()); });
  if (reduce()) { // a still picture of the ending, briefly
    const tt = dur * 0.93;
    c.clearRect(-1e4, -1e4, 2e4, 2e4); draw(c, tt);
    setTimeout(finish, 4500);
    return;
  }
  const frame = (now) => {
    const t = (now - t0) / 1000;
    c.clearRect(-1e4, -1e4, 2e4, 2e4);
    draw(c, Math.min(t, dur));
    if (t < dur + .4) raf = requestAnimationFrame(frame);
    else finish();
  };
  raf = requestAnimationFrame(frame);
}

/* ---------- weekly badge ---------- */

const rangeLabel = (ws) => {
  const a = store.parseDate(ws), b = store.parseDate(store.addDays(ws, 6));
  const mo = (d) => d.toLocaleDateString(undefined, { month: "short" });
  return a.getMonth() === b.getMonth() ? `${mo(a)} ${a.getDate()} – ${b.getDate()}` : `${mo(a)} ${a.getDate()} – ${mo(b)} ${b.getDate()}`;
};

function weekSetup(ws) {
  const b = badges(), me = b[ws], w = lit.weekOf(ws);
  // the row: up to four earlier badges, then this one
  const earlier = Object.keys(b).filter((k) => k < ws).sort().slice(-4);
  const row = earlier.map((k) => { const x = lit.weekOf(k); return { mark: b[k].mark, color: x.color, light: x.light }; });
  return {
    mark: me.mark, name: me.name, color: w.color, light: w.light, row, slot: row.length,
    sub: `${me.days} of ${me.goal} days · ${rangeLabel(ws)}`, rowLabel: `Your weeks · ${lit.SEASONS[w.season].name}`,
  };
}

export function playWeek(ws, fresh = false) {
  if (!badges()[ws]) return;
  scenes.setWeek(weekSetup(ws));
  player({ dur: scenes.WEEKLY_DUR, edge: ["#1a1611", "#120f0b"], draw: (c, t) => scenes.weekly(c, t),
    after: () => fresh && bar("Week complete", badges()[ws].name, () => shareWeek(ws), "See your weeks") });
}

/* ---------- monthly scene ---------- */

function monthLabels(key) {
  const n = months()[key].n, year = Math.floor((n - 1) / 12), i = (n - 1) % 12;
  const big = `${n} MONTH${n === 1 ? "" : "S"} · EVERY DAY`;
  const small = year ? `Year ${year + 1} in gold · fruit ${i + 1} of 12` : i === 11 ? "Your Tree of Life, full of fruit" : `Fruit ${i + 1} of your Tree of Life`;
  return { n, i, gold: year > 0, big, small };
}

export function playMonth(key, fresh = false) {
  if (!months()[key]) return;
  const L = monthLabels(key), sc = scenes.MONTHS[L.i];
  player({ dur: sc.dur, edge: sc.edge, draw: (c, t) => scenes.drawMonth(c, L.i, t, L),
    after: () => fresh && bar(`${monthName(key)} complete`, `${sc.name} · fruit ${L.i + 1} of 12`, () => shareMonth(key), "See your Tree of Life") });
}
const monthName = (key) => { const [y, m] = key.split("-").map(Number); return `${MONTH_NAMES[m - 1]} ${y}`; };

/* ---------- the bar afterwards (like a treasure found), and sharing ---------- */

function bar(title, sub, onShare, seeLabel) {
  document.querySelector(".egg-found")?.remove();
  const el = document.createElement("div");
  el.className = "egg-found";
  el.innerHTML = `<div class="egg-found-icon">✦</div>
    <div class="egg-found-text"><b>${esc(title)}</b><span>${esc(sub)}</span><a class="egg-found-link" href="#/settings?journey=1" data-see>${esc(seeLabel)} →</a></div>
    <button class="btn small" data-share>Share</button><button class="btn icon ghost" data-x aria-label="Close">✕</button>`;
  document.body.appendChild(el);
  const close = () => (el.classList.add("out"), setTimeout(() => el.remove(), 300));
  el.querySelector("[data-x]").onclick = close;
  el.querySelector("[data-see]").addEventListener("click", close);
  el.querySelector("[data-share]").onclick = onShare;
  setTimeout(close, 12000);
}

async function shareCanvas(canvas, name, text) {
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  const file = new File([blob], name, { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], text });
    if (navigator.share) return await navigator.share({ text });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("Picture downloaded");
  } catch (e) {
    if (e?.name !== "AbortError") console.warn("share failed", e);
  }
}

function shareWeek(ws) {
  const me = badges()[ws], w = lit.weekOf(ws);
  const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1350;
  const c = cv.getContext("2d");
  const g = c.createLinearGradient(0, 0, 0, 1350); g.addColorStop(0, "#2a241b"); g.addColorStop(1, "#120f0b"); c.fillStyle = g; c.fillRect(0, 0, 1080, 1350);
  const halo = c.createRadialGradient(540, 560, 40, 540, 560, 520); halo.addColorStop(0, "rgba(255,205,110,.45)"); halo.addColorStop(1, "rgba(255,205,110,0)"); c.fillStyle = halo; c.fillRect(0, 0, 1080, 1350);
  scenes.medallion(c, 540, 560, 250, 1, 0, 0, me.mark, w.color, w.light);
  c.textAlign = "center"; c.fillStyle = "#d4aa5a"; c.font = "600 34px Inter, system-ui, sans-serif"; c.fillText("WEEK COMPLETE", 540, 940);
  c.fillStyle = "#f1e9da"; c.font = `600 ${me.name.length > 26 ? 56 : 64}px Literata, Georgia, serif`; c.fillText(me.name, 540, 1030);
  c.fillStyle = "#a99e8c"; c.font = "500 34px Inter, system-ui, sans-serif"; c.fillText(`${me.days} of ${me.goal} days · ${rangeLabel(ws)}`, 540, 1090);
  c.font = "italic 400 32px Literata, Georgia, serif"; c.fillText("Iter ad Dominum · finding my way to Jesus Christ", 540, 1270);
  shareCanvas(cv, `week-${ws}.png`, `✦ Week complete: ${me.name}`);
}

function shareMonth(key) {
  const L = monthLabels(key), sc = scenes.MONTHS[L.i];
  const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 2105; // 390 × 760, at 2.77×
  const c = cv.getContext("2d"); c.setTransform(1080 / 390, 0, 0, 1080 / 390, 0, 0);
  scenes.drawMonth(c, L.i, sc.dur * 0.95, L);
  shareCanvas(cv, `month-${key}.png`, `✦ ${monthName(key)}: every day with the Bible. ${sc.name}.`);
}

/* ---------- the You page: your weeks, and your Tree of Life ---------- */

export function journeyHTML() {
  const b = badges(), m = months(), today = store.localDate();
  const year = today.slice(0, 4);
  // every week that starts in this calendar year
  let ws = store.weekStart(`${year}-01-01`);
  if (ws < `${year}-01-01`) ws = store.addDays(ws, 7);
  const cells = [];
  for (; ws.slice(0, 4) === year; ws = store.addDays(ws, 7)) {
    const got = b[ws], w = got ? lit.weekOf(ws) : null, past = ws <= today, now = ws === store.weekStart(today);
    cells.push(got
      ? `<button class="wk got" style="--c:${w.color};--l:${w.light}" data-week="${ws}" title="${esc(got.name)}">${esc(got.mark)}</button>`
      : `<span class="wk ${now ? "now" : past ? "missed" : "future"}" title="${now ? "This week" : ""}"></span>`);
  }
  const earnedThisYear = Object.keys(b).filter((k) => k.startsWith(year)).length;
  // the tree
  const list = Object.entries(m).sort((x, y) => x[1].n - y[1].n);
  const total = list.length, yr = Math.floor(Math.max(0, total - 1) / 12), inYear = total ? ((total - 1) % 12) + 1 : 0;
  const spots = [[60, 52], [92, 38], [128, 30], [164, 38], [196, 52], [74, 82], [110, 70], [146, 70], [182, 82], [96, 104], [132, 98], [166, 106]];
  const fruit = spots.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="8.5" ${i < inYear ? `fill="${FRUIT[i]}"` : `fill="none" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 3"`}/>`).join("");
  const treeSVG = `<svg class="tol-svg ${yr ? "gold" : ""}" viewBox="0 0 256 190" aria-hidden="true">
    <path d="M128 186c-4-34-2-56 0-70M128 130c-16-12-34-18-50-30M128 122c18-10 36-18 52-30M128 150c-12-8-20-10-30-12" stroke="#7a5536" stroke-width="7" fill="none" stroke-linecap="round"/>
    <ellipse cx="128" cy="70" rx="104" ry="56" fill="#7fb069" opacity=".9"/><ellipse cx="92" cy="58" rx="46" ry="34" fill="#93c47b" opacity=".8"/><ellipse cx="166" cy="62" rx="48" ry="34" fill="#6ea35b" opacity=".8"/>${fruit}</svg>`;
  const rows = list.length
    ? list.map(([k, v]) => { const i = (v.n - 1) % 12; return `<button class="tol-row" data-month="${k}"><i style="background:${FRUIT[i]}"></i><b>${esc(monthName(k))}</b><span>${esc(scenes.MONTHS[i].name)}${v.n > 12 ? " · in gold" : ""}</span><em>▶</em></button>`; }).join("")
    : `<p class="muted small" style="margin:0">Read every day of a month (three days of grace allowed) to grow your first fruit.</p>`;
  return `<section class="card section" id="journey">
    <div class="section-head"><h2>Your journey</h2></div>
    <div class="jr-sub"><b>Your weeks · ${year}</b><span class="muted small">${earnedThisYear} badge${earnedThisYear === 1 ? "" : "s"} · a badge for each week you reach your goal of ${goals.get().weekly} days</span></div>
    <div class="wk-grid">${cells.join("")}</div>
    <div class="jr-sub" style="margin-top:20px"><b>Your Tree of Life</b><span class="muted small">${total ? `${yr ? `Year ${yr + 1}, in gold · ` : ""}${inYear} of 12 fruits` : "No fruit yet"}</span></div>
    <div class="tol">${treeSVG}<div class="tol-list">${rows}</div></div>
  </section>`;
}

export function wireJourney(root) {
  root.querySelectorAll("[data-week]").forEach((b) => (b.onclick = () => playWeek(b.dataset.week)));
  root.querySelectorAll("[data-month]").forEach((b) => (b.onclick = () => playMonth(b.dataset.month)));
}
