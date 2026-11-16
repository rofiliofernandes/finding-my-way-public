import * as store from "../store.js";
import * as sync from "../sync.js";
import { esc, icon, $, toast, timeAgo, confirmBox } from "../ui.js";
import * as semantic from "../semantic.js";
import { AI_ENABLED } from "../config.js";
import * as blessing from "../blessing.js";
import * as daily from "../daily.js";
import * as motion from "../motion.js";
import * as eggs from "../eggs.js";
import * as act from "../activity.js";
import * as bible from "../bible.js";

const GOOGLE = `<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.8 6.1C12.3 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-4-13.6-9.6l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>`;

/* ---------- Hidden treasures: a wall of little doors ---------- */
// liturgical colours, each door a two-tone pane
const PALETTE = [["#8e5cc7", "#6b3fa0"], ["#d65555", "#b23a3a"], ["#3f9a68", "#2f7d4f"], ["#4a7fca", "#2d5fa6"], ["#e0b04a", "#c9962b"], ["#d27a95", "#b35d78"], ["#2fa3a0", "#1f7f7c"], ["#5d6fd0", "#4152ad"]];
const SEASON_COLORS = { christmas: ["#e7c45a", "#c9962b"], easter: ["#f0cf6a", "#d6a93a"], pentecost: ["#e05a4a", "#bf3b2c"], ashes: ["#8a7fa6", "#6b5f8a"], goodfriday: ["#7a2e2e", "#561d1d"], mercy: ["#d9534f", "#3f7fbf"], watch: ["#3b4a7a", "#25305a"] };
const SVG = (d) => `<svg viewBox="0 0 24 24">${d}</svg>`;
const EMBLEMS = {
  love: SVG('<path d="M12 21C5 16 2 12 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 4-3 8-10 13Z"/>'),
  light: SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
  rainbow: SVG('<path d="M3 17a9 9 0 0 1 18 0M6 17a6 6 0 0 1 12 0M9 17a3 3 0 0 1 6 0"/>'),
  sea: SVG('<path d="M2 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0M12 4v16"/>'),
  fish: SVG('<path d="M3 12c4-6 11-7 16-2l3-3v10l-3-3c-5 5-12 4-16-2Z"/><circle cx="8" cy="11" r=".8"/>'),
  still: SVG('<ellipse cx="12" cy="14" rx="9" ry="4"/><ellipse cx="12" cy="14" rx="5" ry="2"/><path d="M12 4v6"/>'),
  wept: SVG('<path d="M12 3c3 5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11Z"/>'),
  net: SVG('<path d="M3 5h18M3 5l3 14h12l3-14M8 5l2 14M16 5l-2 14M4.5 12h15"/>'),
  fire: SVG('<path d="M12 2c2 5 7 7 7 13a7 7 0 0 1-14 0c0-4 3-5 3-9 2 2 2 4 4 5 0-3-1-6 0-9Z"/>'),
  lamp: SVG('<path d="M4 15h11a5 5 0 0 0 5-5h-6l-2-2H6a4 4 0 0 0 0 8M9 15v4h6M12 4V2"/>'),
  bestill: SVG('<path d="M5 9h14M3 12h18M7 15h10"/>'),
  seek: SVG('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'),
  amen: SVG('<path d="M8 21V11l4-8 4 8v10M8 14h8"/>'),
  christmas: SVG('<path d="M12 2l2.6 6.4L21 9l-5 4.3L17.5 20 12 16.6 6.5 20 8 13.3 3 9l6.4-.6Z"/>'),
  easter: SVG('<path d="M4 20V12a8 8 0 0 1 16 0v8M4 20h16"/><circle cx="17" cy="16" r="3"/>'),
  pentecost: SVG('<path d="M8 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 2-3 2-5M16 6c1 2 3 3 3 6a3 3 0 0 1-6 0"/>'),
  ashes: SVG('<path d="M12 4v16M7 9h10"/>'),
  goodfriday: SVG('<path d="M12 2v20M6 7h12"/>'),
  mercy: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  watch: SVG('<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10Z"/>'),
  psalm119: SVG('<path d="M6 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6zM6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2M9 8h6M9 12h6M9 16h4"/>'),
  bible: SVG('<path d="M12 6c-2.5-1.6-5.5-2-8-1.6V19c2.5-.4 5.5 0 8 1.6 2.5-1.6 5.5-2 8-1.6V4.4C17.5 4 14.5 4.4 12 6Zm0 0v14.6M15 9h3"/>'),
  stars: SVG('<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM18 16l.8 1.8L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-1.2z"/>'),
  ladder: SVG('<path d="M8 22 10 2M16 22 14 2M8.5 18h7M9 13h6M9.5 8h5"/>'),
  bush: SVG('<path d="M5 18a5 5 0 0 1 4-8 6 6 0 0 1 10 2 4 4 0 0 1-1 6zM12 8c1-2 3-3 3-5"/>'),
  manna: SVG('<circle cx="6" cy="8" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="18" cy="9" r="1.5"/><circle cx="9" cy="14" r="1.5"/><circle cx="15" cy="15" r="1.5"/><path d="M3 20h18"/>'),
  donkey: SVG('<path d="M4 6h12a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-6l-4 4v-4H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>'),
  voice: SVG('<path d="M4 12h2M9 9v6M12 7v10M15 9v6M18 12h2"/>'),
  lions: SVG('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="13" r="4"/><path d="M10 12h.01M14 12h.01"/>'),
  raphael: SVG('<path d="M12 6v14M12 8C9 4 4 4 3 8c3 0 6 2 9 6M12 8c3-4 8-4 9 0-3 0-6 2-9 6"/>'),
  bethlehem: SVG('<path d="M12 2l2 6 6 1-5 3 2 6-5-4-5 4 2-6-5-3 6-1z"/>'),
  waterwalk: SVG('<path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0M12 4a1.5 1.5 0 1 1 0 .01M12 7v6M9 9l3 2 3-2"/>'),
  storm: SVG('<path d="M6 15a4 4 0 0 1 1-8 6 6 0 0 1 11 2 3 3 0 0 1 0 6M12 13l-2 4h3l-2 4"/>'),
  sheep: SVG('<path d="M6 12a3 3 0 0 1 3-4 3 3 0 0 1 5 0 3 3 0 0 1 3 4 3 3 0 0 1-3 4H9a3 3 0 0 1-3-4zM9 16v4M15 16v4"/>'),
  manger: SVG('<path d="M3 9h18l-3 7H6zM6 16l-2 5M18 16l2 5M9 9a3 3 0 0 1 6 0"/>'),
  host: SVG('<circle cx="6" cy="7" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="18" cy="7" r="2"/><path d="M4 18c3-3 13-3 16 0"/>'),
  wine: SVG('<path d="M7 3h10l-1 6a4 4 0 0 1-8 0zM12 13v7M8 21h8"/>'),
  loaves: SVG('<path d="M4 13c0-4 4-7 8-7s8 3 8 7v4H4zM8 9v4M12 7v6M16 9v4"/>'),
  cloth: SVG('<path d="M4 7h16v10H4zM4 11h16M9 7v10"/>'),
  notseen: SVG('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>'),
  stone: SVG('<path d="M3 20V12a7 7 0 0 1 14 0v8M3 20h18"/><circle cx="18" cy="16" r="3"/>'),
  newall: SVG('<path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3"/><circle cx="12" cy="12" r="3"/>'),
  streak40: SVG('<path d="M3 14c5 0 7 2 9 5 1-4 0-9-3-12 5 2 8 6 8 10 2-2 4-3 6-3-2 2-3 4-3 6-2 4-8 5-13 3-2-1-3-5-4-9Z"/>'),
};
const NUM = (n) => `<svg viewBox="0 0 24 24"><text x="12" y="16.5" text-anchor="middle" font-size="12" font-family="Georgia,serif" font-style="italic" fill="#fff" stroke="none">${n}</text><circle cx="12" cy="12" r="9"/></svg>`;
const MYSTERY = SVG('<path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .8-1 1.5V14M12 17.5v.01"/>');

