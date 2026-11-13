// The header title: "Iter ad Dominum". Hold it for 2 seconds and it becomes
// "Finding My Way to Jesus Christ", and stays in English on this device.
import * as store from "./store.js";

const LATIN = "Iter ad Dominum";
const ENGLISH = "Finding My Way to Jesus Christ";
const HOLD_MS = 2000;

function letters(text, cls = "") {
  return [...text].map((ch, i) => `<span class="ch ${cls}" style="animation-delay:${cls === "in" ? i * 28 : i * 12}ms">${ch === " " ? " " : ch}</span>`).join("");
}

export function initTitle() {
  const brand = document.querySelector(".brand");
  const holder = brand.querySelector(".title-text");
  const bar = brand.querySelector(".hold-bar");
  const set = (english) => {
    holder.innerHTML = letters(english ? ENGLISH : LATIN);
    brand.setAttribute("aria-label", english ? ENGLISH : `${LATIN} (hold to translate)`);
    brand.title = english ? "" : "Hold to translate";
  };
  set(!!store.pref("titleEnglish"));

  let timer = null;
  let justTranslated = false;
  const cancel = () => {
    clearTimeout(timer);
    timer = null;
    brand.classList.remove("holding");
  };
  const translate = () => {
    cancel();
    justTranslated = true;
    store.pref("titleEnglish", true);
    holder.querySelectorAll(".ch").forEach((c) => c.classList.add("out"));
    const outTime = 350 + LATIN.length * 12;
    setTimeout(() => {
      // reveal: letters grow in from the middle outwards (0.3s + 0.1s per step from the centre)
      const chars = [...ENGLISH];
      const middle = chars.length / 2;
      holder.innerHTML = chars
        .map((ch, i) => `<span class="ch" style="animation-delay:${(0.3 + Math.abs(i - middle) * 0.1).toFixed(2)}s">${ch}</span>`)
        .join("");
      holder.classList.remove("reveal");
      void holder.offsetWidth;
      holder.classList.add("reveal");
      brand.setAttribute("aria-label", ENGLISH);
      brand.title = "";
    }, outTime);
    if (navigator.vibrate) navigator.vibrate(15);
  };
  brand.addEventListener("pointerdown", (e) => {
    if (store.pref("titleEnglish") || (e.button && e.button !== 0)) return;
    brand.classList.add("holding");
    timer = setTimeout(translate, HOLD_MS);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => brand.addEventListener(ev, () => timer && cancel()));
  brand.addEventListener("contextmenu", (e) => e.preventDefault());
  // after a successful hold, don't also follow the link
  brand.addEventListener("click", (e) => {
    if (justTranslated) {
      e.preventDefault();
      justTranslated = false;
    }
  });
  return { setEnglish: (v) => (store.pref("titleEnglish", v), set(v)) };
}
