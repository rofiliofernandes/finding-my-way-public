// "The Lord will fight for you" (Exodus 14:14).
// From a heavy feeling in Topics: a short sheet asks what's weighing on you, then double doors open,
// Jesus stands in the light, and each dark word is met by a beam from His heart and becomes its answer.
// Your own words come last. Afterwards: a verse to think about, and the choice to keep it as a prayer.
// Everything you type stays on this device unless you tap "Save as a prayer".
import * as store from "./store.js";
import * as bible from "./bible.js";
import * as semantic from "./semantic.js";
import { esc, icon, openModal, toast } from "./ui.js";
import * as motion from "./motion.js";

/* ---------- the words ---------- */

// The usual battle: dark word → its answer.
const PAIRS = [
  ["fear", "peace"],
  ["alone", "I am with you"],
  ["shame", "forgiven"],
  ["worthless", "loved"],
  ["not enough", "my grace is enough"],
  ["anxiety", "cast it on me"],
  ["guilt", "no condemnation"],
  ["despair", "hope"],
  ["weak", "strong in me"],
  ["forgotten", "never forgotten"],
  ["broken", "healed"],
  ["lost", "found"],
  ["tired", "rest"],
  ["rejected", "chosen"],
];

// Answers for your own words. keys: word stems to look for; q: what it means (for matching by meaning);
// a: the answer that appears in gold; ref: the verse behind it (and the verse to think about).
const ANSWERS = [
  { id: "crisis", keys: ["suicid", "kill myself", "end my life", "end it all", "want to die", "self harm", "self-harm", "hurt myself", "cut myself"], q: "I want to die and end my life", a: "your life is precious to me", ref: "PSA 34:18", crisis: true },
  { id: "exam", keys: ["exam", "test", "study", "studies", "school", "college", "university", "result", "marks", "grade", "interview", "assignment", "homework"], q: "worried about my exams and studies", a: "I will give you wisdom", ref: "JAS 1:5" },
  { id: "health", keys: ["health", "sick", "ill", "disease", "pain", "hospital", "surgery", "cancer", "doctor", "fever", "injury", "recovery", "heal"], q: "sickness and someone's health", a: "I will heal you", ref: "JER 17:14" },
  { id: "money", keys: ["money", "debt", "loan", "bill", "rent", "salary", "financ", "poor", "afford", "broke", "emi"], q: "money worries and paying bills", a: "I will provide", ref: "PHP 4:19" },
  { id: "work", keys: ["job", "work", "boss", "career", "office", "unemploy", "fired", "promotion", "business", "deadline"], q: "trouble with my job and career", a: "I go before you", ref: "DEU 31:8" },
  { id: "future", keys: ["future", "unknown", "uncertain", "what next", "plan", "visa", "move", "moving"], q: "uncertain about the future", a: "I know the plans I have for you", ref: "JER 29:11" },
  { id: "decide", keys: ["decision", "decide", "confus", "direction", "choice", "which way", "don't know what"], q: "confused and can't decide which way to go", a: "I will guide you", ref: "PRO 3:5-6" },
  { id: "family", keys: ["family", "parent", "dad", "father", "mom", "mum", "mother", "brother", "sister", "son", "daughter", "kids", "child", "home"], q: "trouble in my family at home", a: "I hold your family", ref: "PSA 127:1" },
  { id: "heart", keys: ["breakup", "break up", "heartbreak", "divorce", "marriage", "wife", "husband", "girlfriend", "boyfriend", "relationship", "ex"], q: "heartbreak in my relationship", a: "I heal the brokenhearted", ref: "PSA 147:3" },
  { id: "grief", keys: ["grief", "griev", "died", "death", "dead", "funeral", "passed away", "miss", "loss"], q: "grieving someone who died", a: "I am the resurrection", ref: "JHN 11:25" },
  { id: "sin", keys: ["sin", "addict", "temptation", "tempt", "porn", "lust", "habit", "relapse", "drink", "smok", "gambl"], q: "struggling with sin and temptation", a: "I will make a way out", ref: "1CO 10:13" },
  { id: "anger", keys: ["anger", "angry", "rage", "hate", "furious", "temper", "bitter"], q: "full of anger and bitterness", a: "let my peace rule your heart", ref: "COL 3:15" },
  { id: "envy", keys: ["jealous", "envy", "compar"], q: "jealous and comparing myself to others", a: "I made you wonderfully", ref: "PSA 139:14" },
  { id: "doubt", keys: ["doubt", "unbelief", "faith", "is god real", "can't pray", "cant pray"], q: "doubting God and struggling to believe", a: "believe, I am here", ref: "JHN 20:27" },
  { id: "failure", keys: ["fail", "mistake", "messed", "mess up", "regret", "screwed"], q: "I failed and made a mistake", a: "my mercies are new", ref: "LAM 3:22-23" },
  { id: "sleep", keys: ["sleep", "insomnia", "awake", "night", "nightmare"], q: "I can't sleep at night", a: "I give you sleep", ref: "PSA 4:8" },
  { id: "enemy", keys: ["enemy", "enemies", "bully", "bullied", "people", "judg", "critic", "gossip", "mock", "they"], q: "people are against me and judging me", a: "I am for you", ref: "ROM 8:31" },
  { id: "wait", keys: ["wait", "waiting", "delay", "patien", "slow", "stuck"], q: "waiting so long, feeling stuck", a: "wait on me, I will renew you", ref: "ISA 40:31" },
  { id: "lonely", keys: ["alone", "lonely", "loneliness", "isolat", "no friends", "nobody"], q: "lonely with nobody to talk to", a: "I am with you always", ref: "MAT 28:20" },
  { id: "shame", keys: ["shame", "ashamed", "embarrass", "ugly", "dirty"], q: "ashamed of myself", a: "you are mine", ref: "ISA 43:1" },
  { id: "sad", keys: ["sad", "depress", "empty", "numb", "cry", "crying", "down", "low", "hurt"], q: "sad, depressed and empty inside", a: "I am close to you", ref: "PSA 34:18" },
  { id: "stress", keys: ["stress", "pressure", "overwhelm", "burden", "busy", "too much", "heavy"], q: "overwhelmed and under pressure", a: "come to me, I will give you rest", ref: "MAT 11:28" },
  { id: "anxiety", keys: ["anxi", "worr", "panic", "nervous", "overthink"], q: "anxious and worried", a: "cast it on me", ref: "1PE 5:7" },
  { id: "fear", keys: ["fear", "afraid", "scared", "terrified", "fright"], q: "afraid and scared", a: "do not fear, I am with you", ref: "ISA 41:10" },
  { id: "guilt", keys: ["guilt", "guilty", "sorry", "condemn"], q: "guilty about what I did", a: "no condemnation", ref: "ROM 8:1" },
  { id: "weak", keys: ["weak", "tired", "exhaust", "burnout", "burnt out", "drained", "weary"], q: "weak and exhausted", a: "my strength in your weakness", ref: "2CO 12:9" },
  { id: "betray", keys: ["betray", "cheat", "lied", "abandon", "left me", "trust"], q: "betrayed and abandoned by someone", a: "I will never leave you", ref: "HEB 13:5" },
  { id: "forgive", keys: ["forgive", "grudge", "unforgiv"], q: "I can't forgive someone", a: "forgive, as I forgave you", ref: "COL 3:13" },
  { id: "worth", keys: ["worthless", "useless", "not enough", "not good enough", "nobody", "loser", "stupid", "unloved", "unwanted", "rejected"], q: "I feel worthless and not good enough", a: "I love you, always", ref: "JER 31:3" },
  { id: "hope", keys: ["hopeless", "despair", "give up", "giving up", "pointless", "no point"], q: "hopeless, I want to give up", a: "I am your hope", ref: "ROM 15:13" },
  { id: "danger", keys: ["danger", "safe", "war", "travel", "accident", "storm", "attack"], q: "in danger, worried about safety", a: "I am your refuge", ref: "PSA 46:1" },
  { id: "battle", keys: ["fight", "battle", "court", "case", "conflict", "lawsuit", "dispute"], q: "a fight or battle I am facing", a: "the battle is mine", ref: "2CH 20:15" },
];
const FALLBACK = { id: "with", a: "I am with you in this", ref: "ISA 43:2" };

