// Hidden treasures ("For the kingdom of heaven is like treasure hidden in a field", Matthew 13:44).
// Small, reverent surprises found by reading, tapping, praying at certain hours, and keeping a rhythm.
// Found treasures are stored as notes of kind "treasure", so they sync like everything else.
import * as store from "./store.js";
import * as act from "./activity.js";
import * as bible from "./bible.js";
import { esc, icon } from "./ui.js";
import * as fx from "./eggfx.js";

export const TREASURES = [
  // ---- in the Scriptures (tap the verse) ----
  { id: "light", group: "scripture", where: ["GEN", 1, 3], title: "Let there be light", hint: "On the first day, something is spoken into being.", how: "Tap Genesis 1:3 while reading.", fx: "light" },
  { id: "rainbow", group: "scripture", where: ["GEN", 9, 13], title: "The sign in the clouds", hint: "A promise after the flood has colours.", how: "Tap Genesis 9:13 while reading.", fx: "rainbow" },
  { id: "sea", group: "scripture", where: ["EXO", 14, 21], title: "The sea parts", hint: "Moses stretches out his hand.", how: "Tap Exodus 14:21 while reading.", fx: "sea" },
  { id: "fish", group: "scripture", where: ["JON", 1, 17], title: "A great fish", hint: "Someone is swallowed, and not by the sea.", how: "Tap Jonah 1:17 while reading.", fx: "whale" },
  { id: "still", group: "scripture", where: ["PSA", 23, 2], title: "Still waters", hint: "The shepherd leads somewhere calm.", how: "Tap Psalm 23:2 while reading.", fx: "still" },
  { id: "wept", group: "scripture", where: ["JHN", 11, 35], title: "Jesus wept", hint: "The shortest verse in the Bible.", how: "Tap John 11:35 while reading.", fx: "wept" },
  { id: "net", group: "scripture", where: ["JHN", 21, 11], title: "One hundred fifty-three", hint: "A net that should have torn, but didn't.", how: "Tap John 21:11 while reading.", fx: "net" },
  { id: "fire", group: "scripture", where: ["ACT", 2, 3], title: "Tongues of fire", hint: "Pentecost, as it happened.", how: "Tap Acts 2:3 while reading.", fx: "fire" },
  { id: "stars", group: "scripture", where: ["GEN", 1, 16], title: "He also made the stars", hint: "On the fourth day, the lights of the sky.", how: "Tap Genesis 1:16 while reading.", fx: "stars" },
  { id: "ladder", group: "scripture", where: ["GEN", 28, 12], title: "A stairway to heaven", hint: "Jacob falls asleep on a stone pillow.", how: "Tap Genesis 28:12 while reading.", fx: "ladder" },
  { id: "bush", group: "scripture", where: ["EXO", 3, 2], title: "The bush that did not burn up", hint: "Moses notices something strange on the mountain.", how: "Tap Exodus 3:2 while reading.", fx: "bush" },
  { id: "manna", group: "scripture", where: ["EXO", 16, 14], title: "Bread from heaven", hint: "Something small and round covers the ground one morning.", how: "Tap Exodus 16:14 while reading.", fx: "manna" },
  { id: "donkey", group: "scripture", where: ["NUM", 22, 28], title: "The donkey speaks", hint: "Balaam's journey is interrupted by an unexpected voice.", how: "Tap Numbers 22:28 while reading.", fx: "donkey" },
  { id: "voice", group: "scripture", where: ["1KI", 19, 12], title: "A still small voice", hint: "Not in the wind, nor the earthquake, nor the fire.", how: "Tap 1 Kings 19:12 while reading.", fx: "voice" },
  { id: "lions", group: "scripture", where: ["DAN", 6, 22], title: "The lions' mouths are shut", hint: "A night spent in a den.", how: "Tap Daniel 6:22 while reading.", fx: "lions" },
  { id: "raphael", group: "scripture", where: ["TOB", 5, 4], title: "Raphael", hint: "Tobias looks for a travelling companion.", how: "Tap Tobit 5:4 while reading.", fx: "raphael" },
  { id: "bethlehem", group: "scripture", where: ["MAT", 2, 9], title: "The star stood still", hint: "The wise men follow a light.", how: "Tap Matthew 2:9 while reading.", fx: "bethlehem" },
  { id: "waterwalk", group: "scripture", where: ["MAT", 14, 29], title: "Walking on the water", hint: "Peter hears one word: “Come.”", how: "Tap Matthew 14:29 while reading.", fx: "waterwalk" },
  { id: "storm", group: "scripture", where: ["MRK", 4, 39], title: "Peace! Be still!", hint: "A storm on the lake, and someone asleep in the boat.", how: "Tap Mark 4:39 while reading.", fx: "storm" },
  { id: "sheep", group: "scripture", where: ["LUK", 15, 5], title: "The lost sheep is found", hint: "One out of a hundred wandered off.", how: "Tap Luke 15:5 while reading.", fx: "sheep" },
  { id: "manger", group: "scripture", where: ["LUK", 2, 7], title: "Laid in a manger", hint: "There was no room at the inn.", how: "Tap Luke 2:7 while reading.", fx: "manger" },
  { id: "host", group: "scripture", where: ["LUK", 2, 13], title: "The heavenly host", hint: "Shepherds in the fields at night.", how: "Tap Luke 2:13 while reading.", fx: "host" },
  { id: "wine", group: "scripture", where: ["JHN", 2, 9], title: "Water into wine", hint: "A wedding runs out of something.", how: "Tap John 2:9 while reading.", fx: "wine" },
  { id: "loaves", group: "scripture", where: ["JHN", 6, 11], title: "Five loaves and two fish", hint: "A boy's lunch feeds a crowd.", how: "Tap John 6:11 while reading.", fx: "loaves" },
  { id: "cloth", group: "scripture", where: ["JHN", 20, 7], title: "The folded cloth", hint: "Look closely inside the empty tomb.", how: "Tap John 20:7 while reading.", fx: "cloth" },
  { id: "notseen", group: "scripture", where: ["JHN", 20, 29], title: "Blessed are those who have not seen", hint: "Thomas finally believes.", how: "Tap John 20:29 while reading.", fx: "notseen" },
  { id: "stone", group: "scripture", where: ["MAT", 28, 2], title: "The stone rolled away", hint: "An earthquake at dawn on the first day of the week.", how: "Tap Matthew 28:2 while reading.", fx: "stone" },
  { id: "newall", group: "scripture", where: ["REV", 21, 5], title: "All things new", hint: "The very end of the story.", how: "Tap Revelation 21:5 while reading.", fx: "newall" },
  // ---- hidden gestures ----
  { id: "lamp", group: "gesture", title: "A lamp to my feet", hint: "Seven is the number of completeness. Try it on the little book at the top.", how: "Tap the book icon in the header 7 times quickly.", verse: ["PSA", 119, 105], fx: "lamp" },
  { id: "bestill", group: "gesture", title: "Be still", hint: "When everything is shaking…", how: "Shake your phone.", verse: ["PSA", 46, 10], fx: "bestill" },
  { id: "seek", group: "gesture", title: "Seek and you will find", hint: "On the Today page, look beyond the top.", how: "On the Today page, pull down past the top (or scroll up hard on a computer).", verse: ["MAT", 7, 7], fx: "seek" },
  { id: "fight", group: "gesture", title: "The Lord will fight for you", hint: "When a feeling is heavy, you don't have to carry it alone.", how: "In Topics, choose a heavy feeling (like Fear or Worry) and tap “Let Him fight for you”.", verse: ["EXO", 14, 14], fx: "fight" },
  { id: "amen", group: "gesture", title: "Amen", hint: "How do prayers end?", how: "End a note with the word “Amen” and save it.", verse: ["PSA", 106, 48], fx: "amen" },
  // ---- seasons and hours ----
  { id: "christmas", group: "season", title: "Glory to God in the highest", hint: "Comes on Christmas Eve and Christmas Day.", how: "Open the app on 24 or 25 December.", verse: ["LUK", 2, 14], fx: "snow" },
  { id: "easter", group: "season", title: "He is risen", hint: "Comes on Easter Sunday.", how: "Open the app on Easter Sunday.", verse: ["MAT", 28, 6], fx: "tomb" },
  { id: "pentecost", group: "season", title: "Come, Holy Spirit", hint: "Comes fifty days after Easter.", how: "Open the app on Pentecost Sunday.", verse: ["ACT", 2, 3], fx: "pentecost" },
  { id: "ashes", group: "season", title: "Return to the Lord", hint: "Comes at the start of Lent.", how: "Open the app on Ash Wednesday.", verse: ["JOL", 2, 13], fx: "ashes" },
  { id: "goodfriday", group: "season", title: "It is finished", hint: "Comes two days before Easter.", how: "Open the app on Good Friday.", verse: ["JHN", 19, 30], fx: "goodfriday" },
  { id: "mercy", group: "season", title: "The Hour of Mercy", hint: "Read at three in the afternoon.", how: "Open a chapter between 3 and 4 pm.", verse: ["PSA", 136, 1], fx: "mercy" },
  { id: "watch", group: "season", title: "Watch with me one hour", hint: "Read when the world is asleep.", how: "Open a chapter between midnight and 4 am.", verse: ["MAT", 26, 40], fx: "watch" },
  // ---- milestones ----
  { id: "streak3", group: "milestone", title: "On the third day", hint: "Read 3 days in a row.", how: "Keep a 3-day reading streak.", verse: ["LUK", 24, 6], need: 3, fx: "badge" },
  { id: "streak7", group: "milestone", title: "Sabbath rest", hint: "Read 7 days in a row.", how: "Keep a 7-day reading streak.", verse: ["GEN", 2, 2], need: 7, fx: "badge" },
  { id: "streak12", group: "milestone", title: "The Twelve", hint: "Read 12 days in a row.", how: "Keep a 12-day reading streak.", verse: ["LUK", 6, 13], need: 12, fx: "badge" },
  { id: "streak40", group: "milestone", title: "Forty days in the desert", hint: "Read 40 days in a row.", how: "Keep a 40-day reading streak.", verse: ["MAT", 4, 2], need: 40, fx: "dove" },
  { id: "psalm119", group: "milestone", title: "The longest chapter", hint: "Finish the longest chapter in the Bible.", how: "Read all of Psalm 119.", verse: ["PSA", 119, 105], fx: "badge" },
  { id: "bible", group: "milestone", title: "Well done, good and faithful servant", hint: "Read every chapter of the Bible.", how: "Read all 1,328 chapters.", verse: ["MAT", 25, 21], fx: "bible" },
];
const byId = Object.fromEntries(TREASURES.map((t) => [t.id, t]));

