// The holy-day scenes: Ash Wednesday, Christmas, Good Friday, Easter, Pentecost,
// the Christmas tree on the You page, and the prayer candle.
// Each scene is drawn on a 390 x 760 stage that is fitted to the screen; play(id) shows it full screen and
// resolves when it ends (or is closed).

const W = 390, H = 760;
let c = null;                       // the 2D context being drawn into
let VIEW = { x: 0, y: 0, w: W, h: H }; // the whole screen, in stage units (wider or taller than the stage)
let NAME = "", INTENT = "";
const full = () => c.fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const win = (t, a, b) => clamp((t - a) / (b - a));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const ei = (x) => Math.pow(clamp(x), 3);
const eio = (x) => (x = clamp(x), x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function glow(x, y, r, col, a) { if (a <= 0) return; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
function wrap(text, maxW) { const ws = text.split(" "), out = []; let l = ""; for (const w of ws) { const t = l ? l + " " + w : w; if (c.measureText(t).width > maxW && l) { out.push(l); l = w; } else l = t; } if (l) out.push(l); return out; }
const SERIF = "Literata, Georgia, serif";
// a quote, then its reference, faded in at time a (and out at b)
function quote(t, a, b, text, ref, y, { size = 20, color = "255,246,232", refCol = "243,207,138", maxW = 320, lh = 1.45, shadow = "0,0,0" } = {}) {
  const k = eo(win(t, a, a + 1)) * (b ? 1 - win(t, b, b + .8) : 1); if (k <= 0) return;
  c.save(); c.globalAlpha = k; c.textAlign = "center"; c.font = `italic 400 ${size}px ${SERIF}`;
  c.shadowColor = `rgba(${shadow},.7)`; c.shadowBlur = 14;
  const ls = wrap(text, maxW); ls.forEach((l, i) => { c.fillStyle = `rgb(${color})`; c.fillText(l, 195, y + i * size * lh + (1 - k) * 8); });
  if (ref) { c.shadowBlur = 0; c.font = "600 11px Inter, system-ui, sans-serif"; c.fillStyle = `rgba(${refCol},.9)`; c.fillText(ref.toUpperCase().split("").join(" ").replace(/ {3}/g, "   "), 195, y + ls.length * size * lh + 8); }
  c.restore();
}
function label() {}

/* ================= ASH WEDNESDAY ================= */
const ASH = (() => {
  const r = rng(31), P = [];
  const V = [[195, 150], [195, 560]], Hh = [[85, 300], [305, 300]];
  for (let i = 0; i < 1700; i++) {
    const s = r() < .62 ? 0 : 1, u = r(), seg = s ? Hh : V;
    const g = (r() + r() + r() - 1.5) / 1.5; // roughly bell-shaped, -1..1
    const off = g * 19, along = (r() - .5) * 4;
    const x = lerp(seg[0][0], seg[1][0], u) + (s ? along : off), y = lerp(seg[0][1], seg[1][1], u) + (s ? off : along);
    const dark = 18 + Math.floor(r() * 40);
    P.push({ s, u, x, y, z: .7 + r() * 2.4, a: (.35 + r() * .6) * (1 - Math.abs(g) * .45), col: `${dark},${dark - 3},${dark - 6}`, fly: r() < .1, vx: (r() - .5) * 120, vy: -40 - r() * 90 });
  }
  return P;
})();
// a soft, cartoon hand (in the style of the Uiverse "tapping hand"): palm, four curled fingers, and the thumb that draws
function hand(x, y, ang, ashy) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(-1, 1); // mirrored: the thumb on the other edge
  const skin = "#eec39a", edge = "rgba(120,70,40,.18)";
  c.save(); c.filter = "blur(12px)"; c.globalAlpha = .28; c.fillStyle = "#000"; c.beginPath(); c.roundRect(-30, 120, 190, 140, [40, 10, 40, 10]); c.fill(); c.restore();
  c.fillStyle = skin; c.beginPath(); c.roundRect(-20, 600, 150, -480, 60); c.fill();                       // wrist and forearm
  c.beginPath(); c.roundRect(-34, 96, 168, 128, [14, 52, 14, 52]); c.fill();                              // palm
  [70, 80, 90, 100].forEach((b, i) => {                                                                    // four curled fingers
    c.save(); c.filter = `brightness(${b}%)`; c.fillStyle = skin; c.beginPath(); c.roundRect(4 + i * 6, 86 + i * 26, 104 - i * 4, 30, 15); c.fill(); c.restore();
  });
  c.strokeStyle = edge; c.lineWidth = 2;
  // the thumb: short and wide, with a broad nail and a knuckle crease, pointing to the tip at (0,0)
  c.fillStyle = skin; c.beginPath(); c.moveTo(-31, 100); c.lineTo(-31, 30); c.bezierCurveTo(-31, -6, 31, -6, 31, 30); c.lineTo(33, 100); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#f6d6c0"; c.strokeStyle = "rgba(150,90,60,.35)"; c.beginPath(); c.moveTo(-19, 30); c.bezierCurveTo(-19, 6, 19, 6, 19, 30); c.lineTo(18, 42); c.quadraticCurveTo(0, 47, -18, 42); c.closePath(); c.fill(); c.stroke();   // the nail
  c.fillStyle = "rgba(255,255,255,.4)"; c.beginPath(); c.ellipse(-6, 24, 4, 8, 0, 0, 7); c.fill();
  c.strokeStyle = edge; c.lineWidth = 2; c.beginPath(); c.moveTo(-22, 60); c.quadraticCurveTo(0, 67, 22, 60); c.moveTo(-18, 66); c.quadraticCurveTo(0, 72, 18, 66); c.stroke();
  if (ashy > 0) { c.fillStyle = `rgba(25,22,20,${.8 * ashy})`; c.beginPath(); c.ellipse(0, 7, 17, 10, 0, 0, 7); c.fill(); }
  c.restore();
}
function ashScene(t) {
  const dim = .38 * eo(win(t, .3, 1.3)) * (1 - win(t, 8.6, 9.6));
  c.fillStyle = `rgba(48,40,34,${dim})`; full();
  const v = eio(win(t, 2.1, 3.5)), h = eio(win(t, 3.8, 5.0)), big = 1 - eo(win(t, 8.6, 9.6));
  // the smudge under the grains
  c.save(); c.globalAlpha = big; c.lineCap = "round"; c.strokeStyle = "rgba(28,24,21,.42)"; c.lineWidth = 30;
  if (v > 0) { c.beginPath(); c.moveTo(195, 150); c.lineTo(195, lerp(150, 560, v)); c.stroke(); }
  if (h > 0) { c.beginPath(); c.moveTo(85, 300); c.lineTo(lerp(85, 305, h), 300); c.stroke(); }
  // the grains of ash; a few scatter as the thumb passes
  for (const p of ASH) {
    const prog = p.s ? h : v; if (prog < p.u) continue;
    let x = p.x, y = p.y, a = p.a;
    if (p.fly) { const t0 = p.s ? 3.8 + p.u * 1.2 : 2.1 + p.u * 1.4, k = clamp(t - t0, 0, 1.2); x += p.vx * k; y += p.vy * k + 260 * k * k; a *= 1 - k / 1.2; }
    c.fillStyle = `rgba(${p.col},${a})`; c.fillRect(x - p.z / 2, y - p.z / 2, p.z, p.z);
  }
  c.restore();
  // the hand: comes in, draws down, lifts, draws across, leaves
  let hx, hy, lift = 0;
  if (t < 2.1) { const k = eio(win(t, .9, 2.1)); hx = lerp(-80, 195, k); hy = lerp(880, 150, k); }
  else if (t < 3.5) { hx = 195; hy = lerp(150, 560, v); }
  else if (t < 3.8) { const k = eio(win(t, 3.5, 3.8)); hx = lerp(195, 85, k); hy = lerp(560, 300, k); lift = Math.sin(k * Math.PI); }
  else if (t < 5.0) { hx = lerp(85, 305, h); hy = 300; }
  else { const k = eio(win(t, 5.0, 5.9)); hx = lerp(305, -120, k); hy = lerp(300, 900, k); }
  if (t > .9 && t < 6) { c.save(); c.shadowColor = "rgba(0,0,0,.28)"; c.shadowBlur = 24 + lift * 20; c.shadowOffsetY = 10 + lift * 14; hand(hx, hy - lift * 10, .55, win(t, 2.1, 2.4)); c.restore(); }
  const band = eo(win(t, 5.7, 6.4)) * (1 - win(t, 8.4, 9.2)); if (band > 0) { const bg2 = c.createLinearGradient(0, 560, 0, H); bg2.addColorStop(0, "rgba(20,16,13,0)"); bg2.addColorStop(.3, `rgba(20,16,13,${.85 * band})`); bg2.addColorStop(1, `rgba(20,16,13,${.92 * band})`); c.fillStyle = bg2; c.fillRect(0, 560, W, H - 560); }
  quote(t, 6.0, 8.4, "“Remember that you are dust, and to dust you shall return.”", "Genesis 3:19", 640, { size: 21 });
  label(t, "Ash Wednesday");
}

/* ================= CHRISTMAS ================= */
const SNOW = (() => { const r = rng(7); return Array.from({ length: 80 }, () => ({ x: r() * W, y: r() * H, s: .6 + r() * 1.8, v: 18 + r() * 26, w: r() * 6 })); })();
const STARS = (() => { const r = rng(9); return Array.from({ length: 120 }, () => ({ x: r() * W, y: r() * 460, z: .5 + r() * 1.3, p: r() * 6 })); })();
function snow(t, a = 1) { c.fillStyle = `rgba(255,255,255,${.85 * a})`; for (const f of SNOW) { const y = (f.y + f.v * t) % (H + 10), x = f.x + Math.sin(t * .9 + f.w) * 10; c.beginPath(); c.arc(x, y, f.s, 0, 7); c.fill(); } }
function starShape(x, y, r, rot, a) {
  c.save(); c.translate(x, y); c.rotate(rot); c.globalCompositeOperation = "lighter";
  glow(0, 0, r * 4, "255,236,180", .5 * a);
  for (const [len, wid] of [[r * 5.5, r * .22], [r * 2.6, r * .14]]) for (let i = 0; i < 4; i++) {
    c.save(); c.rotate(i * Math.PI / 2 + (len < r * 5 ? Math.PI / 4 : 0));
    const g = c.createLinearGradient(0, 0, 0, -len); g.addColorStop(0, `rgba(255,248,220,${a})`); g.addColorStop(1, "rgba(255,240,200,0)");
    c.fillStyle = g; c.beginPath(); c.moveTo(-wid, 0); c.lineTo(0, -len); c.lineTo(wid, 0); c.fill(); c.restore();
  }
  c.fillStyle = `rgba(255,255,245,${a})`; c.beginPath(); c.arc(0, 0, r * .55, 0, 7); c.fill(); c.restore();
}
function featherWing(side, flap, sc = 1) {
  c.save(); c.scale(side, 1); c.rotate(-.15 + flap);
  const rows = [[92, "#ffffff"], [74, "#f4f7fb"], [54, "#e9eff7"]];
  rows.forEach(([len, col], r) => {
    c.fillStyle = col; c.strokeStyle = "rgba(150,170,200,.45)"; c.lineWidth = 1.2;
    for (let i = 5; i >= 0; i--) {                         // long feathers fanning out
      const a = -.95 + i * .26, L = len * (1 - i * .07) * sc;
      c.save(); c.rotate(a); c.beginPath(); c.ellipse(L * .5 + 6, 0, L * .5, 9 - r * 1.5, 0, 0, 7); c.fill(); c.stroke(); c.restore();
    }
  });
  c.fillStyle = "#fff"; c.beginPath(); c.ellipse(10, -6, 22, 18, -.3, 0, 7); c.fill();
  c.restore();
}
function angel(x, y, s, a, t, pose = "fly") {
  if (a <= 0) return;
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = a;
  c.save(); c.globalCompositeOperation = "lighter"; glow(0, 0, 130, "255,246,220", .5); c.restore();
  const flap = pose === "fly" ? Math.sin(t * 3) * .12 : Math.sin(t * 1.2) * .04;
  c.save(); c.translate(0, -2); featherWing(-1, flap); featherWing(1, flap); c.restore();
  // robe
  c.fillStyle = "#fffaf0"; c.strokeStyle = "rgba(190,160,110,.6)"; c.lineWidth = 1.5;
  if (pose === "sit") {
    c.beginPath(); c.moveTo(-16, 10); c.quadraticCurveTo(0, 4, 16, 10); c.lineTo(30, 52); c.quadraticCurveTo(0, 60, -30, 52); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = "#f6dcc6"; c.beginPath(); c.ellipse(-9, 60, 5, 4, 0, 0, 7); c.ellipse(9, 60, 5, 4, 0, 0, 7); c.fill();   // feet hanging
  } else {
    c.beginPath(); c.moveTo(-15, 10); c.quadraticCurveTo(0, 4, 15, 10); c.lineTo(28, 78); c.quadraticCurveTo(0, 86, -28, 78); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = "rgba(190,160,110,.35)"; c.beginPath(); c.moveTo(-6, 30); c.lineTo(-12, 76); c.moveTo(6, 30); c.lineTo(12, 76); c.stroke();
  }
  c.fillStyle = "#e3b96a"; c.fillRect(-14, 22, 28, 4);                                          // golden belt
  c.fillStyle = "#fffaf0"; c.strokeStyle = "rgba(190,160,110,.6)";
  c.beginPath(); c.ellipse(-15, 20, 7, 14, .5, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.ellipse(15, 20, 7, 14, -.5, 0, 7); c.fill(); c.stroke(); // sleeves
  c.fillStyle = "#f6dcc6"; c.beginPath(); c.ellipse(0, 30, 6, 5, 0, 0, 7); c.fill();           // hands together
  // head: hair, face, eyes, smile, cheeks
  c.fillStyle = "#e6b85c"; c.beginPath(); c.arc(0, -18, 19, 0, 7); c.fill();
  c.beginPath(); c.ellipse(-15, -10, 7, 12, .3, 0, 7); c.ellipse(15, -10, 7, 12, -.3, 0, 7); c.fill();
  c.fillStyle = "#f8dec9"; c.beginPath(); c.arc(0, -15, 15, 0, 7); c.fill();
  c.fillStyle = "#e6b85c"; c.beginPath(); c.ellipse(-4, -28, 13, 6, -.3, 0, 7); c.ellipse(7, -28, 10, 5, .4, 0, 7); c.fill();   // fringe
  c.fillStyle = "#3b2a22"; c.beginPath(); c.ellipse(-5.5, -14, 2.2, 2.8, 0, 0, 7); c.ellipse(5.5, -14, 2.2, 2.8, 0, 0, 7); c.fill();
  c.fillStyle = "#fff"; c.beginPath(); c.arc(-4.8, -15, .8, 0, 7); c.arc(6.2, -15, .8, 0, 7); c.fill();
  c.strokeStyle = "#a8614d"; c.lineWidth = 1.4; c.lineCap = "round"; c.beginPath(); c.arc(0, -9, 3.5, .2, Math.PI - .2); c.stroke();
  c.fillStyle = "rgba(240,140,140,.45)"; c.beginPath(); c.arc(-9, -9, 2.8, 0, 7); c.arc(9, -9, 2.8, 0, 7); c.fill();
  // halo
  c.strokeStyle = "rgba(255,214,110,.95)"; c.lineWidth = 3; c.beginPath(); c.ellipse(0, -42, 15, 4.5, 0, 0, 7); c.stroke();
  c.save(); c.globalCompositeOperation = "lighter"; glow(0, -42, 26, "255,220,140", .5); c.restore();
  c.restore();
}

function pine(x, y, h, col) {
  c.fillStyle = col; for (let i = 0; i < 3; i++) { const w = h * (.55 - i * .12), yy = y - i * h * .28; c.beginPath(); c.moveTo(x - w / 2, yy); c.quadraticCurveTo(x, yy - h * .5, x, yy - h * .55); c.quadraticCurveTo(x, yy - h * .5, x + w / 2, yy); c.closePath(); c.fill(); }
  c.fillStyle = "rgba(255,255,255,.8)"; c.beginPath(); c.ellipse(x, y - h * .78, h * .07, h * .04, 0, 0, 7); c.fill();
  c.fillStyle = "#8b6a4e"; c.fillRect(x - 3, y, 6, 10);
}
function sheep(x, y, s, t, ph) {
  c.save(); c.translate(x, y + Math.sin(t * 2 + ph) * 1.2); c.scale(s, s);
  c.fillStyle = "#5d5050"; c.fillRect(-10, 8, 4, 10); c.fillRect(6, 8, 4, 10);
  c.fillStyle = "#fffdf8"; c.strokeStyle = "rgba(160,140,120,.35)"; c.lineWidth = 1;
  for (const [dx, dy, r] of [[-12, 0, 9], [-4, -6, 10], [6, -5, 10], [12, 2, 8], [0, 4, 10], [-10, 6, 7], [10, 7, 7]]) { c.beginPath(); c.arc(dx, dy, r, 0, 7); c.fill(); c.stroke(); }
  c.fillStyle = "#6b5a55"; c.beginPath(); c.ellipse(-20, -2, 7, 9, -.3, 0, 7); c.fill();
  c.fillStyle = "#fff"; c.beginPath(); c.arc(-21, -10, 5, 0, 7); c.fill();
  c.fillStyle = "#111"; c.beginPath(); c.arc(-22, -2, 1.2, 0, 7); c.arc(-18, -2, 1.2, 0, 7); c.fill();
  c.restore();
}
function donkey(x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = "#a99486"; c.strokeStyle = "rgba(90,70,60,.3)"; c.lineWidth = 1.2;
  c.beginPath(); c.ellipse(8, 0, 24, 14, 0, 0, 7); c.fill(); c.stroke();                                  // body
  c.fillRect(-10, 6, 6, 18); c.fillRect(20, 6, 6, 18);
  c.beginPath(); c.ellipse(-16, -14, 11, 15, .2, 0, 7); c.fill(); c.stroke();                             // head
  c.beginPath(); c.ellipse(-22, -32, 4, 11, -.2, 0, 7); c.ellipse(-12, -33, 4, 11, .25, 0, 7); c.fill();   // ears
  c.fillStyle = "#e6dad0"; c.beginPath(); c.ellipse(-18, -5, 7, 6, 0, 0, 7); c.fill();                     // muzzle
  c.fillStyle = "#2b2220"; c.beginPath(); c.arc(-20, -17, 1.5, 0, 7); c.arc(-12, -17, 1.5, 0, 7); c.fill();
  c.restore();
}
function face(x, y, r, { hair, beard, closed } = {}) {
  c.fillStyle = "#f6d9c2"; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  if (closed) { c.strokeStyle = "#4a3428"; c.lineWidth = 1.4; c.lineCap = "round"; c.beginPath(); c.arc(x - r * .36, y - r * .05, r * .16, .2, Math.PI - .2); c.moveTo(x + r * .52, y - r * .05); c.arc(x + r * .36, y - r * .05, r * .16, .2, Math.PI - .2); c.stroke(); }
  else { c.fillStyle = "#3a2a22"; c.beginPath(); c.ellipse(x - r * .36, y - r * .08, r * .12, r * .16, 0, 0, 7); c.ellipse(x + r * .36, y - r * .08, r * .12, r * .16, 0, 0, 7); c.fill(); }
  c.strokeStyle = "#b0705c"; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y + r * .25, r * .18, .3, Math.PI - .3); c.stroke();
  c.fillStyle = "rgba(240,140,140,.4)"; c.beginPath(); c.arc(x - r * .55, y + r * .22, r * .16, 0, 7); c.arc(x + r * .55, y + r * .22, r * .16, 0, 7); c.fill();
  if (beard) { c.fillStyle = hair; c.beginPath(); c.moveTo(x - r * .8, y + r * .1); c.quadraticCurveTo(x, y + r * 1.45, x + r * .8, y + r * .1); c.quadraticCurveTo(x, y + r * .75, x - r * .8, y + r * .1); c.fill(); }
}
function christmasScene(t) {
  // a soft night: mint sky, cream snow
  const sky = c.createLinearGradient(0, 0, 0, 560); sky.addColorStop(0, "#5f8e91"); sky.addColorStop(.6, "#9cc2bd"); sky.addColorStop(1, "#d9e6df"); c.fillStyle = sky; full();
  const r = rng(4); for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * 360, a = .4 + .6 * Math.abs(Math.sin(t * 1.3 + i)); c.fillStyle = `rgba(255,236,170,${a})`; c.save(); c.translate(x, y); c.rotate(.785); c.fillRect(-1.6, -1.6, 3.2, 3.2); c.restore(); }
  // the star rises and becomes the brightest
  const sk = eio(win(t, .8, 4)); starShape(195, lerp(260, 96, sk), 8 + 5 * sk, 0, .5 + .5 * sk);
  // hills, trees, snow
  c.fillStyle = "#c9ddd5"; c.beginPath(); c.moveTo(0, 520); c.bezierCurveTo(100, 480, 260, 500, W, 470); c.lineTo(W, H); c.lineTo(0, H); c.fill();
  for (const [x, y, h, col] of [[30, 520, 150, "#7fa99b"], [78, 540, 110, "#8fb5a6"], [360, 510, 160, "#7fa99b"], [318, 535, 115, "#8fb5a6"]]) pine(x, y, h, col);
  c.fillStyle = "#f7efe6"; c.beginPath(); c.moveTo(0, 560); c.bezierCurveTo(120, 535, 270, 540, W, 556); c.lineTo(W, H); c.lineTo(0, H); c.fill();
  // the stable (drawn a third bigger, around its floor)
  c.save(); c.translate(195, 560); c.scale(1.36, 1.36); c.translate(-195, -560);
  const st = eo(win(t, 1.5, 3.2)), lamp = eo(win(t, 3.4, 5));
  c.save(); c.globalAlpha = st;
  c.save(); c.globalCompositeOperation = "lighter"; glow(195, 520, 170, "255,214,150", .45 * lamp); c.restore();
  c.fillStyle = "#e9d6bd"; c.fillRect(104, 424, 182, 150);                              // back wall, warm
  const wall = c.createRadialGradient(195, 520, 10, 195, 500, 140); wall.addColorStop(0, `rgba(255,226,170,${.9 * lamp})`); wall.addColorStop(1, "rgba(255,226,170,0)"); c.fillStyle = wall; c.fillRect(104, 424, 182, 150);
  c.strokeStyle = "rgba(160,120,80,.25)"; c.lineWidth = 1; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(104, 440 + i * 22); c.lineTo(286, 440 + i * 22); c.stroke(); }
  c.fillStyle = "#b48a62"; c.fillRect(100, 418, 12, 158); c.fillRect(278, 418, 12, 158); c.fillRect(96, 414, 198, 10);   // posts and beam
  c.beginPath(); c.moveTo(78, 428); c.lineTo(195, 346); c.lineTo(312, 428); c.lineTo(298, 432); c.lineTo(195, 362); c.lineTo(92, 432); c.fill();
  c.fillStyle = "#fffdfa"; c.beginPath(); c.moveTo(70, 432); c.quadraticCurveTo(68, 420, 80, 418); c.lineTo(195, 338); c.lineTo(310, 418); c.quadraticCurveTo(322, 420, 320, 432); c.quadraticCurveTo(290, 440, 280, 430); c.quadraticCurveTo(250, 404, 195, 360); c.quadraticCurveTo(140, 404, 110, 430); c.quadraticCurveTo(100, 440, 70, 432); c.fill();   // snow on the roof
  for (const lx of [92, 298]) { c.save(); c.globalCompositeOperation = "lighter"; glow(lx, 470, 26, "255,210,120", .9 * lamp); c.restore(); c.fillStyle = "#6b5440"; c.fillRect(lx - 5, 462, 10, 16); c.fillStyle = `rgba(255,220,140,${.4 + .6 * lamp})`; c.fillRect(lx - 3, 465, 6, 10); }
  c.fillStyle = "#e8cf8f"; c.beginPath(); c.ellipse(195, 572, 90, 10, 0, 0, 7); c.fill();   // straw
  c.restore();
  // Mary, Joseph and the Child
  const fam = eo(win(t, 4.2, 6)), lift = (1 - fam) * 10;
  if (fam > 0) {
    c.save(); c.globalAlpha = fam; c.translate(0, lift);
    // Mary, kneeling, in her blue veil
    c.fillStyle = "#f3c9c4"; c.beginPath(); c.moveTo(130, 520); c.quadraticCurveTo(145, 505, 160, 520); c.lineTo(168, 572); c.lineTo(122, 572); c.closePath(); c.fill();
    c.fillStyle = "#7ea8bd"; c.beginPath(); c.moveTo(146, 470); c.bezierCurveTo(118, 470, 116, 520, 112, 572); c.lineTo(132, 572); c.bezierCurveTo(130, 530, 134, 500, 146, 494); c.bezierCurveTo(160, 500, 162, 530, 160, 572); c.lineTo(172, 572); c.bezierCurveTo(170, 520, 172, 470, 146, 470); c.fill();
    c.fillStyle = "#6b4630"; c.beginPath(); c.ellipse(146, 490, 13, 15, 0, 0, 7); c.fill();
    face(146, 492, 11, { closed: true });
    c.fillStyle = "#f6d9c2"; c.beginPath(); c.ellipse(158, 528, 6, 5, 0, 0, 7); c.fill();
    // Joseph, standing with his staff
    c.strokeStyle = "#8a6440"; c.lineWidth = 4; c.lineCap = "round"; c.beginPath(); c.moveTo(262, 572); c.lineTo(262, 466); c.arc(254, 466, 8, 0, Math.PI, true); c.stroke();
    c.fillStyle = "#a97f57"; c.beginPath(); c.moveTo(232, 500); c.quadraticCurveTo(244, 492, 256, 500); c.lineTo(262, 572); c.lineTo(226, 572); c.closePath(); c.fill();
    c.fillStyle = "#86a891"; c.beginPath(); c.moveTo(228, 500); c.quadraticCurveTo(244, 488, 260, 500); c.lineTo(254, 540); c.lineTo(234, 540); c.closePath(); c.fill();
    c.fillStyle = "#7a5236"; c.beginPath(); c.arc(244, 478, 14, Math.PI, 0); c.fill();
    face(244, 482, 11, { hair: "#7a5236", beard: true });
    c.fillStyle = "#f6d9c2"; c.beginPath(); c.ellipse(258, 516, 5, 5, 0, 0, 7); c.fill();
    // the manger and the Child
    c.strokeStyle = "#9c7550"; c.lineWidth = 5; c.beginPath(); c.moveTo(176, 574); c.lineTo(212, 548); c.moveTo(214, 574); c.lineTo(178, 548); c.stroke();
    c.fillStyle = "#b48a62"; c.beginPath(); c.moveTo(172, 544); c.lineTo(218, 544); c.lineTo(212, 556); c.lineTo(178, 556); c.closePath(); c.fill();
    c.fillStyle = "#e8cf8f"; c.beginPath(); c.ellipse(195, 543, 24, 6, 0, 0, 7); c.fill();
    const child = eo(win(t, 5.6, 7.2));
    c.save(); c.globalCompositeOperation = "lighter"; glow(195, 536, 50, "255,236,190", .9 * child * (.85 + .15 * Math.sin(t * 2.4))); c.restore();
    c.fillStyle = "#fffaf0"; c.beginPath(); c.ellipse(198, 538, 15, 7, 0, 0, 7); c.fill();
    face(184, 535, 7, { closed: true });
    c.strokeStyle = `rgba(255,214,110,${child})`; c.lineWidth = 2; c.beginPath(); c.arc(184, 535, 11, 0, 7); c.stroke();
    c.restore();
  }
  c.restore();
  // the animals come to see
  const an = (d) => eo(win(t, 6.4 + d, 7.4 + d));
  if (an(0) > 0) { c.save(); c.globalAlpha = an(0); donkey(58, 620 + (1 - an(0)) * 8, 1.35); c.restore(); }
  if (an(.3) > 0) { c.save(); c.globalAlpha = an(.3); sheep(338, 622, 1.3, t, 1); c.restore(); }
  if (an(.6) > 0) { c.save(); c.globalAlpha = an(.6); sheep(140, 636, 1.05, t, 2); c.restore(); }
  if (an(.9) > 0) { c.save(); c.globalAlpha = an(.9); sheep(262, 640, 1, t, 3); c.restore(); }
  snow(t, .9);
  // the angel brings the news
  const ang = eo(win(t, 9.2, 10.6)), ay = lerp(130, 238, ang);
  angel(lerp(330, 300, ang), ay + Math.sin(t * 1.6) * 4, .95, ang, t, "fly");
  const band = eo(win(t, 10.2, 11)); c.fillStyle = `rgba(255,250,242,${.94 * band})`; c.fillRect(0, 662, W, H - 662);
  quote(t, 10.6, 13.6, "“Don't be afraid, for behold, I bring you good news of great joy which will be to all the people.”", null, 690, { size: 16.5, color: "70,52,40", refCol: "160,110,60", shadow: "255,255,255" });
  quote(t, 14.2, 0, "“For there is born to you today, in David's city, a Savior, who is Christ the Lord.”", "Luke 2:10–11", 690, { size: 16.5, color: "70,52,40", refCol: "160,110,60", shadow: "255,255,255" });
  label(t, "Christmas");
}

