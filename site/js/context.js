// A verse that fits your day: used by Verse for today when it picks from "anywhere" (the default when you
// aren't reading a book). Everyone gets their own mix (a personal seed), shaped by
//   · feast days of the Church, and of your country (rough location from your connection, see worker/index.js),
//   · the Church season and Sundays,
//   · the time of day on your phone,
//   · the Topics you opened in the past two days.
// The location is only the country/city Cloudflare already knows from the connection: no permission prompt,
// never stored on a server; kept on this device for a day so the verse can say "Morning in Mumbai".
import * as store from "./store.js";
import * as synced from "./synced.js";
import { easter, weekOf } from "./liturgy.js";
import { topic, parseKey, TOPICS } from "./topics.js";

const P = (s) => s.split("|");
const TIME = {
  morning: { icon: "🌅", label: "For your morning", refs: P("LAM 3:23|PSA 5:3|PSA 143:8|PSA 118:24|PSA 90:14|PSA 30:5") },
  afternoon: { icon: "☀️", label: "For your afternoon", refs: P("MAT 11:28|COL 3:23|PHP 4:13|GAL 6:9|PSA 121:2|ISA 26:3|PSA 55:22") },
  evening: { icon: "🌆", label: "For your evening", refs: P("PSA 141:2|PSA 4:4|PSA 113:3|PHP 4:7|PSA 16:7|ZEP 3:17") },
  night: { icon: "🌙", label: "For tonight", refs: P("PSA 4:8|PSA 127:2|PSA 121:4|PRO 3:24|PSA 91:1|ISA 26:9") },
};
const SEASON = {
  advent: { icon: "🕯", label: "Advent", refs: P("ISA 9:2|ISA 40:3|ROM 13:11|ISA 7:14|LUK 1:37|PSA 25:4|JAS 5:8|ISA 60:1") },
  christmas: { icon: "⭐", label: "Christmas season", refs: P("LUK 2:11|JHN 1:14|ISA 9:6|MAT 1:23|LUK 2:14|GAL 4:4|JHN 1:5|TIT 2:11") },
  lent: { icon: "✝", label: "Lent", refs: P("JOL 2:13|PSA 51:10|MAT 4:4|ISA 1:18|LUK 15:20|2CO 6:2|MAT 6:6|PSA 51:17") },
  holy: { icon: "✝", label: "Holy Week", refs: P("JHN 15:13|ISA 53:5|PHP 2:8|LUK 23:46|ROM 5:8|1PE 2:24") },
  easter: { icon: "🌿", label: "Easter season", refs: P("JHN 11:25|MAT 28:6|1PE 1:3|1CO 15:55|JHN 20:29") },
};
const SUNDAY = { icon: "⛪", label: "Sunday", refs: P("PSA 118:24|PSA 122:1|PSA 95:6|MAT 18:20|PSA 100:4|HEB 10:24") };

// fixed-date feasts for everyone (Roman calendar), then by country (ISO code from the connection)
const FEASTS = {
  "01-01": ["Mary, Mother of God", "LUK 2:19"],
  "02-02": ["The Presentation of the Lord", "LUK 2:30"],
  "03-19": ["St Joseph", "MAT 1:24"],
  "03-25": ["The Annunciation", "LUK 1:38"],
  "06-29": ["Sts Peter and Paul", "MAT 16:18"],
  "08-06": ["The Transfiguration", "MAT 17:5"],
  "08-15": ["The Assumption of Mary", "LUK 1:48"],
  "09-14": ["The Exaltation of the Holy Cross", "JHN 12:32"],
  "11-01": ["All Saints", "HEB 12:1"],
  "11-02": ["All Souls", "JHN 11:25"],
  "12-08": ["The Immaculate Conception", "LUK 1:28"],
  "12-25": ["Christmas Day", "LUK 2:11"],
};
const COUNTRY = {
  IN: { name: "India", days: {
    "01-26": ["Republic Day", "PSA 33:12"],
    "07-03": ["St Thomas the Apostle", "JHN 20:28"],
    "08-15": ["The Assumption · Independence Day", "LUK 1:48"],
    "09-05": ["St Teresa of Calcutta", "MAT 25:40"],
    "09-08": ["Our Lady of Velankanni", "LUK 1:46"],
    "10-02": ["Gandhi Jayanti", "MAT 5:9"],
    "12-03": ["St Francis Xavier", "MAT 28:19"],
  } },
  US: { name: "the USA", days: { "07-04": ["Independence Day", "GAL 5:1"] } },
  MX: { name: "Mexico", days: { "12-12": ["Our Lady of Guadalupe", "LUK 1:45"] } },
  IE: { name: "Ireland", days: { "03-17": ["St Patrick", "ISA 52:7"] } },
  PH: { name: "the Philippines", days: { "12-08": ["The Immaculate Conception, patroness of the Philippines", "LUK 1:28"] } },
};
// moving feasts, from Easter
function movable(y) {
  const e = easter(y), at = (days) => new Date(e + days * 864e5).toISOString().slice(0, 10);
  const xmas = Date.UTC(y, 11, 24), sun = xmas - new Date(xmas).getUTCDay() * 864e5; // the Sunday on or before 24 Dec
  return {
    [at(-46)]: ["Ash Wednesday", "JOL 2:13"],
    [at(-7)]: ["Palm Sunday", "MAT 21:9"],
    [at(-2)]: ["Good Friday", "JHN 19:30"],
    [at(0)]: ["Easter Sunday", "MAT 28:6"],
    [at(49)]: ["Pentecost", "ACT 2:4"],
    [new Date(sun - 28 * 864e5).toISOString().slice(0, 10)]: ["Christ the King", "JHN 18:37"],
  };
}