// Topics that count as "heavy" get the button, and the word the sheet starts with.
export const HEAVY = { anger: "anger", fear: "fear", anxiety: "anxiety", grief: "grief", loneliness: "loneliness", guilt: "guilt", jealousy: "jealousy", temptation: "temptation", doubt: "doubt", weariness: "tired" };
const MAX_WORDS = 5;

const norm = (s) => " " + s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z' -]/g, " ").replace(/\s+/g, " ").trim() + " ";

function byKeywords(word) {
  const w = norm(word);
  for (const e of ANSWERS) {
    for (const k of e.keys) {
      // stems match the start of a word ("worr" → "worried"); short keys must be whole words
      const re = k.length <= 3 ? new RegExp(`[ ]${k}[ ]`) : new RegExp(`[ ]${k.replace(/[-]/g, "\\-")}`);
      if (re.test(w)) return e;
    }
  }
  return null;
}

let answerVecs = null;
const dot = (a, b) => {
  let s = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) (s += a[i] * b[i]), (na += a[i] * a[i]), (nb += b[i] * b[i]);
  return s / Math.sqrt(na * nb || 1);
};
async function byMeaning(word) {
  if (semantic.status().status !== "ready") return null;
  if (!answerVecs) {
    answerVecs = [];
    for (const e of ANSWERS) answerVecs.push(await semantic.embedQuery(e.q));
  }
  const v = await semantic.embedQuery(word);
  let best = -1, bi = -1;
  answerVecs.forEach((av, i) => {
    const s = dot(v, av);
    if (s > best) (best = s), (bi = i);
  });
  // the crisis answer only ever comes from clear words, never from a guess
  return best >= 0.42 && !ANSWERS[bi].crisis ? ANSWERS[bi] : null;
}

