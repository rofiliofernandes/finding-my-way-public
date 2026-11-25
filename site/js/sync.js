// Sign-in (Google, or email with a link and a 6-digit code, through Supabase Auth) and background sync of the local store.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import * as store from "./store.js";

const COLUMNS = {
  reading_log: ["id", "book", "chapter", "verse_start", "verse_end", "mode", "read_at", "created_at", "updated_at", "deleted"],
  notes: ["id", "kind", "book", "chapter", "verse_start", "verse_end", "week_start", "body", "created_at", "updated_at", "deleted"],
  bookmarks: ["id", "book", "chapter", "verse", "color", "created_at", "updated_at", "deleted"],
};

let client = null;
let session = null;
let ready = false;
export const isReady = () => ready || !status.configured;
let syncing = null;
let timer = null;
const listeners = new Set();
export const status = { configured: !!(SUPABASE_URL && SUPABASE_ANON_KEY), state: "idle", lastSync: store.meta("lastSync"), error: null };

export function onStatus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  listeners.forEach((fn) => fn(status, session));
}

export function accessToken() {
  return session?.access_token || null;
}

export function user() {
  return session?.user || null;
}

// Call one of the server functions in supabase/social.sql (Journey with). Throws a plain Error on failure.
export async function rpc(fn, args = {}) {
  if (!client || !session) throw new Error("Sign in to journey with others.");
  const { data, error } = await client.rpc(fn, args);
  if (error) throw Object.assign(new Error(error.message || "Something went wrong"), { code: error.code });
  return data;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Could not load " + src));
    document.head.appendChild(s);
  });
}

export async function init() {
  if (!status.configured) return;
  try {
    if (!window.supabase) await loadScript("vendor/supabase.js");
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
    });
    client.auth.onAuthStateChange((event, s) => {
      const prevUser = session?.user?.id;
      session = s;
      if (s && s.user.id !== prevUser) {
        adoptLocalData(s.user.id);
        scheduleSync(50);
      }
      emit();
    });
    const { data } = await client.auth.getSession();
    session = data.session;
    ready = true;
    // From the home screen on Android, Google sign-in finishes in a browser tab that shares this app's storage.
    // When they come back to the app, notice the new sign-in and load it.
    if (homeScreen) {
      const check = () => {
        if (document.visibilityState !== "visible" || session) return;
        try { if (Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k))) location.reload(); } catch {}
      };
      document.addEventListener("visibilitychange", check);
      addEventListener("focus", check);
    }
    // Remove ?code=... left over from the Google redirect.
    if (location.search.includes("code=")) history.replaceState(history.state, "", location.pathname + location.hash);
    // A cancelled or refused sign-in comes back as ?error=...: say so in plain words and tidy the address.
    const q = new URLSearchParams(location.search);
    if (q.get("error")) {
      const why = q.get("error"), desc = (q.get("error_description") || "").toLowerCase();
      history.replaceState(history.state, "", location.pathname + location.hash);
      const msg =
        why === "access_denied" ? "Sign-in was cancelled, or this Google account isn't on the list yet." :
        desc.includes("expired") ? "That sign-in link has expired. Ask for a new code." :
        "Sign-in didn't work. Please try again.";
      import("./ui.js").then((ui) => ui.toast(msg));
    }
    emit();
    if (session) scheduleSync(50);
  } catch (e) {
    status.error = e.message;
    emit();
  }

  store.onChange((table, source) => {
    if (source !== "remote") scheduleSync(2000);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleSync(300);
  });
  window.addEventListener("online", () => scheduleSync(300));
  setInterval(() => {
    if (document.visibilityState === "visible") scheduleSync(0);
  }, 60000);
}

// Data written before signing in belongs to whoever signs in first on this device.
// If a different account signs in later, the device starts fresh for that account.
function adoptLocalData(userId) {
  const owner = store.meta("owner");
  if (owner && owner !== userId) {
    store.clearAll();
    store.meta("lastPull", {});
  } else if (!owner) {
    store.markAllDirty();
  }
  store.meta("owner", userId);
}

