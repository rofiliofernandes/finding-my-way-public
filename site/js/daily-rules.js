// Which verses make sense on their own: no "And…"/"Then…" openings, nothing cut off mid-sentence,
// no half-quotes. Shared by the app (js/daily.js) and the build tool (tools/build_daily.mjs).
const plainVerse = (t) => t.replace(/\n\t?/g, " ").replace(/\s+/g, " ").trim();

const OPENERS = /^(and|now|then|for|but|so|therefore|because|or|nor|that|which|who|whom|whose|when|while|after|as|also|again|thus|yet|moreover|furthermore|likewise|wherefore|until|unless|if|lest|since|than|these|those|this|it|they|he answered|they answered|and he|saying|namely)\b/i;
// verses that point back to something said just before ("What fell among the thorns…", "These are those who…")
const POINTS_BACK = /^((he|she|they|jesus) (said|answered)[^.]*?[,:]\s*)?(what (fell|was sown|is sown)|the ones? (on|among|who|which|that)|these are (those|they|the)|those (on|among|which|that|who were)|that which|such (a|an|is|was)|the same (is|was|day)|in the same way|likewise|in like manner|it is like|but (he|she|they)|after (this|these))\b/i;
export function standsAlone(raw) {
  const t = plainVerse(raw).replace(/^[^A-Za-z“"‘']+/, "");
  if (t.length < 28 || t.length > 330) return false;
  if (OPENERS.test(t.replace(/^[“"‘']/, ""))) return false;
  if (POINTS_BACK.test(t.replace(/^[^A-Za-z]+/, ""))) return false;
  if (!/[.!?][”"’')\]]*$/.test(t)) return false; // ends mid-sentence
  // a speech often opens in one verse and closes in a later one: that's fine (tidyQuotes hides the lone mark)
  if (/^\d|^[a-z]/.test(t)) return false;
  return true;
}


// Hide quote marks whose partner is in another verse, so a verse shown alone doesn't start or end with a lone “ or ”
export function tidyQuotes(t) {
  const open = (t.match(/“/g) || []).length, close = (t.match(/”/g) || []).length;
  if (open === close) return t;
  return t.replace(open > close ? /“(?![^“]*”)/g : /(^|[^“]*?)”/, (m) => m.replace(/[“”]/g, ""));
}
