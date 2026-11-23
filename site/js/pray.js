// A time of prayer, opened from Today: pray in silence before a candle and a cross,
// or let a short guide lead you through one intention (your family, the sick, those in need…).
// Either way it ends with a large "Amen" button.
import * as store from "./store.js";
import * as bible from "./bible.js";
import { esc } from "./ui.js";

// Each guide: a few gentle prompts, one at a time, then a verse to rest on.
export const GUIDES = [
  {
    id: "family", title: "For my family", icon: "🏠",
    steps: [
      "Bring to mind each person in your family, one at a time. Let their faces come before you.",
      "Thank God for something you love in each of them.",
      "Ask Him for what they need today: health, peace, work, faith, rest.",
      "If there is someone you find hard to love, place them gently into His hands.",
    ],
    verse: ["COL", 3, 14],
  },
  {
    id: "sick", title: "For the sick", icon: "🤍",
    steps: [
      "Think of someone who is ill or in pain, in body or in mind.",
      "Picture Jesus coming close to them, as He came close to every sick person who reached out to Him.",
      "Pray for the people who care for them: doctors, nurses, family.",
      "Ask for healing, and for peace and courage while they wait.",
    ],
    verse: ["JAS", 5, 15],
  },
  {
    id: "need", title: "For those in need", icon: "🍞",
    steps: [
      "Think of the people who are hungry, poor, homeless or alone today.",
      "Remember the ones the world forgets: prisoners, refugees, the very old, the lonely.",
      "Ask God to provide for them, and to send people to help.",
      "Ask Him quietly whether there is one person you could help this week.",
    ],
    verse: ["MAT", 25, 40],
  },
  {
    id: "peace", title: "For peace in the world", icon: "🕊",
    steps: [
      "Bring before God the places where there is war, violence or fear.",
      "Pray for the people caught in the middle: children, families, those who have lost their homes.",
      "Pray for leaders, that they choose peace and justice.",
      "Ask Him to make you a peacemaker in your own home, work and street.",
    ],
    verse: ["MAT", 5, 9],
  },
  {
    id: "hurt", title: "For someone who hurt me", icon: "🤝",
    steps: [
      "You don't have to feel ready. Just bring the person before God, by name.",
      "Tell Him honestly how it hurt. He already knows, and He is not afraid of your feelings.",
      "If you can, ask Him to bless them. If you can't yet, ask for the grace to want to.",
      "Ask Him to heal what was wounded in you.",
    ],
    verse: ["LUK", 6, 28],
  },
  {
    id: "thanks", title: "In thanksgiving", icon: "🌅",
    steps: [
      "Look back over today. Name three good things, however small.",
      "Thank God for the people He has put in your life.",
      "Thank Him for something hard that has made you grow.",
      "Rest for a moment in being loved by Him.",
    ],
    verse: ["1TH", 5, 18],
  },
  {
    id: "departed", title: "For those who have died", icon: "🕯",
    steps: [
      "Remember someone who has died. Let yourself remember their voice, their face.",
      "Thank God for their life, and for what they gave you.",
      "Entrust them to His mercy: “Eternal rest grant unto them, O Lord, and let perpetual light shine upon them.”",
      "Pray too for those who are grieving today.",
    ],
    verse: ["JHN", 11, 25],
  },
  {
    id: "me", title: "For myself", icon: "🙏",
    steps: [
      "What are you carrying today? Tell God plainly, the way you would tell a friend.",
      "Ask Him for what you need. Nothing is too small to bring to Him.",
      "Is there anything you need to say sorry for? Say it, and receive His mercy.",
      "Ask for the grace to trust Him with the rest.",
    ],
    verse: ["MAT", 11, 28],
  },
];

const KEY = "fmw:prayed";
export function prayedToday() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && v.day === store.localDate() ? v : null; } catch { return null; }
}
function record(secs, guide) {
  const prev = prayedToday();
  const v = { day: store.localDate(), secs: (prev?.secs || 0) + secs, times: (prev?.times || 0) + 1, last: guide?.title || "In silence" };
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {}
}
const mins = (s) => (s < 60 ? "under a minute" : `${Math.round(s / 60)} min`);