/* ================= GOOD FRIDAY ================= */
function walker(x, y, t, s) {
  // Jesus carrying the cross, side view facing right (feet at 0,0): bent forward under the weight,
  // the beam over his right shoulder dragging behind him, head bowed in front of the beam, the crown of thorns on it
  const ph = t * 1.9, bob = Math.abs(Math.cos(ph)) * 3, sway = Math.sin(ph) * .02;
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(.14 + sway); c.translate(0, bob);
  c.fillStyle = "#130a09"; c.strokeStyle = "#130a09"; c.lineCap = "round"; c.lineJoin = "round";
  // legs: heavy, short steps
  const leg = (q) => { const st = Math.sin(q), lift = Math.max(0, Math.cos(q)) * 7;
    const knee = { x: 4 + st * 10, y: -32 - lift }, foot = { x: st * 18, y: -lift * .6 };
    c.lineWidth = 10; c.beginPath(); c.moveTo(0, -62); c.lineTo(knee.x, knee.y); c.lineTo(foot.x, foot.y); c.stroke();
    c.lineWidth = 7; c.beginPath(); c.moveTo(foot.x - 2, foot.y); c.lineTo(foot.x + 10, foot.y + 1); c.stroke(); };
  leg(ph); leg(ph + Math.PI);
  // the cross: the long beam over the shoulder, going back and down to the ground; the crossbar behind his back
  const sh = { x: 14, y: -124 }, ang = Math.atan2(sh.y - 66, sh.x + 150);   // from the ground behind him up to the shoulder
  c.save(); c.translate(sh.x, sh.y); c.rotate(ang);
  c.fillRect(-262, -8, 278, 16);          // the beam (ends a little past the shoulder)
  c.fillRect(-60, -50, 16, 100);          // the crossbar
  c.restore();
  // the robe, bent forward
  c.beginPath(); c.moveTo(-6, -112); c.quadraticCurveTo(14, -126, 30, -122); c.quadraticCurveTo(38, -116, 34, -104); c.quadraticCurveTo(32, -78, 22, -24);
  c.lineTo(-24, -20); c.quadraticCurveTo(-22, -70, -12, -100); c.quadraticCurveTo(-10, -108, -6, -112); c.closePath(); c.fill();
  // neck and head, bowed forward, in front of the beam
  c.lineWidth = 10; c.beginPath(); c.moveTo(28, -118); c.lineTo(40, -116); c.stroke();
  c.beginPath(); c.arc(45, -117, 12, 0, 7); c.fill();
  c.beginPath(); c.moveTo(40, -124); c.quadraticCurveTo(30, -122, 30, -104); c.lineTo(38, -104); c.closePath(); c.fill();   // hair falling forward
  // the crown of thorns on his head
  c.save(); c.translate(46, -126); c.rotate(.35); c.lineWidth = 2.4; c.beginPath(); c.ellipse(0, 0, 13, 4.2, 0, 0, 7); c.stroke();
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, px = Math.cos(a) * 13, py = Math.sin(a) * 4.2, d = i % 2 ? 1 : -1; c.lineWidth = 1.7; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a + d) * 6, py + Math.sin(a + d) * 4 - 3); c.stroke(); }
  c.restore();
  // arms reaching up to hold the beam in front of the shoulder
  c.lineWidth = 8; c.beginPath(); c.moveTo(26, -112); c.quadraticCurveTo(40, -100, 30, -132); c.stroke();
  c.restore();
}
function thorns(x, y, R, t) {
  c.save(); c.translate(x, y); c.strokeStyle = "#0b0505"; c.lineCap = "round";
  for (let k = 0; k < 3; k++) {
    c.lineWidth = 3; c.beginPath();
    for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2, r = R + Math.sin(a * 5 + k * 2) * 5; const px = Math.cos(a) * r, py = Math.sin(a) * r * .9; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
  }
  c.lineWidth = 2; const r = rng(55); for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, rr = R + (r() - .5) * 8, l = 6 + r() * 7, d = (r() < .5 ? -1 : 1); const px = Math.cos(a) * rr, py = Math.sin(a) * rr * .9; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a + d * 1.2) * l, py + Math.sin(a + d * 1.2) * l); c.stroke(); }
  c.restore();
}
function cloth(t) {
  // a white cloth over the crossbar, hanging on both sides
  const sway = Math.sin(t * 1.1) * 2;
  const g = c.createLinearGradient(0, 230, 0, 420); g.addColorStop(0, "#f4ece0"); g.addColorStop(1, "#d8ccb8");
  c.fillStyle = g; c.strokeStyle = "rgba(120,100,80,.5)"; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(92, 236); c.bezierCurveTo(140, 300, 250, 300, 298, 236); c.lineTo(296, 252); c.bezierCurveTo(250, 318, 140, 318, 94, 252); c.closePath(); c.fill(); c.stroke();  // the swag in front
  for (const [x0, dir] of [[96, -1], [294, 1]]) {   // the hanging ends
    c.beginPath(); c.moveTo(x0 - 14 * dir, 236); c.bezierCurveTo(x0 + dir * 16, 280, x0 + dir * 8 + sway, 330, x0 + dir * 14 + sway, 392);
    c.lineTo(x0 + dir * 2 + sway, 380); c.lineTo(x0 - dir * 8 + sway, 398); c.bezierCurveTo(x0 - dir * 10, 330, x0 - dir * 16, 280, x0 - 14 * dir, 252); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = "rgba(120,100,80,.25)"; c.beginPath(); c.moveTo(x0, 260); c.quadraticCurveTo(x0 + dir * 6, 320, x0 + dir * 4 + sway, 384); c.stroke(); c.strokeStyle = "rgba(120,100,80,.5)";
  }
}
const G = 1500;
const ROCKS = [[150, 612, 34, 18], [196, 618, 46, 22], [244, 610, 32, 17], [96, 646, 34, 17], [298, 644, 34, 17], [62, 668, 22, 11], [334, 664, 22, 11]];
const DROPS2 = [{ t: 7.9, x: 188, y: 268, s: .5 }, { t: 8.45, x: 201, y: 270, s: .34 }, { t: 9.7, x: 183, y: 266, s: .42 }, { t: 10.05, x: 206, y: 268, s: .58 }, { t: 11.2, x: 195, y: 272, s: .3 }];
const SPL2 = DROPS2.map((d, i) => { const r = rng(70 + i); return { d, bits: Array.from({ length: 12 }, () => ({ a: -Math.PI * (.08 + r() * .84), v: 60 + r() * 120, z: 1.5 + r() * 2.5 })), blob: Array.from({ length: 14 }, () => .7 + r() * .6), spikes: Array.from({ length: 7 }, () => ({ a: -Math.PI * r(), l: 6 + r() * 12 })) }; });
const rockTop = (x) => { let y = 640; for (const [rx, ry, rw, rh] of ROCKS) if (Math.abs(x - rx) < rw) y = Math.min(y, ry - rh * Math.sqrt(1 - Math.pow((x - rx) / rw, 2))); return y; };
function goodFridayScene(t) {
  // 1. Jesus carries the cross up the hill, at sunset
  const walkA = 1 - eo(win(t, 5.6, 6.6));
  if (walkA > 0) {
    c.save(); c.globalAlpha = 1;
    const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#5a2a2e"); sky.addColorStop(.45, "#e08a4c"); sky.addColorStop(.7, "#f6c27a"); sky.addColorStop(1, "#b0602e"); c.fillStyle = sky; full();
    c.save(); c.globalCompositeOperation = "lighter"; glow(250, 380, 220, "255,220,150", .5); c.restore();
    c.fillStyle = "rgba(60,30,30,.55)"; c.beginPath(); c.ellipse(120, 150, 180, 26, 0, 0, 7); c.ellipse(300, 210, 160, 18, 0, 0, 7); c.fill();
    c.strokeStyle = "rgba(255,226,170,.9)"; c.lineWidth = 2; c.beginPath(); c.ellipse(120, 174, 150, 4, 0, Math.PI * .1, Math.PI * .9); c.stroke();
    c.fillStyle = "#1a0e0c"; c.beginPath(); c.moveTo(0, 640); c.lineTo(W, 470); c.lineTo(W, H); c.lineTo(0, H); c.fill();   // the slope
    const k = win(t, .3, 6.2), wx = lerp(40, 300, k), wy = 640 - (wx / W) * 170;
    walker(wx, wy, t, 1.15);
    c.restore();
    c.fillStyle = `rgba(0,0,0,${1 - walkA})`; full();
  }
  // 2. the cross on the hill, the crown of thorns, the cloth, and the drops
  const crossA = eo(win(t, 6.2, 7.2));
  if (crossA > 0) {
    c.save(); c.globalAlpha = crossA;
    const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#8e2b2d"); sky.addColorStop(1, "#c4453c"); c.fillStyle = sky; full();
    c.fillStyle = "#f4b363"; c.beginPath(); c.arc(195, 330, 150, 0, 7); c.fill();               // the sun
    c.fillStyle = "#b63f39"; for (const [y, h, x0, x1] of [[300, 7, 60, 200], [340, 5, 220, 360], [380, 8, 40, 170], [420, 5, 250, 350]]) c.fillRect(x0, y, x1 - x0, h);
    c.fillStyle = "#0e0807"; c.fillRect(181, 140, 28, 480); c.fillRect(92, 228, 206, 24);       // the cross
    // blood on the cross: running down from the crown, and along parts of its edges
    c.fillStyle = "#a3101e";
    for (const [x0, y0, w, h] of [[181, 262, 5, 120], [184, 262, 3, 64], [205, 258, 4, 86], [209, 276, 2, 40], [168, 250, 10, 4], [214, 250, 12, 4], [181, 470, 4, 90], [205, 500, 4, 60]]) {
      c.beginPath(); c.roundRect(x0, y0, w, h, w / 2); c.fill(); c.beginPath(); c.arc(x0 + w / 2, y0 + h, w * .8, 0, 7); c.fill();
    }
    for (const [x0, h] of [[150, 9], [172, 14], [220, 11], [238, 7], [104, 6], [290, 5]]) { c.beginPath(); c.roundRect(x0, 251, 3, h, 1.5); c.fill(); c.beginPath(); c.arc(x0 + 1.5, 251 + h, 2.4, 0, 7); c.fill(); }
    c.fillStyle = "rgba(170,16,30,.8)"; c.fillRect(92, 228, 4, 24); c.fillRect(294, 228, 4, 24); c.fillRect(181, 140, 3, 30);
    thorns(195, 240, 34, t);
    for (const d of DROPS2) {   // falling drops, drawn before the cloth so they come out from behind it
      const fall = t - d.t, ground = rockTop(d.x), tl = Math.sqrt(2 * (ground - d.y) / G);
      if (fall < 0 || fall >= tl) continue;
      const y = d.y + .5 * G * fall * fall, sp = fall / tl, q = d.s;
      c.fillStyle = "#8a0715"; c.beginPath(); c.moveTo(d.x, y - (14 + 14 * sp) * q); c.quadraticCurveTo(d.x + 8 * q, y - 2 * q, d.x + 8 * q, y + 4 * q); c.arc(d.x, y + 4 * q, 8 * q, 0, Math.PI); c.quadraticCurveTo(d.x - 8 * q, y - 2 * q, d.x, y - (14 + 14 * sp) * q); c.fill();
      c.fillStyle = "rgba(255,170,170,.5)"; c.beginPath(); c.ellipse(d.x - 2.5 * q, y, 1.6 * q, 3.2 * q, 0, 0, 7); c.fill();
    }
    cloth(t);
    c.fillStyle = "#0e0807"; c.beginPath(); c.moveTo(0, 680); c.bezierCurveTo(100, 620, 160, 600, 195, 600); c.bezierCurveTo(240, 600, 300, 620, W, 670); c.lineTo(W, H); c.lineTo(0, H); c.fill();   // the hill
    for (const [gx, gy] of [[60, 662], [120, 630], [300, 628], [350, 655]]) { c.strokeStyle = "#0e0807"; c.lineWidth = 2; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(gx + i * 3, gy); c.lineTo(gx + i * 5, gy - 10 - Math.abs(3 - Math.abs(i)) * 3); c.stroke(); } }
    for (const [rx, ry, rw, rh] of ROCKS) {   // the rocks at the foot of the cross
      const g = c.createLinearGradient(0, ry - rh, 0, ry + rh); g.addColorStop(0, "#5b5051"); g.addColorStop(1, "#231c1c"); c.fillStyle = g;
      c.beginPath(); c.ellipse(rx, ry, rw, rh, 0, Math.PI, 0); c.lineTo(rx + rw, ry + 6); c.lineTo(rx - rw, ry + 6); c.fill();
      c.fillStyle = "rgba(255,220,200,.12)"; c.beginPath(); c.ellipse(rx - rw * .2, ry - rh * .7, rw * .5, rh * .2, 0, 0, 7); c.fill();
    }
    for (const s2 of SPL2) {
      const d = s2.d, fall = t - d.t, ground = rockTop(d.x);
      if (t < d.t - .8) continue;
      const tl = Math.sqrt(2 * (ground - d.y) / G); if (fall < tl) continue;   // still falling (drawn behind the cloth above)
      const k = fall - tl, grow = eo(clamp(k / .16));
      c.save(); c.translate(d.x, ground + 2); c.scale(1.7 * d.s * 1.2, .5 * d.s * 1.2); c.fillStyle = "#7a0612"; c.beginPath();
      s2.blob.forEach((m, i) => { const a = i / s2.blob.length * Math.PI * 2, r = 12 * m * grow; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); }); c.closePath(); c.fill();
      for (const sp of s2.spikes) { c.beginPath(); c.moveTo(Math.cos(sp.a - .14) * 9 * grow, Math.sin(sp.a - .14) * 9 * grow); c.lineTo(Math.cos(sp.a) * (12 + sp.l) * grow, Math.sin(sp.a) * (12 + sp.l) * grow); c.lineTo(Math.cos(sp.a + .14) * 9 * grow, Math.sin(sp.a + .14) * 9 * grow); c.fill(); }
      c.restore();
      for (const b of s2.bits) { const kk = Math.min(k, .5), bx = d.x + Math.cos(b.a) * b.v * kk * 1.4 * d.s * 1.2, byRaw = ground + Math.sin(b.a) * b.v * kk * d.s * 1.4 + .5 * G * kk * kk, landed = byRaw >= ground && k > .08; c.fillStyle = "#6e0510"; c.beginPath(); landed ? c.ellipse(bx, rockTop(bx) + 2, b.z * d.s * 2.2, b.z * d.s * .8, 0, 0, 7) : c.arc(bx, byRaw, b.z * d.s * 1.3, 0, 7); c.fill(); }
    }
    c.restore();
  }
  const band = eo(win(t, 12.4, 13)); c.fillStyle = `rgba(10,5,5,${.6 * band})`; c.fillRect(0, 676, W, H - 676);
  quote(t, 12.6, 0, "“It is finished!”", "John 19:30", 712, { size: 28, color: "250,238,228", shadow: "0,0,0" });
  label(t, "Good Friday");
}