/* ---------- where you are (rough), once a day ---------- */
let whereP = null;
export function where() {
  const day = store.localDate(), saved = store.meta("where");
  if (saved?.day === day) return Promise.resolve(saved);
  whereP ||= fetch("/api/where", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((w) => { const v = { ...(w || {}), day }; store.meta("where", v); return v; })
    .catch(() => saved || null);
  return Promise.race([whereP, new Promise((r) => setTimeout(() => r(saved || null), 1500))]); // never hold up Today
}

/* ---------- recent topics (written by the Topics page) ---------- */
export function noteTopic(id) {
  if (!id) return;
  const list = (store.meta("recentTopics") || []).filter((x) => x.id !== id);
  store.meta("recentTopics", [{ id, at: Date.now() }, ...list].slice(0, 5));
}
function recentTopic() {
  const t = (store.meta("recentTopics") || []).find((x) => Date.now() - x.at < 2 * 864e5);
  return t ? topic(t.id) : null;
}

/* ---------- the everyday pool: hand-picked verses that stand on their own ---------- */
// every single-verse key verse from the Topics (about 210), plus the time-of-day, season and Sunday verses
let pool = null;
export function generalPool() {
  if (pool) return pool;
  const refs = new Set();
  const walk = (t) => { (t.key || []).forEach((r) => !r.includes("-") && refs.add(r)); (t.subs || []).forEach(walk); };
  // topics full of warnings (where jealousy is, there is every evil deed…) fit when you open them, not as a greeting
  TOPICS.filter((t) => !/^(anger|jealous|envy|tempt|pride)/.test(t.id)).forEach(walk);
  for (const g of [...Object.values(TIME), ...Object.values(SEASON), SUNDAY]) g.refs.forEach((r) => refs.add(r));
  return (pool = [...refs].map(one).filter(Boolean));
}

/* ---------- your own mix ---------- */
export function personSeed() {
  let s = synced.get("seed");
  if (!s) { s = Math.random().toString(36).slice(2, 10); synced.set("seed", s); } // synced, so your phone and laptop agree
  return s;
}

const slot = (h) => (h >= 5 && h < 12 ? "morning" : h >= 12 && h < 17 ? "afternoon" : h >= 17 && h < 21 ? "evening" : "night");
const one = (ref) => { const k = parseKey(ref); return k ? [k.book, k.chapter, k.vs] : null; };

// What fits today: { ref:[book,c,v], why } or null for "anything good".
// rnd is a 0..1 number from your seed and the day; bump > 0 when you tap Another.
export async function choose(rnd, bump) {
  const day = store.localDate(), md = day.slice(5), y = +day.slice(0, 4);
  const w = await where(), cc = (w?.country || "").toUpperCase(), place = COUNTRY[cc];
  const city = w?.city && w.city.length < 30 ? w.city : "";
  // 1. a feast day: the first verse of the day is the feast's
  if (!bump) {
    const f = place?.days[md] || movable(y)[day] || FEASTS[md];
    if (f) return { ref: one(f[1]), why: `✝ ${f[0]}${place?.days[md] ? " · " + place.name : ""}` };
  }
  const pickFrom = (refs, salt) => one(refs[Math.floor(((rnd * 7919 + salt) % 1) * refs.length) % refs.length]);
  // 2. what you've been looking at lately
  const t = recentTopic();
  if (t && rnd < 0.3) {
    const refs = (t.key || []).map((r) => r.split("-")[0]);
    if (refs.length) return { ref: pickFrom(refs, .17), why: `Because you looked at ${t.name}` };
  }
  // 3. the Church season (Sunday in Ordinary Time counts too)
  const wk = weekOf(day), sunday = new Date().getDay() === 0;
  const season = SEASON[wk.season] || (sunday ? SUNDAY : null);
  if (season && rnd < 0.55) return { ref: pickFrom(season.refs, .41), why: `${season.icon} ${season === SUNDAY ? "Sunday" : wk.name || season.label}` };
  // 4. the time of day where you are
  const sl = slot(new Date().getHours()), s = TIME[sl];
  const here = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", night: "Tonight" }[sl];
  if (rnd < 0.75) return { ref: pickFrom(s.refs, .73), why: `${s.icon} ${city ? `${here} in ${city}` : s.label}` };
  return null;
}