function itemHTML(t, { locked, lockText, progress }) {
  const found = eggs.isFound(t.id);
  if (found) {
    const when = new Date(eggs.foundAt(t.id)).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const open = t.where ? `<a class="btn ghost small" href="#/read/${t.where[0]}/${t.where[1]}?v=${t.where[2]}">${icon("book")} Open</a>` : "";
    return `<div class="door__item"><b>${esc(t.title)}</b><div class="sub">Found ${esc(when)}</div><div class="acts"><button class="btn small" data-share="${t.id}">${icon("share")} Share</button><button class="btn ghost small" data-play="${t.id}">Play again</button>${open}</div></div>`;
  }
  if (locked) {
    const read = t.where ? `<a class="btn ghost small" href="#/read/${t.where[0]}/${t.where[1]}">${icon("book")} Read it</a>` : "";
    return `<div class="door__item"><b>Still hidden</b><div class="sub">${esc(lockText)}</div><div class="acts">${read}</div></div>`;
  }
  return `<div class="door__item" data-t="${t.id}"><b>Still hidden</b>${progress ? `<div class="sub">${esc(progress)}</div>` : ""}<div class="reveal-slot"></div>
    <div class="acts"><button class="btn ghost small" data-hint="${t.id}">Hint</button><button class="btn ghost small" data-show="${t.id}">Show me</button></div></div>`;
}

