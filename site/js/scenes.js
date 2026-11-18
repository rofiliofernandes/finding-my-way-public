// The milestone animations, drawn on a canvas 390 × 760 units tall (scaled to the screen by milestones.js):
// the weekly badge medallion, and the twelve monthly scenes of the Tree of Life.
// Each scene is a function of time, so it can be drawn at any moment (and recorded frame by frame).
let ctx;
const W = 390, H = 760;
let WK = { mark: "33", name: "", sub: "", color: "#3f7d4e", light: "#7fbf86", row: [], slot: 4, rowLabel: "" };
let L = { big: "", small: "" };
export function setWeek(w) { WK = { ...WK, ...w }; }
const shade = (h, k) => { const [r, g, b] = hex(h); return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`; };
/* ---------- helpers ---------- */
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x) => clamp(x);
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const eio = (x) => (x = clamp(x), x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x) => { x = clamp(x); const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a, b, t) => a + (b - a) * t;
const win = (t, a, b) => clamp((t - a) / (b - a));           // 0→1 between a and b
const fade = (t, a, b, c, d) => Math.min(win(t, a, b), 1 - win(t, c, d)); // in a→b, out c→d
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(",")})`; };
function glow(x, y, r, color, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${color},${a})`); g.addColorStop(1, `rgba(${color},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
function wrap(text, maxW) { const words = text.split(" "), lines = []; let line = ""; for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; } if (line) lines.push(line); return lines; }
function spaced(text, x, y, spacing) { // letter-spaced, centred
  let w = 0; for (const ch of text) w += ctx.measureText(ch).width + spacing; w -= spacing;
  let cx = x - w / 2; ctx.textAlign = "left"; for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + spacing; } ctx.textAlign = "center";
}
function sparkle(x, y, r, a, rot = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * .28 : r; const an = i * Math.PI / 4; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); }
// verse caption, centred, fading in at `at`
function caption(t, at, text, ref, opt = {}) {
  const a = win(t, at, at + .9); if (a <= 0) return;
  const y0 = opt.y || 640, ink = opt.ink || "241,233,218", sub = opt.sub || "212,170,90";
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "center";
  ctx.font = "italic 400 19px Literata, Georgia, serif"; const lines = wrap(text, 320);
  if (opt.panel) { const h = lines.length * 28 + 50; ctx.fillStyle = opt.panel; roundRect(28, y0 - 30, 334, h, 18); ctx.fill(); }
  ctx.fillStyle = `rgba(${ink},1)`; lines.forEach((l, i) => ctx.fillText(l, 195, y0 + i * 28 + (1 - a) * 8));
  ctx.font = "600 12px Inter, system-ui, sans-serif"; ctx.fillStyle = `rgba(${sub},1)`; spaced(ref.toUpperCase(), 195, y0 + lines.length * 28 + 6, 1.6);
  ctx.restore();
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function topLabel(t, big, small, ink = "212,170,90", ink2 = "241,233,218") {
  const a = fade(t, .2, .9, 99, 100); ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "center";
  ctx.font = "600 11px Inter, system-ui, sans-serif"; ctx.fillStyle = `rgba(${ink},1)`; spaced(big, 195, 70, 2.2);
  ctx.font = "400 14px Literata, Georgia, serif"; ctx.fillStyle = `rgba(${ink2},.8)`; ctx.fillText(small, 195, 92); ctx.restore();
}

/* ---------- weekly badge ---------- */
export function medallion(c, x, y, R, sx, t, glint, num = "33", color = "#3f7d4e", light = "#7fbf86") {
  if (c) ctx = c;
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(.02, Math.abs(sx)), 1);
  const front = sx >= 0;
  // rim
  const g = ctx.createLinearGradient(-R, -R, R, R); g.addColorStop(0, "#fbe39a"); g.addColorStop(.45, "#c9932e"); g.addColorStop(.7, "#f6d47a"); g.addColorStop(1, "#a8761f");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
  ctx.fillStyle = "rgba(120,80,20,.55)"; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * (R - 6), Math.sin(a) * (R - 6), R * .025, 0, 7); ctx.fill(); }
  if (front) {
    const e = ctx.createRadialGradient(-R * .3, -R * .35, 0, 0, 0, R * .85); e.addColorStop(0, light); e.addColorStop(.65, color); e.addColorStop(1, shade(color, .55));
    ctx.fillStyle = e; ctx.beginPath(); ctx.arc(0, 0, R * .8, 0, 7); ctx.fill();
    ctx.strokeStyle = "#f3cf6f"; ctx.lineWidth = R * .035; ctx.beginPath(); ctx.arc(0, 0, R * .8, 0, 7); ctx.stroke();
    // small cross and the week number
    ctx.fillStyle = "#f8dc8a"; ctx.fillRect(-R * .03, -R * .58, R * .06, R * .24); ctx.fillRect(-R * .1, -R * .5, R * .2, R * .06);
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `600 ${R * (num.length > 2 ? .44 : .62)}px Literata, Georgia, serif`; ctx.fillText(num, 0, R * .06);
    ctx.font = `600 ${R * .13}px Inter`; spaced("WEEK", 0, R * .5, R * .03); ctx.textBaseline = "alphabetic";
  } else {
    ctx.fillStyle = "rgba(255,240,190,.35)"; ctx.fillRect(-R * .06, -R * .45, R * .12, R * .9); ctx.fillRect(-R * .3, -R * .2, R * .6, R * .12);
  }
  if (glint > 0 && glint < 1) { // light sweeping across the face
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.clip(); ctx.globalCompositeOperation = "lighter";
    const gx = lerp(-R * 1.6, R * 1.6, glint); const lg = ctx.createLinearGradient(gx - R * .4, 0, gx + R * .4, 0);
    lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(.5, "rgba(255,255,240,.55)"); lg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.rotate(-.5); ctx.fillStyle = lg; ctx.fillRect(-R * 2, -R * 2, R * 4, R * 4); ctx.restore();
  }
  ctx.restore();
}
export function weekly(c, t) {
  ctx = c;
  ctx.fillStyle = "#16130f"; ctx.fillRect(0, 0, W, H);
  const v = ctx.createRadialGradient(195, 300, 40, 195, 300, 420); v.addColorStop(0, "#2a241b"); v.addColorStop(1, "#120f0b"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  // the row of weeks at the bottom
  const slots = 9, sy = 652, sx0 = 195 - (slots - 1) * 17;
  ctx.textAlign = "center"; ctx.font = "500 12px Inter"; ctx.fillStyle = "rgba(169,158,140,.9)"; ctx.fillText(WK.rowLabel, 195, 616);
  for (let i = 0; i < slots; i++) {
    const x = sx0 + i * 34;
    const prev = WK.row[i];
    if (prev) { medallion(null, x, sy, 13, 1, 0, 0, prev.mark, prev.color, prev.light); continue; }
    ctx.strokeStyle = "rgba(169,158,140,.45)"; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, sy, 13, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  }
  // drop in, spin, shine, then fly to its place in the row
  const fly = eio(win(t, 3.5, 4.5));
  const y = lerp(lerp(-120, 300, back(win(t, 0, .75))), sy, fly);
  const x = lerp(195, sx0 + WK.slot * 34, fly);
  const R = lerp(80, 13, fly);
  const spin = (1 - eo(win(t, .1, 1.8))) * Math.PI * 4;
  if (t > 1.6 && fly < 1) glow(x, y, R * 2.6, "255,205,110", .55 * win(t, 1.6, 2.1) * (1 - fly));
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(x, y + R + 12 * (1 - fly), R * .8 * Math.abs(Math.cos(spin)), R * .12, 0, 0, 7); if (fly < .9) ctx.fill();
  medallion(null, x, y, R, Math.cos(spin), t, win(t, 1.85, 2.6), WK.mark, WK.color, WK.light);
  // sparkles when it settles
  const r = rng(7); ctx.fillStyle = "#ffe7a8";
  for (let i = 0; i < 20; i++) { const a = r() * 7, d = 90 + r() * 70, k = win(t, 1.8 + r() * .2, 2.9 + r() * .3); if (k > 0 && k < 1) sparkle(195 + Math.cos(a) * d * eo(k), 300 + Math.sin(a) * d * eo(k), 3 + r() * 4, 1 - k, k * 3); }
  // the words
  const a = fade(t, 2.1, 2.6, 3.3, 3.6);
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "center";
  ctx.font = "600 12px Inter"; ctx.fillStyle = "#d4aa5a"; spaced("WEEK COMPLETE", 195, 430, 2.2);
  ctx.font = `600 ${WK.name.length > 26 ? 20 : 23}px Literata, Georgia, serif`; ctx.fillStyle = "#f1e9da"; ctx.fillText(WK.name, 195, 464);
  ctx.font = "500 13px Inter, system-ui, sans-serif"; ctx.fillStyle = "#a99e8c"; ctx.fillText(WK.sub, 195, 492); ctx.restore();
  // landing pulse
  const land = win(t, 4.5, 5.3); if (land > 0 && land < 1) { ctx.strokeStyle = `rgba(255,215,130,${1 - land})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx0 + WK.slot * 34, sy, 13 + land * 22, 0, 7); ctx.stroke(); }
}

/* ---------- month 1: a seed ---------- */
function month1(t) {
  const day = eio(win(t, 1.8, 3.6));
  const sky = ctx.createLinearGradient(0, 0, 0, 560);
  sky.addColorStop(0, mix("#141a33", "#7fb5de", day)); sky.addColorStop(.7, mix("#2b2747", "#cfe3ee", day)); sky.addColorStop(1, mix("#3b2f48", "#f7e2b5", day));
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 560);
  // stars at night
  const r = rng(3); for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * 480, s = r(); ctx.fillStyle = `rgba(255,255,255,${(1 - day) * (.35 + .5 * Math.sin(t * 3 + i) ** 2) * s})`; ctx.fillRect(x, y, 1.3, 1.3); }
  // the sun rises: "night and day"
  const sunY = lerp(600, 190, eo(win(t, 1.8, 4.2)));
  glow(300, sunY, 170, "255,214,140", .55 * day); glow(300, sunY, 60, "255,240,200", .9 * day);
  ctx.fillStyle = `rgba(255,236,180,${day})`; ctx.beginPath(); ctx.arc(300, sunY, 24, 0, 7); ctx.fill();
  // soft rays
  if (day > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; for (let i = 0; i < 7; i++) { const a = 2.2 + i * .18 + Math.sin(t * .5 + i) * .02; ctx.fillStyle = `rgba(255,230,170,${.05 * day})`; ctx.beginPath(); ctx.moveTo(300, sunY); ctx.lineTo(300 + Math.cos(a - .04) * 700, sunY + Math.sin(a - .04) * 700); ctx.lineTo(300 + Math.cos(a + .04) * 700, sunY + Math.sin(a + .04) * 700); ctx.fill(); } ctx.restore(); }

  // the seed falls and lands
  const GY = 540, fall = win(t, .3, 1.3), sink = eio(win(t, 1.35, 1.9));
  const seedX = 195 + Math.sin(fall * 9) * 14 * (1 - fall), seedY = lerp(110, GY - 4, fall * fall) + sink * 18;

  // roots: light underground (drawn under the soil's top so they glow through)
  const g = eio(win(t, 2.6, 5.6));
  // soil
  const soil = ctx.createLinearGradient(0, GY, 0, H); soil.addColorStop(0, "#6b4527"); soil.addColorStop(1, "#2e1c10");
  ctx.fillStyle = soil; ctx.beginPath(); ctx.moveTo(0, GY + 6); for (let x = 0; x <= W; x += 10) ctx.lineTo(x, GY + Math.sin(x * .05) * 3); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  const rs = rng(11); for (let i = 0; i < 260; i++) { const x = rs() * W, y = GY + 6 + rs() * (H - GY), l = rs(); ctx.fillStyle = l > .5 ? "rgba(140,96,58,.35)" : "rgba(20,12,6,.35)"; ctx.fillRect(x, y, 2, 2); }
  // seed (visible above ground; a warm glow once it's buried)
  if (sink < 1 || t < 1.9) { ctx.save(); ctx.translate(seedX, seedY); ctx.rotate(fall * 5); const sg = ctx.createLinearGradient(-5, -7, 5, 7); sg.addColorStop(0, "#e8c27a"); sg.addColorStop(1, "#8a5a2a"); ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(0, 0, 5, 7.5, 0, 0, 7); ctx.fill(); ctx.restore(); }
  if (t > 1.3) { const k = win(t, 1.3, 2); const rr = rng(5); ctx.fillStyle = `rgba(120,80,45,${1 - k})`; for (let i = 0; i < 12; i++) { const a = Math.PI + rr() * Math.PI, d = 18 * eo(k) * (0.6 + rr()); ctx.beginPath(); ctx.arc(195 + Math.cos(a) * d, GY + Math.sin(a) * d * .6 + 20 * k * k, 1.8, 0, 7); ctx.fill(); } }
  if (t > 1.8) { ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(195, GY + 16, 40 + 8 * Math.sin(t * 4), "255,200,110", .5 * win(t, 1.8, 2.4));
    // roots
    const roots = [[-.9, 60], [-.4, 78], [0, 92], [.45, 74], [.95, 56]];
    ctx.strokeStyle = "rgba(255,214,150,.75)"; ctx.lineWidth = 1.4; ctx.lineCap = "round";
    for (const [a, L] of roots) { ctx.beginPath(); ctx.moveTo(195, GY + 16); const l = L * g; ctx.quadraticCurveTo(195 + Math.sin(a) * l * .3, GY + 16 + l * .5, 195 + Math.sin(a) * l * .7, GY + 16 + Math.cos(a) * l); ctx.stroke(); }
    ctx.restore(); }

  // the sprout: stem, then two seed leaves, then true leaves
  if (g > 0) {
    const sway = Math.sin(t * 1.7) * .04 * g, h = 170 * g;
    const tip = [195 + Math.sin(sway) * h, GY - Math.cos(sway) * h];
    ctx.strokeStyle = "#5c9a48"; ctx.lineWidth = 4.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(195, GY + 4); ctx.bezierCurveTo(188, GY - h * .35, 204 + sway * 80, GY - h * .7, tip[0], tip[1]); ctx.stroke();
    const leaf = (x, y, ang, len, open) => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); const lg = ctx.createLinearGradient(0, 0, len, 0); lg.addColorStop(0, "#4f8f3e"); lg.addColorStop(1, "#9fd47c");
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * .5, -len * .42 * open, len, 0); ctx.quadraticCurveTo(len * .5, len * .42 * open, 0, 0); ctx.fill();
      ctx.strokeStyle = "rgba(40,90,40,.5)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(len * .9, 0); ctx.stroke(); ctx.restore(); };
    const c1 = eo(win(g, .35, .8)); if (c1 > 0) { leaf(tip[0], tip[1], -Math.PI / 2 - .2 - c1 * .9, 38 * c1, c1); leaf(tip[0], tip[1], -Math.PI / 2 + .2 + c1 * .9, 38 * c1, c1); }
    const c2 = eo(win(g, .72, 1)); if (c2 > 0) { const y2 = tip[1] + 34; const x2 = lerp(195, tip[0], .8); leaf(x2, y2, Math.PI + .35 - c2 * .25, 30 * c2, c2); leaf(x2, y2, -.35 + c2 * .25, 30 * c2, c2); }
    // dew-like sparkle on the new leaves
    if (g >= 1) { ctx.fillStyle = "#fff6d8"; sparkle(tip[0] + 26, tip[1] - 14, 4, fade(t, 5.6, 5.9, 6.6, 7.2), t); }
  }
  // grass tufts appear with the day
  const rg = rng(21); ctx.strokeStyle = `rgba(110,160,80,${day})`; ctx.lineWidth = 1.6;
  for (let i = 0; i < 26; i++) { const x = rg() * W; if (Math.abs(x - 195) < 40) continue; const hh = 6 + rg() * 10; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x, GY + 2); ctx.lineTo(x + k * 4 + Math.sin(t * 2 + i) , GY - hh * day); ctx.stroke(); } }

  topLabel(t, L.big, L.small, "232,196,120", "245,238,225");
  caption(t, 5.8, "…the seed should spring up and grow, though he doesn’t know how.", "Mark 4:27", { y: 652 });
}

/* ---------- month 6: a city on a hill ---------- */
const CITY = (() => {
  const r = rng(42), b = [];
  const hillY = (x) => 470 + Math.pow((x - 195) / 160, 2) * 120;
  let x = 92;
  while (x < 298) { const w = 14 + r() * 16, cx = x + w / 2, center = Math.abs(cx - 195) < 12;
    const h = center ? 0 : 28 + (1 - Math.abs(cx - 195) / 110) * 70 * (0.6 + r() * .6);
    if (!center) b.push({ x, w, h, base: hillY(cx) + 4, dome: r() < .25, roof: r() < .35 });
    x += w + 1 + r() * 3; }
  b.push({ x: 183, w: 24, h: 150, base: hillY(195) + 4, church: true });
  const wins = [];
  for (const k of b) { const cols = Math.max(1, Math.floor((k.w - 4) / 6)), rows = Math.max(1, Math.floor((k.h - 10) / 11));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { if (r() < .25) continue; const wx = k.x + 3 + i * ((k.w - 6) / cols) + 1, wy = k.base - 8 - j * 11;
      wins.push({ x: wx, y: wy, d: Math.hypot(wx + 2 - 195, (wy - 540) * 1.3) + r() * 30 }); } }
  wins.sort((a, b) => a.d - b.d); wins.forEach((w, i) => (w.at = 1.2 + (i / wins.length) * 3.8 + (r() - .5) * .3));
  return { b, wins, hillY };
})();
function month6(t) {
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#070b1f"); sky.addColorStop(.55, "#18204a"); sky.addColorStop(.8, "#33305e"); sky.addColorStop(1, "#141832"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const r = rng(9); for (let i = 0; i < 150; i++) { const x = r() * W, y = r() * 430, s = r(); ctx.fillStyle = `rgba(255,255,255,${(.25 + .6 * Math.sin(t * 2.2 + i * 1.7) ** 2) * s})`; ctx.fillRect(x, y, s > .9 ? 2 : 1.2, s > .9 ? 2 : 1.2); }
  // moon
  glow(78, 140, 70, "200,210,255", .25); ctx.fillStyle = "#eef0ff"; ctx.beginPath(); ctx.arc(78, 140, 18, 0, 7); ctx.fill(); ctx.fillStyle = "#0b1028"; ctx.beginPath(); ctx.arc(86, 134, 16, 0, 7); ctx.fill();
  const lit = CITY.wins.filter((w) => t > w.at).length / CITY.wins.length;
  // warm light rising off the city
  glow(195, 470, 260, "255,190,100", .32 * lit);
  // far hills
  ctx.fillStyle = "#121735"; ctx.beginPath(); ctx.moveTo(0, 560); ctx.quadraticCurveTo(80, 500, 160, 545); ctx.quadraticCurveTo(260, 590, 390, 520); ctx.lineTo(390, H); ctx.lineTo(0, H); ctx.fill();
  // the hill
  const hill = ctx.createLinearGradient(0, 450, 0, H); hill.addColorStop(0, mix("#1b2147", "#3b3046", lit)); hill.addColorStop(1, "#0a0d22"); ctx.fillStyle = hill;
  ctx.beginPath(); ctx.moveTo(-10, H); for (let x = -10; x <= 400; x += 6) ctx.lineTo(x, CITY.hillY(x) + 8); ctx.lineTo(400, H); ctx.fill();
  // buildings
  for (const k of CITY.b) {
    ctx.fillStyle = k.church ? "#1d2350" : "#181e44";
    if (k.church) {
      ctx.fillRect(k.x, k.base - 70, k.w, 70); ctx.fillRect(k.x + 7, k.base - 150, 10, 82);
      ctx.beginPath(); ctx.moveTo(k.x + 5, k.base - 150); ctx.lineTo(k.x + 12, k.base - 168); ctx.lineTo(k.x + 19, k.base - 150); ctx.fill();
      const c = win(t, 5.2, 5.9); ctx.fillStyle = mix("#2a3060", "#ffe7a8", c); ctx.fillRect(k.x + 11, k.base - 186, 2.5, 18); ctx.fillRect(k.x + 7, k.base - 180, 10, 2.5);
      if (c > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(k.x + 12, k.base - 178, 60, "255,230,160", .7 * c); glow(k.x + 12, k.base - 40, 30, "255,210,130", .8 * c);
        for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .16; ctx.fillStyle = `rgba(255,228,160,${.06 * c})`; ctx.beginPath(); ctx.moveTo(k.x + 12, k.base - 178); ctx.lineTo(k.x + 12 + Math.cos(a - .03) * 600, k.base - 178 + Math.sin(a - .03) * 600); ctx.lineTo(k.x + 12 + Math.cos(a + .03) * 600, k.base - 178 + Math.sin(a + .03) * 600); ctx.fill(); }
        ctx.restore(); ctx.fillStyle = mix("#2a3060", "#ffd27a", c); ctx.beginPath(); ctx.arc(k.x + 12, k.base - 44, 6, 0, 7); ctx.fill(); }
      continue;
    }
    ctx.fillRect(k.x, k.base - k.h, k.w, k.h);
    if (k.dome) { ctx.beginPath(); ctx.arc(k.x + k.w / 2, k.base - k.h, k.w / 2, Math.PI, 0); ctx.fill(); }
    else if (k.roof) { ctx.beginPath(); ctx.moveTo(k.x - 1, k.base - k.h); ctx.lineTo(k.x + k.w / 2, k.base - k.h - k.w * .45); ctx.lineTo(k.x + k.w + 1, k.base - k.h); ctx.fill(); }
  }
  // windows light up, from the middle outward
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (const w of CITY.wins) { const k = win(t, w.at, w.at + .25); if (k <= 0) continue; const flick = k < 1 ? (k > .5 ? 1.3 : k * 2) : 1;
    glow(w.x + 2, w.y + 3, 9, "255,200,110", .25 * flick); ctx.fillStyle = `rgba(255,214,130,${Math.min(1, flick)})`; ctx.fillRect(w.x, w.y, 4, 6); }
  ctx.restore();
  // lamps along the path down the hill
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 12; i++) { const s = i / 11, x = 195 + Math.sin(s * 5.5) * 50 * s, y = 516 + s * 112, k = win(t, 2.4 + i * .22, 2.7 + i * .22);
    if (k > 0) { glow(x, y, 14 + 4 * s, "255,200,110", .5 * k); ctx.fillStyle = `rgba(255,226,160,${k})`; ctx.beginPath(); ctx.arc(x, y, 1.6 + s, 0, 7); ctx.fill(); } }
  ctx.restore();
  topLabel(t, L.big, L.small);
  caption(t, 6.3, "You are the light of the world. A city located on a hill can’t be hidden.", "Matthew 5:14", { y: 682 });
}

/* ---------- month 12: the Tree of Life ---------- */
const FRUIT = ["#e0473c", "#f08a2c", "#f3c13a", "#7a3b8f", "#e26a9a", "#8cc63f", "#4a79d0", "#b5283e", "#f6a37a", "#5a3e8f", "#efe05a", "#9a5f45"];
function tree(baseX, baseY, dir, g, t, tips) {
  // recursive branches; records branch tips for leaves and fruit
  const branch = (x, y, ang, len, depth, grow) => {
    if (grow <= 0 || depth > 6) return;
    const l = len * Math.min(1, grow), x2 = x + Math.cos(ang) * l, y2 = y + Math.sin(ang) * l;
    ctx.strokeStyle = "#6b4a2e"; ctx.lineWidth = Math.max(1, 13 - depth * 2.1); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    if (grow < 1) return;
    const sway = Math.sin(t * 1.3 + depth) * .015 * depth;
    if (depth >= 3) tips.push([x2, y2, depth]);
    const spread = depth === 0 ? .55 : .5;
    branch(x2, y2, ang - spread + sway, len * .72, depth + 1, (grow - 1) * 1.8);
    branch(x2, y2, ang + spread * .8 + sway, len * .7, depth + 1, (grow - 1) * 1.8);
    if (depth === 1 || depth === 2) branch(x2, y2, ang + sway * 2, len * .62, depth + 2, (grow - 1) * 1.8);
  };
  branch(baseX, baseY, -Math.PI / 2 + .08 * dir, 74, 0, g * 4.2);
}
function month12(t) {
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#fff6e2"); sky.addColorStop(.35, "#f6deac"); sky.addColorStop(.6, "#d9e4b9"); sky.addColorStop(1, "#8fb36f"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // light from the throne
  const throne = .7 + .3 * win(t, 7.6, 8.6);
  glow(195, 40, 330, "255,250,225", .9 * throne); glow(195, 40, 90, "255,255,255", 1);
  ctx.save(); ctx.globalCompositeOperation = "lighter"; for (let i = 0; i < 14; i++) { const a = Math.PI / 2 + (i - 6.5) * .17 + Math.sin(t * .4 + i) * .02; ctx.fillStyle = `rgba(255,240,200,${.05 * throne})`; ctx.beginPath(); ctx.moveTo(195, 40); ctx.lineTo(195 + Math.cos(a - .035) * 800, 40 + Math.sin(a - .035) * 800); ctx.lineTo(195 + Math.cos(a + .035) * 800, 40 + Math.sin(a + .035) * 800); ctx.fill(); } ctx.restore();
  // fields
  ctx.fillStyle = "#9cc27a"; ctx.beginPath(); ctx.moveTo(0, 430); ctx.quadraticCurveTo(120, 400, 195, 420); ctx.quadraticCurveTo(290, 440, 390, 410); ctx.lineTo(390, H); ctx.lineTo(0, H); ctx.fill();
  // the river of the water of life, flowing out from the light
  const front = lerp(40, H + 20, eio(win(t, .1, 2.4)));
  const cxAt = (y) => 195 + Math.sin(y / 85) * 34 * (y / H), wAt = (y) => 6 + (y - 40) * .13;
  ctx.beginPath(); for (let y = 40; y <= front; y += 6) ctx.lineTo(cxAt(y) - wAt(y), y); for (let y = front; y >= 40; y -= 6) ctx.lineTo(cxAt(y) + wAt(y), y); ctx.closePath();
  const rv = ctx.createLinearGradient(0, 40, 0, H); rv.addColorStop(0, "#eefaff"); rv.addColorStop(1, "#6fb6d4"); ctx.fillStyle = rv; ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.6;
  for (let i = 0; i < 40; i++) { const y = ((i * 37 + t * 70) % (H - 40)) + 40; if (y > front) continue; const off = Math.sin(i * 2.3) * wAt(y) * .6; ctx.beginPath(); ctx.moveTo(cxAt(y) + off - 5, y); ctx.lineTo(cxAt(y) + off + 5, y + 3); ctx.stroke(); }
  ctx.restore();
  // the trees, on this side of the river and on that
  const g = eo(win(t, 1.8, 4.6)), tips = [];
  tree(92, 560, -1, g, t, tips); tree(300, 548, 1, g, t, tips);
  // leaves
  const lv = eo(win(t, 3.6, 5)), rl = rng(17);
  if (lv > 0) for (const [x, y, d] of tips) { const n = d >= 5 ? 3 : 2; for (let k = 0; k < n; k++) { const ox = (rl() - .5) * 30, oy = (rl() - .5) * 24, rr = (12 + rl() * 10) * lv;
    ctx.fillStyle = ["#5f9d4f", "#77b45e", "#93c972"][(k + d) % 3]; ctx.globalAlpha = .92; ctx.beginPath(); ctx.arc(x + ox + Math.sin(t * 1.4 + x) * 1.2, y + oy, rr, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } }
  // twelve fruits, one for each month
  const spots = [];
  if (tips.length) { // spread the twelve evenly across both trees
    const pool = tips.filter((p) => p[2] >= 4 && p[1] < 470).sort((a, b) => a[0] - b[0]);
    const order = [0, 6, 3, 9, 1, 7, 4, 10, 2, 8, 5, 11];
    for (const i of order) spots.push(pool[Math.min(pool.length - 1, Math.floor(((i + .5) / 12) * pool.length))]); }
  let shown = 0;
  spots.forEach((p, i) => { if (!p) return; const at = 5.0 + i * .24, k = win(t, at, at + .35); if (k <= 0) return; shown++;
    const s = back(k), x = p[0] + (i % 2 ? 6 : -6), y = p[1] + 10, pulse = 1 + .12 * win(t, 8.0, 8.4) * Math.sin(t * 6 + i);
    if (t > 7.9) glow(x, y, 22, "255,235,170", .55 * win(t, 7.9, 8.5));
    ctx.fillStyle = FRUIT[i]; ctx.beginPath(); ctx.arc(x, y, 6.5 * s * pulse, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(x - 2, y - 2.4, 2 * s, 0, 7); ctx.fill();
    if (k < 1) { ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 6 + k * 16, 0, 7); ctx.stroke(); }
  });
  // leaves drift down: "for the healing of the nations"
  const fl = rng(99); for (let i = 0; i < 14; i++) { const st = 8.2 + fl() * 2.5, k = win(t, st, st + 3); if (k <= 0 || k >= 1) continue;
    const x0 = fl() < .5 ? 60 + fl() * 80 : 250 + fl() * 90, x = x0 + Math.sin(k * 6 + i) * 18, y = 420 + k * 260;
    ctx.save(); ctx.translate(x, y); ctx.rotate(k * 5 + i); ctx.fillStyle = `rgba(110,170,80,${1 - k})`; ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.5, 0, 0, 7); ctx.fill(); ctx.restore(); }
  // counter of fruits
  const a = fade(t, .2, .9, 99, 100); ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "center";
  ctx.font = "600 11px Inter, system-ui, sans-serif"; ctx.fillStyle = "#9a6a12"; spaced(L.big, 195, 112, 2.2);
  ctx.font = "400 14px Literata, Georgia, serif"; ctx.fillStyle = "#5a4520"; ctx.fillText(shown ? `${shown} of 12 fruits` : L.small, 195, 134); ctx.restore();
  caption(t, 8.4, "…the tree of life, bearing twelve kinds of fruits, yielding its fruit every month.", "Revelation 22:2", { y: 650, ink: "58,42,18", sub: "154,106,18", panel: "rgba(255,250,236,.86)" });
}


/* ---------- month 2: the mustard seed becomes a tree, and the birds come ---------- */
function month2(t) {
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#9fd0ee"); sky.addColorStop(.55, "#e6f2f0"); sky.addColorStop(1, "#cfe5b0"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  glow(310, 150, 120, "255,244,200", .8);
  // soft clouds drifting
  const cl = rng(4); for (let i = 0; i < 4; i++) { const x = ((cl() * 500 + t * (6 + i * 3)) % 520) - 70, y = 120 + cl() * 160; ctx.fillStyle = "rgba(255,255,255,.75)"; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + k * 18, y + Math.sin(k) * 5, 16 + (k % 2) * 6, 0, 7); ctx.fill(); } }
  // the field
  ctx.fillStyle = "#93c26a"; ctx.beginPath(); ctx.moveTo(0, 560); ctx.quadraticCurveTo(195, 520, 390, 560); ctx.lineTo(390, H); ctx.lineTo(0, H); ctx.fill();
  ctx.fillStyle = "#7fb058"; ctx.beginPath(); ctx.moveTo(0, 610); ctx.quadraticCurveTo(195, 585, 390, 615); ctx.lineTo(390, H); ctx.lineTo(0, H); ctx.fill();
  // the tiny seed, then the tree
  const sd = win(t, .2, 1);
  if (t < 1.4) { ctx.fillStyle = "#8a5a2a"; ctx.beginPath(); ctx.arc(195, lerp(380, 545, eo(sd)), 2.6, 0, 7); ctx.fill(); }
  const g = eo(win(t, 1.2, 4.2)), tips = [];
  if (g > 0) tree(195, 548, 1, g, t, tips);
  const lv = eo(win(t, 3.2, 4.6)), rl = rng(23);
  if (lv > 0) for (const [x, y, d] of tips) for (let k = 0; k < 2; k++) {
    const ox = (rl() - .5) * 28, oy = (rl() - .5) * 22; ctx.fillStyle = ["#5f9d4f", "#77b45e", "#93c972"][(k + d) % 3];
    ctx.beginPath(); ctx.arc(x + ox + Math.sin(t * 1.3 + x) * 1.2, y + oy, (11 + rl() * 9) * lv, 0, 7); ctx.fill(); }
  // birds fly in and settle in its branches
  const perch = tips.filter((p) => p[2] >= 4).sort((a, b) => a[0] - b[0]);
  const rb = rng(31);
  for (let i = 0; i < 6 && perch.length; i++) {
    const p = perch[Math.floor(((i + .5) / 6) * perch.length)], at = 4.6 + i * .45, k = win(t, at, at + 1.6);
    if (k <= 0) continue;
    const fromX = i % 2 ? 440 : -50, fromY = 150 + rb() * 120, e = eio(k);
    const x = lerp(fromX, p[0], e), y = lerp(fromY, p[1] - 8, e) - Math.sin(e * Math.PI) * 60;
    const flap = k < 1 ? Math.sin(t * 22 + i) : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(fromX > 0 ? -1 : 1, 1);
    ctx.fillStyle = "#3b3a48"; ctx.beginPath(); ctx.ellipse(0, 0, 7, 4.5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(6, -3, 3, 0, 7); ctx.fill();
    ctx.fillStyle = "#e0a640"; ctx.beginPath(); ctx.moveTo(9, -3); ctx.lineTo(12, -2); ctx.lineTo(9, -1.5); ctx.fill();
    ctx.strokeStyle = "#3b3a48"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-1, -1); ctx.lineTo(-7, -1 - 9 * (k < 1 ? flap : .15)); ctx.stroke();
    ctx.restore();
  }
  topLabel(t, L.big, L.small, "120,84,20", "60,52,30");
  caption(t, 7.0, "…when it is grown… it becomes a tree, so that the birds of the air come and lodge in its branches.", "Matthew 13:32", { y: 640, ink: "40,52,28", sub: "120,84,20", panel: "rgba(255,252,240,.82)" });
}

/* ---------- month 3: the vine spreads and bears grapes ---------- */
function month3(t) {
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#f6d6a2"); sky.addColorStop(.6, "#f7e8c8"); sky.addColorStop(1, "#c7b07a"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  glow(80, 140, 170, "255,226,160", .7);
  ctx.fillStyle = "#a99256"; ctx.beginPath(); ctx.moveTo(0, 600); ctx.quadraticCurveTo(195, 575, 390, 600); ctx.lineTo(390, H); ctx.lineTo(0, H); ctx.fill();
  // trellis: three posts and two wires
  ctx.strokeStyle = "#7a5634"; ctx.lineWidth = 7; ctx.lineCap = "round";
  for (const x of [60, 195, 330]) { ctx.beginPath(); ctx.moveTo(x, 610); ctx.lineTo(x, 330); ctx.stroke(); }
  ctx.strokeStyle = "rgba(90,70,50,.6)"; ctx.lineWidth = 1.5; for (const y of [360, 450]) { ctx.beginPath(); ctx.moveTo(56, y); ctx.lineTo(334, y); ctx.stroke(); }
  // the vine grows up the middle post and out along both wires
  const g = eio(win(t, .6, 4.6));
  const path = (s) => { // 0..1 along: trunk (0–.3), then left/right along the top wire
    if (s < .3) { const k = s / .3; return [195 + Math.sin(k * 6) * 6, 610 - k * 250]; }
    const k = (s - .3) / .7; return [195, 360 + Math.sin(k * 9) * 6, k];
  };
  ctx.strokeStyle = "#6b4a2a"; ctx.lineWidth = 6; ctx.beginPath();
  for (let s = 0; s <= Math.min(g, .3); s += .01) { const [x, y] = path(s); s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
  const arm = Math.max(0, (g - .3) / .7);
  for (const dir of [-1, 1]) for (const [y0, len, w] of [[360, 135, 4.5], [450, 120, 3.5]]) {
    const a = y0 === 450 ? Math.max(0, (arm - .2) / .8) : arm; if (a <= 0) continue;
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(195, y0);
    for (let k = 0; k <= a; k += .02) ctx.lineTo(195 + dir * k * len, y0 + Math.sin(k * 12) * 5);
    ctx.stroke();
    // leaves and tendrils along the arm
    for (let k = .1; k <= a; k += .14) {
      const x = 195 + dir * k * len, y = y0 + Math.sin(k * 12) * 5, s = eo(win(a, k, k + .15));
      ctx.fillStyle = k * 10 % 2 < 1 ? "#5e9a45" : "#79b35a";
      for (const [dx, dy, r] of [[0, -12, 9], [-7, -6, 7], [7, -6, 7]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, 7); ctx.fill(); }
      ctx.strokeStyle = "rgba(90,130,60,.8)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x + dir * 6, y + 10, 4 * s, 0, 5); ctx.stroke(); ctx.lineWidth = w; ctx.strokeStyle = "#6b4a2a";
    }
  }
  // grape clusters swell
  const gr = [[195 - 70, 372], [195 + 60, 372], [195 - 100, 462], [195 + 95, 462], [195 - 20, 462]];
  gr.forEach(([x, y], i) => {
    const k = eo(win(t, 4.6 + i * .35, 5.6 + i * .35)); if (k <= 0) return;
    const rows = [4, 3, 3, 2, 1];
    rows.forEach((n, r) => { for (let j = 0; j < n; j++) { const gx = x + (j - (n - 1) / 2) * 8.5, gy = y + 6 + r * 7.5;
      const gg = ctx.createRadialGradient(gx - 1.5, gy - 1.5, 0, gx, gy, 5 * k); gg.addColorStop(0, "#9b6cc4"); gg.addColorStop(1, "#4a2a6a");
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(gx, gy, 4.6 * k, 0, 7); ctx.fill(); } });
    if (k < 1) { ctx.fillStyle = "#fff5d0"; sparkle(x + 10, y, 4, 1 - k, t); }
  });
  topLabel(t, L.big, L.small, "120,72,20", "70,50,25");
  caption(t, 6.6, "I am the vine. You are the branches. He who remains in me and I in him bears much fruit…", "John 15:5", { y: 652, ink: "58,40,18", sub: "120,72,20", panel: "rgba(255,250,236,.84)" });
}

/* ---------- month 4: a lamp on a stand fills the room with light ---------- */
function month4(t) {
  ctx.fillStyle = "#1c1510"; ctx.fillRect(0, 0, W, H);
  const lit = eo(win(t, 1.4, 4.2)), fl = .85 + .15 * Math.sin(t * 17) * Math.sin(t * 7.3);
  const R = lerp(40, 640, lit) * (.97 + .03 * fl);
  // the room (walls, window, table, bread and a jug), revealed as the light reaches it
  const room = () => {
    ctx.fillStyle = "#6b4a30"; ctx.fillRect(0, 0, W, 520);
    ctx.fillStyle = "#5a3d27"; for (let y = 20; y < 520; y += 40) for (let x = (y / 40) % 2 ? -30 : 0; x < W; x += 60) { ctx.fillRect(x + 2, y + 2, 56, 36); }
    ctx.fillStyle = "#1c2440"; ctx.fillRect(270, 130, 70, 90); ctx.fillStyle = "#f2eccd"; ctx.beginPath(); ctx.arc(300, 155, 6, 0, 7); ctx.fill();
    ctx.strokeStyle = "#3a2716"; ctx.lineWidth = 5; ctx.strokeRect(270, 130, 70, 90); ctx.beginPath(); ctx.moveTo(305, 130); ctx.lineTo(305, 220); ctx.stroke();
    ctx.fillStyle = "#4a321f"; ctx.fillRect(0, 520, W, 240);
    ctx.fillStyle = "#7a5534"; ctx.fillRect(40, 560, 310, 16); ctx.fillRect(60, 576, 12, 110); ctx.fillRect(318, 576, 12, 110);
    ctx.fillStyle = "#c88e4a"; ctx.beginPath(); ctx.ellipse(110, 552, 30, 11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#8a6a8f"; ctx.beginPath(); ctx.moveTo(272, 560); ctx.quadraticCurveTo(262, 520, 282, 505); ctx.lineTo(296, 505); ctx.quadraticCurveTo(316, 520, 306, 560); ctx.fill();
  };
  room();
  // darkness everywhere the light doesn't reach
  const d = ctx.createRadialGradient(195, 360, R * .15, 195, 360, R);
  d.addColorStop(0, "rgba(20,14,8,0)"); d.addColorStop(.7, `rgba(20,14,8,${.55 - .3 * lit})`); d.addColorStop(1, "rgba(20,14,8,.97)");
  ctx.fillStyle = d; ctx.fillRect(0, 0, W, H);
  // the stand and the lamp
  ctx.fillStyle = "#b08a3a"; ctx.fillRect(191, 400, 8, 160); ctx.beginPath(); ctx.ellipse(195, 560, 30, 7, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(195, 400, 20, 5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#c99a4a"; ctx.beginPath(); ctx.ellipse(195, 388, 26, 10, 0, 0, Math.PI); ctx.fill(); ctx.beginPath(); ctx.moveTo(214, 384); ctx.lineTo(232, 378); ctx.lineTo(214, 391); ctx.fill();
  // spark, then the flame
  if (t > 1.1) {
    const f = eo(win(t, 1.1, 1.6)), fx = 230, fy = 374;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(fx, fy - 6, 90 * f * fl, "255,190,90", .6); glow(fx, fy - 6, 26 * f, "255,240,190", .9); ctx.restore();
    ctx.fillStyle = "#ffd36a"; ctx.beginPath(); ctx.moveTo(fx, fy - 26 * f * fl); ctx.quadraticCurveTo(fx + 9 * f, fy - 6, fx, fy); ctx.quadraticCurveTo(fx - 9 * f, fy - 6, fx, fy - 26 * f * fl); ctx.fill();
    ctx.fillStyle = "#fff6d8"; ctx.beginPath(); ctx.ellipse(fx, fy - 6, 3 * f, 6 * f, 0, 0, 7); ctx.fill();
  } else if (t > .7) { ctx.fillStyle = "#ffe7a0"; sparkle(230, 372, 6, fade(t, .7, .85, 1, 1.15), t * 4); }
  // dust in the light
  const rd = rng(8); ctx.fillStyle = "rgba(255,230,170,.6)"; for (let i = 0; i < 30; i++) { const x = rd() * W, y = (rd() * 520 + t * 8 * (rd() + .3)) % 520; if (Math.hypot(x - 195, y - 360) < R * .6) ctx.fillRect(x, y, 1.4, 1.4); }
  topLabel(t, L.big, L.small, "232,196,120", "245,238,225");
  caption(t, 5.4, "…light a lamp… on a stand; and it shines to all who are in the house.", "Matthew 5:15", { y: 650 });
}

/* ---------- month 5: a well, with living water rising and overflowing ---------- */
function month5(t) {
  const sky = ctx.createLinearGradient(0, 0, 0, 560); sky.addColorStop(0, "#3c3a6e"); sky.addColorStop(.6, "#e08a5c"); sky.addColorStop(1, "#f6c27a"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 560);
  glow(195, 470, 200, "255,200,120", .6);
  // dunes
  ctx.fillStyle = "#d6a464"; ctx.beginPath(); ctx.moveTo(0, 520); ctx.quadraticCurveTo(110, 470, 230, 515); ctx.quadraticCurveTo(320, 545, 390, 505); ctx.lineTo(390, H); ctx.lineTo(0, H); ctx.fill();
  ctx.fillStyle = "#c48f52"; ctx.fillRect(0, 560, W, H - 560);
  const flow = eo(win(t, 4.0, 6.6));
  // water spreading over the dry ground, and green springing up beside it
  if (flow > 0) {
    ctx.fillStyle = "rgba(110,190,220,.85)"; ctx.beginPath(); ctx.moveTo(150, 600);
    ctx.bezierCurveTo(140, 640, 120 - 40 * flow, 680, 100 - 70 * flow, 760 * flow + 600 * (1 - flow));
    ctx.lineTo(300 + 70 * flow, 760 * flow + 600 * (1 - flow)); ctx.bezierCurveTo(270 + 40 * flow, 680, 250, 640, 240, 600); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.4; for (let i = 0; i < 12; i++) { const y = 610 + ((i * 23 + t * 50) % 150) * flow; ctx.beginPath(); ctx.moveTo(185 + Math.sin(i) * 30 - 6, y); ctx.lineTo(185 + Math.sin(i) * 30 + 6, y + 3); ctx.stroke(); }
    const rg = rng(12); for (let i = 0; i < 26; i++) { const s = rg(), side = rg() < .5 ? -1 : 1, y = 610 + s * 150 * flow, x = 195 + side * (60 + s * 80 * flow + rg() * 20), k = win(flow, s * .7, s * .7 + .3);
      if (k > 0) { ctx.strokeStyle = "#6fae4a"; ctx.lineWidth = 1.6; for (const a of [-.4, 0, .4]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + a * 8, y - 10 * k); ctx.stroke(); } if (i % 4 === 0) { ctx.fillStyle = ["#f26d6d", "#f6d04d", "#ffffff"][i % 3]; ctx.beginPath(); ctx.arc(x, y - 11 * k, 2.4 * k, 0, 7); ctx.fill(); } } }
  }
  // the well
  const wx = 195, wy = 560;
  ctx.fillStyle = "#8a7560"; ctx.fillRect(wx - 60, wy - 70, 120, 70);
  ctx.fillStyle = "#6e5b48"; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) ctx.fillRect(wx - 60 + c * 20 + (r % 2) * 10 + 1, wy - 70 + r * 17.5 + 1, 18, 15.5);
  ctx.fillStyle = "#9b8670"; ctx.beginPath(); ctx.ellipse(wx, wy - 70, 62, 15, 0, 0, 7); ctx.fill();
  // the water rises inside, then spills over the rim
  const rise = eo(win(t, 1.2, 4.0)), lvl = lerp(16, 0, rise);
  ctx.save(); ctx.beginPath(); ctx.ellipse(wx, wy - 70, 54, 11, 0, 0, 7); ctx.clip();
  ctx.fillStyle = "#1d2a33"; ctx.fillRect(wx - 60, wy - 85, 120, 30);
  const wg = ctx.createLinearGradient(0, wy - 80, 0, wy - 60); wg.addColorStop(0, "#bfe8f4"); wg.addColorStop(1, "#4f9fc4");
  ctx.fillStyle = wg; ctx.beginPath(); ctx.ellipse(wx, wy - 70 + lvl, 54, 11, 0, 0, 7); ctx.fill(); ctx.restore();
  if (rise > .2) { ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(wx, wy - 72, 70, "190,235,255", .5 * rise); ctx.restore(); }
  if (flow > 0) { ctx.fillStyle = "rgba(140,205,230,.8)"; for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(wx + side * 58, wy - 72); ctx.quadraticCurveTo(wx + side * 70, wy - 40, wx + side * 52, wy + 40 * flow); ctx.lineTo(wx + side * 44, wy); ctx.lineTo(wx + side * 52, wy - 72); ctx.fill(); } }
  // spray drops
  const rd = rng(6); ctx.fillStyle = "rgba(220,245,255,.9)"; for (let i = 0; i < 16; i++) { const k = ((t * .8 + rd()) % 1), a = -Math.PI / 2 + (rd() - .5) * 1.6; if (rise < .9) break; ctx.beginPath(); ctx.arc(wx + Math.cos(a) * 40 * k, wy - 74 + Math.sin(a) * 40 * k + 60 * k * k, 1.8, 0, 7); ctx.fill(); }
  topLabel(t, L.big, L.small, "255,230,170", "255,246,230");
  caption(t, 6.8, "…the water that I will give him will become in him a well of water springing up to eternal life.", "John 4:14", { y: 640, ink: "40,34,30", sub: "130,80,30", panel: "rgba(255,250,240,.86)" });
}

/* ---------- month 7: rest — the sun sets over a calm sea as seven stars appear ---------- */
function month7(t) {
  const dusk = eio(win(t, .5, 5.5));
  const sky = ctx.createLinearGradient(0, 0, 0, 450);
  sky.addColorStop(0, mix("#f2a25c", "#141a3a", dusk)); sky.addColorStop(.6, mix("#f7c27a", "#3a3266", dusk)); sky.addColorStop(1, mix("#ffe0a0", "#c4706a", dusk));
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 450);
  // the sun sinks into the sea
  const sy = lerp(330, 470, eio(win(t, .3, 5.2)));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 450); ctx.clip();
  glow(195, sy, 150, "255,190,110", .7 * (1 - dusk * .6)); ctx.fillStyle = "#ffd890"; ctx.beginPath(); ctx.arc(195, sy, 34, 0, 7); ctx.fill(); ctx.restore();
  // the sea, calm, with the sun's road on it
  const sea = ctx.createLinearGradient(0, 450, 0, H); sea.addColorStop(0, mix("#c97a5a", "#2a2a52", dusk)); sea.addColorStop(1, mix("#5a3a52", "#0d1028", dusk)); ctx.fillStyle = sea; ctx.fillRect(0, 450, W, H - 450);
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 26; i++) { const y = 456 + i * 11 + i * i * .3, w = (40 - i) * (1 - dusk * .7) + Math.sin(t * 2 + i) * 6; if (w <= 0) continue; ctx.fillStyle = `rgba(255,200,130,${.35 * (1 - i / 26) * (1 - dusk * .5)})`; ctx.fillRect(195 - w / 2 + Math.sin(t * 1.5 + i * 2) * 4, y, w, 2); }
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 1; for (let i = 0; i < 9; i++) { const y = 470 + i * 30; ctx.beginPath(); for (let x = 0; x <= W; x += 10) ctx.lineTo(x, y + Math.sin(x * .03 + t + i) * 1.5); ctx.stroke(); }
  // seven stars, one at a time
  const ST = [[70, 90], [140, 60], [210, 110], [280, 70], [330, 150], [110, 180], [250, 200]];
  ST.forEach(([x, y], i) => { const k = win(t, 3.2 + i * .45, 3.7 + i * .45); if (k <= 0) return; const tw = .75 + .25 * Math.sin(t * 3 + i);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(x, y, 16, "255,250,220", .5 * k * tw); ctx.restore(); ctx.fillStyle = `rgba(255,252,235,${k})`; sparkle(x, y, 6 * k * tw, 1, 0); });
  topLabel(t, L.big, L.small);
  caption(t, 6.4, "On the seventh day God finished his work… and he rested on the seventh day…", "Genesis 2:2", { y: 640 });
}

/* ---------- month 8: an eagle rises through the clouds into open sky ---------- */
function month8(t) {
  const up = eio(win(t, .3, 6.5));
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, mix("#8fa3b8", "#2f7fd0", up)); sky.addColorStop(1, mix("#c5ccd4", "#bfe2fa", up)); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  glow(195, -40 + 0 * up, 300, "255,250,220", .5 + .4 * up);
  // cloud layers slide downward past the eagle: it is rising
  const layer = (seed, speed, alpha, size) => { const r = rng(seed); for (let i = 0; i < 7; i++) { const x = r() * W, y0 = r() * H * 1.6 - H * .3, y = ((y0 + up * speed + 40) % (H * 1.6)) - H * .3;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + (k - 2) * size * .7, y + Math.sin(k * 2) * size * .2, size * (.6 + (k % 2) * .3), 0, 7); ctx.fill(); } } };
  layer(3, 900, .55, 40); layer(7, 1400, .75, 56);
  // the eagle: flaps, then soars with wings wide
  const soar = win(t, 3.0, 4.0), flap = Math.sin(t * 9) * (1 - soar) + soar * .1;
  const ex = 195 + Math.sin(t * .8) * 18, ey = 380 - up * 40;
  ctx.save(); ctx.translate(ex, ey); ctx.fillStyle = "#3a2a1e";
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -4); ctx.quadraticCurveTo(side * 50, -22 - flap * 26, side * 110, -8 - flap * 40); ctx.quadraticCurveTo(side * 80, 4 - flap * 10, side * 96, 12 - flap * 20); ctx.quadraticCurveTo(side * 50, 12, 0, 8); ctx.fill();
    ctx.strokeStyle = "#3a2a1e"; ctx.lineWidth = 2; for (let f = 0; f < 4; f++) { ctx.beginPath(); ctx.moveTo(side * (80 + f * 6), -6 - flap * 30); ctx.lineTo(side * (98 + f * 6), -14 - flap * 42 + f * 4); ctx.stroke(); } }
  ctx.beginPath(); ctx.ellipse(0, 6, 11, 26, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, 28); ctx.lineTo(0, 46); ctx.lineTo(10, 28); ctx.fill();
  ctx.fillStyle = "#f4efe4"; ctx.beginPath(); ctx.arc(0, -24, 9, 0, 7); ctx.fill(); ctx.fillStyle = "#e3a62f"; ctx.beginPath(); ctx.moveTo(-3, -31); ctx.lineTo(0, -38); ctx.lineTo(3, -31); ctx.fill();
  ctx.restore();
  // breaking into the open, bright sky
  if (up > .7) { ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(195, 120, 260, "255,255,240", .35 * win(up, .7, 1)); ctx.restore(); }
  topLabel(t, L.big, L.small, "255,240,200", "255,255,255");
  caption(t, 6.0, "…those who wait for the LORD will renew their strength. They will mount up with wings like eagles.", "Isaiah 40:31", { y: 640, ink: "26,44,70", sub: "60,90,140", panel: "rgba(255,255,255,.78)" });
}

/* ---------- month 9: a wheat field ripens in golden waves ---------- */
function month9(t) {
  const ripe = eio(win(t, .6, 4.6));
  const sky = ctx.createLinearGradient(0, 0, 0, 420); sky.addColorStop(0, mix("#9cc6e6", "#e9a96a", ripe * .7)); sky.addColorStop(1, mix("#e8f0e8", "#fbe3b2", ripe)); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 420);
  glow(300, 330, 160, "255,220,150", .5 + .4 * ripe);
  ctx.fillStyle = mix("#7aa25a", "#c99a3e", ripe); ctx.fillRect(0, 400, W, H - 400);
  // rows of stalks, far to near; a wave of wind runs across them
  for (let row = 0; row < 16; row++) {
    const z = row / 15, y = 405 + z * z * 360, sc = .35 + z * 1.1, n = Math.round(18 + (1 - z) * 20);
    for (let i = 0; i < n; i++) {
      const x = (i + .5 + (row % 2) * .5) * (W / n), wave = Math.sin(x * .02 - t * 2.4 + row * .3) * .5 + Math.sin(x * .05 + t * 1.3) * .2;
      const h = 46 * sc, lean = wave * 10 * sc;
      ctx.strokeStyle = mix("#5f8f3e", "#b98a32", ripe); ctx.lineWidth = 1.3 * sc; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * .3, y - h * .6, x + lean, y - h); ctx.stroke();
      ctx.fillStyle = mix("#8db35a", "#f2c95e", ripe); ctx.beginPath(); ctx.ellipse(x + lean, y - h - 5 * sc, 2.6 * sc, 8 * sc, lean * .02, 0, 7); ctx.fill();
    }
  }
  // a few birds far away
  ctx.strokeStyle = "rgba(60,50,40,.5)"; ctx.lineWidth = 1.3; for (let i = 0; i < 3; i++) { const x = 60 + i * 30 + t * 12, y = 180 + i * 14; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.quadraticCurveTo(x - 3, y - 4, x, y); ctx.quadraticCurveTo(x + 3, y - 4, x + 6, y); ctx.stroke(); }
  topLabel(t, L.big, L.small, "120,72,20", "70,50,25");
  caption(t, 6.0, "…lift up your eyes and look at the fields, that they are white for harvest already.", "John 4:35", { y: 640, ink: "58,40,18", sub: "120,72,20", panel: "rgba(255,250,236,.84)" });
}

/* ---------- month 10: great gates swing open to light ---------- */
function month10(t) {
  ctx.fillStyle = "#2a2230"; ctx.fillRect(0, 0, W, H);
  const open = eio(win(t, 1.4, 4.0));
  const gx = 195, top = 210, bot = 600, half = 100;
  // light behind the gates
  ctx.save(); ctx.beginPath(); ctx.moveTo(gx - half, bot); ctx.lineTo(gx - half, top + 60); ctx.arc(gx, top + 60, half, Math.PI, 0); ctx.lineTo(gx + half, bot); ctx.clip();
  const lg = ctx.createRadialGradient(gx, 380, 10, gx, 380, 260); lg.addColorStop(0, "#fffbe8"); lg.addColorStop(.5, "#ffe39a"); lg.addColorStop(1, "#d9a44a"); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H); ctx.restore();
  // rays pouring out as they open
  if (open > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; for (let i = 0; i < 16; i++) { const a = Math.PI / 2 + (i - 7.5) * .16; ctx.fillStyle = `rgba(255,232,170,${.07 * open})`; ctx.beginPath(); ctx.moveTo(gx, 380); ctx.lineTo(gx + Math.cos(a - .05) * 700, 380 + Math.sin(a - .05) * 700); ctx.lineTo(gx + Math.cos(a + .05) * 700, 380 + Math.sin(a + .05) * 700); ctx.fill(); } glow(gx, 400, 330, "255,220,140", .45 * open); ctx.restore(); }
  // the stone wall and arch
  ctx.fillStyle = "#5c4f5c";
  ctx.beginPath(); ctx.rect(0, 120, W, H - 120); ctx.moveTo(gx + half + 22, bot); ctx.lineTo(gx + half + 22, top + 60); ctx.arc(gx, top + 60, half + 22, 0, Math.PI, true); ctx.lineTo(gx - half - 22, bot); ctx.closePath(); ctx.fill("evenodd");
  ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1; for (let y = 140; y < H; y += 28) for (let x = (y / 28) % 2 ? -20 : 0; x < W; x += 40) { if (Math.abs(x + 20 - gx) < half + 30 && y > top - 40 && y < bot) continue; ctx.strokeRect(x, y, 40, 28); }
  ctx.fillStyle = "#3e3442"; ctx.fillRect(0, bot, W, H - bot);
  // the two gates swing inward (drawn narrowing)
  for (const side of [-1, 1]) {
    const w = half * (1 - open * .88);
    ctx.save(); ctx.beginPath(); ctx.moveTo(gx - half, bot); ctx.lineTo(gx - half, top + 60); ctx.arc(gx, top + 60, half, Math.PI, 0); ctx.lineTo(gx + half, bot); ctx.clip();
    const x0 = side < 0 ? gx - half : gx + half - w;
    const wood = ctx.createLinearGradient(x0, 0, x0 + w, 0); wood.addColorStop(0, side < 0 ? "#6b4226" : "#4a2c17"); wood.addColorStop(1, side < 0 ? "#4a2c17" : "#6b4226");
    ctx.fillStyle = wood; ctx.fillRect(x0, top - 40, w, bot - top + 40);
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x0 + (w * k) / 4, top - 40); ctx.lineTo(x0 + (w * k) / 4, bot); ctx.stroke(); }
    ctx.fillStyle = "#c9a24a"; for (const y of [300, 470]) ctx.fillRect(x0, y, w, 6);
    ctx.restore();
  }
  // motes in the light
  const rd = rng(5); ctx.fillStyle = "rgba(255,240,200,.7)"; for (let i = 0; i < 40 * open; i++) { const x = gx + (rd() - .5) * 2 * half * open, y = (bot - ((rd() * 400 + t * 14) % 400)); ctx.fillRect(x, y, 1.6, 1.6); }
  topLabel(t, L.big, L.small);
  caption(t, 5.2, "Lift up your heads, you gates! Be lifted up, you everlasting doors, and the King of glory will come in.", "Psalm 24:7", { y: 650 });
}

/* ---------- month 11: a runner nears the finish, with a crowd of witnesses ---------- */
function month11(t) {
  const sky = ctx.createLinearGradient(0, 0, 0, 380); sky.addColorStop(0, "#f6b27a"); sky.addColorStop(1, "#fbe6c2"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 380);
  glow(195, 330, 180, "255,230,170", .8);
  const run = win(t, 0, 6.2), fin = eo(win(t, 4.8, 5.6));
  // the stands, rising away on both sides, and grass beside the track
  const st = ctx.createLinearGradient(0, 380, 0, H); st.addColorStop(0, "#8a6a70"); st.addColorStop(1, "#4a3a48"); ctx.fillStyle = st; ctx.fillRect(0, 380, W, H - 380);
  ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1; for (let r = 0; r < 14; r++) { const y = 390 + r * r * 2.2; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = "#6f9a52"; ctx.beginPath(); ctx.moveTo(150, 380); ctx.lineTo(240, 380); ctx.lineTo(390, H); ctx.lineTo(0, H); ctx.fill();
  // the stands on both sides: the witnesses light up as the runner passes
  for (const side of [-1, 1]) for (let r = 0; r < 5; r++) for (let i = 0; i < 9; i++) {
    const z = i / 8, x = 195 + side * (60 + z * 150 + r * 14), y = 360 + z * 330 - r * (16 + z * 8);
    const lit = win(run * 9 - (8 - i) * .6, 0, 1), s = .6 + z * .9;
    ctx.fillStyle = lit > 0 ? mix("#6a5a6e", "#ffd47a", lit) : "#6a5a6e";
    ctx.beginPath(); ctx.arc(x, y - 7 * s, 4.5 * s, 0, 7); ctx.fill(); ctx.fillRect(x - 4 * s, y - 3 * s, 8 * s, 9 * s);
    if (lit > 0 && (i + r) % 3 === 0) { ctx.strokeStyle = `rgba(255,214,122,${lit})`; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(x, y - 2 * s); ctx.lineTo(x + side * -6 * s, y - 14 * s - Math.sin(t * 8 + i) * 3); ctx.stroke(); }
  }
  // the track, rushing toward us
  ctx.fillStyle = "#c46a4a"; ctx.beginPath(); ctx.moveTo(170, 380); ctx.lineTo(220, 380); ctx.lineTo(330, H); ctx.lineTo(60, H); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 2; for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(195 + k * 25, 380); ctx.lineTo(195 + k * 135, H); ctx.stroke(); }
  for (let i = 0; i < 8; i++) { const k = ((i / 8 + t * .5) % 1), y = 380 + k * k * (H - 380); ctx.strokeStyle = `rgba(255,255,255,${.5 * k})`; ctx.beginPath(); ctx.moveTo(195 - 2 - k * 6, y); ctx.lineTo(195 + 2 + k * 6, y); ctx.stroke(); }
  // the finish ribbon comes near and breaks
  const rz = eo(win(t, 3.8, 5.0)), ry = lerp(400, 520, rz), rw = lerp(60, 300, rz);
  if (fin < 1) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 3 + rz * 3; ctx.beginPath(); ctx.moveTo(195 - rw / 2, ry); ctx.lineTo(195 + rw / 2, ry); ctx.stroke(); }
  else for (const k of [-1, 1]) { const a = win(t, 5.6, 6.6); ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(195 + k * 150, ry); ctx.quadraticCurveTo(195 + k * 80, ry + 30 * a, 195 + k * (10 + 50 * a), ry + 70 * a); ctx.stroke(); }
  // the runner (from behind), arms and legs swinging
  const cyc = t * 9, rx = 195, base = 600 - rz * 30;
  ctx.save(); ctx.translate(rx, base); ctx.strokeStyle = "#2d2633"; ctx.lineCap = "round";
  ctx.lineWidth = 9; for (const k of [0, Math.PI]) { const a = Math.sin(cyc + k); ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(a * 14, -12); ctx.lineTo(a * 8 + (a > 0 ? 6 : -2), 18); ctx.stroke(); }
  ctx.lineWidth = 7; for (const k of [0, Math.PI]) { const a = Math.sin(cyc + k + Math.PI); ctx.beginPath(); ctx.moveTo(0, -80); ctx.lineTo(a * 18 + (k ? -12 : 12), -60); ctx.lineTo(a * 22 + (k ? -14 : 14), -42); ctx.stroke(); }
  ctx.fillStyle = "#2d2633"; ctx.beginPath(); ctx.ellipse(0, -62, 15, 26, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(0, -100, 11, 0, 7); ctx.fill();
  ctx.restore();
  // light and confetti at the finish
  if (fin > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(195, 500, 240, "255,226,160", .5 * fin); ctx.restore();
    const rc = rng(19); for (let i = 0; i < 40; i++) { const k = win(t, 5.4 + rc() * .3, 6.8 + rc() * .5); if (k <= 0 || k >= 1) continue; ctx.fillStyle = ["#ffd36a", "#ffffff", "#f6a37a"][i % 3]; const a = rc() * 7, d = 40 + rc() * 160; ctx.fillRect(195 + Math.cos(a) * d * eo(k), 480 + Math.sin(a) * d * eo(k) + 80 * k * k, 4, 4); } }
  topLabel(t, L.big, L.small, "120,60,20", "70,40,20");
  caption(t, 6.4, "…seeing we are surrounded by so great a cloud of witnesses… let's run with perseverance the race that is set before us.", "Hebrews 12:1", { y: 620, ink: "58,30,18", sub: "140,70,30", panel: "rgba(255,248,236,.86)" });
}

/* ---------- the twelve, in order ---------- */
export const MONTHS = [
  { name: "A seed sprouts", draw: month1, dur: 8.4, edge: ["#141a33", "#2e1c10"] },
  { name: "The mustard tree", draw: month2, dur: 9.6, edge: ["#9fd0ee", "#7fb058"] },
  { name: "The vine bears fruit", draw: month3, dur: 9.2, edge: ["#f6d6a2", "#a99256"] },
  { name: "A lamp on a stand", draw: month4, dur: 8.4, edge: ["#1c1510", "#4a321f"] },
  { name: "Living water", draw: month5, dur: 9.4, edge: ["#3c3a6e", "#c48f52"] },
  { name: "A city on a hill", draw: month6, dur: 9.2, edge: ["#070b1f", "#0a0d22"] },
  { name: "Rest", draw: month7, dur: 9.0, edge: ["#141a3a", "#0d1028"] },
  { name: "Wings like eagles", draw: month8, dur: 8.6, edge: ["#2f7fd0", "#bfe2fa"] },
  { name: "Fields white for harvest", draw: month9, dur: 8.6, edge: ["#c9a070", "#c99a3e"] },
  { name: "The gates open", draw: month10, dur: 8.0, edge: ["#2a2230", "#3e3442"] },
  { name: "The race", draw: month11, dur: 9.0, edge: ["#f6b27a", "#c46a4a"] },
  { name: "The Tree of Life", draw: month12, dur: 11.4, edge: ["#fff6e2", "#8fb36f"] },
];

// Draw month scene i (0–11) at time t. gold: the second year (and after), richer each time.
export function drawMonth(c, i, t, { big = "", small = "", gold = false } = {}) {
  ctx = c; L = { big, small };
  ctx.save(); MONTHS[i].draw(t); ctx.restore();
  if (gold) {
    ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = "rgba(255,200,90,.45)"; ctx.fillRect(0, 0, W, H); ctx.restore();
    const v = ctx.createRadialGradient(195, 380, 200, 195, 380, 520); v.addColorStop(0, "rgba(255,210,120,0)"); v.addColorStop(1, "rgba(200,150,40,.35)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    const r = rng(i + 50); ctx.fillStyle = "#fff1c4";
    for (let k = 0; k < 18; k++) { const x = r() * W, y = r() * H, ph = (t * .7 + r()) % 1; sparkle(x, y, 2 + 3 * Math.sin(ph * Math.PI), Math.sin(ph * Math.PI) * .9, ph * 3); }
  }
}
export const WEEKLY_DUR = 5.6;