/* ================= EASTER ================= */
function easterScene(t) {
  const dawn = eo(win(t, 0, 6));
  const sky = c.createLinearGradient(0, 0, 0, 600);
  const mix = (a, b) => a.map((v, i) => Math.round(lerp(v, b[i], dawn)));
  const top = mix([12, 20, 48], [126, 168, 214]), mid = mix([30, 40, 82], [246, 206, 150]), low = mix([48, 52, 92], [250, 178, 112]);
  sky.addColorStop(0, `rgb(${top})`); sky.addColorStop(.55, `rgb(${mid})`); sky.addColorStop(1, `rgb(${low})`); c.fillStyle = sky; full();
  // the sun rising behind the garden
  const sun = lerp(640, 470, eo(win(t, 1, 7)));
  c.save(); c.globalCompositeOperation = "lighter"; glow(320, sun, 160, "255,214,140", .7 * dawn); c.restore();
  c.fillStyle = `rgba(255,236,190,${dawn})`; c.beginPath(); c.arc(320, sun, 34, 0, 7); c.fill();
  // the rock with the tomb
  c.fillStyle = `rgb(${mix([46, 40, 46], [150, 126, 104])})`;
  c.beginPath(); c.moveTo(-10, 620); c.bezierCurveTo(10, 420, 120, 360, 210, 370); c.bezierCurveTo(300, 380, 360, 440, 400, 620); c.fill();
  c.fillStyle = `rgba(0,0,0,.12)`; c.beginPath(); c.moveTo(-10, 620); c.bezierCurveTo(10, 470, 80, 430, 130, 420); c.lineTo(110, 620); c.fill();
  // the opening; light pours out once the stone is gone
  const roll = eio(win(t, 2.6, 4.6)), light = eo(win(t, 4.2, 6.5));
  c.fillStyle = "#120d0b"; c.beginPath(); c.moveTo(140, 600); c.lineTo(140, 500); c.arc(195, 500, 55, Math.PI, 0); c.lineTo(250, 600); c.fill();
  if (light > 0) {
    const g = c.createRadialGradient(195, 540, 5, 195, 540, 90); g.addColorStop(0, `rgba(255,255,245,${light})`); g.addColorStop(1, `rgba(255,236,190,${.85 * light})`);
    c.fillStyle = g; c.beginPath(); c.moveTo(140, 600); c.lineTo(140, 500); c.arc(195, 500, 55, Math.PI, 0); c.lineTo(250, 600); c.fill();
    c.save(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 14; i++) { const a = -Math.PI * (.05 + i / 13 * .9), len = 260 + 140 * Math.sin(i * 2.3 + t); const gg = c.createLinearGradient(195, 520, 195 + Math.cos(a) * len, 520 + Math.sin(a) * len); gg.addColorStop(0, `rgba(255,246,210,${.4 * light})`); gg.addColorStop(1, "rgba(255,240,200,0)"); c.fillStyle = gg; c.beginPath(); c.moveTo(195, 520); c.lineTo(195 + Math.cos(a - .05) * len, 520 + Math.sin(a - .05) * len); c.lineTo(195 + Math.cos(a + .05) * len, 520 + Math.sin(a + .05) * len); c.fill(); }
    glow(195, 520, 220, "255,240,200", .55 * light); c.restore();
  }
  // the stone rolls away
  const sx = lerp(195, 318, roll), rot = roll * 2.2;
  c.save(); c.translate(sx, 538); c.rotate(rot);
  c.fillStyle = `rgb(${mix([70, 64, 66], [128, 116, 104])})`; c.beginPath(); c.arc(0, 0, 62, 0, 7); c.fill();
  c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 50, .4, 2.2); c.stroke(); c.beginPath(); c.arc(0, 0, 30, 3.2, 4.6); c.stroke(); c.beginPath(); c.moveTo(-20, -40); c.lineTo(10, -20); c.stroke();
  c.restore();
  // garden in front
  c.fillStyle = `rgb(${mix([16, 26, 22], [62, 96, 62])})`; c.beginPath(); c.moveTo(0, 600); c.bezierCurveTo(120, 590, 270, 594, W, 600); c.lineTo(W, H); c.lineTo(0, H); c.fill();
  const r = rng(3); c.strokeStyle = `rgb(${mix([20, 34, 26], [80, 124, 76])})`; c.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = r() * W, h = 10 + r() * 22; c.beginPath(); c.moveTo(x, 610 + r() * 20); c.quadraticCurveTo(x + 4, 600 - h / 2, x + (r() - .5) * 10, 600 - h + r() * 10); c.stroke(); }
  // the angel at the tomb
  // the angel sits on the stone he rolled away (Matthew 28:2)
  const an = eo(win(t, 6.0, 7.4));
  if (an > 0) { c.save(); c.globalAlpha = an; glow(318, 430, 80, "90,60,30", .35); c.restore(); }
  angel(318, 440, .8, an, t, "sit");
  const band = eo(win(t, 7.6, 8.4)); c.fillStyle = `rgba(30,22,16,${.4 * band})`; c.fillRect(0, 40, W, 210);
  quote(t, 8.0, 11.4, "“Don't be afraid, for I know that you seek Jesus, who has been crucified. He is not here, for he has risen, just like he said.”", "Matthew 28:5–6", 82, { size: 19 });
  // He is risen!
  const hr = eo(win(t, 12, 13));
  if (hr > 0) {
    c.save(); c.globalAlpha = hr; c.textAlign = "center"; c.font = `italic 600 46px ${SERIF}`; c.shadowColor = "rgba(255,200,90,.9)"; c.shadowBlur = 26; c.fillStyle = "#fff3d0";
    c.fillText("He is risen!", 195, 150 + (1 - hr) * 10); c.shadowBlur = 0; c.font = "600 12px Inter, system-ui"; c.fillStyle = "rgba(255,240,210,.9)"; c.fillText("A L L E L U I A", 195, 182);
    const rr = rng(77); c.fillStyle = "#ffe9b8"; for (let i = 0; i < 14; i++) { const x = 60 + rr() * 270, y = 90 + rr() * 110, a = Math.sin(clamp((t - 12 - rr() * 2) / 1.4) * Math.PI); if (a > 0) { c.globalAlpha = a * hr; c.beginPath(); c.arc(x, y, 1.6 + rr() * 1.6, 0, 7); c.fill(); } }
    c.restore();
  }
  label(t, "Easter Sunday");
}

