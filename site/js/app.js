import * as bible from "./bible.js";
import * as store from "./store.js";
import * as sync from "./sync.js";
import * as welcome from "./welcome.js";
import * as milestones from "./milestones.js";
import * as install from "./install.js";
import { $, $$ } from "./ui.js";
import { renderHome } from "./views/home.js";
import { renderBooks, renderChapter, renderVerse, renderRandom } from "./views/read.js";
import { renderHistory } from "./views/history.js";
import { renderJournal } from "./views/journal.js";
import { renderSettings } from "./views/settings.js";
import { renderTopics } from "./views/topics.js";
import * as blessing from "./blessing.js";
import { initTitle } from "./title.js";
import * as eggs from "./eggs.js";

const routes = [
  [/^\/?$/, renderHome, "home"],
  [/^\/books(?:\/(\w+))?$/, renderBooks, "read"],
  [/^\/read\/(\w+)\/(\d+)$/, renderChapter, "read"],
  [/^\/verse\/(\w+)\/(\d+)\/(\d+)$/, renderVerse, "read"],
  [/^\/random$/, renderRandom, "read"],
  [/^\/topics$/, renderTopics, "topics"],
  [/^\/history$/, renderHistory, "history"],
  [/^\/journal$/, renderJournal, "journal"],
  [/^\/settings$/, renderSettings, "settings"],
];

const main = $("#view");
let current = null; // { cleanup, refresh }
let renderId = 0;

// Know whether a navigation was "back", by numbering our history entries.
let navIdx = history.state?.idx ?? 0;
if (history.state?.idx == null) history.replaceState({ ...(history.state || {}), idx: 0 }, "");
let lastPath = "";
const READING = /^\/(read|verse|random)\b/;

async function route() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, qs] = raw.split("?");
  let isBack = false;
  if (history.state?.idx == null) {
    navIdx += 1;
    history.replaceState({ ...(history.state || {}), idx: navIdx }, "");
  } else {
    isBack = history.state.idx < navIdx;
    navIdx = history.state.idx;
  }
  // pressing back from a passage after 5+ minutes of reading → a short blessing
  if (isBack && READING.test(lastPath) && path !== lastPath) blessing.show();
  lastPath = path;
  const query = new URLSearchParams(qs || "");
  let match = null;
  for (const [re, fn, tab] of routes) {
    const m = path.match(re);
    if (m) {
      match = { fn, tab, params: m.slice(1) };
      break;
    }
  }
  if (!match) {
    location.replace("#/");
    return;
  }
  current?.cleanup?.();
  current = null;
  main.className = "";
  $$(".tabs a").forEach((a) => a.classList.toggle("active", a.dataset.tab === match.tab));
  const id = ++renderId;
  try {
    const res = await match.fn(main, match.params, query);
    if (id !== renderId) {
      res?.cleanup?.();
      return;
    }
    current = res || null;
    if (match.tab === "home") eggs.onHome();
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="empty-state"><h2>Something went wrong</h2><p>${String(e.message || e)}</p><a href="#/">Go home</a></div>`;
  }
  if (!query.get("v")) main.focus({ preventScroll: true });
}

// Re-render when data arrives from another device.
let refreshTimer;
store.onChange((table, source) => {
  if (source === "local") return;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    if (!$("#modal").hidden) return;
    if (current?.refresh) {
      if (current.refresh() === true) route();
    } else {
      route();
    }
  }, 250);
});

sync.onStatus((st, session) => {
  const dot = $("#syncDot");
  dot.className = "sync-dot " + (session ? st.state : "");
  dot.title = !session ? "" : st.state === "error" ? "Sync failed: " + st.error : st.state === "syncing" ? "Syncing…" : "Synced";
});

async function start() {
  store.load();
  initTitle();
  blessing.startTimer();
  eggs.init();
  main.innerHTML = `<div class="spinner"></div>`;
  await bible.loadCanon();
  window.addEventListener("hashchange", route);
  await route();
  // once we know whether someone is signed in: the welcome screen for new visitors
  sync.init().then(() => welcome.maybeShow());
  milestones.init(); // weekly badges and the monthly Tree of Life
  install.init(); // the Install button (home-screen shortcut)
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

start();
