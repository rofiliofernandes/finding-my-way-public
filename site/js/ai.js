// Optional AI layer: sends a few passages + your question to a small Cloudflare function,
// which calls Claude with your own API key. Only the passages shown are sent.
import { AI_ENABLED } from "./config.js";
import * as sync from "./sync.js";
import * as store from "./store.js";
import { getCanon } from "./bible.js";
import { esc, icon } from "./ui.js";

export function aiEnabled() {
  return AI_ENABLED && sync.status.configured;
}

export const MODES = {
  explain: { label: "Explain", icon: "sparkle", title: "What does this passage mean?" },
  reflect: { label: "Help me reflect", icon: "note", title: "Reflection" },
  ask: { label: "Ask", icon: "sparkle", title: "Answer" },
};

function trackUsage(u) {
  const month = store.localDate().slice(0, 7);
  let rec = store.pref("aiUsage");
  if (!rec || rec.month !== month) rec = { month, calls: 0, input: 0, output: 0 };
  rec.calls++;
  rec.input += u?.input_tokens || 0;
  rec.output += u?.output_tokens || 0;
  store.pref("aiUsage", rec);
}

export async function askAI({ mode, question = "", passages }) {
  const token = sync.accessToken();
  if (!token) throw new Error("Sign in (on the You page) to use AI explanations.");
  const res = await fetch("api/ai", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + token },
    body: JSON.stringify({ mode, question, passages }),
  });
  if (res.status === 404) throw new Error("The AI function isn't deployed yet — see “Optional: AI” in the README.");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `AI request failed (${res.status})`);
  trackUsage(data.usage);
  return data.text;
}

// Turn "John 3:16" etc. in the answer into links.
function linkify(html) {
  const canon = getCanon();
  const names = canon.books.map((b) => b.name).concat(["Psalm"]).sort((a, b) => b.length - a.length);
  const byName = Object.fromEntries(canon.books.map((b) => [b.name, b.id]));
  byName.Psalm = "PSA";
  const re = new RegExp("\\b(" + names.map((n) => n.replace(/ /g, "\\s")).join("|") + ")\\s(\\d+):(\\d+)(?:[–-]\\d+)?", "g");
  return html.replace(re, (m, name, c, v) => {
    const id = byName[name.replace(/\s/g, " ")];
    return id ? `<a href="#/read/${id}/${c}?v=${v}">${m}</a>` : m;
  });
}

export function renderAnswer(text) {
  const paras = esc(text)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return linkify(paras);
}

// Show an AI panel inside `host` and run the request.
export async function runInto(host, opts) {
  const m = MODES[opts.mode];
  host.hidden = false;
  host.innerHTML = `<div class="ai-panel"><div class="ai-head">${icon("sparkle")} ${esc(m.title)}</div><div class="ai-body"><div class="spinner" style="margin:14px auto"></div></div></div>`;
  const body = host.querySelector(".ai-body");
  try {
    const text = await askAI(opts);
    body.innerHTML = renderAnswer(text) + `<p class="muted small ai-note">AI can make mistakes. For guidance on your faith, a priest or spiritual director is the best companion.</p>`;
  } catch (e) {
    body.innerHTML = `<p class="small" style="color:#b2402f">${esc(e.message)}</p>`;
  }
}
