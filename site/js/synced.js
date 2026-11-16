// Small settings that should follow you to every device (goals, where "Verse for today" comes from, and
// which daily verses you've already been shown). They ride along with your notes as one row of kind "settings",
// so they sync through the same table with no database change.
import * as store from "./store.js";

const ID = "settings.synced";
const read = () => {
  try {
    return JSON.parse(store.get("notes", ID)?.body || "{}");
  } catch {
    return {};
  }
};

export function get(key) {
  return read()[key];
}

export function set(key, value) {
  const row = store.get("notes", ID);
  const data = read();
  data[key] = value;
  store.put("notes", { ...(row || {}), id: ID, kind: "settings", body: JSON.stringify(data), created_at: row?.created_at || store.nowISO(), deleted: false });
}