/* ================= PENTECOST ================= */
// the flame shader (adapted from the CodePen you sent; transparent background, so it can be laid over the scene)
// simple drawn flame, used when the device has no WebGL
function flame(x, y, s, t, a) {
  c.save(); c.translate(x, y); c.scale(s, s * (1 + .08 * Math.sin(t * 9 + x)));
  c.globalCompositeOperation = "lighter"; glow(0, 4, 26, "255,150,60", .5 * a);
  const g = c.createLinearGradient(0, -24, 0, 10); g.addColorStop(0, `rgba(255,236,160,${a})`); g.addColorStop(.6, `rgba(255,150,50,${a})`); g.addColorStop(1, `rgba(220,70,30,${a * .9})`);
  c.fillStyle = g; const sway = Math.sin(t * 5 + x) * 3;
  c.beginPath(); c.moveTo(sway, -26); c.bezierCurveTo(10, -10, 11, 2, 0, 10); c.bezierCurveTo(-11, 2, -10, -10, sway, -26); c.fill(); c.restore();
}
let _fl = null;
const FL = (time) => { try { return (_fl ||= makeFL())(time); } catch { _fl = () => null; return null; } };
function makeFL() {
  const cv2 = document.createElement("canvas"); cv2.width = 120; cv2.height = 180;
  const gl = cv2.getContext("webgl", { premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) return () => null;   // no WebGL: simple drawn flames instead
  const vs = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }";
  const fs = `precision highp float; uniform vec2 u_resolution; uniform float u_time;
  float tri(float x){ return abs(fract(x)-.5); }
  vec3 tri3(vec3 p){ return vec3(tri(p.z+tri(p.y)), tri(p.z+tri(p.x)), tri(p.y+tri(p.x))); }
  float triNoise3D(vec3 p, float spd, float time){ float z=1.4; float rz=0.; vec3 bp=p;
    for(float i=0.; i<=3.; i++){ vec3 dg=tri3(bp*2.); p+=(dg+time*.1*spd); bp*=1.8; z*=1.5; p*=1.2; float t=tri(p.z+tri(p.x+tri(p.y))); rz+=t/z; bp+=0.14; } return rz; }
  void main(){
    vec2 uv = (gl_FragCoord.xy - 0.5*u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    vec2 pos = uv / .5; float bottom = 0.5*(pos.y+1.0)*sin(u_time); vec2 wave = vec2(0.);
    wave.x += bottom*sin(4.0*pos.y-8.0*u_time)*.5; pos += .25*wave; pos.x += pos.x/(1.0-(pos.y));
    float flameMask = clamp(1.0-length(pos), 0.0, 1.0); flameMask = 1.0-pow(1.0-flameMask, 4.);
    vec3 bodyColour = mix(vec3(0.5,0.2,0.2), vec3(0.55,0.25,0.0), uv.y+flameMask);
    vec3 highlightColour = mix(vec3(1.0,.5,0.0), vec3(1.0,2.0,0.0), uv.y*(1.-flameMask*flameMask));
    vec3 uv3d = .04*vec3(uv.x, uv.y, 0.0) + vec3(0.0, -u_time*0.04, u_time*0.02);
    float noise = triNoise3D(uv3d*5. + flameMask*.05, 0., u_time); noise = noise*1.5 - .2;
    float value = flameMask*noise + .5*flameMask;
    float flame_edge = flameMask*0.3*(pos.y+1.0);
    float edge = clamp(value-flame_edge*2., 0.0, 1.0);
    float hardMask = smoothstep(flame_edge, flame_edge+0.1, value);
    float highlight = pow(1.0-edge*edge, 2.0);
    vec3 colour = highlightColour*(hardMask*highlight) + bodyColour*flameMask*flameMask;
    gl_FragColor = vec4(colour, 1.0); }`;
  const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uT = gl.getUniformLocation(pr, "u_time"); gl.uniform2f(gl.getUniformLocation(pr, "u_resolution"), 120, 180);
  return (time) => { gl.uniform1f(uT, time); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); return cv2; };
}
const RAYS = (() => { const r = rng(88); return Array.from({ length: 46 }, () => ({ x: r() * (W + 100) - 50, len: H / 2 + r() * H / 2, w: .5 + r() * 4, hue: 45 + r() * 15, sat: 20 + r() * 40, ttl: 2 + r() * 4, ph: r() * 6, v: (r() - .5) * 18 })); })();
const MOTES = (() => { const r = rng(89); return Array.from({ length: 44 }, () => ({ x: r() * W, y: H / 2 + r() * H / 2, vx: (r() - .5) * 30, vy: (r() - .5) * 30, ttl: 2 + r() * 4, ph: r() * 6, z: 1 + r() * 9 })); })();
function dove(x, y, s, t) {
  const flap = Math.sin(t * 3.2) * .22;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.save(); c.globalCompositeOperation = "lighter"; glow(0, 0, 150, "255,240,190", .55); glow(0, 0, 60, "255,255,240", .6); c.restore();
  // tail fan below
  c.fillStyle = "#eef2f8"; c.strokeStyle = "rgba(150,170,200,.5)"; c.lineWidth = 1.2;
  for (let i = -2; i <= 2; i++) { c.save(); c.translate(0, 26); c.rotate(i * .2); c.beginPath(); c.ellipse(0, 22, 7, 24, 0, 0, 7); c.fill(); c.stroke(); c.restore(); }
  // wings spread out to both sides
  c.save(); c.translate(10, -4); featherWing(1, -.25 + flap, .95); c.restore();
  c.save(); c.translate(-10, -4); featherWing(-1, -.25 + flap, .95); c.restore();
  // body and breast
  const g = c.createRadialGradient(-4, -6, 2, 0, 4, 34); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#dfe6f0"); c.fillStyle = g;
  c.beginPath(); c.ellipse(0, 8, 21, 30, 0, 0, 7); c.fill();
  // head, eyes, little beak
  c.beginPath(); c.arc(0, -26, 14, 0, 7); c.fill();
  c.fillStyle = "#2a2a35"; c.beginPath(); c.arc(-5.5, -28, 2.3, 0, 7); c.arc(5.5, -28, 2.3, 0, 7); c.fill();
  c.fillStyle = "#fff"; c.beginPath(); c.arc(-4.8, -28.8, .8, 0, 7); c.arc(6.2, -28.8, .8, 0, 7); c.fill();
  c.fillStyle = "#f2b38a"; c.beginPath(); c.moveTo(-3, -22); c.lineTo(3, -22); c.lineTo(0, -16); c.closePath(); c.fill();
  c.fillStyle = "rgba(255,170,170,.35)"; c.beginPath(); c.arc(-9, -21, 3, 0, 7); c.arc(9, -21, 3, 0, 7); c.fill();
  c.restore();
}
function pentecostScene(t) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#2b2a1a"); g.addColorStop(1, "#11110a"); c.fillStyle = g; full();
  // a rushing wind
  const wind = win(t, .2, .8) * (1 - win(t, 2.4, 3.2));
  if (wind > 0) { const r = rng(12); c.lineCap = "round"; for (let i = 0; i < 16; i++) { const y = 80 + r() * 600, sp = 500 + r() * 400, len = 80 + r() * 120, x = -200 + ((t * sp + r() * 900) % (W + 400)); c.strokeStyle = `rgba(240,236,210,${.25 * wind})`; c.lineWidth = 1 + r() * 2; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + len / 2, y - 10 * Math.sin(t * 3 + i), x + len, y); c.stroke(); } }
  // light coming down from above: drifting rays and glowing motes (the "Rays & Particles" idea)
  const light = eo(win(t, 2.2, 5));
  if (light > 0) {
    c.save(); c.globalCompositeOperation = "lighter"; c.shadowBlur = 30; c.shadowColor = "white";
    const ang = 85 * Math.PI / 180;
    for (const ry of RAYS) {
      const life = ((t + ry.ph) % ry.ttl) / ry.ttl, a = Math.sin(life * Math.PI) * .4 * light, x = ry.x + ry.v * t;
      const gx = c.createLinearGradient(x, 0, x + ry.len * Math.cos(ang), ry.len * Math.sin(ang)); gx.addColorStop(0, `hsla(${ry.hue},${ry.sat}%,60%,${a})`); gx.addColorStop(1, "hsla(50,20%,20%,0)");
      c.strokeStyle = gx; c.lineWidth = ry.w; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + ry.len * Math.cos(ang), ry.len * Math.sin(ang)); c.stroke();
    }
    for (const m of MOTES) { const life = ((t + m.ph) % m.ttl) / m.ttl, a = Math.sin(life * Math.PI) * .6 * light; c.fillStyle = `hsla(50,50%,25%,${a})`; c.beginPath(); c.arc(m.x + m.vx * t % W, m.y + m.vy * life, m.z, 0, 7); c.fill(); }
    c.shadowBlur = 0; glow(195, 0, 380, "255,236,170", .45 * light); c.restore();
  }
  // the dove comes down in the light and stays, gently hovering
  const dv = eo(win(t, 2.6, 5.4));
  if (dv > 0) { c.save(); c.globalAlpha = dv; dove(195, lerp(-80, 250, dv) + Math.sin(t * 1.6) * 6, .95, t); c.restore(); }
  // tongues of fire come down and rest
  const fl = win(t, 5.2, 8.5);
  if (fl > 0) {
    const r = rng(21); c.save(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 7; i++) {
      const tx = 50 + i * 48 + (r() - .5) * 20, ty = 430 + r() * 140, d = r() * .9, k = eo(clamp((t - 5.2 - d) / 1.8)), sc = .55 + r() * .3;
      if (k <= 0) continue;
      const img = FL(t * 1.6 + i * 1.7);
      if (img) { c.globalAlpha = k; c.drawImage(img, tx - 55 * sc, lerp(-260, ty, k) - 190 * sc, 110 * sc, 250 * sc); }
      else flame(tx, lerp(-260, ty, k) - 20, sc * 2.4, t, k);
    }
    c.restore();
  }
  quote(t, 9.0, 0, "“They were all filled with the Holy Spirit.”", "Acts 2:4", 642, { size: 19 });
  const ch = eo(win(t, 10.6, 11.6)); if (ch > 0) { c.save(); c.globalAlpha = ch; c.textAlign = "center"; c.font = `italic 600 32px ${SERIF}`; c.shadowColor = "rgba(255,210,120,.9)"; c.shadowBlur = 22; c.fillStyle = "#fff2d4"; c.fillText("Come, Holy Spirit", 195, 128); c.restore(); }
  label(t, "Pentecost");
}

