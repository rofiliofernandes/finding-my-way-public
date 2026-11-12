import * as store from "../store.js";
import * as sync from "../sync.js";
import { esc, icon, $, toast, timeAgo, confirmBox } from "../ui.js";
import * as semantic from "../semantic.js";
import { AI_ENABLED } from "../config.js";

const GOOGLE = `<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.8 6.1C12.3 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-4-13.6-9.6l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>`;

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
      notes: store.all("notes").length,
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

      <section class="card section">
        <div class="section-head"><h2>Reading</h2></div>
        <div class="setting"><div class="what"><b>Text size</b><span class="muted small" id="sizeLabel">${size}px</span></div>
          <input type="range" min="15" max="26" step="1" value="${size}" id="size"></div>
        <div class="setting"><div class="what"><b>Appearance</b></div>
          <div class="chips">${["system", "light", "dark"]
            .map((t) => `<button class="chip ${theme === t ? "on" : ""}" data-theme="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`)
            .join("")}</div></div>
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
