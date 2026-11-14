// Little scenes for the hidden treasures. Each one has a beginning, a middle and an end,
// never blocks reading (pointer-events: none), and is skipped down to a short caption
// when the device asks for reduced motion.

const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function scene(cls, html, ms) {
  const el = document.createElement("div");
  el.className = "egg-layer fx " + cls;
  el.innerHTML = html;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), reduce() ? 1800 : ms);
  return el;
}
const cap = (text, delay = 0, cls = "") => `<div class="fx-cap ${cls}" style="animation-delay:${delay}s">${text}</div>`;
const rnd = (seed) => {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};
function shakePage(delay, dur = 0.8) {
  const main = document.querySelector("#view");
  if (!main || reduce()) return;
  setTimeout(() => {
    main.classList.add("fx-quake");
    setTimeout(() => main.classList.remove("fx-quake"), dur * 1000);
  }, delay * 1000);
}

/* ---------------- shapes ---------------- */
const WAVES = `<svg viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0 40c100-30 200-30 300 0s200 30 300 0 200-30 300 0 200 30 300 0v80H0z"/></svg>`;
const SHEEP = `<svg viewBox="0 0 120 90"><g class="legs" stroke="#3b3029" stroke-width="5" stroke-linecap="round"><path class="l1" d="M38 62v20"/><path class="l2" d="M54 62v20"/><path class="l3" d="M74 62v20"/><path class="l4" d="M88 62v20"/></g>
  <g fill="#fff" stroke="#d8cfc2" stroke-width="2"><circle cx="40" cy="44" r="18"/><circle cx="60" cy="36" r="20"/><circle cx="80" cy="42" r="18"/><circle cx="64" cy="54" r="18"/><circle cx="44" cy="56" r="14"/><circle cx="86" cy="56" r="13"/></g>
  <ellipse cx="102" cy="42" rx="12" ry="14" fill="#3b3029"/><ellipse cx="96" cy="32" rx="7" ry="4" fill="#3b3029" transform="rotate(-25 96 32)"/><circle cx="106" cy="40" r="2.2" fill="#fff"/></svg>`;
const DONKEY = `<svg viewBox="0 0 160 120"><g stroke="#5b5048" stroke-width="7" stroke-linecap="round" class="legs"><path class="l1" d="M44 74v34"/><path class="l2" d="M60 74v34"/><path class="l3" d="M96 74v34"/><path class="l4" d="M110 74v34"/></g>
  <path d="M30 50c0-14 18-22 50-22s46 8 52 18l14-26c8-2 14 2 14 10l-4 30c-2 8-10 10-18 6l-10 14c-10 8-30 10-54 8-26-2-44-10-44-38Z" fill="#8c8178"/>
  <path d="M138 22 132 0l-6 22M150 22l2-22-10 20" fill="#8c8178" stroke="#6d635b" stroke-width="2"/><path d="M28 48c-10 2-16 10-14 22" stroke="#6d635b" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="142" cy="36" r="2.6" fill="#222"/><path d="M146 56c4 2 8 1 10-2" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round" class="mouth"/></svg>`;