export async function answerFor(word) {
  return byKeywords(word) || (await byMeaning(word).catch(() => null)) || FALLBACK;
}

/* ---------- the sheet ---------- */

export function open({ feeling = "", onEnd } = {}) {
  if (store.pref("semanticDownloaded")) semantic.ensureLoaded().catch(() => {});
  let words = feeling ? [feeling] : [];
  openModal(
    `<div class="fight-sheet">
      <div class="eyebrow">Exodus 14:14</div>
      <h2 style="margin:4px 0 2px">What's weighing on you?</h2>
      <p class="muted small" style="margin:0 0 12px">Name it, and let Him fight for you. Up to ${MAX_WORDS}. This stays on your device.</p>
      <div class="fight-chips" id="fChips"></div>
      <form class="fight-add" id="fAdd"><input id="fIn" maxlength="28" placeholder="e.g. my exam, money, dad's health" autocomplete="off" enterkeyhint="done"><button class="btn ghost small" type="submit">Add</button></form>
      <div class="actions"><button class="btn ghost" data-skip>Just show me</button><button class="btn primary" data-begin>Begin</button></div>
    </div>`,
    (dlg, close) => {
      const chips = dlg.querySelector("#fChips");
      const input = dlg.querySelector("#fIn");
      const draw = () => {
        chips.innerHTML = words.length
          ? words.map((w, i) => `<span class="chip on">${esc(w)}<button type="button" aria-label="Remove ${esc(w)}" data-rm="${i}">×</button></span>`).join("")
          : `<span class="muted small">Nothing added. You can just watch.</span>`;
        chips.querySelectorAll("[data-rm]").forEach((b) => (b.onclick = () => (words.splice(+b.dataset.rm, 1), draw())));
        input.disabled = words.length >= MAX_WORDS;
        input.placeholder = words.length >= MAX_WORDS ? "That's enough for now" : "e.g. my exam, money, dad's health";
      };
      const add = () => {
        const v = input.value.trim().replace(/\s+/g, " ");
        if (v && words.length < MAX_WORDS && !words.some((w) => w.toLowerCase() === v.toLowerCase())) words.push(v);
        input.value = "";
        draw();
      };
      dlg.querySelector("#fAdd").onsubmit = (e) => (e.preventDefault(), add());
      dlg.querySelector("[data-skip]").onclick = () => (close(), play([], { feeling, onEnd }));
      dlg.querySelector("[data-begin]").onclick = async () => {
        add();
        const b = dlg.querySelector("[data-begin]");
        b.disabled = true;
        b.textContent = "…";
        // give the meaning model a moment if it's already on its way
        if (semantic.status().status === "loading") await Promise.race([semantic.ensureLoaded().catch(() => {}), new Promise((r) => setTimeout(r, 3000))]);
        const mine = [];
        for (const w of words) mine.push({ d: w, ...(await answerFor(w)) });
        close();
        play(mine, { feeling, onEnd });
      };
      draw();
      if (!feeling) setTimeout(() => input.focus(), 50);
    }
  );
}

/* ---------- the scene ---------- */

const FIGURE = `<div class="stage"><div class="theman"><div class="halo"></div><div class="hairleft"></div><div class="hairright"></div>
  <div class="head"><div class="hairline"></div><div class="bangsright"></div><div class="bangsleft"></div><div class="forehead1"></div><div class="forehead2"></div><div class="eyes"></div><div class="mouth"></div><div class="cheeks"></div><div class="beard"></div></div>
  <div class="torso"><div class="fheart"><svg viewBox="0 0 32 30" aria-hidden="true"><path d="M16 29 C6 21 1 15 1 9 C1 4.5 4.5 1 9 1 C12 1 14.5 2.6 16 5 C17.5 2.6 20 1 23 1 C27.5 1 31 4.5 31 9 C31 15 26 21 16 29Z"/></svg></div><div class="arm left"><div class="hand"></div></div><div class="arm right"><div class="hand"></div></div></div><div class="foot1"></div><div class="foot2"></div></div></div>`;