async function verseText(ref) {
  try {
    const ch = await bible.loadChapter(ref[0], ref[1]);
    const v = ch.v.find((x) => x.n === ref[2]);
    return v ? bible.plainVerse(v.t).trim().replace(/^[“"‘']+|[”"’']+$/g, "") : "";
  } catch { return ""; }
}

// The card on Today
export function cardHTML() {
  const p = prayedToday();
  return `<div class="pray-home">
      <svg class="pray-ic" viewBox="0 0 40 52" aria-hidden="true"><rect x="17" y="2" width="6" height="34" rx="1.5" fill="#6b4a33"/><rect x="7" y="10" width="26" height="6" rx="1.5" fill="#6b4a33"/>
        <rect x="13" y="34" width="14" height="17" rx="2" fill="#f1e5cc"/><path d="M20 21c3 4 4 6 4 8.5a4 4 0 0 1-8 0c0-2.5 1-4.5 4-8.5Z" fill="#f2a33a"/><path d="M20 25c1.4 2 2 3 2 4.4a2 2 0 0 1-4 0c0-1.4.6-2.4 2-4.4Z" fill="#fff3c4"/></svg>
      <div class="what"><b>${p ? "You prayed today" : "Take a moment to pray"}</b>
        <div class="muted small">${p ? `${esc(p.last)} · ${mins(p.secs)}${p.times > 1 ? ` · ${p.times} times` : ""}` : "In silence before a candle, or let a short guide lead you: your family, the sick, those in need…"}</div></div>
    </div>
    <button class="btn primary pray-go" data-pray>${p ? "Pray again" : "Pray"}</button>`;
}
export function wireCard(box, redraw) {
  box.querySelector("[data-pray]")?.addEventListener("click", () => open().then(redraw));
}

// The prayer time itself
export function open() {
  return new Promise((resolve) => {
    const ov = document.createElement("div");
    ov.className = "pray-ov";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-label", "Prayer");
    ov.innerHTML = `<canvas class="pray-bg" aria-hidden="true"></canvas><div class="pray-ui"><button class="holy-x" data-x aria-label="Close">×</button><div class="pray-stage"></div><div class="pray-foot"></div></div>`;
    document.body.appendChild(ov);
    document.documentElement.classList.add("praying");
    const stage = ov.querySelector(".pray-stage"), foot = ov.querySelector(".pray-foot");
    let scene = null, started = 0, guide = null, timer = 0, lock = null, closed = false;
    import("./holy.js").then((m) => { if (!closed) scene = m.ambient(ov.querySelector(".pray-bg")); });
    // keep the screen awake while praying
    navigator.wakeLock?.request?.("screen").then((l) => (lock = l)).catch(() => {});

    const show = (html, footHtml = "") => {
      stage.classList.remove("in"); void stage.offsetWidth;
      stage.innerHTML = html; foot.innerHTML = footHtml;
      stage.classList.add("in");
    };
    const finish = (prayed) => {
      if (closed) return;
      closed = true;
      clearInterval(timer);
      lock?.release?.().catch?.(() => {});
      if (prayed && started) record(Math.round((Date.now() - started) / 1000), guide);
      ov.classList.add("out");
      setTimeout(() => { scene?.stop(); ov.remove(); document.documentElement.classList.remove("praying"); resolve(prayed); }, 700);
      removeEventListener("keydown", onKey);
    };
    const onKey = (e) => e.key === "Escape" && finish(false);
    addEventListener("keydown", onKey);
    ov.querySelector("[data-x]").onclick = () => finish(!!started);

    const amenBtn = `<button class="pray-amen" data-amen><span>Amen</span><small>I've finished praying</small></button>`;
    const amen = () => {
      foot.innerHTML = "";
      show(`<div class="pray-done">Amen</div>`);
      setTimeout(() => finish(true), 1700);
    };
    const begin = () => { if (!started) started = Date.now(); scene ? scene.light() : setTimeout(() => scene?.light(), 400); };

    // 1. how would you like to pray?
    show(`<div class="pray-head"><div class="pray-eyebrow">Take a moment with God</div><h2>How would you like to pray?</h2></div>
      <button class="pray-silent" data-silent><b>🕯 Pray in silence</b><span>The candle is lit. Just you and Him, for as long as you like.</span></button>
      <div class="pray-or">or let a short guide lead you</div>
      <div class="pray-guides">${GUIDES.map((g) => `<button class="pray-guide" data-guide="${g.id}"><span class="gi" aria-hidden="true">${g.icon}</span>${esc(g.title)}</button>`).join("")}</div>`);
    stage.querySelector("[data-silent]").onclick = silent;
    stage.querySelectorAll("[data-guide]").forEach((b) => (b.onclick = () => guided(GUIDES.find((g) => g.id === b.dataset.guide))));

    // 2a. in silence: the candle lights, the cross behind; a quiet line, a small clock, and Amen
    function silent() {
      begin();
      show(`<div class="pray-quiet"><div class="pray-q">“Be still, and know that I am God.”</div><div class="pray-ref">Psalm 46:10</div></div><div class="pray-clock" aria-live="off">0:00</div>`, amenBtn);
      const clock = stage.querySelector(".pray-clock");
      timer = setInterval(() => { const s = Math.round((Date.now() - started) / 1000); clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }, 1000);
      setTimeout(() => stage.querySelector(".pray-quiet")?.classList.add("faded"), 9000);
      foot.querySelector("[data-amen]").onclick = amen;
    }

    // 2b. guided: one prompt at a time, then a verse, then Amen
    async function guided(g) {
      guide = g;
      begin();
      const vt = verseText(g.verse);
      let i = 0;
      const step = async () => {
        if (i < g.steps.length) {
          show(`<div class="pray-step"><div class="pray-eyebrow">${esc(g.title)}</div><p>${esc(g.steps[i])}</p>
            <div class="pray-dots">${g.steps.map((_, j) => `<i class="${j <= i ? "on" : ""}"></i>`).join("")}<i></i></div>
            <div class="pray-hint">Take your time</div></div>`,
            `<button class="btn pray-next" data-next>${i < g.steps.length - 1 ? "Next" : "Continue"}</button>`);
          foot.querySelector("[data-next]").onclick = () => { i++; step(); };
        } else {
          const text = await vt;
          show(`<div class="pray-step"><div class="pray-eyebrow">${esc(g.title)}</div>
            ${text ? `<p class="pray-verse">“${esc(text)}”</p><div class="pray-ref">${esc(bible.formatRef(...g.verse))}</div>` : ""}
            <div class="pray-dots">${g.steps.map(() => `<i class="on"></i>`).join("")}<i class="on"></i></div>
            <div class="pray-hint">Stay as long as you like. When you're ready:</div></div>`, amenBtn);
          foot.querySelector("[data-amen]").onclick = amen;
        }
      };
      step();
    }
  });
}