function doorHTML({ label, colors, emblem, items, opts }) {
  const n = items.length;
  const got = items.filter((t) => eggs.isFound(t.id)).length;
  const gems = "✦".repeat(got) + "✧".repeat(n - got);
  return `<article class="door" style="--c1:${colors[0]};--c2:${colors[1]}">
    <button class="door__pane" aria-expanded="false" aria-label="${esc(label)}: ${got} of ${n} found">
      <span class="door__emblem">${emblem}</span>
      <span class="door__label">${esc(label)}</span>
      <span class="door__gems" aria-hidden="true">${gems}</span>
    </button>
    <div class="door__inside">
      <button class="door__close" data-closedoor aria-label="Close">${icon("close")}</button>
      <div class="door__bauble ${got ? "" : "empty"}">${got ? "✦" : "?"}</div>
      ${items.map((t) => itemHTML(t, typeof opts === "function" ? opts(t) : opts)).join("")}
    </div>
  </article>`;
}

function treasuresHTML() {
  const total = eggs.TREASURES.length;
  const found = eggs.foundCount();
  const read = act.chaptersRead();
  const streak = act.streak();
  const mystery = (t) => (eggs.isFound(t.id) ? EMBLEMS[t.id] || MYSTERY : MYSTERY);
  const gemRow = eggs.TREASURES.map((t) => `<i class="${eggs.isFound(t.id) ? "on" : ""}"></i>`).join("");
  const headline =
    found === 0 ? "Treasures are hidden all through the Bible" : found === total ? "You've found every hidden treasure" : `You've uncovered ${found} hidden treasure${found === 1 ? "" : "s"}`;
  let html = `<section class="card section" id="treasures">
    <div class="treasure-head"><div class="egg-found-icon">✦</div><div><h2 style="font-size:19px">${headline}</h2>
      <div class="muted small" style="font-style:italic;font-family:var(--serif);font-size:14.5px">“The Kingdom of Heaven is like treasure hidden in the field…” (Matthew 13:44)</div></div></div>
    <div class="gemrow" title="${found} of ${total} found">${gemRow}</div>`;

  // In the Scriptures: one door per chapter
  html += `<div class="treasure-group"><div class="section-head" style="margin-bottom:0"><h3>Hidden in the Scriptures</h3></div>
    <p class="muted small" style="margin:2px 0 0">Open a door to see what's inside. Hints unlock once you've finished reading that chapter.</p><div class="doors">`;
  eggs.treasureChapters().forEach((ch, i) => {
    const label = bible.formatRef(ch.book, ch.chapter);
    const done = read.has(ch.book + "." + ch.chapter);
    const allFound = ch.items.every((t) => eggs.isFound(t.id));
    html += doorHTML({ label, colors: PALETTE[i % PALETTE.length], emblem: allFound ? EMBLEMS[ch.items[0].id] : MYSTERY, items: ch.items, opts: { locked: !done, lockText: `Finish ${label} to unlock a hint` } });
  });
  html += `</div></div>`;

  // Gestures
  html += `<div class="treasure-group"><div class="section-head" style="margin-bottom:0"><h3>Hidden gestures</h3></div>
    <p class="muted small" style="margin:2px 0 0">Hints unlock after you've found 3 treasures.</p><div class="doors">`;
  eggs.TREASURES.filter((t) => t.group === "gesture").forEach((t, i) => {
    html += doorHTML({ label: eggs.isFound(t.id) ? t.title : "A secret gesture", colors: PALETTE[(i + 6) % PALETTE.length], emblem: mystery(t), items: [t], opts: { locked: found < 3, lockText: "Find 3 treasures to unlock a hint" } });
  });
  html += `</div></div>`;

  // Seasons and hours
  const SEASON_LABEL = { christmas: "Christmas", easter: "Easter Sunday", pentecost: "Pentecost", ashes: "Ash Wednesday", goodfriday: "Good Friday", mercy: "3 o'clock", watch: "The night watch" };
  html += `<div class="treasure-group"><div class="section-head" style="margin-bottom:0"><h3>Seasons and hours</h3></div><div class="doors">`;
  eggs.TREASURES.filter((t) => t.group === "season").forEach((t) => {
    html += doorHTML({ label: SEASON_LABEL[t.id], colors: SEASON_COLORS[t.id], emblem: EMBLEMS[t.id], items: [t], opts: { locked: false } });
  });
  html += `</div></div>`;

  // Milestones
  const MILE_LABEL = { streak3: "3 days", streak7: "7 days", streak12: "12 days", streak40: "40 days", psalm119: "Psalm 119", bible: "The whole Bible" };
  html += `<div class="treasure-group"><div class="section-head" style="margin-bottom:0"><h3>Milestones</h3></div><div class="doors">`;
  eggs.TREASURES.filter((t) => t.group === "milestone").forEach((t) => {
    const progress = t.need ? `Your streak: ${Math.min(streak, t.need)} of ${t.need} days` : t.id === "psalm119" ? (read.has("PSA.119") ? "Finished" : "Not finished yet") : `${read.size.toLocaleString()} of 1,328 chapters`;
    const emblem = t.need && t.id !== "streak40" ? NUM(t.need) : EMBLEMS[t.id];
    html += doorHTML({ label: MILE_LABEL[t.id], colors: ["#e0b04a", "#c9962b"], emblem, items: [t], opts: { locked: false, progress } });
  });
  html += `</div></div>`;
  return html + `</section>`;
}

