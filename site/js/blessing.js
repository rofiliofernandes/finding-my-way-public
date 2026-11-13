// "Jesus loves you, my child": a short blessing shown when you press back from a passage
// after reading for 5 minutes or more in this visit. Once per visit; tap to skip.

const NEEDED_SECONDS = 5 * 60;
const KEY_TIME = "fmw:readSeconds";
const KEY_SHOWN = "fmw:blessed";

function ss(key, value) {
  try {
    if (value === undefined) return sessionStorage.getItem(key);
    sessionStorage.setItem(key, value);
  } catch {
    return null;
  }
}

// count time while the app is actually on screen
export function startTimer() {
  setInterval(() => {
    if (document.visibilityState === "visible") ss(KEY_TIME, String((+ss(KEY_TIME) || 0) + 1));
  }, 1000);
}

export function eligible() {
  return (+ss(KEY_TIME) || 0) >= NEEDED_SECONDS && !ss(KEY_SHOWN);
}

const FIGURE = `
  <div class="theman">
    <div class="halo"></div>
    <div class="hairleft"></div>
    <div class="hairright"></div>
    <div class="head">
      <div class="hairline"></div>
      <div class="bangsright"></div>
      <div class="bangsleft"></div>
      <div class="forehead1"></div>
      <div class="forehead2"></div>
      <div class="eyes"></div>
      <div class="mouth"></div>
      <div class="cheeks"></div>
      <div class="beard"></div>
    </div>
    <div class="torso">
      <div class="arm left"><div class="hand"></div></div>
      <div class="arm right"><div class="hand"></div></div>
    </div>
    <div class="foot1"></div>
    <div class="foot2"></div>
  </div>`;

export function show({ force = false } = {}) {
  if (!force && !eligible()) return false;
  if (document.querySelector(".blessing")) return false;
  if (!force) ss(KEY_SHOWN, "1");
  const el = document.createElement("div");
  el.className = "blessing";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Jesus loves you, my child.");
  el.innerHTML = `<div class="rays"></div><div class="words">Jesus loves you, my child.</div><div class="stage">${FIGURE}</div>`;
  // fit the figure on small screens
  const scale = Math.min(1, (innerHeight * 0.62) / 430, (innerWidth * 0.8) / 220);
  el.querySelector(".stage").style.transform = `scale(${scale})`;
  document.body.appendChild(el);
  let done = false;
  const close = () => {
    if (done) return;
    done = true;
    el.classList.add("out");
    setTimeout(() => el.remove(), 600);
  };
  el.addEventListener("click", close);
  setTimeout(close, 3000);
  return true;
}