const LION = `<svg viewBox="0 0 160 150"><circle cx="80" cy="76" r="66" fill="#b8742a" stroke="#9a5d1d" stroke-width="10" stroke-dasharray="14 8"/><circle cx="80" cy="80" r="46" fill="#e8b45a"/>
  <g class="eyes-open"><circle cx="64" cy="70" r="5" fill="#2b1d0e"/><circle cx="96" cy="70" r="5" fill="#2b1d0e"/></g><g class="eyes-closed" stroke="#2b1d0e" stroke-width="3" fill="none" stroke-linecap="round"><path d="M58 70q6 5 12 0M90 70q6 5 12 0"/></g>
  <path d="M72 86h16l-8 8z" fill="#6b3d17"/><ellipse class="jaw" cx="80" cy="104" rx="14" ry="10" fill="#7a2a1a"/><path d="M70 96q10 8 20 0" stroke="#6b3d17" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
const JAR = `<svg viewBox="0 0 120 150"><defs><clipPath id="fxjar"><path d="M30 30h60l-6 12c18 10 26 30 22 56-4 26-20 42-46 42s-42-16-46-42c-4-26 4-46 22-56z"/></clipPath></defs>
  <g clip-path="url(#fxjar)"><rect class="liquid" x="0" y="46" width="120" height="150"/></g>
  <path d="M30 30h60l-6 12c18 10 26 30 22 56-4 26-20 42-46 42s-42-16-46-42c-4-26 4-46 22-56z" fill="none" stroke="#8a6a4a" stroke-width="5"/><path d="M26 26h68" stroke="#8a6a4a" stroke-width="7" stroke-linecap="round"/></svg>`;
const LOAF = `<svg viewBox="0 0 60 36"><ellipse cx="30" cy="20" rx="27" ry="14" fill="#c98b45"/><path d="M14 14q4 6 0 12M26 10q4 8 0 16M38 10q4 8 0 16M50 14q3 6 0 12" stroke="#e8b878" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
const FISH = `<svg viewBox="0 0 64 32"><path d="M2 16c10-12 30-14 44-4l14-9-4 13 4 13-14-9C32 30 12 28 2 16Z" fill="currentColor"/><circle cx="14" cy="13" r="2" fill="#fff"/></svg>`;
const FLAME = `<svg viewBox="0 0 24 36"><path d="M12 1c3 7 10 11 10 20a10 10 0 0 1-20 0c0-6 4-8 5-13 2 3 2 6 5 7-1-5-2-9 0-14Z" fill="#f59e0b"/><path d="M12 16c2 3 5 5 5 9a5 5 0 0 1-10 0c0-3 2-4 2-7 1 2 2 3 3 3 0-2-1-3 0-5Z" fill="#fde68a"/></svg>`;
const BOAT = `<svg viewBox="0 0 140 70"><path d="M6 36h128l-18 26H24Z" fill="#8a5a32"/><path d="M70 36V4l34 30z" fill="#efe6d6"/><path d="M70 4v32" stroke="#5a3a20" stroke-width="3"/></svg>`;
const PERSON = `<svg viewBox="0 0 40 80"><circle cx="20" cy="12" r="9" fill="currentColor"/><path d="M8 78 12 30h16l4 48z" fill="currentColor"/><path class="arm" d="M12 34 2 52M28 34l10 18" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`;
const MANGER = `<svg viewBox="0 0 160 110"><path d="M20 40h120l-16 40H36z" fill="#9a6a3a" stroke="#7a4f28" stroke-width="3"/><path d="M36 80 24 108M124 80l12 28M50 80l-6 28M110 80l6 28" stroke="#7a4f28" stroke-width="6" stroke-linecap="round"/>
  <path d="M30 42c10-8 16 2 24-6s14 4 24-4 14 6 24-2 14 4 24-2 10 6 16 2" stroke="#e8c76a" stroke-width="4" fill="none"/><ellipse cx="80" cy="34" rx="26" ry="11" fill="#fff8ec" stroke="#e8dcc4" stroke-width="2"/><circle cx="62" cy="30" r="8" fill="#f2d2b0"/></svg>`;
