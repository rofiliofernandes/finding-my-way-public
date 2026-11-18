// The Church year (Roman calendar): which season and week a date is in, for naming weekly badges.
// Seasons: Advent, Christmas, Ordinary Time, Lent, Holy Week, Easter (to Pentecost), then Ordinary Time again.

const DAY = 86400000;
const d0 = (y, m, d) => Date.UTC(y, m - 1, d);
const toUTC = (s) => { const [y, m, d] = s.split("-").map(Number); return d0(y, m, d); };
const dow = (t) => new Date(t).getUTCDay(); // 0 = Sunday
const sundayOnOrBefore = (t) => t - dow(t) * DAY;
const fmt = (t) => new Date(t).toISOString().slice(0, 10);

export function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return d0(y, month, day);
}
const advent1 = (y) => sundayOnOrBefore(d0(y, 12, 24)) - 21 * DAY;
const baptism = (y) => { const ep = d0(y, 1, 6); return ep + ((7 - dow(ep)) % 7 || 7) * DAY; }; // the Sunday after 6 January

const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");

export const SEASONS = {
  advent: { name: "Advent", color: "#6b4b9a", light: "#a58bd0" },
  christmas: { name: "Christmas", color: "#c9a24a", light: "#f3e3b0", white: true },
  ordinary: { name: "Ordinary Time", color: "#3f7d4e", light: "#7fbf86" },
  lent: { name: "Lent", color: "#5e3f80", light: "#9a7cc0" },
  holy: { name: "Holy Week", color: "#9b2a2a", light: "#d96b5f" },
  easter: { name: "Easter", color: "#c9a24a", light: "#f3e3b0", white: true },
};

// The liturgical week a date (YYYY-MM-DD) falls in: { season, week, name, short }
export function weekOf(dateStr) {
  const t = toUTC(dateStr), y = new Date(t).getUTCFullYear();
  const sun = sundayOnOrBefore(t);
  // Advent and Christmas can belong to this year's end or last year's
  const adv = advent1(y);
  if (t >= adv && t < d0(y, 12, 25)) { const n = (sun - adv) / (7 * DAY) + 1; return mk("advent", n, `${ord(n)} Week of Advent`); }
  if (t >= d0(y, 12, 25)) return mk("christmas", 0, "Christmas Week");
  const bap = baptism(y);
  if (t <= bap) return mk("christmas", 0, "Christmas Season");
  const E = easter(y), ash = E - 46 * DAY, palm = E - 7 * DAY, pent = E + 49 * DAY;
  if (t < ash) { const n = (sun - bap) / (7 * DAY) + 1; return mk("ordinary", n, `${ord(n)} Week in Ordinary Time`); }
  if (t < ash + 4 * DAY) return mk("lent", 0, "Week of Ash Wednesday");
  if (t < palm) { const n = (sun - (ash + 4 * DAY)) / (7 * DAY) + 1; return mk("lent", n, `${ord(n)} Week of Lent`); }
  if (t < E) return mk("holy", 0, "Holy Week");
  if (t < E + 7 * DAY) return mk("easter", 1, "Easter Week");
  if (t <= pent) { const n = (sun - E) / (7 * DAY) + 1; return mk("easter", n, `${ord(n)} Week of Easter`); }
  const n = 35 - (adv - sun) / (7 * DAY);
  return mk("ordinary", n, `${ord(n)} Week in Ordinary Time`);
}
function mk(season, week, name) {
  return { season, week, name, color: SEASONS[season].color, light: SEASONS[season].light, white: !!SEASONS[season].white };
}

// The text on a medallion: the week number, or a short word for weeks that have none
export function badgeMark(w) {
  if (w.week) return String(w.week);
  return { christmas: "✦", holy: "✝", lent: "✝" }[w.season] || "✦";
}

export { fmt as isoDay };
