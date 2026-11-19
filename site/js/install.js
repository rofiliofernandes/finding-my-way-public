// "Install": put the app on the home screen (or desktop) as its own shortcut.
// Chrome, Edge and Samsung Internet give us a real install prompt (beforeinstallprompt), so the button opens it directly.
// iPhone and iPad have no prompt, so the button shows the two steps (Share → Add to Home Screen).
// Once installed (opened from the shortcut), the button hides itself.
import { $, esc, openModal, toast } from "./ui.js";

let deferred = null;
const subs = new Set();
const notify = () => subs.forEach((f) => f());

const ua = navigator.userAgent;
const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
const isMacSafari = !isIOS && /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg|Firefox/.test(ua);
const isFirefoxDesktop = !isAndroid && /Firefox\//.test(ua);

export const installed = () =>
  matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: window-controls-overlay)").matches || navigator.standalone === true;

// show the button whenever we can either prompt or explain how
export const available = () => !installed() && (!!deferred || isIOS || isAndroid || isMacSafari || isFirefoxDesktop || "onbeforeinstallprompt" in window);

export function onChange(f) { subs.add(f); return () => subs.delete(f); }

export function init() {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; notify(); });
  window.addEventListener("appinstalled", () => { deferred = null; notify(); toast("Installed. Open it from your home screen"); });
  matchMedia("(display-mode: standalone)").addEventListener?.("change", notify);
  // the pill in the top bar
  const bar = $(".topbar");
  if (bar && !$(".install-pill", bar)) {
    const b = document.createElement("button");
    b.className = "install-pill"; b.type = "button";
    b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"/></svg><span>Install</span>`;
    b.title = "Install the app and add a shortcut to your home screen";
    b.addEventListener("click", install);
    bar.insertBefore(b, $("#syncDot", bar));
    const sync = () => (b.hidden = !available());
    onChange(sync); sync();
  }
}

export async function install() {
  if (installed()) return toast("Already installed");
  if (deferred) {
    const e = deferred; deferred = null; notify();
    try { e.prompt(); const r = await e.userChoice; if (r?.outcome !== "accepted") { deferred = e; notify(); } } catch { steps(); }
    return;
  }
  steps();
}

const shareIcon = `<svg class="inl" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1"/></svg>`;
const dotsIcon = `<svg class="inl" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>`;

function steps() {
  let title = "Install the app", list;
  if (isIOS) {
    title = "Add to your Home Screen";
    list = [`Tap the <b>Share</b> button ${shareIcon} (at the bottom in Safari, or at the top on iPad).`, `Scroll down and tap <b>Add to Home Screen</b>.`, `Tap <b>Add</b>. The book icon appears on your Home Screen.`];
  } else if (isAndroid) {
    list = [`Tap the browser's menu ${dotsIcon} at the top right.`, `Tap <b>Install app</b> or <b>Add to Home screen</b>.`, `Tap <b>Install</b>. The book icon appears on your home screen.`];
  } else if (isMacSafari) {
    list = [`In the menu bar, click <b>File → Add to Dock</b>.`, `Click <b>Add</b>. It opens in its own window from the Dock.`];
  } else if (isFirefoxDesktop) {
    list = [`Firefox on computers can't install web apps.`, `Open <b>${esc(location.host)}</b> in Chrome or Edge and click <b>Install</b> there, or bookmark this page.`];
  } else {
    list = [`Click the install icon at the right end of the address bar, or open the browser's menu ${dotsIcon}.`, `Choose <b>Install Iter ad Dominum</b> (in Chrome: <b>Cast, save and share → Install page as app</b>, or <b>Create shortcut</b>).`, `It opens in its own window, with a shortcut on your desktop.`];
  }
  openModal(
    `<h2 style="margin:0 0 4px">${title}</h2>
     <p class="muted small" style="margin:0 0 12px">It opens like an app, full screen, with its own icon. It works offline, and your reading stays the same.</p>
     <ol class="install-steps">${list.map((s) => `<li>${s}</li>`).join("")}</ol>
     <div class="actions"><button class="btn primary" data-close>Got it</button></div>`,
    (d, close) => d.querySelector("[data-close]").addEventListener("click", close)
  );
}

// a row for the You page
export function settingHTML() {
  if (installed()) return `<div class="setting"><div class="what"><b>App</b><span class="muted small">Installed on this device ✓</span></div></div>`;
  return `<div class="setting"><div class="what"><b>Install the app</b><span class="muted small">Adds a shortcut to your home screen or desktop. It opens full screen and works offline.</span></div>
    <button class="btn primary" data-install>Install</button></div>`;
}
export function wire(root) { $("[data-install]", root)?.addEventListener("click", install); }
