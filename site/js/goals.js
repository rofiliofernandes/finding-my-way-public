// Goals and progress rings for the Today page: Today · This week · Your journey.
import * as act from "./activity.js";
import * as store from "./store.js";
import * as bible from "./bible.js";
import * as synced from "./synced.js";
import { esc, openModal, toast } from "./ui.js";

const DEFAULT = { daily: 1, weekly: 5, journey: "all" }; // chapters a day · days a week · whole Bible
export const get = () => ({ ...DEFAULT, ...(synced.get("goals") || {}) });

const JOURNEYS = {
  all: { name: "the whole Bible", test: () => true },
  NT: { name: "the New Testament", test: (b) => b.t === "NT" },
  OT: { name: "the Old Testament", test: (b) => b.t === "OT" },
  gospels: { name: "the four Gospels", test: (b) => ["MAT", "MRK", "LUK", "JHN"].includes(b.id) },
  psalms: { name: "the Psalms", test: (b) => b.id === "PSA" },
};

// Chapters read today, counting part of a chapter as part of one
function chaptersToday() {
  const today = store.localDate();
  const canon = bible.getCanon();
  const ps = act.passages(act.logsBetween(today, store.addDays(today, 1)));
  return ps.reduce((a, p) => a + (p.whole ? 1 : Math.min(1, p.count / (canon.byId[p.book]?.vc[p.chapter - 1] || 1))), 0);
}

function daysThisWeek() {
  const ws = store.weekStart(store.localDate());
  return new Set(act.logsBetween(ws, store.addDays(ws, 7)).map((r) => store.localDate(r.read_at))).size;
}

function journey(kind) {
  const canon = bible.getCanon();
  const j = JOURNEYS[kind] || JOURNEYS.all;
  const books = canon.books.filter(j.test);
  const ids = new Set(books.map((b) => b.id));
  const total = books.reduce((a, b) => a + b.vc.length, 0);
  const done = [...act.chaptersRead()].filter((k) => ids.has(k.split(".")[0])).length;
  return { done, total, name: j.name };
}

export function progress() {
  const g = get();
  const t = chaptersToday(), w = daysThisWeek(), j = journey(g.journey);
  const fmt = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1).replace(/\.0$/, ""));
  return [
    { id: "today", label: "Today", value: Math.min(1, t / g.daily), text: `${fmt(Math.round(t * 10) / 10)} of ${g.daily}`, sub: g.daily === 1 ? "chapter" : "chapters" },
    { id: "week", label: "This week", value: Math.min(1, w / g.weekly), text: `${w} of ${g.weekly}`, sub: "days" },
    { id: "journey", label: "Your journey", value: j.done / j.total, text: j.done / j.total >= 0.1 ? `${Math.floor((j.done / j.total) * 100)}%` : `${j.done} of ${j.total}`, sub: j.done / j.total >= 0.1 ? `of ${j.name}` : `chapters of ${j.name}` },
  ];
}

const R = 34, C = 2 * Math.PI * R;
function ring(p) {
  const full = p.value >= 1;
  return `<div class="ring ${full ? "full" : ""}" data-ring="${p.id}">
    <svg viewBox="0 0 84 84" aria-hidden="true"><circle class="ring-bg" cx="42" cy="42" r="${R}"/>
      <circle class="ring-fg" cx="42" cy="42" r="${R}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" data-off="${(C * (1 - Math.max(0, p.value))).toFixed(1)}"/></svg>
    <div class="ring-mid">${full ? `<span class="ring-check">✓</span>` : `<b>${esc(p.text)}</b>`}</div>
    <div class="ring-label">${esc(p.label)}</div><div class="ring-sub">${full ? esc(p.text + " " + p.sub) : esc(p.sub)}</div>
  </div>`;
}

export function cardHTML() {
  return `<section class="section card goals" id="goals">
    <div class="section-head"><h2>Your goals</h2><button class="btn ghost small" data-goals-edit>Change</button></div>
    <div class="rings">${progress().map(ring).join("")}</div>
  </section>`;
}

// Draw the rings in after they're on screen
export function wire(root, redraw) {
  const box = root.querySelector("#goals");
  if (!box) return;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => box.querySelectorAll(".ring-fg").forEach((c) => (c.style.strokeDashoffset = c.dataset.off)))
  );
  box.querySelector("[data-goals-edit]").onclick = () => edit(redraw);
}

export function edit(onDone) {
  const g = get();
  const opt = (name, val, label, cur) => `<button type="button" class="chip ${String(cur) === String(val) ? "on" : ""}" data-k="${name}" data-v="${val}">${label}</button>`;
  openModal(
    `<div class="eyebrow">Your goals</div><h2 style="margin:4px 0 14px">Gentle goals, not rules</h2>
     <div class="goal-q"><b>Each day</b><div class="chips">${[1, 2, 3, 4, 5].map((n) => opt("daily", n, `${n} chapter${n > 1 ? "s" : ""}`, g.daily)).join("")}</div></div>
     <div class="goal-q"><b>Each week</b><div class="chips">${[3, 4, 5, 6, 7].map((n) => opt("weekly", n, `${n} days`, g.weekly)).join("")}</div></div>
     <div class="goal-q"><b>Your journey</b><div class="chips">${Object.entries(JOURNEYS)
       .map(([k, j]) => opt("journey", k, j.name[4].toUpperCase() + j.name.slice(5), g.journey))
       .join("")}</div></div>
     <div class="actions"><button class="btn ghost" data-cancel>Cancel</button><button class="btn primary" data-ok>Save</button></div>`,
    (dlg, close) => {
      const v = { ...g };
      dlg.querySelectorAll("[data-k]").forEach(
        (b) =>
          (b.onclick = () => {
            v[b.dataset.k] = b.dataset.k === "journey" ? b.dataset.v : +b.dataset.v;
            dlg.querySelectorAll(`[data-k="${b.dataset.k}"]`).forEach((x) => x.classList.toggle("on", x === b));
          })
      );
      dlg.querySelector("[data-cancel]").onclick = close;
      dlg.querySelector("[data-ok]").onclick = () => {
        synced.set("goals", v);
        close();
        toast("Goals saved");
        onDone?.();
      };
    }
  );
}