// Opened from the home screen (an installed app) rather than in the browser?
export const homeScreen = (() => { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch { return false; } })();
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
// On iPhone and iPad, a home-screen app keeps its own storage, separate from Safari, so a Google sign-in
// (which has to leave the app) can never come back to it. Email with a code works everywhere.
export const googleWorksHere = !(homeScreen && isIOS);

export async function signIn() {
  if (!client) return;
  const redirectTo = location.origin + location.pathname;
  const { error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  if (error) {
    status.error = error.message;
    emit();
  }
}

// Email sign-in: Supabase emails a link and a 6-digit code. The link works in the browser that asked for it;
// the code works anywhere (e.g. asked on the laptop, email opened on the phone).
export async function sendEmailCode(email) {
  if (!client) return { error: "Sign-in isn't set up on this site yet." };
  const redirectTo = location.origin + location.pathname;
  const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: true } });
  return { error: error ? friendly(error) : null };
}

export async function verifyEmailCode(email, code) {
  if (!client) return { error: "Sign-in isn't set up on this site yet." };
  const { error } = await client.auth.verifyOtp({ email, token: code, type: "email" });
  return { error: error ? friendly(error) : null };
}

// Supabase's messages, in plain words
function friendly(error) {
  const m = (error.message || String(error)).toLowerCase();
  if (m.includes("rate limit") || error.status === 429) return "Too many emails for now. Please wait a minute and try again.";
  if (m.includes("not authorized") || m.includes("not authorised")) return "Email sign-in isn't switched on for this address yet. Use Google for now.";
  if (m.includes("signups not allowed") || m.includes("signup")) return "New accounts are closed on this site. Ask the owner to let you in.";
  if (m.includes("invalid") || m.includes("expired")) return "That code didn't work. Check it, or send a new one.";
  if (m.includes("email") && m.includes("valid")) return "That doesn't look like an email address.";
  if (m.includes("fetch") || m.includes("network")) return "You seem to be offline. Try again when you're connected.";
  return error.message || "Something went wrong. Please try again.";
}

export async function signOut() {
  if (!client) return;
  await syncNow().catch(() => {});
  await client.auth.signOut();
  session = null;
  emit();
}

export function scheduleSync(delay = 1500) {
  if (!client || !session) return;
  clearTimeout(timer);
  timer = setTimeout(() => syncNow().catch(() => {}), delay);
}

export function syncNow() {
  if (!client || !session) return Promise.resolve();
  if (syncing) return syncing;
  syncing = doSync().finally(() => (syncing = null));
  return syncing;
}

async function doSync() {
  status.state = "syncing";
  status.error = null;
  emit();
  try {
    const uid = session.user.id;
    const lastPull = store.meta("lastPull") || {};
    for (const table of store.TABLES) {
      // pull (synced_at is set by the server, so other devices' clocks don't matter)
      let since = lastPull[table] || "1970-01-01T00:00:00Z";
      for (;;) {
        const { data, error } = await client
          .from(table)
          .select("*")
          .gt("synced_at", since)
          .order("synced_at", { ascending: true })
          .limit(1000);
        if (error) throw error;
        if (!data.length) break;
        store.mergeRemote(table, data);
        since = data[data.length - 1].synced_at;
        if (data.length < 1000) break;
      }
      lastPull[table] = since;
      store.meta("lastPull", lastPull);
      // then push what's changed here (after the pull, so a new device doesn't overwrite combined settings)
      const dirty = store.dirty(table);
      for (let i = 0; i < dirty.length; i += 500) {
        const chunk = dirty.slice(i, i + 500);
        const rows = chunk.map((r) => {
          const row = { user_id: uid };
          for (const c of COLUMNS[table]) row[c] = r[c] === undefined ? null : r[c];
          row.deleted = !!r.deleted;
          return row;
        });
        const { error } = await client.from(table).upsert(rows, { onConflict: "user_id,id" });
        if (error) throw error;
        store.markClean(table, chunk);
      }
    }
    status.state = "ok";
    status.lastSync = store.nowISO();
    store.meta("lastSync", status.lastSync);
  } catch (e) {
    status.state = "error";
    status.error = e.message || String(e);
    console.warn("Sync failed", e);
  }
  emit();
}