/* ================= CHRISTMAS TREE (on the You page) ================= */
// our own tree: one continuous zig-zag outline, then the base and the pot
const TREE = [[118, 330], [168, 284], [142, 284], [182, 238], [160, 238], [195, 196], [230, 238], [208, 238], [248, 284], [222, 284], [272, 330]];
const BASE = [[110, 344], [280, 344]];
function along(pts, u) { // a point a fraction u along a polyline
  const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
  let d = u * L; for (let i = 1; i < pts.length; i++) { if (d <= seg[i - 1]) { const k = d / seg[i - 1]; return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; } d -= seg[i - 1]; } return pts[pts.length - 1];
}
function partial(pts, u) { const out = [pts[0]]; for (let i = 1; i <= 120; i++) { const k = i / 120 * u; out.push(along(pts, k)); } return out; }
const TCOL = ["#d9a441", "#5aa7c9", "#c9775f", "#B74551", "#5DBA72", "#910B28", "#446D39", "#e8b94a"];
const SPARKS = (() => { const r = rng(17); return Array.from({ length: 260 }, (_, i) => ({ u: i / 260, vx: (r() - .5) * 90, vy: -40 - r() * 60, g: 60 + r() * 120, life: 1 + r() * 2, col: TCOL[i % TCOL.length], z: .6 + r() * 1.2, rot: r() * 6 })); })();
function star5(x, y, r, rot) { c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .45 : r, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.restore(); }
function treeScene(t) {
  // the card at the top of You
  // no card: the page itself softens, and the tree is drawn right over it
  const wash = eo(win(t, 0, .7)); c.fillStyle = `rgba(248,243,233,${.93 * wash})`; full();
  const cy = 0; c.save();
  c.save(); c.translate(195, 330); c.scale(1.75, 1.75); c.translate(-195, -262);
  const draw = eio(win(t, .8, 5.6)), base = eio(win(t, 5.8, 7));
  c.strokeStyle = "#cb9866"; c.lineWidth = 4; c.lineJoin = "round"; c.lineCap = "round";
  if (draw > 0) { const pp = partial(TREE, draw); c.beginPath(); pp.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
  if (base > 0) { c.beginPath(); c.moveTo(BASE[0][0], BASE[0][1]); c.lineTo(lerp(BASE[0][0], BASE[1][0], base), BASE[0][1]); c.stroke();
    if (base > .5) { const pk = eo((base - .5) * 2); c.beginPath(); c.moveTo(180, 344); c.lineTo(182, 344 + 22 * pk); c.lineTo(208, 344 + 22 * pk); c.lineTo(210, 344); c.stroke(); } }
  // the spark that draws it, and the little stars it throws off
  const spU = t < 5.6 ? draw : null, sp = spU !== null ? along(TREE, spU) : t < 7 ? [lerp(BASE[0][0], BASE[1][0], base), 344] : null;
  c.save();
  for (const s2 of SPARKS) {
    const born = .8 + s2.u * 6.2, k = t - born; if (k < 0 || k > s2.life) continue;
    const [bx, by] = born < 5.6 + .8 ? along(TREE, clamp((born - .8) / 4.8)) : [lerp(BASE[0][0], BASE[1][0], clamp((born - 5.8) / 1.2)), 344];
    const x = bx + s2.vx * k, y = by + s2.vy * k + .5 * s2.g * k * k, a = (1 - k / s2.life) * (.5 + .5 * Math.abs(Math.sin(k * 40 + s2.rot)));
    c.globalAlpha = a; c.fillStyle = s2.col; star5(x, y, 3.4 * s2.z, s2.rot + k * 3);
  }
  c.globalAlpha = 1;
  if (sp) { glow(sp[0], sp[1], 34, "255,190,90", .7); glow(sp[0], sp[1], 9, "255,250,230", 1); }
  c.restore();
  // the star pops onto the top
  const pop = win(t, 6.6, 7.8);
  if (pop > 0) { const el = 1 + Math.sin(pop * Math.PI * 3) * Math.exp(-pop * 4) * .6; c.save(); c.translate(195, 180); c.scale(el * eo(pop * 3), el * eo(pop * 3)); glow(0, 0, 40, "255,200,90", .55); c.fillStyle = "#e0a640"; star5(0, 0, 18, 0); c.strokeStyle = "#8a5a22"; c.lineWidth = 1.5; c.stroke(); c.restore(); }
  // little lights twinkle on the branches
  const lights = win(t, 7.6, 9);
  if (lights > 0) { const rr = rng(66); c.save(); for (let i = 0; i < 18; i++) { const [x, y] = along(TREE, .04 + rr() * .92), on = clamp((lights - i / 24) * 6) * (.6 + .4 * Math.sin(t * 4 + i)); glow(x, y + 6, 10, ["240,170,40", "220,70,80", "70,150,220"][i % 3], .9 * on); c.fillStyle = ["#e8a830", "#c8404c", "#3f8fd0"][i % 3]; c.globalAlpha = on; c.beginPath(); c.arc(x, y + 6, 3, 0, 7); c.fill(); c.globalAlpha = 1; } c.restore(); }
  c.restore();
  const msg = eo(win(t, 8.4, 9.4));
  if (msg > 0) { c.save(); c.globalAlpha = msg; c.textAlign = "center"; c.fillStyle = "#3a2418"; c.font = `italic 600 31px ${SERIF}`; c.fillText(NAME ? `Merry Christmas, ${NAME}` : "Merry Christmas", 195, 600); c.font = `italic 400 15px ${SERIF}`; c.fillStyle = "#9a5a3c"; c.fillText("“There is born to you today… a Savior.” Luke 2:11", 195, 632); c.restore(); }
  c.restore();
  label(t, "Christmas · on the You page");
}

/* ================= PRAYER CANDLE ================= */
function candleFlame(x, y, t, k) {
  // a flickering flame: its height, width and tip sway breathe on a few slow waves (blending between flame shapes)
  const n = (f, p) => Math.sin(t * f + p);
  const h = (86 + 9 * n(7.1, 0) + 4 * n(13.3, 1) + 3 * n(23, 2)) * k, w = (15 + 1.8 * n(5.3, 3)) * k, sway = (4 * n(3.1, 4) + 2.5 * n(8.7, 5)) * k;
  c.save(); c.globalCompositeOperation = "lighter";
  glow(x, y - h * .45, 150 * k * (1 + .05 * n(9, 6)), "255,170,80", .35 * k); glow(x, y - h * .4, 60 * k, "255,214,140", .45 * k);
  c.restore();
  const body = (scale, col1, col2) => {
    const g = c.createLinearGradient(0, y, 0, y - h * scale); g.addColorStop(0, col1); g.addColorStop(1, col2); c.fillStyle = g;
    c.beginPath(); c.moveTo(x, y + 2); c.bezierCurveTo(x + w * scale * 1.2, y - 2, x + w * scale, y - h * scale * .55, x + sway, y - h * scale);
    c.bezierCurveTo(x - w * scale, y - h * scale * .55, x - w * scale * 1.2, y - 2, x, y + 2); c.fill();
  };
  body(1, "rgba(255,120,40,.95)", "rgba(255,90,20,0)");
  body(.82, "rgba(255,210,120,1)", "rgba(255,170,60,.3)");
  body(.55, "rgba(255,255,235,1)", "rgba(255,240,190,.6)");
  c.fillStyle = "rgba(90,120,255,.55)"; c.beginPath(); c.ellipse(x, y - 3, w * .45, 6 * k, 0, 0, 7); c.fill();   // blue at the base
}
function candleScene(t) {
  const dark = eo(win(t, 0, 1)); c.fillStyle = `rgba(12,8,6,${.94 * dark})`; full();
  // the candle
  const cx = 195, top = 460;
  const wax = c.createLinearGradient(cx - 34, 0, cx + 34, 0); wax.addColorStop(0, "#d9c8a8"); wax.addColorStop(.35, "#f6ecd8"); wax.addColorStop(1, "#c9b494"); c.fillStyle = wax;
  c.beginPath(); c.roundRect(cx - 28, top, 56, 200, [6, 6, 4, 4]); c.fill();
  c.fillStyle = "#f8f0e0"; c.beginPath(); c.ellipse(cx, top, 28, 7, 0, 0, 7); c.fill();
  for (const [dx, l] of [[-20, 26], [-6, 14], [12, 34], [22, 18]]) { c.beginPath(); c.roundRect(cx + dx - 3, top, 7, l, 3.5); c.fill(); c.beginPath(); c.arc(cx + dx + .5, top + l, 4, 0, 7); c.fill(); }
  c.fillStyle = "#3a2a20"; c.fillRect(cx - 1.5, top - 16, 3, 16);   // wick
  // a spark at the wick, and the flame grows
  const spark = win(t, 1.3, 1.6) * (1 - win(t, 1.6, 1.9)); if (spark > 0) { c.save(); c.globalCompositeOperation = "lighter"; glow(cx, top - 18, 22, "255,230,170", spark); c.restore(); }
  const lit = eo(win(t, 1.5, 2.5));
  if (lit > 0) candleFlame(cx, top - 14, t, lit);
  // sparks drifting up from the flame
  if (lit > 0) { const r = rng(14); c.save(); c.globalCompositeOperation = "lighter"; for (let i = 0; i < 12; i++) { const st = 2.6 + r() * 7, k = (t - st) / 2.2; if (k < 0 || k > 1) continue; const x = cx + Math.sin(k * 6 + i) * 14 * k + (r() - .5) * 8, y = top - 70 - k * 230; c.fillStyle = `rgba(255,236,170,${(1 - k) * .9})`; c.beginPath(); c.arc(x, y, 1.6 + r(), 0, 7); c.fill(); } c.restore(); }
  quote(t, 3.4, 0, "“Let my prayer be set before you like incense; the lifting up of my hands like the evening sacrifice.”", "Psalm 141:2", 170, { size: 20 });
  const tag = eo(win(t, 5, 6)); if (tag > 0) { c.save(); c.globalAlpha = tag * .85; c.fillStyle = "#e9d6bd"; c.textAlign = "center";
    if (INTENT) { c.font = `italic 400 17px ${SERIF}`; wrap(`For ${INTENT}`, 320).forEach((l, i) => c.fillText(l, 195, 704 + i * 22)); }
    else { c.font = "500 13px Inter, system-ui"; c.fillText("Your candle stays lit today", 195, 712); }
    c.restore(); }
  label(t, "Prayer candle");
}



/* ================= playing a scene ================= */
const SCENES = { ash: [ashScene, 10], christmas: [christmasScene, 18], goodfriday: [goodFridayScene, 16], easter: [easterScene, 15], pentecost: [pentecostScene, 13], tree: [treeScene, 11.5], candle: [candleScene, 10] };
// scenes drawn over the page itself (no sky of their own)
const OVER_PAGE = new Set(["ash", "tree", "candle"]);
export const ids = Object.keys(SCENES);
let current = null;

export function play(id, { name = "", intention = "" } = {}) {
  const sc = SCENES[id];
  if (!sc) return Promise.resolve();
  current?.close();
  NAME = name; INTENT = intention;
  return new Promise((resolve) => {
    const [draw, dur] = sc;
    const ov = document.createElement("div");
    ov.className = "holy-ov" + (OVER_PAGE.has(id) ? " over-page" : "");
    ov.innerHTML = `<canvas class="holy-back" aria-hidden="true"></canvas><canvas class="holy-front" aria-hidden="true"></canvas><button class="holy-x" aria-label="Close">×</button>`;
    document.body.appendChild(ov);
    const front = ov.querySelector(".holy-front"), back = ov.querySelector(".holy-back");
    const bctx = back.getContext("2d");
    let raf = 0, t0 = 0, done = false, k = 1;
    const fit = () => {
      const vw = innerWidth, vh = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
      // cover the screen when little would be cut off (phones); otherwise fit the height (wide screens)
      const cover = Math.max(vw / W, vh / H), contain = Math.min(vw / W, vh / H);
      k = (W * cover - vw) / (W * cover) <= .2 && (H * cover - vh) / (H * cover) <= .12 ? cover : contain;
      front.width = vw * dpr; front.height = vh * dpr;
      const ox = (vw - W * k) / 2, oy = (vh - H * k) / 2;
      front._m = [k * dpr, ox * dpr, oy * dpr];
      VIEW = { x: -ox / k, y: -oy / k, w: vw / k, h: vh / k };
      back.width = Math.ceil(vw / 6); back.height = Math.ceil(vh / 6);
      ov.classList.toggle("boxed", k === contain && k !== cover && !OVER_PAGE.has(id));
    };
    fit();
    addEventListener("resize", fit);
    const close = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      removeEventListener("resize", fit);
      removeEventListener("keydown", onKey);
      ov.classList.add("out");
      setTimeout(() => ov.remove(), 600);
      if (current === handle) current = null;
      resolve();
    };
    const onKey = (e) => e.key === "Escape" && close();
    addEventListener("keydown", onKey);
    ov.querySelector(".holy-x").onclick = close;
    const handle = { close };
    current = handle;
    const ctx = front.getContext("2d");
    const frame = (now) => {
      if (done) return;
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      const [s, ox, oy] = front._m;
      c = ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, front.width, front.height);
      ctx.setTransform(s, 0, 0, s, ox, oy); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.filter = "none";
      try { draw(Math.min(t, dur)); } catch (e) { console.error(e); return close(); }
      if (ov.classList.contains("boxed")) { bctx.clearRect(0, 0, back.width, back.height); bctx.drawImage(front, 0, 0, back.width, back.height); }
      if (t >= dur + .4) return close();
      raf = requestAnimationFrame(frame);
    };
    // wait for the fonts the words use, then start
    Promise.all([document.fonts?.load?.("italic 400 20px Literata"), document.fonts?.load?.("italic 600 20px Literata")].filter(Boolean)).catch(() => {}).finally(() => { raf = requestAnimationFrame(frame); });
  });
}