const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const eio = (x) => ((x = ease(x)), x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

// mine: [{d, a, ref, crisis?}] — your own words with their answers
export function play(mine = [], { feeling = "", onEnd } = {}) {
  document.querySelector(".fight")?.remove();
  const root = document.createElement("div");
  root.className = "blessing fight";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "The Lord will fight for you");
  root.innerHTML = `
    <canvas class="f-bg"></canvas><canvas class="f-fx"></canvas>
    <div class="f-glow"></div>
    <div class="f-fig">${FIGURE}</div>
    <div class="f-words"></div>
    <div class="f-flash"></div>
    <div class="f-final">The Lord will fight for you,<br>and you shall be still.<small>Exodus 14:14</small></div>
    <div class="f-doors"><div class="f-frame"></div><div class="f-seam"></div>
      <div class="f-leaf l"><div class="f-panel p1"></div><div class="f-panel p2"></div><div class="f-ring"></div></div>
      <div class="f-leaf r"><div class="f-panel p1"></div><div class="f-panel p2"></div><div class="f-ring"></div></div>
      <div class="f-cross"></div></div>
    <button class="f-skip" type="button">Skip</button>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  let raf = 0, finished = false, stopDepth = () => {};
  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    stopDepth();
    removeEventListener("resize", size);
    document.removeEventListener("keydown", onKey);
    root.classList.add("out");
    setTimeout(() => {
      root.remove();
      document.body.style.overflow = prevOverflow;
      endCard(mine, feeling, onEnd);
    }, 450);
  };
  const onKey = (e) => e.key === "Escape" && finish();
  document.addEventListener("keydown", onKey);
  $(".f-skip").onclick = finish;

  if (reduce()) {
    // no flying: just the answers, quietly, then the card
    root.classList.add("still");
    $(".f-words").innerHTML = `<div class="f-list">${[...PAIRS.slice(0, 6).map(([d, a]) => ({ d, a })), ...mine]
      .map((w) => `<div><s>${esc(w.d)}</s> → <b>${esc(w.a)}</b></div>`)
      .join("")}</div>`;
    setTimeout(finish, 6000);
    return;
  }

  // studs on the doors
  root.querySelectorAll(".f-leaf").forEach((l) => {
    for (let i = 0; i < 10; i++) {
      const s = document.createElement("i");
      s.className = "f-stud";
      s.style.left = i % 2 ? "8%" : "84%";
      s.style.top = 14 + Math.floor(i / 2) * 17 + "%";
      l.appendChild(s);
    }
  });

  const cv = $(".f-bg"), cvt = $(".f-fx");
  const bg = cv.getContext("2d"), ctx = cvt.getContext("2d");
  const fig = $(".f-fig"), heart = $(".fheart"), glow = $(".f-glow"), wordsEl = $(".f-words");
  let CX, CY, R, figScale, VW, VH;
  function size() {
    VW = innerWidth;
    VH = innerHeight;
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = cvt.width = VW * dpr;
    cv.height = cvt.height = VH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bg.setTransform(dpr, 0, 0, dpr, 0, 0);
    CX = VW / 2;
    CY = VH * 0.52;
    R = Math.hypot(VW, VH) / 2 + 30;
    figScale = Math.min(0.55, (VH * 0.36) / 430, (VW * 0.4) / 220);
    fig.style.left = CX + "px";
    fig.style.top = CY + "px";
  }
  size();
  addEventListener("resize", size);
  // tilt the phone: the light drifts, the doors sway, He stays nearly still (beams follow His heart)
  stopDepth = motion.depth([[glow, 12], [$(".f-doors"), 9], [fig, -4]]);

  const measurer = document.createElement("div");
  measurer.className = "fw truth";
  measurer.style.visibility = "hidden";
  wordsEl.appendChild(measurer);
  // dust: sample a word's pixels from an offscreen canvas, in the word's own font
  const sampler = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const samplePoints = (el, text, cx, cy, scale) => {
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize) * scale;
    const font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    sampler.font = font;
    const w = Math.ceil(sampler.measureText(text).width) + 8, h = Math.ceil(size * 1.4);
    sampler.canvas.width = w;
    sampler.canvas.height = h;
    sampler.font = font;
    sampler.textBaseline = "middle";
    sampler.fillStyle = "#fff";
    sampler.fillText(text, 4, h / 2);
    const data = sampler.getImageData(0, 0, w, h).data, pts = [];
    const step = 2;
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (data[(y * w + x) * 4 + 3] > 110) pts.push([cx - w / 2 + x, cy - h / 2 + y]);
    return pts;
  };
  const makeDust = (w) => {
    const from = samplePoints(w.el, w.d, w.hx, w.hy, 1.15);
    const to = samplePoints(w.tr, w.a, w.hx, w.hy, 1);
    if (!from.length || !to.length) return [];
    // shuffle the targets so the dust crosses over itself as it re-forms
    for (let i = to.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [to[i], to[j]] = [to[j], to[i]]; }
    const n = Math.max(from.length, to.length), spread = w.mine ? 70 : 40;
    const dust = [];
    for (let i = 0; i < n; i++) {
      const [sx, sy] = from[i % from.length], [tx, ty] = to[i % to.length];
      const a = Math.random() * Math.PI * 2, r = (0.3 + Math.random()) * spread;
      dust.push({ sx, sy, tx, ty, mx: sx + Math.cos(a) * r, my: sy + Math.sin(a) * r * 0.7 - spread * 0.25, j: Math.random() * 6.28, d: Math.random() * 0.25 });
    }
    return dust;
  };
  const fit = (el) => {
    const max = VW - 28, wd = el.offsetWidth;
    if (wd > max) el.style.fontSize = parseFloat(getComputedStyle(el).fontSize) * (max / wd) + "px";
  };
  const measure = (txt, mineCls) => ((measurer.className = "fw truth" + mineCls), (measurer.textContent = txt), measurer.offsetWidth);

  // the usual words (fewer when you've brought your own, so it stays about the same length), then yours
  const base = PAIRS.filter(([d]) => !mine.some((w) => w.d.toLowerCase() === d)).slice(0, Math.max(8, 14 - mine.length * 1.5) | 0);
  const T_DOOR = 1.2, T_OPEN = 2.4, T_FIG = 3.2, T_W0 = 4.2, GAP = 0.62, TRAVEL = 2.2;
  const MY_GAP = 1.5, MY_TRAVEL = 2.6;
  const MORPH = 0.9, MY_MORPH = 2.0; // seconds for a word to break into dust and re-form as its answer
  const list = base.map(([d, a], i) => ({ d, a, mine: false, start: T_W0 + i * GAP, travel: TRAVEL, ang: ((i * 137.5) * Math.PI) / 180 + 0.4 }));
  const myStart = T_W0 + base.length * GAP + (mine.length ? 1.0 : 0);
  mine.forEach((w, i) => {
    // alternate below / above Him, stepping outward: 0 below, 1 above, 2 further below, ...
    const side = i % 2 === 0 ? 1 : -1, row = Math.floor(i / 2);
    list.push({ d: w.d, a: w.a, mine: true, start: myStart + i * MY_GAP, travel: MY_TRAVEL, side, row, drift: i % 2 ? -1 : 1 });
  });
  const lastHit = list.reduce((m, w) => Math.max(m, w.start + w.travel), 0);
  const T_END = lastHit + (mine.length ? MY_MORPH + 1.2 : MORPH + 1.0);
  list.forEach((w, i) => {
    w.i = i;
    w.el = document.createElement("div");
    w.el.className = "fw neg" + (w.mine ? " mine" : "");
    w.el.textContent = w.d;
    w.el.style.opacity = 0;
    wordsEl.appendChild(w.el);
    fit(w.el);
    w.sparks = [];
  });
  const beams = [], rings = [];
  const heartXY = () => {
    const r = heart.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };

  const t0 = performance.now();
  const frame = (now) => {
    const t = (now - t0) / 1000;
    // doors
    $(".f-seam").style.opacity = ease((t - 0.3) / (T_DOOR - 0.3));
    const o = eio((t - T_DOOR) / (T_OPEN - T_DOOR));
    $(".f-leaf.l").style.transform = `rotateY(${-112 * o}deg)`;
    $(".f-leaf.r").style.transform = `rotateY(${112 * o}deg)`;
    const go = ease((t - (T_OPEN - 0.3)) / 1.0);
    const doors = $(".f-doors");
    doors.style.transform = `translate(-50%,-50%) scale(${1 + go * 1.6})`;
    doors.style.opacity = 1 - go;
    if (go >= 1) doors.style.visibility = "hidden";
    // light bursts out of the doors, then settles into a radiance around Him
    const g = ease((t - T_DOOR) / 1.6);
    const settle = ease((t - T_OPEN) / 1.2);
    const pulse = 1 + 0.04 * Math.sin(t * 3);
    const gs = (40 + g * Math.max(VW, VH) * 1.3 * (1 - settle) + settle * Math.min(VW, VH) * 0.95) * pulse;
    glow.style.cssText = `left:${CX}px;top:${CY}px;width:${gs}px;height:${gs}px;margin:${-gs / 2}px;opacity:${Math.min(1, g * 1.4)}`;
    const f = ease((t - T_FIG) / 0.8);
    fig.style.opacity = f;
    fig.style.transform = `scale(${figScale * (0.9 + 0.1 * f)})`;
    // darkness around Him
    const dark = ease((t - T_OPEN) / 0.8) * (1 - ease((t - (T_END - 1.4)) / 1.0));
    bg.clearRect(0, 0, VW, VH);
    bg.fillStyle = `rgba(8,7,16,${dark})`;
    bg.fillRect(0, 0, VW, VH);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, VW, VH);
    ctx.globalCompositeOperation = "lighter";

    for (const w of list) {
      const p = (t - w.start) / w.travel;
      if (p < 0) continue;
      let x, y;
      if (w.mine) {
        const figHalf = 215 * figScale;
        const ty = Math.min(VH - 40, Math.max(40, CY + w.side * (figHalf + 46 + w.row * 54)));
        const e = eio(Math.min(p, 1));
        x = CX + w.drift * VW * 0.7 * (1 - e);
        y = ty + w.side * (VH * 0.6) * (1 - e);
      } else {
        const near = Math.min(VW, VH) * (0.4 + (w.i % 3) * 0.05);
        const d2 = R + (near - R) * eio(Math.min(p, 1));
        const half = Math.max(w.el.offsetWidth, w.tw || (w.tw = measure(w.a, ""))) / 2 + 14;
        x = Math.min(VW - half, Math.max(half, CX + Math.cos(w.ang) * d2));
        y = Math.min(VH - 44, Math.max(44, CY + Math.sin(w.ang) * d2 * 1.75));
      }
      if (!w.hit && p >= 1) {
        w.hit = t;
        w.hx = x;
        w.hy = y;
        beams.push({ x, y, t, big: w.mine });
        rings.push({ x, y, t, big: w.mine });
        const n = w.mine ? 18 : 10;
        for (let k = 0; k < n; k++) {
          const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * (w.mine ? 170 : 120);
          w.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6 + Math.random() * 0.6, t });
        }
        w.tr = document.createElement("div");
        w.tr.className = "fw truth" + (w.mine ? " mine" : "");
        w.tr.textContent = w.a;
        wordsEl.appendChild(w.tr);
        fit(w.tr);
        w.tr.style.opacity = 0;
        w.morph = w.mine ? MY_MORPH : MORPH;
        w.dust = makeDust(w);
      }
      if (!w.hit) {
        const shake = Math.sin(t * 23 + (w.ang ?? w.i) * 5) * (w.mine ? 2 : 1.2);
        w.el.style.opacity = Math.min(1, p * 3);
        w.el.style.transform = `translate(${x + shake}px,${y}px) translate(-50%,-50%) scale(${1 + p * 0.15})`;
        w.el.style.filter = `blur(${(1 - p) * 1.5}px)`;
      } else {
        const k = t - w.hit;
        // the dark word gives way to its dust at once
        w.el.style.opacity = w.dust.length ? 0 : Math.max(0, 1 - k * 6);
        // the answer appears as the dust settles into it
        const q = w.dust.length ? ease((k - w.morph * 0.82) / (w.morph * 0.25)) : ease(k / 0.5);
        const kr = Math.max(0, k - w.morph);
        const fade = t > T_END - 1.8 ? Math.max(0, 1 - (t - (T_END - 1.8)) / 0.8) : 1;
        // the usual answers glow, then soften so the screen stays readable; yours stay bright
        let soft = w.mine ? 1 : 0.55 + 0.45 * Math.max(0, 1 - Math.max(0, k - 1.6) / 1.2);
        if (!w.mine && mine.length) soft *= 1 - 0.6 * ease((t - myStart) / 1.2);
        w.tr.style.opacity = q * fade * soft;
        w.tr.style.transform = `translate(${w.hx}px,${w.hy - kr * 6}px) translate(-50%,-50%)`;
        // dust: crumble outward (grey), drift, then gather into the answer (gold)
        if (w.dust.length && k < w.morph * 1.15) {
          const out = 1 - ease((k - w.morph * 0.95) / (w.morph * 0.2));
          const sz = w.mine ? 1.8 : 1.5;
          for (const d of w.dust) {
            const u = ease((k / w.morph - d.d * 0.4) / (1 - d.d * 0.4));
            let px, py;
            if (u < 0.32) {
              const e = eio(u / 0.32);
              px = d.sx + (d.mx - d.sx) * e;
              py = d.sy + (d.my - d.sy) * e;
            } else {
              const e = eio((u - 0.32) / 0.68);
              px = d.mx + (d.tx - d.mx) * e;
              py = d.my + (d.ty - d.my) * e;
            }
            const jit = (1 - u) * 1.6;
            px += Math.sin(t * 11 + d.j) * jit;
            py += Math.cos(t * 13 + d.j) * jit;
            const c = ease((u - 0.25) / 0.6);
            const rC = (169 + (255 - 169) * c) | 0, gC = (163 + (226 - 163) * c) | 0, bC = (184 + (150 - 184) * c) | 0;
            ctx.fillStyle = `rgba(${rC},${gC},${bC},${(0.55 + 0.45 * c) * out * fade})`;
            ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
          }
        }
      }
      for (const s of w.sparks) {
        const k = t - s.t;
        if (k > s.life) continue;
        ctx.fillStyle = `rgba(255,${(200 + Math.random() * 50) | 0},120,${1 - k / s.life})`;
        ctx.fillRect(s.x + s.vx * k - 1.5, s.y + s.vy * k + 30 * k * k - 1.5, 3, 3);
      }
    }
    // the heart beats gently, and leaps each time it sends out light
    let beat = 0;
    for (const b of beams) {
      const k = t - b.t;
      if (k >= 0 && k < 0.4) beat = Math.max(beat, (1 - k / 0.4) * (b.big ? 1.3 : 1));
    }
    heart.style.transform = `scale(${1 + 0.06 * Math.max(0, Math.sin(t * 7.5)) + 0.45 * beat})`;
    const [HX, HY] = heartXY();
    if (beat > 0) {
      const rr = 46 * (beat > 1 ? 1.4 : 1);
      const rg = ctx.createRadialGradient(HX, HY, 0, HX, HY, rr);
      rg.addColorStop(0, `rgba(255,240,200,${Math.min(1, beat)})`);
      rg.addColorStop(0.4, `rgba(255,120,90,${Math.min(1, beat) * 0.5})`);
      rg.addColorStop(1, "rgba(255,120,90,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(HX, HY, rr, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of beams) {
      const life = b.big ? 0.7 : 0.5, k = t - b.t;
      if (k > life) continue;
      const a = 1 - k / life, wd = b.big ? 1.5 : 1;
      const grd = ctx.createLinearGradient(HX, HY, b.x, b.y);
      grd.addColorStop(0, `rgba(255,250,220,${a})`);
      grd.addColorStop(1, `rgba(255,210,110,${a})`);
      ctx.strokeStyle = grd;
      ctx.lineWidth = (9 * a + 1.5) * wd;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(HX, HY);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.lineWidth = 30 * a * wd;
      ctx.strokeStyle = `rgba(255,220,140,${a * 0.35})`;
      ctx.stroke();
    }
    for (const r of rings) {
      const k = t - r.t, life = r.big ? 1.2 : 0.9;
      if (k > life) continue;
      const a = 1 - k / life;
      ctx.strokeStyle = `rgba(255,225,150,${a * 0.8})`;
      ctx.lineWidth = 3 * a + 0.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 6 + k * (r.big ? 120 : 90), 0, Math.PI * 2);
      ctx.stroke();
    }
    // the finish
    $(".f-flash").style.opacity = ease((t - (T_END - 1.6)) / 0.8) * 0.92;
    $(".f-final").style.opacity = ease((t - (T_END - 1.0)) / 0.8);
    if (t < T_END + 2.6) raf = requestAnimationFrame(frame);
    else finish();
  };
  raf = requestAnimationFrame(frame);
}

/* ---------- afterwards: a verse to think about, and the choice to keep it ---------- */

function parseRef(ref) {
  const m = /^(\w+) (\d+):(\d+)(?:-(\d+))?$/.exec(ref);
  return m ? { book: m[1], chapter: +m[2], vs: +m[3], ve: m[4] ? +m[4] : +m[3] } : null;
}
async function verseText(ref) {
  const r = parseRef(ref);
  if (!r) return null;
  const ch = await bible.loadChapter(r.book, r.chapter);
  const text = ch.v
    .filter((v) => v.n >= r.vs && v.n <= r.ve)
    .map((v) => bible.plainVerse(v.t))
    .join(" ");
  return { ...r, text, label: bible.formatRef(r.book, r.chapter, r.vs, r.ve > r.vs ? r.ve : undefined) };
}

// the verse to think about: from your first word (the crisis one if it's there), else your feeling
function pickVerse(mine, feeling) {
  const c = mine.find((w) => w.crisis);
  if (c) return c.ref;
  if (mine.length) return mine[mine.length - 1].ref;
  const e = feeling && byKeywords(feeling);
  return e ? e.ref : "ISA 41:10";
}

async function endCard(mine, feeling, onEnd) {
  const ref = pickVerse(mine, feeling);
  const v = await verseText(ref).catch(() => null);
  const crisis = mine.some((w) => w.crisis);
  const el = document.createElement("div");
  el.className = "fight-end";
  el.innerHTML = `<div class="fight-card" role="dialog" aria-label="A verse to think about">
      ${
        mine.length
          ? `<div class="eyebrow">You gave these to Him</div>
             <ul class="fight-given">${mine.map((w) => `<li><s>${esc(w.d)}</s><span>${esc(w.a)}</span></li>`).join("")}</ul>`
          : ""
      }
      <div class="eyebrow" style="margin-top:${mine.length ? 18 : 0}px">A verse to think about</div>
      ${v ? `<blockquote class="quote">${esc(v.text)}</blockquote><div class="muted small" style="font-weight:600">${esc(v.label)}</div>` : ""}
      ${
        crisis
          ? `<div class="fight-help"><b>You matter, and you don't have to carry this alone.</b> If you're thinking about ending your life, please talk to someone right now: call or message a person you trust, or a helpline. In India, Tele-MANAS is free, any time: <a href="tel:14416">14416</a>. In an emergency, call <a href="tel:112">112</a>.</div>`
          : ""
      }
      <div class="actions">
        ${v ? `<a class="btn ghost" href="#/read/${v.book}/${v.chapter}?v=${v.vs}" data-fread>${icon("book")} Read it</a>` : ""}
        ${mine.length ? `<button class="btn ghost" data-fsave>Save as a prayer</button>` : ""}
        <button class="btn primary" data-fdone>Done</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  void el.offsetWidth; // apply the start state, then fade in
  el.classList.add("in");
  const close = () => {
    el.classList.remove("in");
    setTimeout(() => el.remove(), 300);
    onEnd?.();
  };
  el.querySelector("[data-fdone]").onclick = close;
  el.querySelector("[data-fread]")?.addEventListener("click", close);
  el.querySelector("[data-fsave]")?.addEventListener("click", (e) => {
    savePrayer(mine, feeling, v);
    e.target.disabled = true;
    e.target.textContent = "Saved ✓";
    toast("Saved to your journal. Your weekly review will ask how it went.");
  });
}

