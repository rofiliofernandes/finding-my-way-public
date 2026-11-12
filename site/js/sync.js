// Google sign-in (Supabase Auth) and background sync of the local store.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import * as store from "./store.js";

const COLUMNS = {
  reading_log: ["id", "book", "chapter", "verse_start", "verse_end", "mode", "read_at", "created_at", "updated_at", "deleted"],
  notes: ["id", "kind", "book", "chapter", "verse_start", "verse_end", "week_start", "body", "created_at", "updated_at", "deleted"],
  bookmarks: ["id", "book", "chapter", "verse", "color", "created_at", "updated_at", "deleted"],
};

let client = null;
let session = null;
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
    // Remove ?code=... left over from the Google redirect.
    if (location.search.includes("code=")) history.replaceState(null, "", location.pathname + location.hash);
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

export async function signIn() {
  if (!client) return;
  const redirectTo = location.origin + location.pathname;
  const { error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  if (error) {
    status.error = error.message;
    emit();
  }
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
      // push
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