/* ---------- found state (synced) ---------- */
export const treasureNoteId = (id) => "treasure." + id;
export function isFound(id) {
  return !!store.get("notes", treasureNoteId(id));
}
export function foundCount() {
  return TREASURES.filter((t) => isFound(t.id)).length;
}
export function foundAt(id) {
  return store.get("notes", treasureNoteId(id))?.created_at || null;
}

const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const today = () => store.localDate();

// Find a treasure: play its effect, then show the "found" card.
// Already-found treasures still play their effect (that's part of the joy), but quietly and without the card.
export function find(id, ctx = {}) {
  const t = byId[id];
  if (!t) return;
  const first = !isFound(id);
  if (first) store.put("notes", { id: treasureNoteId(id), kind: "treasure", body: id, deleted: false });
  // seasonal / hourly ones only announce themselves once per day
  const key = "egg-seen:" + id;
  if (!first && (t.group === "season" || t.group === "milestone")) {
    if (sessionStorage.getItem(key)) return;
  }
  try {
    sessionStorage.setItem(key, "1");
  } catch {}
  playEffect(t, ctx);
  if (first) setTimeout(() => foundCard(t), t.fx === "bible" ? 9000 : 1400);
}

// For treasures whose scene plays itself (like "fight"): just record it and show the found card.
export function discover(id) {
  const t = byId[id];
  if (!t || isFound(id)) return;
  store.put("notes", { id: treasureNoteId(id), kind: "treasure", body: id, deleted: false });
  foundCard(t);
}

