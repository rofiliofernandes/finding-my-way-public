// Motion: shake (a hidden treasure) and tilt (gentle depth in the blessing and the fight scene).
// Android browsers send motion events freely. iPhones only send them after the person allows it,
// which has to be asked from a tap (You → Settings → Motion).
import * as store from "./store.js";

// Only iPhones and iPads hold motion back until asked (newer Chrome has the same function but doesn't need it)
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const needsPermission = () => isIOS() && typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function";
export const enabled = () => store.pref("motion") !== "off";
export const allowed = () => !needsPermission() || store.pref("motionGranted") === true;
const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Ask the iPhone for motion access. Must be called from a tap.
export async function requestAccess() {
  if (!needsPermission()) return true;
  try {
    const a = await DeviceMotionEvent.requestPermission();
    const b = typeof DeviceOrientationEvent?.requestPermission === "function" ? await DeviceOrientationEvent.requestPermission() : a;
    const ok = a === "granted" && b === "granted";
    store.pref("motionGranted", ok);
    return ok;
  } catch {
    return false;
  }
}

export function setEnabled(on) {
  store.pref("motion", on ? "on" : "off");
}

// Follow how the phone is tilted (relative to how it was held when this started).
// cb({x, y}) gets values from -1 to 1, smoothed. On computers, the mouse stands in for tilt.
// Returns a function that stops listening.
export function tilt(cb) {
  if (!enabled() || reduce()) return () => {};
  let base = null, tx = 0, ty = 0, x = 0, y = 0, raf = 0, alive = true;
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  const onOrient = (e) => {
    if (e.gamma == null || e.beta == null) return;
    if (!base) base = { g: e.gamma, b: e.beta };
    tx = clamp((e.gamma - base.g) / 22);
    ty = clamp((e.beta - base.b) / 22);
  };
  const fine = matchMedia("(pointer: fine)").matches;
  const onPointer = (e) => {
    tx = clamp((e.clientX / innerWidth) * 2 - 1);
    ty = clamp((e.clientY / innerHeight) * 2 - 1);
  };
  addEventListener("deviceorientation", onOrient); // the browser only sends these once motion is allowed
  if (fine) addEventListener("pointermove", onPointer);
  const loop = () => {
    if (!alive) return;
    x += (tx - x) * 0.08;
    y += (ty - y) * 0.08;
    cb({ x, y });
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    removeEventListener("deviceorientation", onOrient);
    removeEventListener("pointermove", onPointer);
  };
}

// Move layers by different amounts for a sense of depth. layers: [[element, pixels], ...]
// Uses the separate CSS `translate` property, so it adds to any animation already moving the layer.
export function depth(layers) {
  return tilt(({ x, y }) => {
    for (const [el, px] of layers) if (el) el.style.translate = `${(x * px).toFixed(2)}px ${(y * px * 0.7).toFixed(2)}px`;
  });
}

// Call cb once when the phone is turned away, like turning to show someone the screen
// (a turn of about 110° or more around its upright axis, measured from when this started).
// Returns a function that stops listening.
export function onTurnAway(cb, degrees = 110) {
  if (!enabled()) return () => {};
  let start = null, fired = false;
  const onOrient = (e) => {
    if (fired || e.alpha == null) return;
    if (start == null) return void (start = e.alpha);
    let d = Math.abs(e.alpha - start) % 360;
    if (d > 180) d = 360 - d;
    if (d >= degrees) {
      fired = true;
      cb();
    }
  };
  addEventListener("deviceorientation", onOrient);
  return () => removeEventListener("deviceorientation", onOrient);
}