const STABLE = `<svg viewBox="0 0 160 110"><path d="M10 50 80 8l70 42" fill="none" stroke="#3a2c20" stroke-width="8" stroke-linejoin="round"/><rect x="24" y="48" width="112" height="60" fill="#3a2c20"/><path d="M64 108V74h32v34" fill="#f5d27a"/></svg>`;
const BUSH = `<svg viewBox="0 0 160 110"><g fill="#3f7d3a"><circle cx="40" cy="70" r="30"/><circle cx="80" cy="56" r="38"/><circle cx="120" cy="70" r="30"/><circle cx="60" cy="86" r="24"/><circle cx="102" cy="86" r="24"/></g><g fill="#5a9c4f"><circle cx="70" cy="46" r="10"/><circle cx="106" cy="62" r="8"/><circle cx="44" cy="62" r="7"/></g></svg>`;
const LADDER = `<svg viewBox="0 0 120 600" preserveAspectRatio="none"><g stroke="#f2c94c" stroke-width="6" stroke-linecap="round" fill="none"><path d="M20 600 40 0M100 600 80 0"/>${Array.from({ length: 14 }, (_, i) => { const y = 580 - i * 42; const k = y / 600; return `<path d="M${20 + 20 * (1 - k)} ${y}H${100 - 20 * (1 - k)}"/>`; }).join("")}</g></svg>`;
const TOMB = `<div class="fx-tomb"><div class="egg-tomb-glow"></div><div class="egg-tomb-hill"></div><div class="egg-tomb-door"></div><div class="egg-tomb-stone"></div></div>`;
const WING = `<svg viewBox="0 0 120 160"><g fill="rgba(255,250,230,.92)" stroke="rgba(214,170,60,.6)" stroke-width="1.5">${Array.from({ length: 7 }, (_, i) => `<ellipse cx="${100 - i * 10}" cy="${40 + i * 14}" rx="${46 - i * 3}" ry="11" transform="rotate(${-40 + i * 12} ${100 - i * 10} ${40 + i * 14})"/>`).join("")}</g></svg>`;
const CLOTH = `<div class="fx-cloth"><div class="fx-cloth-in"></div></div>`;

function stars(n, seed, cls = "fx-star") {
  const r = rnd(seed);
  return Array.from({ length: n }, (_, i) => `<i class="${cls}" style="left:${(r() * 100).toFixed(1)}%;top:${(r() * 62).toFixed(1)}%;animation-delay:${(0.6 + r() * 2.2).toFixed(2)}s;--s:${(0.6 + r() * 1.2).toFixed(2)}"></i>`).join("");
}