/* ---------- effects ---------- */
function layer(cls, html = "", ms = 3000) {
  const el = document.createElement("div");
  el.className = "egg-layer " + cls;
  el.innerHTML = html;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), reduce() ? 1500 : ms);
  return el;
}

const quoted = (v) => (/^[“"‘]/.test(v) ? v : `“${v}”`);
async function verseLine(ref) {
  if (!ref) return "";
  const ch = await bible.loadChapter(ref[0], ref[1]);
  const v = ch.v.find((x) => x.n === ref[2]);
  return v ? bible.plainVerse(v.t) : "";
}

function banner(text, ref, cls = "") {
  const r = ref ? bible.formatRef(ref[0], ref[1], ref[2]) : "";
  return layer("egg-banner " + cls, `<div class="egg-banner-in"><div class="egg-banner-text">${bible.verseHTML(text)}</div>${r ? `<div class="egg-banner-ref">${esc(r)}</div>` : ""}</div>`, 4200);
}

const FISH = `<svg viewBox="0 0 64 32"><path d="M2 16c10-12 30-14 44-4l14-9-4 13 4 13-14-9C32 30 12 28 2 16Z" fill="currentColor"/><circle cx="14" cy="13" r="2" fill="#fff"/></svg>`;
const WHALE_OLD = `<svg viewBox="0 0 220 110"><path d="M8 62c0-30 40-48 92-48 48 0 80 20 92 40l20-26c4 14 2 28-8 38 10 8 12 22 8 34l-22-22c-14 18-50 28-90 28C42 106 8 92 8 62Z" fill="currentColor"/><circle cx="48" cy="54" r="4" fill="#fff"/><path d="M60 22c-4-10 2-18 10-18M70 22c0-12 10-16 16-12" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
// a friendly whale facing right; blowhole at (158, 24)
const WHALE = `<svg viewBox="0 0 230 120" class="egg-whale-svg">
  <path d="M8 34 34 58 10 86c22-4 38-12 50-18 16 30 66 42 108 34 36-7 56-26 54-48-2-24-30-42-70-44-46-2-80 16-98 40C42 46 26 38 8 34Z" fill="#3d6a99"/>
  <path d="M62 70c20 22 62 30 102 24 26-4 44-14 52-28-18 12-52 18-86 16-28-2-50-6-68-12Z" fill="#a9c6e3"/>
  <circle cx="190" cy="54" r="4.5" fill="#fff"/><circle cx="191" cy="54" r="2.4" fill="#1d2b3a"/>
  <path d="M182 70c6 4 14 4 20 0" stroke="#1d2b3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M110 74c6 14 2 26-10 34 18-2 28-12 28-26" fill="#335c86"/>
  <ellipse cx="158" cy="24" rx="5" ry="2.2" fill="#24496f"/>
</svg>`;
const WAVES = `<svg viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0 40c100-30 200-30 300 0s200 30 300 0 200-30 300 0 200 30 300 0v80H0z"/></svg>`;
// seven bands, drawn from bottom-left, over the top, to bottom-right
const RAINBOW = (() => {
  const colors = ["#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#3949ab", "#8e24aa"];
  const bands = colors
    .map((c, i) => {
      const r = 300 - i * 14;
      return `<path d="M ${320 - r} 330 A ${r} ${r} 0 0 1 ${320 + r} 330" pathLength="1" stroke="${c}" style="animation-delay:${(i * 0.09).toFixed(2)}s"/>`;
    })
    .join("");
  return `<svg viewBox="0 0 640 340" class="egg-rainbow-svg">${bands}</svg>`;
})();
const FLAME = `<svg viewBox="0 0 24 36"><path d="M12 1c3 7 10 11 10 20a10 10 0 0 1-20 0c0-6 4-8 5-13 2 3 2 6 5 7-1-5-2-9 0-14Z" fill="#f59e0b"/><path d="M12 16c2 3 5 5 5 9a5 5 0 0 1-10 0c0-3 2-4 2-7 1 2 2 3 3 3 0-2-1-3 0-5Z" fill="#fde68a"/></svg>`;
const DOVE = `<svg viewBox="0 0 120 80"><path d="M8 44c18-2 30 4 40 14 6-14 2-34-12-48 22 6 36 24 38 42 10-10 26-14 42-10-10 6-16 14-18 22-6 18-34 26-60 16C28 74 16 62 8 44Z" fill="#fff" stroke="#c9a227" stroke-width="2"/><circle cx="96" cy="44" r="2.5" fill="#333"/></svg>`;

export function playEffect(t, ctx = {}) {
  const r = reduce();
  if (fx.has(t.fx)) return fx.run(t.fx, ctx, { partSea });
  switch (t.fx) {
    case "fight":
      import("./fight.js").then((m) => m.open({}));
      break;
    case "light":
      layer("egg-light", "", 2600);
      break;
    case "rainbow":
      layer("egg-rainbow", RAINBOW + '<div class="egg-rainbow-glint"></div>', 4600);
      break;
    case "sea":
      partSea();
      break;
    case "whale": {
      const drops = Array.from({ length: 14 }, (_, i) => {
        const a = -90 + (i - 6.5) * 9; // fan of droplets
        const d = 60 + (i % 4) * 16;
        const x = Math.cos((a * Math.PI) / 180) * d;
        const y = Math.sin((a * Math.PI) / 180) * d;
        return `<i style="--x:${x.toFixed(0)}px;--y:${y.toFixed(0)}px;animation-delay:${(2.35 + (i % 5) * 0.06).toFixed(2)}s"></i>`;
      }).join("");
      layer(
        "egg-whale",
        `<div class="egg-sea back">${WAVES}</div>
         <div class="egg-whale-swim"><div class="egg-whale-bob">${WHALE}<div class="egg-spout"><div class="egg-plume"></div>${drops}</div></div></div>
         <div class="egg-sea front">${WAVES}</div>`,
        7200
      );
      break;
    }
    case "ripple": {
      const x = ctx.x ?? innerWidth / 2;
      const y = ctx.y ?? innerHeight / 2;
      layer("egg-ripples", [0, 1, 2, 3].map((i) => `<span style="left:${x}px;top:${y}px;animation-delay:${i * 0.35}s"></span>`).join(""), 3600);
      break;
    }
    case "tear":
      layer("egg-tear", '<div class="egg-drop"></div><div class="egg-caption">The shortest verse in the Bible.</div>', 4200);
      break;
    case "fishes":
      layer("egg-fishes", Array.from({ length: 7 }, (_, i) => `<span style="top:${18 + ((i * 37) % 64)}%;animation-delay:${(i * 0.28).toFixed(2)}s;animation-duration:${(4 + (i % 3) * 0.7).toFixed(1)}s">${FISH}</span>`).join("") + '<div class="egg-caption">153 great fish, and the net wasn’t torn.</div>', 6500);
      break;
    case "flames":
    case "pentecost": {
      const target = document.querySelector(t.fx === "flames" ? ".reader-title" : ".brand");
      if (!target) break;
      const rc = target.getBoundingClientRect();
      const n = t.fx === "flames" ? 5 : 3;
      const fy = Math.max(2, rc.top - 30);
      layer("egg-flames", Array.from({ length: n }, (_, i) => `<span style="left:${rc.left + ((i + 0.5) * rc.width) / n - 9}px;top:${fy}px;animation-delay:${i * 0.12}s">${FLAME}</span>`).join(""), 3800);
      if (t.fx === "pentecost") verseLine(t.verse).then((v) => banner(v, t.verse));
      break;
    }
    case "lamp": {
      const icon = document.querySelector(".brand svg");
      if (icon && !r) {
        icon.classList.remove("egg-flutter");
        void icon.getBoundingClientRect();
        icon.classList.add("egg-flutter");
      }
      verseLine(t.verse).then((v) => banner(v, t.verse, "glow"));
      break;
    }
    case "bestill":
      verseLine(t.verse).then((v) => layer("egg-still", `<div class="egg-still-in">${bible.verseHTML(v.split(".")[0] + ".")}</div><div class="egg-banner-ref">Psalm 46:10</div>`, 4200));
      break;
    case "seek":
      verseLine(t.verse).then((v) => banner(v, t.verse, "top"));
      break;
    case "amen":
      layer("egg-amen", '<div class="egg-amen-in">Amen</div>', 2600);
      break;
    case "snow":
      layer("egg-snow", Array.from({ length: r ? 0 : 46 }, (_, i) => `<i style="left:${(i * 53) % 100}%;animation-delay:${((i * 0.37) % 5).toFixed(2)}s;animation-duration:${(5 + (i % 5)).toFixed(1)}s;transform:scale(${0.5 + (i % 4) * 0.25})"></i>`).join("") + '<div class="egg-star">✦</div>', 11000);
      verseLine(t.verse).then((v) => banner(v, t.verse));
      break;
    case "tomb":
      layer("egg-tomb", '<div class="egg-tomb-scene"><div class="egg-tomb-glow"></div><div class="egg-tomb-hill"></div><div class="egg-tomb-door"></div><div class="egg-tomb-stone"></div></div>', 6000);
      setTimeout(() => verseLine(t.verse).then((v) => banner(v, t.verse)), 1800);
      break;
    case "ashes":
      document.documentElement.classList.add("egg-ashwed");
      verseLine(t.verse).then((v) => banner(v, t.verse));
      break;
    case "goodfriday":
      document.documentElement.classList.add("egg-goodfriday");
      verseLine(t.verse).then((v) => banner(v, t.verse, "dark"));
      break;
    case "mercy":
      banner("It is the hour of great mercy. Jesus, I trust in you.", null, "rays");
      break;
    case "watch":
      verseLine(t.verse).then((v) => banner(v, t.verse, "dark"));
      break;
    case "badge":
    case "dove":
      verseLine(t.verse).then((v) =>
        layer("egg-badge", `<div class="egg-badge-in">${t.fx === "dove" ? `<div class="egg-dove">${DOVE}</div>` : '<div class="egg-medal">✦</div>'}<b>${esc(t.title)}</b><div class="egg-badge-verse">${bible.verseHTML(v)}</div><div class="egg-banner-ref">${esc(bible.formatRef(...t.verse))}</div></div>`, 4600)
      );
      break;
    case "bible":
      import("./blessing.js").then((m) => m.show({ force: true, words: ["Well", "done,", "good", "and", "faithful", "servant."] }));
      break;
  }
}

// Exodus 14:21: the text on screen parts down the middle, then closes again.
function partSea(withPath = false) {
  const art = document.querySelector("#scripture");
  if (!art || reduce()) return;
  const rc = art.getBoundingClientRect();
  const make = (clip, dx) => {
    const c = art.cloneNode(true);
    c.removeAttribute("id");
    c.className = art.className + " egg-sea-half";
    Object.assign(c.style, { left: rc.left + "px", top: rc.top + "px", width: rc.width + "px", clipPath: clip, "--dx": dx });
    document.body.appendChild(c);
    return c;
  };
  const a = make("inset(0 50% 0 0)", withPath ? "-70px" : "-38px");
  const b = make("inset(0 0 0 50%)", withPath ? "70px" : "38px");
  if (withPath) {
    const path = document.createElement("div");
    path.className = "fx-seapath";
    path.innerHTML = '<div class="sand"></div><div class="wall l"></div><div class="wall r"></div>';
    path.style.left = rc.left + rc.width / 2 - 70 + "px";
    document.body.appendChild(path);
    setTimeout(() => path.remove(), 3400);
  } else {
    const gap = layer("egg-sea-gap", "", 3200);
    gap.style.left = rc.left + rc.width / 2 - 40 + "px";
  }
  art.style.visibility = "hidden";
  setTimeout(() => {
    a.remove();
    b.remove();
    art.style.visibility = "";
  }, 3200);
}

/* ---------- the "found" card and sharing ---------- */
function foundCard(t) {
  document.querySelector(".egg-found")?.remove();
  const el = document.createElement("div");
  el.className = "egg-found";
  el.innerHTML = `<div class="egg-found-icon">✦</div>
    <div class="egg-found-text"><b>Hidden treasure found</b><span>${esc(t.title)} · ${foundCount()} of ${TREASURES.length}</span></div>
    <button class="btn small" data-share>${icon("share")} Share</button>
    <button class="btn icon ghost" data-x aria-label="Close">${icon("close")}</button>`;
  document.body.appendChild(el);
  const close = () => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 300);
  };
  el.querySelector("[data-x]").onclick = close;
  el.querySelector("[data-share]").onclick = () => share(t.id);
  setTimeout(close, 9000);
}