// for tests: draw one frame of a scene at time t onto a canvas
export function _frame(id, t, canvas) {
  canvas.width = W * 2; canvas.height = H * 2; c = canvas.getContext("2d"); VIEW = { x: 0, y: 0, w: W, h: H };
  c.setTransform(2, 0, 0, 2, 0, 0); SCENES[id][0](t);
}

/* ================= the prayer space: a cross, and a candle that lights (runs until stopped) ================= */
let LIT_AT = null, CRUCIFIX = null, BACKDROP = null;
function drawnCross(t) {
  const fade = eo(win(t, .1, 1.6));
  c.save(); c.globalAlpha = fade;
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#9a9a9a"); g.addColorStop(.35, "#6e6e6e"); g.addColorStop(.7, "#2b2b2b"); g.addColorStop(1, "#0b0b0b"); c.fillStyle = g; full();
  const r = rng(4); c.save(); c.filter = "blur(30px)"; for (let i = 0; i < 18; i++) { c.fillStyle = `rgba(${r() < .5 ? "230,230,230" : "40,40,40"},${.08 + r() * .14})`; c.beginPath(); c.ellipse(VIEW.x + r() * VIEW.w, r() * H * .7, 80 + r() * 160, 30 + r() * 60, 0, 0, 7); c.fill(); } c.restore();
  // the cross
  c.fillStyle = "#151515"; c.fillRect(182, 150, 26, 390); c.fillRect(75, 226, 240, 28);
  c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(182, 150, 3, 390); c.fillRect(75, 226, 240, 3);
  // the hill
  c.fillStyle = "#0b0b0b"; c.beginPath(); c.moveTo(VIEW.x - 20, H * .86); c.bezierCurveTo(W * .15, H * .8, W * .28, H * .72, W * .4, H * .7); c.lineTo(W * .52, H * .69);
  c.bezierCurveTo(W * .75, H * .72, W * .88, H * .8, VIEW.x + VIEW.w + 20, H * .84); c.lineTo(VIEW.x + VIEW.w + 20, VIEW.y + VIEW.h); c.lineTo(VIEW.x - 20, VIEW.y + VIEW.h); c.fill();
  c.restore();
}
// a small, blurred, darkened copy of the picture, made once, to fill the sides on wide screens
function blurredBackdrop(img) {
  if (BACKDROP) return BACKDROP;
  const cv = document.createElement("canvas"); cv.width = 160; cv.height = 100;
  const x = cv.getContext("2d"), s = Math.max(cv.width / img.naturalWidth, cv.height / img.naturalHeight);
  x.filter = "blur(8px) brightness(.8)";
  x.drawImage(img, (cv.width - img.naturalWidth * s) / 2, (cv.height - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
  return (BACKDROP = cv);
}
function prayScene(t) {
  c.fillStyle = "#0b0a09"; full();
  const lit = LIT_AT == null ? 0 : eo(win(t, LIT_AT, LIT_AT + 1.4));
  const flick = 1 + .05 * Math.sin(t * 7.3) + .03 * Math.sin(t * 13.1);
  // Jesus on the cross, filling the screen; it fades in, and is darker while choosing how to pray
  // a misty sky and a plain cross on a hill (put a picture in CRUCIFIX to use a photo instead)
  if (!CRUCIFIX) drawnCross(t);
  const img = CRUCIFIX;
  if (img && img.complete && img.naturalWidth) {
    const fade = eo(win(t, .1, 1.6)), iw = img.naturalWidth, ih = img.naturalHeight;
    const cover = Math.max(VIEW.w / iw, VIEW.h / ih), fitH = VIEW.h / ih;
    c.save(); c.globalAlpha = fade;
    if (iw * cover - VIEW.w > VIEW.w * .25 || ih * cover - VIEW.h > VIEW.h * .25) {
      // a wide screen: the whole picture at full height, with a soft blurred copy of it filling the sides
      c.drawImage(blurredBackdrop(img), VIEW.x, VIEW.y, VIEW.w, VIEW.h);
      const w = iw * fitH, x = VIEW.x + (VIEW.w - w) / 2;
      c.drawImage(img, x, VIEW.y, w, VIEW.h);
      for (const [x0, dir] of [[x, 1], [x + w, -1]]) { const g2 = c.createLinearGradient(x0, 0, x0 + dir * 60, 0); g2.addColorStop(0, "rgba(60,60,60,.55)"); g2.addColorStop(1, "rgba(60,60,60,0)"); c.fillStyle = g2; c.fillRect(Math.min(x0, x0 + dir * 60), VIEW.y, 60, VIEW.h); }
    } else {
      const w = iw * cover, h = ih * cover;
      c.drawImage(img, VIEW.x + (VIEW.w - w) / 2, VIEW.y + (VIEW.h - h) / 2 - VIEW.h * .03, w, h);
    }
    c.restore();
  }
  c.fillStyle = `rgba(0,0,0,${.55 - .3 * lit})`; full();
  const v = c.createLinearGradient(0, H * .5, 0, H); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.8)"); c.fillStyle = v; full();
  // the candle's warm light on the grey
  // the candle burns down over an hour: it gets shorter, a drop of wax runs down every minute, and at the end the flame goes out
  const burnt = LIT_AT == null ? 0 : Math.max(0, t - LIT_AT);
  const melt = clamp(burnt / BURN), cx = 195, top = 580 + 70 * melt;
  const out = LIT_AT == null ? 0 : win(burnt, BURN - 4, BURN);                 // the flame dying in the last seconds
  const life = lit * (1 - out);
  if (life > 0) { c.save(); c.globalCompositeOperation = "lighter"; glow(cx, top - 50, 300, "255,165,80", .2 * life * flick); glow(cx, top - 40, 110, "255,210,140", .22 * life * flick); c.restore(); }
  // a wide pillar candle in front of the hill
  const half = 40, wax = c.createLinearGradient(cx - half, 0, cx + half, 0);
  wax.addColorStop(0, "#c2ad88"); wax.addColorStop(.3, "#f5ead4"); wax.addColorStop(.55, "#efe2c6"); wax.addColorStop(1, "#ad9874"); c.fillStyle = wax;
  c.beginPath(); c.roundRect(cx - half, top, half * 2, 300, [10, 10, 0, 0]); c.fill();
  // the soft, melted top: a bowl around the wick that deepens as it burns
  c.fillStyle = "#f7eedc"; c.beginPath(); c.ellipse(cx, top + 1, half, 9, 0, 0, 7); c.fill();
  c.fillStyle = `rgba(200,165,110,${.3 + .25 * melt})`; c.beginPath(); c.ellipse(cx, top + 2, half - 8, 5 + 1.5 * melt, 0, 0, 7); c.fill();
  // wax drips: a few from the start, then a new one every minute, running down the side and hardening
  const drip = (dx, len, k) => { const l = len * k; c.beginPath(); c.roundRect(cx + dx - 4, top + 2, 8, l, 4); c.fill(); c.beginPath(); c.arc(cx + dx, top + 2 + l, 4.2 + .8 * k, 0, 7); c.fill(); };
  c.fillStyle = "#f3e7cf";
  for (const [dx, l] of [[-33, 22], [-20, 12], [14, 30], [29, 17]]) drip(dx, l, 1);
  const minutes = Math.floor(burnt / 60);
  for (let m = Math.max(1, minutes - 9); m <= minutes; m++) {           // the latest ten stay on the candle
    const r = rng(500 + m), dx = (r() * 2 - 1) * (half - 7), len = 18 + r() * 46;
    const k = eo(clamp((burnt - m * 60) / 9));                          // each runs down over about nine seconds
    c.fillStyle = r() < .5 ? "#f6ecd6" : "#efe1c4"; drip(dx, len, k);
    // the fresh drop glistens while it runs
    if (k < 1 && life > 0) { c.fillStyle = `rgba(255,250,235,${.8 * (1 - k)})`; c.beginPath(); c.arc(cx + dx - 1.2, top + 2 + len * k - 1, 1.6, 0, 7); c.fill(); }
  }
  if (life > 0) { c.save(); c.globalCompositeOperation = "lighter"; glow(cx, top + 10, 46, "255,190,110", .35 * life * flick); c.restore(); }   // the glow inside the wax
  c.fillStyle = "#3a2a20"; c.fillRect(cx - 1.8, top - 14 + 4 * out, 3.6, 15 - 4 * out);
  if (LIT_AT != null) { const sp = win(t, LIT_AT - .3, LIT_AT) * (1 - win(t, LIT_AT, LIT_AT + .3)); if (sp > 0) { c.save(); c.globalCompositeOperation = "lighter"; glow(cx, top - 16, 22, "255,230,170", sp); c.restore(); } }
  if (life > 0) candleFlame(cx, top - 12, t, life);
  // sparks rising slowly
  if (life > 0) { c.save(); c.globalCompositeOperation = "lighter"; for (let i = 0; i < 9; i++) { const k = (((t - LIT_AT) / 4.2 + i * .618) % 1 + 1) % 1, x = cx + Math.sin(k * 5 + i * 2.3) * (10 + 26 * k) + (i % 3 - 1) * 9 * k, y = top - 90 - k * 240; c.fillStyle = `rgba(255,236,170,${(1 - k) * .75 * life})`; c.beginPath(); c.arc(x, y, 1.4 + (i % 3) * .5, 0, 7); c.fill(); } c.restore(); }
  // when it goes out: a thin wisp of smoke, and a last ember on the wick
  if (out > 0) {
    const sk = burnt - (BURN - 1.5);
    if (sk > 0 && sk < 9) { c.save(); c.lineCap = "round"; for (let i = 0; i < 3; i++) { const a = (1 - sk / 9) * (.35 - i * .08); c.strokeStyle = `rgba(200,200,200,${a})`; c.lineWidth = 3 + i * 2; c.beginPath(); c.moveTo(cx, top - 14); for (let y = 0; y < 120 * Math.min(1, sk / 2.5); y += 6) c.lineTo(cx + Math.sin(y / 18 + sk * 1.4 + i) * (4 + y / 10), top - 14 - y); c.stroke(); } c.restore(); }
    const ember = 1 - win(burnt, BURN, BURN + 5); if (ember > 0) { c.save(); c.globalCompositeOperation = "lighter"; glow(cx, top - 14, 6, "255,120,40", .9 * ember); c.restore(); }
  }
}
const BURN = 3600;   // seconds: the candle lasts one hour
export const burnSeconds = BURN;

// Run the prayer space in a canvas until stop() is called; light() lights the candle.
export function ambient(canvas, { speed = 1, onBurnOut } = {}) {
  const ctx = canvas.getContext("2d");
  let raf = 0, t0 = 0, m = [1, 0, 0], view = VIEW, stopped = false, burned = false;
  LIT_AT = null;
  const fit = () => {
    const vw = canvas.clientWidth || innerWidth, vh = canvas.clientHeight || innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
    const cover = Math.max(vw / W, vh / H), contain = Math.min(vw / W, vh / H);
    const k = (W * cover - vw) / (W * cover) <= .2 && (H * cover - vh) / (H * cover) <= .2 ? cover : contain;   // phones: fill; wide screens: fit the height
    canvas.width = vw * dpr; canvas.height = vh * dpr;
    const ox = (vw - W * k) / 2, oy = (vh - H * k) / 2;
    m = [k * dpr, ox * dpr, oy * dpr]; view = { x: -ox / k, y: -oy / k, w: vw / k, h: vh / k };
  };
  fit(); addEventListener("resize", fit);
  const frame = (now) => {
    if (stopped) return;
    if (!t0) t0 = now;
    const t = ((now - t0) / 1000) * speed;
    c = ctx; VIEW = view;
    if (LIT_AT != null && !burned && t - LIT_AT >= BURN) { burned = true; onBurnOut?.(); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(m[0], 0, 0, m[0], m[1], m[2]); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    try { prayScene(t); } catch (e) { console.error(e); return; }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return {
    light() { if (LIT_AT == null) LIT_AT = t0 ? ((performance.now() - t0) / 1000) * speed + .3 * speed : .6; },
    stop() { stopped = true; cancelAnimationFrame(raf); removeEventListener("resize", fit); },
  };
}
export function _prayFrame(t, litAt, canvas) {
  canvas.width = W * 2; canvas.height = H * 2; c = canvas.getContext("2d"); VIEW = { x: 0, y: 0, w: W, h: H }; LIT_AT = litAt;
  c.setTransform(2, 0, 0, 2, 0, 0); prayScene(t);
}