/* ---------- prayers (stored as notes of kind "prayer"; details live in body as JSON so they sync) ---------- */

export function savePrayer(mine, feeling, v) {
  const body = JSON.stringify({ words: mine.map((w) => [w.d, w.a, w.ref]), feeling: feeling || "", followup: "", followup_at: null });
  return store.put("notes", {
    id: "prayer." + store.uid(),
    kind: "prayer",
    book: v?.book || null,
    chapter: v?.chapter || null,
    verse_start: v?.vs || null,
    verse_end: v?.ve || null,
    body,
    created_at: store.nowISO(),
    deleted: false,
  });
}

export function prayerData(n) {
  try {
    const d = JSON.parse(n.body || "{}");
    return { words: d.words || [], feeling: d.feeling || "", followup: d.followup || "", followup_at: d.followup_at || null };
  } catch {
    return { words: [], feeling: "", followup: "", followup_at: null };
  }
}

export function setFollowup(n, text) {
  const d = prayerData(n);
  d.followup = text;
  d.followup_at = text ? store.nowISO() : null;
  return store.put("notes", { ...n, body: JSON.stringify(d) });
}

export function prayerTitle(n) {
  const d = prayerData(n);
  return d.words.map((w) => w[0]).join(" · ") || "A prayer";
}

// A saved prayer, for the journal and the weekly review: what you gave Him, the verse, and "How did it go?"
export function prayerHTML(n, { compact = false } = {}) {
  const d = prayerData(n);
  const when = new Date(n.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const ref = n.book ? bible.formatRef(n.book, n.chapter, n.verse_start, n.verse_end > n.verse_start ? n.verse_end : undefined) : "";
  const words = d.words.map((w) => `<s>${esc(w[0])}</s> <span class="muted">→</span> <b>${esc(w[1])}</b>`).join("<br>");
  const follow = d.followup
    ? `<div class="answered"><span class="muted small" style="font-weight:600">How it went · ${esc(new Date(d.followup_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }))}</span><br>${esc(d.followup)}</div>
       <button class="btn ghost small" data-follow-edit="${n.id}" style="margin-top:6px">Edit</button>`
    : `<textarea data-follow="${n.id}" placeholder="How did it go? Looking back, what did He do?"></textarea>
       <div style="display:flex;justify-content:flex-end;margin-top:6px"><button class="btn small" data-follow-save="${n.id}">Save</button></div>`;
  return `<div class="entry prayer">
    <div class="meta"><span class="kind">Prayer</span>${ref ? `<a href="#/read/${n.book}/${n.chapter}?v=${n.verse_start}">${esc(ref)}</a>` : ""}
      <span class="muted small">${esc(when)}</span><span class="spacer"></span>
      ${compact ? "" : `<button class="btn icon ghost" data-prayer-del="${n.id}" title="Delete">${icon("trash")}</button>`}</div>
    <div class="prayer-words">${words || esc(d.feeling)}</div>
    <div class="prayer-follow">${follow}</div>
  </div>`;
}

export function wirePrayers(root, redraw, confirmBox) {
  root.querySelectorAll("[data-follow-save]").forEach(
    (b) =>
      (b.onclick = () => {
        const n = store.get("notes", b.dataset.followSave);
        const ta = root.querySelector(`[data-follow="${CSS.escape(b.dataset.followSave)}"]`);
        const text = ta?.value.trim();
        if (!n || !text) return;
        setFollowup(n, text);
        toast("Saved. Thank you, Lord.");
        redraw();
      })
  );
  root.querySelectorAll("[data-follow-edit]").forEach(
    (b) =>
      (b.onclick = () => {
        const n = store.get("notes", b.dataset.followEdit);
        if (!n) return;
        const prev = prayerData(n).followup;
        const box = b.closest(".prayer-follow");
        box.innerHTML = `<textarea data-follow="${n.id}">${esc(prev)}</textarea><div style="display:flex;justify-content:flex-end;margin-top:6px"><button class="btn small" data-follow-save="${n.id}">Save</button></div>`;
        wirePrayers(box, redraw, confirmBox);
      })
  );
  root.querySelectorAll("[data-prayer-del]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (confirmBox && !(await confirmBox("Delete this prayer?", "Delete"))) return;
        store.remove("notes", b.dataset.prayerDel);
        toast("Deleted");
        redraw();
      })
  );
}
