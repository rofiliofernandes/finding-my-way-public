// Famous Bible stories by the names people call them, with forgiving spelling:
// "wale story" → Jonah and the big fish, "red see" → Crossing the Red Sea, "goliat" → David and Goliath.
// Matching only looks at this list, so it can't "correct" ordinary searches.

// [title, reference (BOOK C or BOOK C:V), names people use (comma-separated)]
const S = [
  ["The creation of the world", "GEN 1", "creation, creation story, seven days, god made the world, in the beginning"],
  ["Adam and Eve and the fall", "GEN 3", "adam and eve, the fall, garden of eden, eden, serpent, forbidden fruit, apple"],
  ["Cain and Abel", "GEN 4", "cain and abel, cain, abel, am i my brother's keeper"],
  ["Noah's ark and the flood", "GEN 6:9", "noah, noah's ark, ark, the flood, great flood"],
  ["The tower of Babel", "GEN 11", "tower of babel, babel"],
  ["God calls Abraham", "GEN 12", "call of abraham, abram, abraham"],
  ["Sodom and Gomorrah", "GEN 19", "sodom and gomorrah, sodom, lot's wife, pillar of salt"],
  ["Abraham and Isaac on the mountain", "GEN 22", "abraham and isaac, binding of isaac, sacrifice of isaac"],
  ["Jacob and Esau", "GEN 27", "jacob and esau, esau, birthright, stolen blessing"],
  ["Jacob's ladder", "GEN 28:10", "jacob's ladder, ladder, stairway to heaven"],
  ["Jacob wrestles with God", "GEN 32:22", "jacob wrestles, wrestling with god, wrestling angel"],
  ["Joseph and his coat of many colours", "GEN 37", "joseph, coat of many colors, coat of many colours, joseph's dreams, joseph sold"],
  ["Joseph forgives his brothers", "GEN 45", "joseph forgives, joseph and his brothers"],
  ["Baby Moses in the basket", "EXO 2", "baby moses, moses in the basket, moses bulrushes, birth of moses"],
  ["The burning bush", "EXO 3", "burning bush, moses burning bush, i am who i am"],
  ["The plagues of Egypt", "EXO 7:14", "plagues, ten plagues, plagues of egypt, let my people go, pharaoh"],
  ["The Passover", "EXO 12", "passover, the passover lamb, first passover"],
  ["Crossing the Red Sea", "EXO 14", "red sea, crossing the red sea, parting the sea, parting of the red sea, moses parts the sea"],
  ["Manna from heaven", "EXO 16", "manna, bread from heaven, quail"],
  ["Water from the rock", "EXO 17", "water from the rock, moses strikes the rock"],
  ["The Ten Commandments", "EXO 20", "ten commandments, commandments, mount sinai"],
  ["The golden calf", "EXO 32", "golden calf, calf idol"],
  ["Balaam's talking donkey", "NUM 22:21", "balaam, talking donkey, balaam's donkey"],
  ["The walls of Jericho", "JOS 6", "jericho, walls of jericho, joshua jericho, battle of jericho"],
  ["Gideon and his 300 men", "JDG 7", "gideon, gideon's fleece, fleece, three hundred men"],
  ["Samson and Delilah", "JDG 16", "samson, delilah, samson and delilah, samson's hair"],
  ["Ruth and Naomi", "RUT 1", "ruth, naomi, ruth and naomi, where you go i will go"],
  ["God calls the boy Samuel", "1SA 3", "samuel, call of samuel, speak lord your servant is listening"],
  ["David and Goliath", "1SA 17", "david and goliath, goliath, giant, david sling, slingshot"],
  ["David and Bathsheba", "2SA 11", "bathsheba, david and bathsheba, uriah"],
  ["The wisdom of Solomon", "1KI 3:16", "solomon, wisdom of solomon, two mothers, cut the baby in half, king solomon"],
  ["Elijah and the prophets of Baal", "1KI 18:20", "elijah, mount carmel, prophets of baal, baal, fire from heaven"],
  ["Elijah and the still small voice", "1KI 19", "still small voice, elijah in the cave, gentle whisper"],
  ["Elijah taken up to heaven", "2KI 2", "chariot of fire, elijah taken up, elisha"],
  ["Naaman is healed", "2KI 5", "naaman, naaman leprosy, wash in the jordan"],
  ["Queen Esther", "EST 4", "esther, queen esther, for such a time as this, haman, mordecai"],
  ["The suffering of Job", "JOB 1", "job, job's suffering, patience of job"],
  ["The Lord is my shepherd", "PSA 23", "psalm 23, shepherd psalm, the lord is my shepherd, valley of the shadow of death"],
  ["The fiery furnace", "DAN 3", "fiery furnace, shadrach meshach and abednego, shadrach, three young men, furnace"],
  ["The writing on the wall", "DAN 5", "writing on the wall, belshazzar, handwriting on the wall"],
  ["Daniel in the lions' den", "DAN 6", "daniel, lions den, daniel and the lions, lions"],
  ["Jonah and the big fish", "JON 1", "jonah, whale, jonah and the whale, big fish, great fish, swallowed by a fish, nineveh"],
  ["Tobias and the angel Raphael", "TOB 5", "tobit, tobias, raphael, angel raphael, tobias and the angel"],
  ["Judith saves her people", "JDT 13", "judith, holofernes"],
  ["The mother and her seven sons", "2MA 7", "seven brothers, mother and seven sons, maccabees"],
  ["The Annunciation", "LUK 1:26", "annunciation, angel gabriel, gabriel visits mary, hail mary"],
  ["The Visitation", "LUK 1:39", "visitation, mary visits elizabeth, magnificat"],
  ["The birth of Jesus", "LUK 2", "birth of jesus, nativity, christmas, christmas story, manger, bethlehem, shepherds"],
  ["The wise men", "MAT 2", "wise men, magi, three kings, three wise men, star of bethlehem, herod"],
  ["The boy Jesus in the Temple", "LUK 2:41", "boy jesus, jesus in the temple, finding in the temple, jesus lost"],
  ["The baptism of Jesus", "MAT 3:13", "baptism of jesus, jesus baptized, john the baptist, baptism"],
  ["Jesus is tempted in the desert", "MAT 4", "temptation of jesus, jesus tempted, forty days in the desert, devil tempts jesus"],
  ["The wedding at Cana", "JHN 2", "wedding at cana, cana, water into wine"],
  ["Jesus calls the first disciples", "LUK 5", "fishers of men, calling of the disciples, follow me, great catch of fish"],
  ["The Sermon on the Mount", "MAT 5", "sermon on the mount, beatitudes, blessed are the poor, salt and light"],
  ["The Lord's Prayer", "MAT 6:5", "our father, lord's prayer, how to pray"],
  ["The woman at the well", "JHN 4", "woman at the well, samaritan woman, living water"],
  ["The paralysed man through the roof", "MRK 2", "paralytic, paralyzed man, through the roof, lowered through the roof"],
  ["Jesus calms the storm", "MRK 4:35", "calming the storm, jesus calms the storm, storm at sea, peace be still"],
  ["The parable of the sower", "MAT 13", "sower, parable of the sower, seeds, mustard seed"],
  ["Feeding the five thousand", "JHN 6", "feeding the five thousand, five thousand, 5000, feeding the 5000, loaves and fishes, loaves and fish, five loaves"],
  ["Jesus walks on water", "MAT 14:22", "walking on water, jesus walks on water, peter walks on water"],
  ["The Transfiguration", "MAT 17", "transfiguration, mount tabor"],
  ["The Good Samaritan", "LUK 10:25", "good samaritan, samaritan, who is my neighbor, who is my neighbour"],
  ["The Good Shepherd", "JHN 10", "good shepherd, shepherd, i am the good shepherd, sheep gate"],
  ["Mary and Martha", "LUK 10:38", "mary and martha, martha"],
  ["The lost sheep", "LUK 15", "lost sheep, the one sheep, ninety nine"],
  ["The prodigal son", "LUK 15:11", "prodigal son, lost son, prodigal, the father who ran"],
  ["The rich man and Lazarus", "LUK 16:19", "rich man and lazarus"],
  ["Zacchaeus in the tree", "LUK 19", "zacchaeus, zacheus, zaccheus, zakeus, tax collector in the tree, sycamore"],
  ["The woman caught in adultery", "JHN 8", "first stone, woman caught in adultery, without sin cast the first stone"],
  ["The man born blind", "JHN 9", "man born blind, blind man healed, i was blind now i see"],
  ["The raising of Lazarus", "JHN 11", "lazarus, raising of lazarus, jesus wept, lazarus come out"],
  ["Palm Sunday", "MAT 21", "palm sunday, triumphal entry, hosanna, jesus on a donkey"],
  ["Jesus washes their feet", "JHN 13", "washing of feet, washing feet, jesus washes feet"],
  ["The Last Supper", "LUK 22", "last supper, eucharist, this is my body, first communion"],
  ["The agony in the garden", "MAT 26:36", "gethsemane, agony in the garden, garden of gethsemane"],
  ["Peter denies Jesus", "LUK 22:54", "peter denies jesus, peter's denial, rooster crowed"],
  ["The crucifixion", "JHN 19", "crucifixion, the cross, good friday, death of jesus, passion"],
  ["The empty tomb", "JHN 20", "resurrection, empty tomb, he is risen, easter, easter story"],
  ["The road to Emmaus", "LUK 24:13", "emmaus, road to emmaus"],
  ["Doubting Thomas", "JHN 20:24", "doubting thomas, thomas"],
  ["Breakfast by the sea", "JHN 21", "do you love me, feed my sheep, peter restored, breakfast on the beach, 153 fish"],
  ["The Ascension", "ACT 1", "ascension, jesus ascends"],
  ["Pentecost", "ACT 2", "pentecost, holy spirit comes, tongues of fire"],
  ["Saul on the road to Damascus", "ACT 9", "road to damascus, conversion of paul, saul, paul's conversion"],
  ["Paul and Silas in prison", "ACT 16:16", "paul and silas, prison earthquake, singing in prison"],
  ["Paul's shipwreck", "ACT 27", "shipwreck, paul shipwreck"],
  ["Love is patient", "1CO 13", "love is patient, love chapter, faith hope and love"],
  ["The armour of God", "EPH 6:10", "armor of god, armour of god, full armor"],
  ["A new heaven and a new earth", "REV 21", "new heaven, new earth, new jerusalem, no more tears"],
];