function wrap(ctx, text, maxW) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// A 1080×1350 card image with the treasure and its verse.
export async function cardImage(t) {
  const ref = t.where || t.verse;
  const verse = await verseLine(ref);
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1350;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(540, 520, 60, 540, 620, 900);
  grd.addColorStop(0, "#fffbe6");
  grd.addColorStop(0.45, "#fde9a6");
  grd.addColorStop(1, "#e7c262");
  g.fillStyle = grd;
  g.fillRect(0, 0, 1080, 1350);
  g.fillStyle = "#6b4a07";
  g.textAlign = "center";
  g.font = "600 34px Inter, system-ui, sans-serif";
  g.fillText("✦  HIDDEN TREASURE FOUND  ✦", 540, 150);
  g.font = "italic 600 76px Literata, Georgia, serif";
  wrap(g, t.title, 900).forEach((l, i) => g.fillText(l, 540, 300 + i * 90));
  g.font = "italic 600 76px Literata, Georgia, serif";
  const tl = wrap(g, t.title, 900).length;
  g.font = "italic 400 52px Literata, Georgia, serif";
  const lines = wrap(g, quoted(verse.replace(/LORD/g, "Lord")), 880).slice(0, 9);
  const top = 300 + tl * 90 + 40;
  const blockH = lines.length * 70 + 60;
  const y0 = top + Math.max(0, (1170 - top - blockH) / 2) + 50;
  lines.forEach((l, i) => g.fillText(l, 540, y0 + i * 70));
  g.font = "600 40px Inter, system-ui, sans-serif";
  g.fillText(bible.formatRef(...ref), 540, y0 + lines.length * 70 + 50);
  g.font = "italic 400 40px Literata, Georgia, serif";
  g.fillText("Iter ad Dominum", 540, 1270);
  return new Promise((res) => c.toBlob(res, "image/png"));
}

