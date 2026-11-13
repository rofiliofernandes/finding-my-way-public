// "Jesus loves you, my child": a short blessing (about 8 seconds) shown when you press back from a passage
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

const WORDS = [["Jesus", "left"], ["loves", "top"], ["you,", "bottom"], ["my", "right"], ["child.", "bottom"]];
// timeline, in seconds
const W0 = 3.6; // first word starts flying in
const WGAP = 0.3; // between words
const WDUR = 0.9; // each word's flight
const Z0 = 6.4; // the dive into the "o" begins
const ZDUR = 2.0; // and lasts

export function show({ force = false } = {}) {
  if (!force && !eligible()) return false;
  if (document.querySelector(".blessing")) return false;
  if (!force) ss(KEY_SHOWN, "1");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = document.createElement("div");
  el.className = "blessing";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Jesus loves you, my child.");
  const filters = WORDS.map((_, i) => `<filter id="bl-mb${i}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0,0"/></filter>`).join("");
  el.innerHTML = `<svg class="fx" aria-hidden="true"><defs>${filters}</defs></svg>
    <div class="zoom">
      <div class="dark"></div><div class="gold"></div><div class="light"></div>
      <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div><div class="cloud c4"></div><div class="cloud c5"></div>
      <div class="lift"><div class="stage">${FIGURE}</div></div>
      <div class="msg">${WORDS.map(([w], i) => `<span class="w" style="filter:url(#bl-mb${i})">${w === "loves" ? 'l<span class="o">o</span>ves' : w}</span>`).join(" ")}</div>
    </div>`;
  document.body.appendChild(el);

  // size the figure for the screen, start it in the middle, and work out how far it rises
  const vh = innerHeight;
  const vw = innerWidth;
  const scale = Math.min(1, (vh * 0.45) / 430, (vw * 0.7) / 220);
  const h = 430 * scale;
  const top = (vh - h) / 2;
  const lift = el.querySelector(".lift");
  lift.style.top = top + "px";
  lift.style.setProperty("--rise", -(top - vh * 0.05) + "px");
  lift.querySelector(".stage").style.transform = `scale(${scale})`;
  lift.querySelector(".stage").style.height = h + "px";
  el.querySelector(".light").style.top = top + h * 0.35 - Math.max(vw, vh) * 0.15 + "px";
  const msg = el.querySelector(".msg");
  msg.style.top = vh * 0.05 + h + vh * 0.04 + "px";

  const zoom = el.querySelector(".zoom");
  const words = [...msg.querySelectorAll(".w")];
  const blurs = [...el.querySelectorAll("feGaussianBlur")];
  const clouds = [...el.querySelectorAll(".cloud")];
  const ease3 = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t * t;
  let hole = null;
  let done = false;
  let raf = 0;

  const finish = (fade) => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    if (!fade) return el.remove();
    el.classList.add("out");
    setTimeout(() => el.remove(), 600);
  };
  el.addEventListener("click", () => finish(true));

  if (reduce) {
    words.forEach((w) => ((w.style.opacity = 1), (w.style.filter = "none")));
    setTimeout(() => finish(true), 3500);
    return true;
  }

  const t0 = performance.now();
  const frame = (now) => {
    const t = (now - t0) / 1000;
    words.forEach((w, i) => {
      const p = Math.min(1, Math.max(0, (t - W0 - i * WGAP) / WDUR));
      const dir = WORDS[i][1];
      if (p <= 0) return;
      w.style.opacity = 1;
      if (p >= 1) {
        if (w.style.filter !== "none") ((w.style.filter = "none"), (w.style.transform = "none"));
        return;
      }
      const q = ease3(p);
      const d = (1 - q) * 60;
      w.style.transform =
        dir === "left" ? `translateX(-${d}vmax)` : dir === "right" ? `translateX(${d}vmax)` : dir === "top" ? `translateY(-${d}vmax)` : `translateY(${d}vmax)`;
      const b = (1.0001 - q) * 120;
      blurs[i].setAttribute("stdDeviation", dir === "left" || dir === "right" ? `${b},0` : `0,${b}`);
    });
    if (t >= Z0) {
      if (!hole) {
        // find the hole in the "o" once the words have landed
        const o = msg.querySelector(".o").getBoundingClientRect();
        hole = { x: o.left + o.width / 2, y: o.top + o.height * 0.62, rx: o.width * 0.2, ry: o.height * 0.17 };
        zoom.style.transformOrigin = `${hole.x}px ${hole.y}px`;
        const mask = `radial-gradient(${hole.rx}px ${hole.ry}px at ${hole.x}px ${hole.y}px, transparent 97%, #000 100%)`;
        zoom.style.webkitMaskImage = mask;
        zoom.style.maskImage = mask;
      }
      const z = Math.min(1, (t - Z0) / ZDUR);
      zoom.style.transform = `scale(${1 + easeIn(z) * 140})`;
      const fade = Math.max(0, 1 - z * 6);
      lift.style.opacity = fade;
      clouds.forEach((c) => (c.style.opacity = fade));
      if (z >= 1) return finish(false);
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return true;
}