function wireTreasures(main) {
  const reveal = (btn, text) => {
    const slot = btn.closest(".door__item").querySelector(".reveal-slot");
    slot.innerHTML = `<div class="hint">${esc(text)}</div>`;
  };
  const byId = (id) => eggs.TREASURES.find((t) => t.id === id);
  // Only one door open at a time. Close it by: opening another, tapping the door again (its swung-open
  // edge or any empty part inside), the ✕, Escape, or turning the phone away like closing a door.
  let stopTurn = () => {};
  const closeDoor = (door) => {
    if (!door?.classList.contains("open")) return;
    door.classList.remove("open");
    door.querySelector(".door__pane").setAttribute("aria-expanded", "false");
    stopTurn();
  };
  const closeAll = () => main.querySelectorAll(".door.open").forEach(closeDoor);
  main.querySelectorAll(".door").forEach((door) => {
    const pane = door.querySelector(".door__pane");
    pane.onclick = () => {
      if (door.classList.contains("open")) return closeDoor(door);
      closeAll();
      door.classList.add("open");
      pane.setAttribute("aria-expanded", "true");
      stopTurn = motion.onTurnAway(() => closeDoor(door));
    };
    door.querySelector(".door__inside").addEventListener("click", (e) => {
      if (!e.target.closest("button, a")) closeDoor(door);
    });
    door.querySelector("[data-closedoor]").onclick = () => closeDoor(door);
  });
  const onKey = (e) => {
    if (e.key !== "Escape") return;
    if (!document.body.contains(main.querySelector("#treasures"))) return document.removeEventListener("keydown", onKey);
    closeAll();
  };
  document.addEventListener("keydown", onKey);
  main.querySelectorAll("[data-hint]").forEach((b) => (b.onclick = () => reveal(b, byId(b.dataset.hint).hint)));
  main.querySelectorAll("[data-show]").forEach((b) => (b.onclick = () => reveal(b, byId(b.dataset.show).how)));
  main.querySelectorAll("[data-share]").forEach((b) => (b.onclick = () => eggs.share(b.dataset.share)));
  main.querySelectorAll("[data-play]").forEach((b) => (b.onclick = () => eggs.playEffect(byId(b.dataset.play))));
}

function aiUsageText() {
  const u = store.pref("aiUsage");
  const month = store.localDate().slice(0, 7);
  if (!u || u.month !== month) return "On. No questions asked this month yet.";
  const tokens = u.input + u.output;
  return `On. This month on this device: ${u.calls} request${u.calls === 1 ? "" : "s"}, about ${tokens.toLocaleString()} tokens (${u.input.toLocaleString()} in, ${u.output.toLocaleString()} out).`;
}