export async function share(id) {
  const t = byId[id];
  const ref = t.where || t.verse;
  const verse = await verseLine(ref);
  const text = `✦ I found a hidden treasure: “${t.title}”\n\n${quoted(verse.replace(/LORD/g, "Lord"))} — ${bible.formatRef(...ref)}`;
  try {
    const blob = await cardImage(t);
    const file = new File([blob], `treasure-${id}.png`, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: t.title, text });
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: t.title, text });
      return;
    }
    // computer without a share sheet: download the card and copy the text
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `treasure-${id}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    await navigator.clipboard?.writeText(text);
    const { toast } = await import("./ui.js");
    toast("Card downloaded and text copied");
  } catch (e) {
    if (e?.name !== "AbortError") console.warn("share failed", e);
  }
}

/* ---------- triggers ---------- */
const VERSE_EGGS = TREASURES.filter((t) => t.where);
export function onVerse(book, chapter, verse, ctx) {
  const t = VERSE_EGGS.find((x) => x.where[0] === book && x.where[1] === chapter && x.where[2] === verse);
  if (t) find(t.id, ctx);
}

// Chapters holding treasures (for the You page)
export function treasureChapters() {
  const m = new Map();
  for (const t of VERSE_EGGS) {
    const key = t.where[0] + "." + t.where[1];
    if (!m.has(key)) m.set(key, { book: t.where[0], chapter: t.where[1], items: [] });
    m.get(key).items.push(t);
  }
  const canon = bible.getCanon();
  return [...m.values()].sort((a, b) => canon.byId[a.book].index - canon.byId[b.book].index || a.chapter - b.chapter);
}

export function onChapterOpen() {
  const h = new Date().getHours();
  if (h === 15) find("mercy");
  if (h >= 0 && h < 4) find("watch");
}

export function checkMilestones() {
  const s = act.streak();
  for (const id of ["streak3", "streak7", "streak12", "streak40"]) if (s >= byId[id].need && !isFound(id)) return find(id);
  const read = act.chaptersRead();
  if (read.has("PSA.119") && !isFound("psalm119")) return find("psalm119");
  const total = bible.getCanon().books.reduce((a, b) => a + b.chapters, 0);
  if (read.size >= total && !isFound("bible")) return find("bible");
}

export function onNoteSaved(body) {
  if (/\bamen[.!]?\s*$/i.test(body.trim())) find("amen");
}

// Easter by the Gregorian computus (Anonymous algorithm)
export function easter(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return store.localDate(new Date(year, month - 1, day));
}
export function seasonToday(dateStr = today()) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  if (mo === 12 && (d === 24 || d === 25)) return "christmas";
  const e = easter(y);
  if (dateStr === e) return "easter";
  if (dateStr === store.addDays(e, 49)) return "pentecost";
  if (dateStr === store.addDays(e, -46)) return "ashes";
  if (dateStr === store.addDays(e, -2)) return "goodfriday";
  return null;
}
export function onHome() {
  const s = seasonToday();
  if (s) find(s);
  checkMilestones();
}

export function init() {
  // the day's mood for Ash Wednesday / Good Friday
  const s = seasonToday();
  if (s === "ashes") document.documentElement.classList.add("egg-ashwed");
  if (s === "goodfriday") document.documentElement.classList.add("egg-goodfriday");

  // 7 quick taps on the book icon
  const brandIcon = document.querySelector(".brand svg");
  let taps = [];
  brandIcon?.addEventListener("click", () => {
    const now = Date.now();
    taps = taps.filter((x) => now - x < 4000).concat(now);
    if (taps.length >= 7) {
      taps = [];
      find("lamp");
    }
  });

  // shake (phones that allow motion events without asking)
  let last = 0;
  let jolts = 0;
  window.addEventListener("devicemotion", (e) => {
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
    const now = Date.now();
    if (mag > 25) {
      jolts = now - last < 800 ? jolts + 1 : 1;
      last = now;
      if (jolts >= 3) {
        jolts = 0;
        find("bestill");
      }
    }
  });

  // pull down past the top of the Today page
  let startY = null;
  let wheel = 0;
  let wheelT = 0;
  const onToday = () => (location.hash || "#/").replace(/^#/, "") === "/" || location.hash === "";
  window.addEventListener("touchstart", (e) => (startY = onToday() && scrollY <= 0 ? e.touches[0].clientY : null), { passive: true });
  window.addEventListener(
    "touchmove",
    (e) => {
      if (startY != null && e.touches[0].clientY - startY > 140) {
        startY = null;
        find("seek");
      }
    },
    { passive: true }
  );
  window.addEventListener(
    "wheel",
    (e) => {
      if (!onToday() || scrollY > 0 || e.deltaY >= 0) return (wheel = 0);
      const now = Date.now();
      wheel = now - wheelT < 400 ? wheel - e.deltaY : -e.deltaY;
      wheelT = now;
      if (wheel > 900) {
        wheel = 0;
        find("seek");
      }
    },
    { passive: true }
  );
}