const STOP = new Set("the a an of story stories about and in on to by with bible tale account is was what where who how when find show me read".split(" "));
const words = (s) => s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));
const key = (w) => w.replace(/wh/g, "w").replace(/ph/g, "f").replace(/ck/g, "k").replace(/(.)\1+/g, "$1");
const skel = (k) => k[0] + k.slice(1).replace(/[aeiouy]/g, "");

function dist(a, b) {
  // Damerau–Levenshtein (adjacent swaps count as one), early exit for big gaps
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}

// How alike two words are, 0..1
function sim(q, a) {
  if (q === a) return 1;
  const kq = key(q), ka = key(a);
  if (kq === ka) return 1;
  const len = Math.min(kq.length, ka.length);
  const d = dist(kq, ka);
  if (d === 1 && len >= 4) return 0.8;
  if (d === 2 && len >= 6) return 0.62;
  if (Math.min(q.length, a.length) >= 3 && skel(kq) === skel(ka) && kq[0] === ka[0]) return 0.7; // sea / see, son / sun
  if (len >= 5 && (ka.startsWith(kq) || kq.startsWith(ka))) return 0.75;
  return 0;
}

const INDEX = S.map(([title, ref, aka]) => ({ title, ref, aliases: [title, ...aka.split(",")].map((a) => words(a)).filter((w) => w.length) }));

// Best matching stories for a search (at most 2), or [] if it doesn't look like a story name.
export function match(q) {
  const qw = words(q);
  if (!qw.length || qw.length > 6) return [];
  const scored = [];
  for (const st of INDEX) {
    let best = 0;
    for (const al of st.aliases) {
      const per = qw.map((w) => Math.max(...al.map((a) => sim(w, a))));
      if (per.some((x) => x < 0.6)) continue; // every word you typed must be part of the name
      const used = al.filter((a) => qw.some((w) => sim(w, a) >= 0.6)).length;
      const coverage = used / al.length;
      if (coverage < 0.6) continue; // and most of the name must be there
      const score = (per.reduce((x, y) => x + y, 0) / per.length) * (0.6 + 0.4 * coverage);
      best = Math.max(best, score);
    }
    if (best >= 0.6) scored.push({ ...st, score: best });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s, i) => i === 0 || (i === 1 && s.score >= scored[0].score - 0.05)).slice(0, 2);
}

export function parseRef(ref) {
  const m = /^(\w+) (\d+)(?::(\d+))?$/.exec(ref);
  return { book: m[1], chapter: +m[2], verse: m[3] ? +m[3] : null };
}