export function renderSettings(main) {
  const draw = () => {
    const st = sync.status;
    const u = sync.user();
    const theme = store.pref("theme") || "system";
    const size = store.pref("fontSize") || 19;
    const counts = {
      log: store.all("reading_log").length,
      notes: store.all("notes").filter((n) => n.kind !== "treasure" && n.kind !== "settings").length,
      marks: store.all("bookmarks").length,
    };

    let account;
    if (!st.configured) {
      account = `<div class="notice"><b>Sync isn't set up yet.</b> Everything is saved on this device for now.
        To sign in with Google and sync across your devices, add your Supabase URL and anon key to <code>js/config.js</code> — the README explains each step.</div>`;
    } else if (!u) {
      account = `<div class="setting"><div class="what"><b>Sign in to sync</b><span class="muted small">Your history, notes and saved verses will follow you to every device.</span></div>
        <button class="btn google-btn" data-signin>${GOOGLE} Sign in with Google</button></div>
        ${st.error ? `<p class="small" style="color:#b2402f">${esc(st.error)}</p>` : ""}`;
    } else {
      const meta = u.user_metadata || {};
      account = `<div class="setting">
          ${meta.avatar_url ? `<img class="avatar" src="${esc(meta.avatar_url)}" alt="" referrerpolicy="no-referrer">` : `<div class="avatar"></div>`}
          <div class="what"><b>${esc(meta.full_name || meta.name || "Signed in")}</b><span class="muted small">${esc(u.email || "")}</span></div>
          <button class="btn ghost" data-signout>Sign out</button>
        </div>
        <div class="setting"><div class="what"><b>Sync</b><span class="muted small">${
          st.state === "syncing" ? "Syncing…" : st.state === "error" ? `<span style="color:#b2402f">Last sync failed: ${esc(st.error)}</span>` : st.lastSync ? "Last synced " + timeAgo(st.lastSync) : "Not synced yet"
        }</span></div><button class="btn" data-sync>${icon("sync")} Sync now</button></div>`;
    }

    main.innerHTML = `
      <div class="eyebrow">Settings</div>
      <h1 style="margin-top:4px">You</h1>

      <section class="card section">
        <div class="section-head"><h2>Account</h2></div>
        ${account}
      </section>

      ${treasuresHTML()}

      <section class="card section">
        <div class="section-head"><h2>Reading</h2></div>
        <div class="setting"><div class="what"><b>Text size</b><span class="muted small" id="sizeLabel">${size}px</span></div>
          <input type="range" min="15" max="26" step="1" value="${size}" id="size"></div>
        <div class="setting"><div class="what"><b>Appearance</b></div>
          <div class="chips">${["system", "light", "dark"]
            .map((t) => `<button class="chip ${theme === t ? "on" : ""}" data-theme="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`)
            .join("")}</div></div>
        <div class="setting"><div class="what"><b>Verse for today</b><span class="muted small" id="dailyDesc">${esc(daily.describe())}</span></div>
          <button class="btn" data-daily>Change</button></div>
        <div class="setting"><div class="what"><b>Motion</b><span class="muted small" id="motionDesc"></span></div><div id="motionCtl"></div></div>
        <div class="setting"><div class="what"><b>Title</b><span class="muted small">${
          store.pref("titleEnglish") ? "Shown in English. Hold-to-translate already used on this device." : "Shown in Latin. Hold the title for 2 seconds to translate it."
        }</span></div>${store.pref("titleEnglish") ? `<button class="btn" data-latin>Show in Latin again</button>` : ""}</div>
        <div class="setting"><div class="what"><b>The blessing</b><span class="muted small">After 5+ minutes of reading, pressing back from a passage shows a short blessing (about 8 seconds), once per visit. Tap to skip.</span></div>
          <button class="btn" data-bless>Preview</button></div>
        <p class="scripture" style="margin:10px 0 0;font-size:var(--read-size)">The <span class="sc">Lord</span> is my shepherd; I shall lack nothing.</p>
      </section>

      <section class="card section">
        <div class="section-head"><h2>Search & AI</h2></div>
        <div class="setting"><div class="what"><b>Search by meaning</b><span class="muted small">${
          semantic.status().status === "ready" ? "Ready on this device — works offline." : store.pref("semanticDownloaded") ? "Downloaded — loads when you search." : "Not downloaded yet. It downloads the first time you search by meaning."
        }</span></div>${store.pref("semanticDownloaded") ? "" : `<a class="btn" href="#/topics?q=love%20towards%20my%20family">Try it</a>`}</div>
        <div class="setting"><div class="what"><b>AI explanations</b><span class="muted small">${
          !AI_ENABLED ? "Off. See “Optional: AI” in the README to turn it on." : aiUsageText()
        }</span></div></div>
      </section>

      <section class="card section">
        <div class="section-head"><h2>Your data</h2></div>
        <p class="muted small" style="margin:0 0 6px">${counts.log} reading entries · ${counts.notes} notes & reflections · ${counts.marks} saved verses</p>
        <div class="row">
          <button class="btn" data-export>Export (JSON)</button>
          <label class="btn" style="cursor:pointer">Import<input type="file" accept="application/json" data-import hidden></label>
        </div>
      </section>

      <section class="section muted small" style="line-height:1.6">
        Scripture: <b>World English Bible, Catholic Edition</b> — public domain (eBible.org). 73 books in the Catholic canon and order.
        “World English Bible” is a trademark of eBible.org.
      </section>`;

    $("[data-signin]", main)?.addEventListener("click", () => sync.signIn());
    $("[data-signout]", main)?.addEventListener("click", async () => {
      if (await confirmBox("Sign out? Your data stays in your account and on this device.", "Sign out")) {
        await sync.signOut();
        toast("Signed out");
      }
    });
    $("[data-sync]", main)?.addEventListener("click", () => sync.syncNow());
    $("[data-bless]", main).onclick = () => blessing.show({ force: true });
    const drawMotion = () => {
      const desc = $("#motionDesc", main), ctl = $("#motionCtl", main);
      desc.textContent = "Shake your phone for a hidden treasure, and tilt it for gentle depth in the blessing and other scenes.";
      if (motion.needsPermission() && !motion.allowed()) {
        ctl.innerHTML = `<button class="btn" data-motion-allow>Allow motion</button>`;
        $("[data-motion-allow]", main).onclick = async () => {
          const ok = await motion.requestAccess();
          toast(ok ? "Motion is on" : "Motion wasn't allowed. You can allow it in Safari's settings.");
          drawMotion();
        };
      } else {
        const on = motion.enabled();
        ctl.innerHTML = `<div class="chips"><button class="chip ${on ? "on" : ""}" data-motion="on">On</button><button class="chip ${on ? "" : "on"}" data-motion="off">Off</button></div>`;
        main.querySelectorAll("[data-motion]").forEach((b) => (b.onclick = () => (motion.setEnabled(b.dataset.motion === "on"), drawMotion())));
      }
    };
    drawMotion();
    $("[data-daily]", main).onclick = () => daily.choose(() => ($("#dailyDesc", main).textContent = daily.describe()));
    wireTreasures(main);
    const latin = $("[data-latin]", main);
    if (latin)
      latin.onclick = () => {
        store.pref("titleEnglish", false);
        const t = document.querySelector(".brand .title-text");
        if (t) t.textContent = "Iter ad Dominum";
        draw();
      };
    const range = $("#size", main);
    range.addEventListener("input", () => {
      document.documentElement.style.setProperty("--read-size", range.value + "px");
      $("#sizeLabel", main).textContent = range.value + "px";
      store.pref("fontSize", +range.value);
    });
    main.querySelectorAll("[data-theme]").forEach(
      (b) =>
        (b.onclick = () => {
          const t = b.dataset.theme;
          store.pref("theme", t);
          if (t === "system") delete document.documentElement.dataset.theme;
          else document.documentElement.dataset.theme = t;
          draw();
        })
    );
    $("[data-export]", main).onclick = () => {
      const blob = new Blob([JSON.stringify(store.exportAll(), null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `finding-my-way-${store.localDate()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $("[data-import]", main).onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const n = store.importAll(JSON.parse(await f.text()));
        toast(`Imported ${n} item${n === 1 ? "" : "s"}`);
        draw();
      } catch {
        toast("That file couldn't be read");
      }
    };
  };
  draw();
  const off = sync.onStatus(() => {
    if (document.activeElement?.id !== "size") draw();
  });
  return { cleanup: off, refresh: () => draw() };
}
