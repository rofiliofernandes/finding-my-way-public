// Journey with: the app's side of supabase/social.sql. Everything goes through server functions that run as you,
// so the privacy rules live in the database: only companions (an accepted invite) see your journey and your lights.
import * as sync from "./sync.js";
import * as store from "./store.js";
import * as synced from "./synced.js";
import * as act from "./activity.js";
import { bookName } from "./bible.js";
import * as scenes from "./scenes.js";

export const COLORS = ["#c9775f", "#d0607a", "#9a6fc4", "#5f86c9", "#4f9e9a", "#6b8f71", "#c4a24f", "#8a7a6b"];

export const can = () => sync.status.configured && !!sync.user();
const call = (fn, args) => sync.rpc(fn, args);

/* ---------- me ---------- */
let mine; // undefined: not asked yet; null: no username yet
let missing = false; // the server functions (supabase/social.sql) haven't been added yet
export const notSetUp = () => missing;
export async function me(force) {
  if (!can()) return null;
  if (mine !== undefined && !force) return mine;
  try { mine = await call("my_profile"); missing = false; store.meta("myProfile", mine); }
  catch (e) {
    if (/PGRST202|42883/.test(e.code || "") || /could not find the function|does not exist/i.test(e.message)) { missing = true; mine = null; return null; }
    mine = store.meta("myProfile") ?? null;
  }
  return mine;
}
export const cachedMe = () => (can() ? (mine !== undefined ? mine : store.meta("myProfile") ?? null) : null);
export const usernameOk = (u) => /^[a-z0-9_.]{3,20}$/.test(u);
export const usernameFree = (u) => call("username_free", { u });
export async function setProfile(u, name, col) {
  mine = await call("set_profile", { u, name, col });
  store.meta("myProfile", mine);
  publish(true);
  return mine;
}
// a suggestion from the saved name or the email
export function suggestUsername() {
  const base = String(synced.get("name") || sync.user()?.email?.split("@")[0] || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9_.]/g, "");
  return (base.length >= 3 ? base : base + "reader").slice(0, 20);
}

/* ---------- people ---------- */
export const search = (q) => call("search_people", { q });
export const circle = () => call("my_circle");
export const journeyOf = (uname) => call("journey_of", { uname });
export const invite = (other) => call("invite", { other }).then(after);
export const accept = (other) => call("accept", { other }).then(after);
export const part = (other) => call("part", { other }).then(after);
export const block = (other) => call("block", { other }).then(after);
export const unblock = (other) => call("unblock", { other });
export const blocks = () => call("my_blocks");
export const report = (other, why, light = null) => call("report", { other, why, light });
function after(v) { countInvites(); return v; }

/* ---------- lights (notes shared with companions) ---------- */
let myLights = null; // Set of note ids shared
export async function sharedNoteIds(force) {
  if (!can()) return new Set();
  if (myLights && !force) return myLights;
  try { myLights = new Set((await call("my_lights")).map((r) => r.note_id).filter(Boolean)); }
  catch { myLights = new Set(); }
  return myLights;
}
export async function shareLight(note) {
  await call("share_light", { b: note.book, c: note.chapter, vs: note.verse_start, ve: note.verse_end ?? note.verse_start, body: note.body, note: note.id });
  (await sharedNoteIds()).add(note.id);
}
export async function unshareLight(noteId) {
  await call("unshare_light", { note: noteId });
  (await sharedNoteIds()).delete(noteId);
}
export const lightsOn = (b, c) => call("lights_on", { b, c });
export const alongTheWay = (lim = 12) => call("along_the_way", { lim });

/* ---------- your journey, for your companions ---------- */
let pubTimer = null;
export function publish(now) {
  if (!can() || !cachedMe()) return;
  clearTimeout(pubTimer);
  pubTimer = setTimeout(async () => {
    const last = act.lastRead();
    try {
      await call("set_journey", {
        w: Object.keys(synced.get("badges") || {}).length,
        m: Object.keys(synced.get("months") || {}).length,
        s: act.streak(),
        lr: last ? store.localDate(last.read_at) : null,
        rd: last ? bookName(last.book) : null,
      });
    } catch {}
  }, now ? 50 : 4000);
}
// a weekly badge or a month, for Along the way (called by milestones.js)
export function moment(kind, key, title) {
  if (!can() || !cachedMe()) return;
  call("add_moment", { k: kind, kk: key, t: title }).catch(() => {});
  publish();
}
export const monthTitle = (n) => `${scenes.MONTHS[(n - 1) % 12].name}${n > 12 ? " (in gold)" : ""}, fruit ${((n - 1) % 12) + 1} on the Tree of Life`;

/* ---------- invites waiting (a dot on You) ---------- */
let invitesWaiting = 0;
const inviteSubs = new Set();
export const onInvites = (f) => (inviteSubs.add(f), () => inviteSubs.delete(f));
export const invites = () => invitesWaiting;
export async function countInvites() {
  if (!can() || !cachedMe()) { invitesWaiting = 0; inviteSubs.forEach((f) => f(0)); return 0; }
  try { invitesWaiting = (await circle()).filter((p) => p.relation === "invites_you").length; } catch {}
  inviteSubs.forEach((f) => f(invitesWaiting));
  return invitesWaiting;
}

export function init() {
  sync.onStatus(async (st, session) => {
    if (!session) { mine = undefined; myLights = null; countInvites(); return; }
    if (st.state === "ok") { await me(); countInvites(); publish(); }
  });
  store.onChange((table, how) => { if (table === "reading_log" && how === "local") publish(); });
  setInterval(() => document.visibilityState === "visible" && countInvites(), 120000);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && countInvites());
}

/* ---------- little pieces of UI used in several places ---------- */
export function avatar(p, size = 40) {
  const name = (p?.display_name || p?.username || "?").trim();
  const ch = [...name][0]?.toUpperCase() || "?";
  return `<span class="avatar" style="--av:${p?.color || COLORS[0]};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.44)}px" aria-hidden="true">${ch.replace(/[<>&"]/g, "")}</span>`;
}
export const who = (p) => (p?.display_name?.trim() || "@" + p?.username);
export function ago(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "yesterday" : d < 7 ? `${d} days ago` : new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
