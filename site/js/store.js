// Local-first data store. Every change is saved on this device immediately and marked
// "dirty"; sync.js pushes dirty records to Supabase and pulls changes from other devices.

export const TABLES = ["reading_log", "notes", "bookmarks"];
const PREFIX = "lectio:";
const data = {};
const listeners = new Set();

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn("Could not save", key, e);
  }
}

export function load() {
  for (const t of TABLES) {
    data[t] = new Map(safeGet(t, []).map((r) => [r.id, r]));
  }
}

function persist(table) {
  safeSet(table, [...data[table].values()]);
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(table, source) {
  listeners.forEach((fn) => fn(table, source));
}

export function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function nowISO() {
  return new Date().toISOString();
}

/* ---------- reads ---------- */

export function all(table) {
  return [...data[table].values()].filter((r) => !r.deleted);
}

export function get(table, id) {
  const r = data[table].get(id);
  return r && !r.deleted ? r : null;
}

/* ---------- writes (local) ---------- */

export function put(table, rec) {
  const prev = data[table].get(rec.id);
  const next = { ...prev, ...rec, updated_at: nowISO(), _dirty: 1 };
  if (!next.created_at) next.created_at = next.updated_at;
  data[table].set(rec.id, next);
  persist(table);
  emit(table, "local");
  return next;
}

export function remove(table, id) {
  const prev = data[table].get(id);
  if (!prev) return;
  put(table, { ...prev, deleted: true });
}

/* ---------- sync helpers ---------- */

export function dirty(table) {
  return [...data[table].values()].filter((r) => r._dirty);
}

export function markClean(table, recs) {
  for (const r of recs) {
    const cur = data[table].get(r.id);
    if (cur && cur.updated_at === r.updated_at) delete cur._dirty;
  }
  persist(table);
}

// Merge records pulled from the server; newest updated_at wins.
// The synced-settings row (see synced.js) holds many small settings; combine them one by one, newest of each wins.
// Settings saved before per-setting times existed count as old, decided by whichever row is newer.
const SETTINGS_ID = "settings.synced";
function mergeSettings(local, remote) {
  const parse = (b) => { try { return JSON.parse(b || "{}"); } catch { return {}; } };
  const L = parse(local.body), R = parse(remote.body), lt = L._t || {}, rt = R._t || {};
  const remoteNewer = (remote.updated_at || "") >= (local.updated_at || "");
  const out = {}, t = {};
  for (const k of new Set([...Object.keys(L), ...Object.keys(R)])) {
    if (k === "_t") continue;
    const a = lt[k] || "", b = rt[k] || "";
    const useR = b > a || (a === b && (remoteNewer ? k in R : !(k in L)));
    if (useR) { if (k in R) out[k] = R[k]; if (b) t[k] = b; } else { if (k in L) out[k] = L[k]; if (a) t[k] = a; }
  }
  out._t = t;
  // compare in a fixed key order, so the same settings never count as a change
  const canon = (o) => JSON.stringify(Object.keys(o).sort().reduce((m, k) => ((m[k] = k === "_t" ? canon2(o[k] || {}) : o[k]), m), {}));
  const canon2 = (o) => Object.keys(o).sort().reduce((m, k) => ((m[k] = o[k]), m), {});
  const merged = canon(out);
  if (merged === canon({ ...R, _t: R._t || {} })) return remote.body;
  return merged === canon({ ...L, _t: L._t || {} }) && local.body ? local.body : merged;
}

export function mergeRemote(table, rows) {
  let changed = false;
  for (const row of rows) {
    const { user_id, synced_at, ...r } = row;
    // Postgres returns "+00:00" offsets; normalise to the same ISO form the app writes.
    for (const k of ["updated_at", "created_at", "read_at"]) {
      if (r[k]) r[k] = new Date(r[k]).toISOString();
    }
    for (const k of Object.keys(r)) if (r[k] === null) delete r[k];
    const cur = data[table].get(r.id);
    // our own upload coming back (same record, same time): nothing new, so don't redraw anything
    if (cur && r.updated_at === cur.updated_at && !!r.deleted === !!cur.deleted) { if (cur._dirty) { delete cur._dirty; persist(table); } continue; }
    if (table === "notes" && r.id === SETTINGS_ID && cur && !cur.deleted && !r.deleted) {
      const body = mergeSettings(cur, r);
      if (body !== cur.body || r.updated_at > cur.updated_at) {
        const dirty = body !== r.body; // our side had something newer: send the combined row back
        data[table].set(r.id, { ...r, body, ...(dirty ? { updated_at: nowISO(), _dirty: 1 } : {}) });
        changed = true;
      }
      continue;
    }
    if (!cur || r.updated_at >= cur.updated_at) {
      if (cur && cur._dirty && cur.updated_at > r.updated_at) continue;
      data[table].set(r.id, r);
      changed = true;
    }
  }
  if (changed) {
    persist(table);
    emit(table, "remote");
  }
  return changed;
}

export function markAllDirty() {
  for (const t of TABLES) {
    for (const r of data[t].values()) r._dirty = 1;
    persist(t);
  }
}

export function clearAll() {
  for (const t of TABLES) {
    data[t] = new Map();
    persist(t);
  }
  emit("*", "clear");
}

export function meta(key, value) {
  if (value === undefined) return safeGet("meta:" + key, null);
  safeSet("meta:" + key, value);
}

export function exportAll() {
  const out = { app: "Finding My Way to Jesus Christ", exported_at: nowISO() };
  for (const t of TABLES) out[t] = [...data[t].values()].map(({ _dirty, ...r }) => r);
  return out;
}

export function importAll(obj) {
  let n = 0;
  for (const t of TABLES) {
    for (const r of obj[t] || []) {
      if (!r.id) continue;
      const cur = data[t].get(r.id);
      if (!cur || (r.updated_at || "") > (cur.updated_at || "")) {
        data[t].set(r.id, { ...r, _dirty: 1 });
        n++;
      }
    }
    persist(t);
  }
  emit("*", "import");
  return n;
}

/* ---------- preferences (per device, not synced) ---------- */

export function pref(key, value) {
  const prefs = safeGet("prefs", {});
  if (value === undefined) return prefs[key];
  prefs[key] = value;
  safeSet("prefs", prefs);
}

/* ---------- dates ---------- */

export function localDate(d = new Date()) {
  const dt = typeof d === "string" ? new Date(d) : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return localDate(d);
}

// Weeks start on Monday.
export function weekStart(s = localDate()) {
  const d = parseDate(s);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return localDate(d);
}