/* ---------------- the scenes ---------------- */
export const FX = {
  // Genesis 1:3: darkness, then light bursts out from a single point
  light: () => scene("fx-light", `<div class="fx-dark"></div><div class="fx-burst"></div>${cap("“Let there be light.”", 1.7, "big dark")}`, 4200),

  // Genesis 1:16: day turns to night, the moon rises and the stars come out
  stars: () =>
    scene("fx-stars", `<div class="fx-night"></div><div class="fx-sun"></div><div class="fx-moon"></div>${stars(46, 7)}<div class="fx-shoot"></div>${cap("He also made the stars.", 3.2, "light")}`, 6400),

  // Genesis 28:12: a golden stairway reaches to heaven, angels going up and down
  ladder: () =>
    scene(
      "fx-ladder",
      `<div class="fx-night"></div>${stars(26, 3)}<div class="fx-ladder-in">${LADDER}</div>${[0, 1, 2, 3].map((i) => `<i class="fx-angel ${i % 2 ? "down" : "up"}" style="animation-delay:${(1.6 + i * 0.5).toFixed(1)}s"></i>`).join("")}${cap("…its top reached to heaven.", 3, "light")}`,
      6600
    ),

  // Exodus 3:2: the bush burns, and is not consumed
  bush: () =>
    scene(
      "fx-bush",
      `<div class="fx-warm"></div><div class="fx-bush-in">${BUSH}${[0, 1, 2, 3, 4, 5].map((i) => `<span class="fx-flame" style="left:${14 + i * 14}%;animation-delay:${(0.9 + (i % 3) * 0.15).toFixed(2)}s">${FLAME}</span>`).join("")}</div>${cap("…and the bush was not consumed.", 2.6)}`,
      6000
    ),

  // Exodus 14:21: the text parts, water walls rise on both sides, a path of sand between
  sea: (ctx, helpers) => helpers.partSea(true),

  // Exodus 16:14: manna falls like frost and settles on the ground
  manna: () => {
    const r = rnd(11);
    const flakes = Array.from({ length: 60 }, () => `<i style="left:${(r() * 100).toFixed(1)}%;animation-delay:${(r() * 2.6).toFixed(2)}s;animation-duration:${(2.6 + r() * 1.6).toFixed(2)}s"></i>`).join("");
    return scene("fx-manna", `<div class="fx-morning"></div>${flakes}<div class="fx-ground"></div>${cap("“What is it?”", 3.2)}`, 6400);
  },

  // Numbers 22:28: the donkey walks in, stops, and speaks
  donkey: () =>
    scene("fx-donkey", `<div class="fx-walker">${DONKEY}<div class="fx-bubble">“What have I done to you?”</div></div>`, 7000),

  // 1 Kings 19:12: wind, earthquake, fire, and then a still small voice
  voice: () => {
    shakePage(1.3, 0.9);
    const r = rnd(5);
    const gusts = Array.from({ length: 14 }, () => `<i style="top:${(r() * 90).toFixed(0)}%;animation-delay:${(r() * 0.9).toFixed(2)}s;width:${(20 + r() * 40).toFixed(0)}vw"></i>`).join("");
    return scene("fx-voice", `<div class="fx-gusts">${gusts}</div><div class="fx-fireflash"></div><div class="fx-hush"></div><div class="fx-whisper">a still small voice</div>`, 6600);
  },

  // Daniel 6:22: the lion roars… then an angel's light shuts its mouth and it lies down
  lions: () =>
    scene("fx-lions", `<div class="fx-dusk"></div><div class="fx-beam"></div><div class="fx-lion">${LION}<div class="fx-zzz">z z z</div></div>${cap("“My God has sent his angel, and has shut the lions’ mouths.”", 3, "light")}`, 6600),

  // Tobit 5:4: wings of light unfold around a glowing figure
  raphael: () =>
    scene("fx-raphael", `<div class="fx-softglow"></div><div class="fx-wings"><div class="w l">${WING}</div><div class="fx-core"></div><div class="w r">${WING}</div></div>${cap("…and found Raphael, who was an angel.", 2.4)}`, 5800),

  // Matthew 2:9: the star travels across the night and stops over the stable
  bethlehem: () =>
    scene("fx-bethlehem", `<div class="fx-night"></div>${stars(30, 21)}<div class="fx-stable">${STABLE}</div><div class="fx-traveller">✦</div><div class="fx-starbeam"></div>${cap("…and stood over where the young child was.", 3.4, "light")}`, 6800),

  // Matthew 14:29: Peter steps out of the boat and walks on the water towards the light
  waterwalk: () =>
    scene(
      "fx-waterwalk",
      `<div class="fx-dusk soft"></div><div class="egg-sea back">${WAVES}</div><div class="fx-boat">${BOAT}</div><div class="fx-peter">${PERSON}</div><div class="fx-jesus-light"></div><div class="egg-sea front">${WAVES}</div>${cap("“Come!”", 1.2, "light big")}`,
      7400
    ),

  // Mark 4:39: a storm rages… "Peace! Be still!"… and there is a great calm
  storm: () => {
    shakePage(0.3, 2.2);
    const r = rnd(9);
    const rain = Array.from({ length: 70 }, () => `<i style="left:${(r() * 105).toFixed(1)}%;animation-delay:${(r() * 0.8).toFixed(2)}s"></i>`).join("");
    return scene("fx-storm", `<div class="fx-stormsky"></div><div class="fx-rain">${rain}</div><div class="fx-bolt"></div><div class="egg-sea back">${WAVES}</div><div class="egg-sea front">${WAVES}</div><div class="fx-calmword">“Peace! Be still!”</div>`, 7000);
  },

  // Psalm 23:2: ripples spread on still water, and a sheep wanders by
  still: (ctx) => {
    const x = ctx.x ?? innerWidth / 2;
    const y = ctx.y ?? innerHeight / 2;
    return scene("fx-still", `<div class="fx-pool"></div>${[0, 1, 2, 3].map((i) => `<span class="fx-ring" style="left:${x}px;top:${y}px;animation-delay:${i * 0.35}s"></span>`).join("")}<div class="fx-sheepwalk">${SHEEP}</div>${cap("He leads me beside still waters.", 2.6)}`, 6400);
  },

  // Luke 15:5: the lost sheep is found, and the shepherd rejoices
  sheep: () =>
    scene("fx-lost", `<div class="fx-sheephop">${SHEEP}<div class="fx-heart">♥</div></div>${cap("When he has found it, he carries it on his shoulders, rejoicing.", 2.8)}`, 6200),

  // Luke 2:7: a manger, glowing softly under a star
  manger: () => scene("fx-manger", `<div class="fx-night soft"></div><div class="fx-mangerstar">✦</div><div class="fx-mangerglow"></div><div class="fx-manger-in">${MANGER}</div>${cap("…and laid him in a feeding trough.", 2.4, "light")}`, 5800),

  // Luke 2:13: the sky fills with the heavenly host
  host: () => {
    const r = rnd(13);
    const lights = Array.from({ length: 40 }, () => `<i style="left:${(r() * 96).toFixed(1)}%;top:${(4 + r() * 55).toFixed(1)}%;animation-delay:${(0.5 + r() * 2.2).toFixed(2)}s"></i>`).join("");
    return scene("fx-host", `<div class="fx-night"></div>${lights}<div class="fx-gloria">Glory to God in the highest</div>`, 6600);
  },

  // John 2:9: a jar fills with water, and the water becomes wine
  wine: () => scene("fx-wine", `<div class="fx-softglow"></div><div class="fx-jar">${JAR}<i></i><i></i><i></i></div>${cap("…the water now become wine.", 3.1)}`, 6000),

  // John 6:11: five loaves and two fish… multiplied
  loaves: () => {
    const r = rnd(17);
    const many = Array.from({ length: 34 }, (_, i) => {
      const a = r() * Math.PI * 2;
      const d = 30 + r() * 46;
      return `<span class="fx-many ${i % 3 ? "loaf" : "fish"}" style="--x:${(Math.cos(a) * d).toFixed(0)}vmin;--y:${(Math.sin(a) * d * 0.8).toFixed(0)}vmin;animation-delay:${(2 + r() * 0.8).toFixed(2)}s">${i % 3 ? LOAF : FISH}</span>`;
    }).join("");
    const five = [0, 1, 2, 3, 4].map((i) => `<span class="fx-one loaf" style="--i:${i};animation-delay:${(0.4 + i * 0.18).toFixed(2)}s">${LOAF}</span>`).join("");
    const two = [0, 1].map((i) => `<span class="fx-one fish" style="--i:${i + 5};animation-delay:${(1.3 + i * 0.18).toFixed(2)}s">${FISH}</span>`).join("");
    return scene("fx-loaves", `<div class="fx-softglow"></div><div class="fx-basket">${five}${two}${many}</div>${cap("…as much as they desired.", 3.4)}`, 6600);
  },

  // John 11:35: a single tear falls… and lands with a splash
  wept: () =>
    scene("fx-wept", `<div class="fx-tear"></div><div class="fx-splash">${Array.from({ length: 8 }, (_, i) => `<i style="--a:${i * 45}deg"></i>`).join("")}<b></b></div>${cap("The shortest verse in the Bible.", 2.4)}`, 5200),

  // John 20:7: the face cloth, folded and set by itself
  cloth: () => scene("fx-clothscene", `<div class="fx-dawn"></div>${CLOTH}${cap("…rolled up in a place by itself.", 2.6)}`, 5600),

  // John 20:29: blessed are those who have not seen, and have believed
  notseen: () => scene("fx-notseen", `<div class="fx-dark soft"></div><div class="fx-heartglow">♥</div>${cap("Blessed are those who have not seen and have believed.", 1.8, "light")}`, 5600),

  // John 21:11: a net sweeps in, fills with fish, and is lifted without tearing
  net: () => {
    const r = rnd(4);
    const fish = Array.from({ length: 12 }, (_, i) => `<span style="--tx:${(10 + r() * 60).toFixed(0)}%;--ty:${(25 + r() * 50).toFixed(0)}%;animation-delay:${(0.8 + i * 0.12).toFixed(2)}s">${FISH}</span>`).join("");
    return scene(
      "fx-net",
      `<div class="egg-sea back">${WAVES}</div><div class="fx-catch"><svg viewBox="0 0 200 140" class="fx-netsvg"><path d="M4 8h192l-20 100c-30 30-122 30-152 0z" fill="rgba(240,230,210,.25)"/><g stroke="#c8b08a" stroke-width="1.6" fill="none">${Array.from({ length: 9 }, (_, i) => `<path d="M${14 + i * 22} 8 ${40 + i * 15} 128"/>`).join("")}${Array.from({ length: 6 }, (_, i) => `<path d="M${6 + i * 5} ${20 + i * 20}h${188 - i * 10}"/>`).join("")}</g><path d="M4 8h192" stroke="#8a6a3a" stroke-width="4"/></svg><div class="fx-netfish">${fish}</div></div><div class="egg-sea front">${WAVES}</div>${cap("153 great fish, and the net wasn’t torn.", 3)}`,
      6600
    );
  },

  // Matthew 28:2: an earthquake, an angel of light descends, and the stone is rolled away
  stone: () => {
    shakePage(0.2, 1.1);
    return scene("fx-stonescene", `<div class="fx-angelbeam"></div>${TOMB}${cap("…and rolled away the stone from the door.", 3)}`, 6400);
  },

  // Acts 2:3: a rushing wind sweeps across the page, then tongues of fire settle one by one
  fire: () => {
    const r = rnd(2);
    const gusts = Array.from({ length: 16 }, () => `<i style="top:${(r() * 90).toFixed(0)}%;animation-delay:${(r() * 0.9).toFixed(2)}s;width:${(20 + r() * 45).toFixed(0)}vw"></i>`).join("");
    const target = document.querySelector(".reader-title") || document.querySelector(".brand");
    const rc = target.getBoundingClientRect();
    const fy = Math.max(2, rc.top - 30);
    const flames = Array.from({ length: 5 }, (_, i) => `<span class="fx-tongue" style="left:${rc.left + ((i + 0.5) * rc.width) / 5 - 9}px;top:${fy}px;animation-delay:${(1.3 + i * 0.25).toFixed(2)}s">${FLAME}</span>`).join("");
    return scene("fx-fire", `<div class="fx-gusts">${gusts}</div>${flames}${cap("Tongues like fire appeared… and one sat on each of them.", 2.8)}`, 6200);
  },

  // Revelation 21:5: everything washes white, then blooms with colour, all things new
  newall: () => {
    const cols = ["#f6c453", "#e86a7a", "#7cc6a4", "#6a9ee8", "#b98be0", "#f29b5c"];
    const blooms = cols.map((c, i) => `<i style="background:${c};left:${15 + ((i * 37) % 70)}%;top:${25 + ((i * 23) % 45)}%;animation-delay:${(1.2 + i * 0.18).toFixed(2)}s"></i>`).join("");
    return scene("fx-new", `<div class="fx-white"></div>${blooms}${cap("“Behold, I am making all things new.”", 2.2, "big dark")}`, 6000);
  },
};

export const has = (name) => Object.prototype.hasOwnProperty.call(FX, name);
export function run(name, ctx = {}, helpers = {}) {
  if (reduce()) {
    // keep it to a short caption
    return scene("fx-reduced", `<div class="fx-cap" style="animation:none;opacity:1">✦</div>`, 1200);
  }
  return FX[name](ctx, helpers);
}
