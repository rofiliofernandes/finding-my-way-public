// Small UI helpers shared by the views.

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ICONS = {
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  bookmark: '<path d="M7 4h10v17l-5-4-5 4z"/>',
  bookmarkFill: '<path d="M7 4h10v17l-5-4-5 4z" fill="currentColor"/>',
  note: '<path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4M9 9h6M9 13h4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  shuffle: '<path d="M4 7h3c5 0 5 10 10 10h3M4 17h3c2 0 3-1.5 4-3.5M13 9.5c1-2 2-2.5 4-2.5h3M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  book: '<path d="M12 6c-2.5-1.6-5.5-2-8-1.6V19c2.5-.4 5.5 0 8 1.6 2.5-1.6 5.5-2 8-1.6V4.4C17.5 4 14.5 4.4 12 6Zm0 0v14.6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  sync: '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3M18 3v4h-4M6 21v-4h4"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  collapse: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  cards: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 10h8M8 14h5"/>',
};

export function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

let toastTimer;
export function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

export function openModal(html, onMount) {
  const el = $("#modal");
  el.innerHTML = `<div class="dialog" role="dialog" aria-modal="true">${html}</div>`;
  el.hidden = false;
  const close = () => {
    el.hidden = true;
    el.innerHTML = "";
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey);
  el.onclick = (e) => {
    if (e.target === el) close();
  };
  onMount?.(el.firstElementChild, close);
  return close;
}

export function confirmBox(message, okLabel = "Delete") {
  return new Promise((resolve) => {
    openModal(
      `<p style="margin:0 0 6px;font-size:16px">${esc(message)}</p>
       <div class="actions"><button class="btn ghost" data-no>Cancel</button><button class="btn primary" data-yes>${esc(okLabel)}</button></div>`,
      (dlg, close) => {
        dlg.querySelector("[data-no]").onclick = () => (close(), resolve(false));
        dlg.querySelector("[data-yes]").onclick = () => (close(), resolve(true));
      }
    );
  });
}

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + " min ago";
  if (s < 86400) return Math.floor(s / 3600) + " h ago";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDate(iso, opts = { weekday: "short", month: "short", day: "numeric" }) {
  return new Date(iso).toLocaleDateString(undefined, opts);
}

export function highlight(text, q) {
  const safe = esc(text);
  if (!q) return safe;
  const re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
  return safe.replace(re, "<mark>$1</mark>");
}
