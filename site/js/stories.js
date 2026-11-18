// Famous Bible stories by the names people call them, with forgiving spelling:
// "wale story" → Jonah and the big fish, "red see" → Crossing the Red Sea, "goliat" → David and Goliath.
// Matching only looks at this list, so it can't "correct" ordinary searches.

// [title, where it starts (BOOK C or BOOK C:V), names people use (comma-separated), where it ends (C:V),
//  its key verse (C:V), a question to think about]
const S = [
  ["The creation of the world", "GEN 1", "creation, creation story, seven days, god made the world, in the beginning", "2:3", "1:31", "Where do you see the goodness of what God has made today?"],
  ["Adam and Eve and the fall", "GEN 3", "adam and eve, the fall, garden of eden, eden, serpent, forbidden fruit, apple", "3:24", "3:9", "Where are you hiding from God right now?"],
  ["Cain and Abel", "GEN 4", "cain and abel, cain, abel, am i my brother's keeper", "4:16", "4:7", "What is crouching at your door that you need to master?"],
  ["Noah's ark and the flood", "GEN 6:9", "noah, noah's ark, ark, the flood, great flood", "9:17", "9:13", "Which promise of God do you need to hold on to?"],
  ["The tower of Babel", "GEN 11", "tower of babel, babel", "11:9", "11:4", "Where am I trying to make a name for myself instead of trusting God?"],
  ["God calls Abraham", "GEN 12", "call of abraham, abram, abraham", "12:9", "12:1", "What might God be asking you to leave behind?"],
  ["Sodom and Gomorrah", "GEN 19", "sodom and gomorrah, sodom, lot's wife, pillar of salt", "19:29", "19:26", "What do you keep looking back to?"],
  ["Abraham and Isaac on the mountain", "GEN 22", "abraham and isaac, binding of isaac, sacrifice of isaac", "22:19", "22:14", "Where do you need to trust that the Lord will provide?"],
  ["Jacob and Esau", "GEN 27", "jacob and esau, esau, birthright, stolen blessing", "27:41", "27:38", "Is there someone you need to make peace with?"],
  ["Jacob's ladder", "GEN 28:10", "jacob's ladder, ladder, stairway to heaven", "28:22", "28:16", "Where has God been with you without you noticing?"],
  ["Jacob wrestles with God", "GEN 32:22", "jacob wrestles, wrestling with god, wrestling angel", "32:32", "32:26", "What are you wrestling with God about?"],
  ["Joseph and his coat of many colours", "GEN 37", "joseph, coat of many colors, coat of many colours, joseph's dreams, joseph sold", "37:36", "37:4", "Have jealousy or favouritism hurt your family?"],
  ["Joseph forgives his brothers", "GEN 45", "joseph forgives, joseph and his brothers", "45:15", "45:5", "Can you see God bringing good out of something hard?"],
  ["Baby Moses in the basket", "EXO 2", "baby moses, moses in the basket, moses bulrushes, birth of moses", "2:10", "2:6", "Who has God placed in your life to protect you?"],
  ["The burning bush", "EXO 3", "burning bush, moses burning bush, i am who i am", "3:15", "3:14", "What would change if you truly believed God is with you, the great I AM?"],
  ["The plagues of Egypt", "EXO 7:14", "plagues, ten plagues, plagues of egypt, let my people go, pharaoh", "11:10", "9:1", "What is keeping you from being free to serve God?"],
  ["The Passover", "EXO 12", "passover, the passover lamb, first passover", "12:28", "12:13", "What has God passed over and forgiven in your life?"],
  ["Crossing the Red Sea", "EXO 14", "red sea, crossing the red sea, parting the sea, parting of the red sea, moses parts the sea", "14:31", "14:14", "What battle do you need to let God fight for you?"],
  ["Manna from heaven", "EXO 16", "manna, bread from heaven, quail", "16:21", "16:4", "Are you trusting God for today's bread, or worrying about tomorrow's?"],
  ["Water from the rock", "EXO 17", "water from the rock, moses strikes the rock", "17:7", "17:6", "Where do you feel dry, and need God to bring water?"],
  ["The Ten Commandments", "EXO 20", "ten commandments, commandments, mount sinai", "20:17", "20:3", "What comes before God in your life?"],
  ["The golden calf", "EXO 32", "golden calf, calf idol", "32:14", "32:1", "What do you turn to when God feels slow?"],
  ["Balaam's talking donkey", "NUM 22:21", "balaam, talking donkey, balaam's donkey", "22:35", "22:31", "What might God be trying to stop you from?"],
  ["The walls of Jericho", "JOS 6", "jericho, walls of jericho, joshua jericho, battle of jericho", "6:20", "6:20", "Where is God asking you for patient obedience?"],
  ["Gideon and his 300 men", "JDG 7", "gideon, gideon's fleece, fleece, three hundred men", "7:22", "7:2", "Where does God want to show his strength through your weakness?"],
  ["Samson and Delilah", "JDG 16", "samson, delilah, samson and delilah, samson's hair", "16:30", "16:28", "What do you need God to strengthen you for, one more time?"],
  ["Ruth and Naomi", "RUT 1", "ruth, naomi, ruth and naomi, where you go i will go", "1:22", "1:16", "Who has God given you to stay beside?"],
  ["God calls the boy Samuel", "1SA 3", "samuel, call of samuel, speak lord your servant is listening", "3:21", "3:10", "How can you listen for God today?"],
  ["David and Goliath", "1SA 17", "david and goliath, goliath, giant, david sling, slingshot", "17:50", "17:47", "What giant are you facing, and whose battle is it?"],
  ["David and Bathsheba", "2SA 11", "bathsheba, david and bathsheba, uriah", "12:13", "12:13", "Is there something you need to bring honestly to God?"],
  ["The wisdom of Solomon", "1KI 3:16", "solomon, wisdom of solomon, two mothers, cut the baby in half, king solomon", "3:28", "3:28", "Where do you need God's wisdom to see clearly?"],
  ["Elijah and the prophets of Baal", "1KI 18:20", "elijah, mount carmel, prophets of baal, baal, fire from heaven", "18:39", "18:21", "Where are you wavering between two opinions?"],
  ["Elijah and the still small voice", "1KI 19", "still small voice, elijah in the cave, gentle whisper", "19:13", "19:12", "Where might God be speaking quietly to you?"],
  ["Elijah taken up to heaven", "2KI 2", "chariot of fire, elijah taken up, elisha", "2:14", "2:11", "What faith have you received from others that you can carry on?"],
  ["Naaman is healed", "2KI 5", "naaman, naaman leprosy, wash in the jordan", "5:14", "5:14", "Is God asking you to do something simple you've been resisting?"],
  ["Queen Esther", "EST 4", "esther, queen esther, for such a time as this, haman, mordecai", "4:17", "4:14", "Could you be where you are for such a time as this?"],
  ["The suffering of Job", "JOB 1", "job, job's suffering, patience of job", "1:22", "1:21", "Can you bless God's name even in loss?"],
  ["The Lord is my shepherd", "PSA 23", "psalm 23, shepherd psalm, the lord is my shepherd, valley of the shadow of death", "23:6", "23:4", "Where do you need the Shepherd beside you?"],
  ["The fiery furnace", "DAN 3", "fiery furnace, shadrach meshach and abednego, shadrach, three young men, furnace", "3:97", "3:92", "Who walks with you in the fire?"],
  ["The writing on the wall", "DAN 5", "writing on the wall, belshazzar, handwriting on the wall", "5:30", "5:27", "What in your life needs to be weighed honestly before God?"],
  ["Daniel in the lions' den", "DAN 6", "daniel, lions den, daniel and the lions, lions", "6:23", "6:22", "What would it look like to stay faithful under pressure?"],
  ["Jonah and the big fish", "JON 1", "jonah, whale, jonah and the whale, big fish, great fish, swallowed by a fish, nineveh", "2:10", "2:2", "From what deep place do you need to call out to God?"],
  ["Tobias and the angel Raphael", "TOB 5", "tobit, tobias, raphael, angel raphael, tobias and the angel", "5:22", "5:21", "Who has God sent to walk beside you?"],
  ["Judith saves her people", "JDT 13", "judith, holofernes", "13:20", "13:14", "Where is God asking you to be brave?"],
  ["The mother and her seven sons", "2MA 7", "seven brothers, mother and seven sons, maccabees", "7:41", "7:28", "What gives you courage to stay faithful?"],
  ["The Annunciation", "LUK 1:26", "annunciation, angel gabriel, gabriel visits mary, hail mary", "1:38", "1:38", "What is God asking you to say yes to?"],
  ["The Visitation", "LUK 1:39", "visitation, mary visits elizabeth, magnificat", "1:56", "1:45", "Where can you rejoice in what God has done?"],
  ["The birth of Jesus", "LUK 2", "birth of jesus, nativity, christmas, christmas story, manger, bethlehem, shepherds", "2:20", "2:11", "How can you make room for Jesus today?"],
  ["The wise men", "MAT 2", "wise men, magi, three kings, three wise men, star of bethlehem, herod", "2:12", "2:11", "What gift can you bring Him?"],
  ["The boy Jesus in the Temple", "LUK 2:41", "boy jesus, jesus in the temple, finding in the temple, jesus lost", "2:52", "2:49", "Where do you go looking for Jesus?"],
  ["The baptism of Jesus", "MAT 3:13", "baptism of jesus, jesus baptized, john the baptist, baptism", "3:17", "3:17", "Can you hear God calling you His beloved?"],
  ["Jesus is tempted in the desert", "MAT 4", "temptation of jesus, jesus tempted, forty days in the desert, devil tempts jesus", "4:11", "4:4", "Which word of God helps you resist temptation?"],
  ["The wedding at Cana", "JHN 2", "wedding at cana, cana, water into wine", "2:11", "2:5", "What is Jesus asking you to do?"],
  ["Jesus calls the first disciples", "LUK 5", "fishers of men, calling of the disciples, follow me, great catch of fish", "5:11", "5:10", "What would it mean to leave your nets?"],
  ["The Sermon on the Mount", "MAT 5", "sermon on the mount, beatitudes, blessed are the poor, salt and light", "5:16", "5:3", "Which blessing speaks to you today?"],
  ["The Lord's Prayer", "MAT 6:5", "our father, lord's prayer, how to pray", "6:15", "6:9", "Which line of the Our Father do you most need?"],
  ["The woman at the well", "JHN 4", "woman at the well, samaritan woman, living water", "4:42", "4:14", "What are you thirsty for?"],
  ["The paralysed man through the roof", "MRK 2", "paralytic, paralyzed man, through the roof, lowered through the roof", "2:12", "2:5", "Who could you carry to Jesus?"],
  ["Jesus calms the storm", "MRK 4:35", "calming the storm, jesus calms the storm, storm at sea, peace be still", "4:41", "4:39", "What storm do you need Him to calm?"],
  ["The parable of the sower", "MAT 13", "sower, parable of the sower, seeds, mustard seed", "13:23", "13:23", "What kind of soil is your heart right now?"],
  ["Feeding the five thousand", "JHN 6", "feeding the five thousand, five thousand, 5000, feeding the 5000, loaves and fishes, loaves and fish, five loaves", "6:14", "6:9", "What small thing can you offer Him?"],
  ["Jesus walks on water", "MAT 14:22", "walking on water, jesus walks on water, peter walks on water", "14:33", "14:31", "Where are you looking at the waves instead of at Jesus?"],
  ["The Transfiguration", "MAT 17", "transfiguration, mount tabor", "17:8", "17:5", "What would it mean to listen to Him?"],
  ["The Good Samaritan", "LUK 10:25", "good samaritan, samaritan, who is my neighbor, who is my neighbour", "10:37", "10:37", "Who is the neighbour you're being asked to help?"],
  ["The Good Shepherd", "JHN 10", "good shepherd, shepherd, i am the good shepherd, sheep gate", "10:18", "10:14", "How does it feel to be known by name?"],
  ["Mary and Martha", "LUK 10:38", "mary and martha, martha", "10:42", "10:42", "What is the one thing you need today?"],
  ["The lost sheep", "LUK 15", "lost sheep, the one sheep, ninety nine", "15:7", "15:6", "Can you let yourself be carried home?"],
  ["The prodigal son", "LUK 15:11", "prodigal son, lost son, prodigal, the father who ran", "15:32", "15:20", "What would it mean to come home to the Father?"],
  ["The rich man and Lazarus", "LUK 16:19", "rich man and lazarus", "16:31", "16:20", "Who is at your gate that you don't see?"],
  ["Zacchaeus in the tree", "LUK 19", "zacchaeus, zacheus, zaccheus, zakeus, tax collector in the tree, sycamore", "19:10", "19:5", "What would change if Jesus came to your house today?"],
  ["The woman caught in adultery", "JHN 8", "first stone, woman caught in adultery, without sin cast the first stone", "8:11", "8:11", "Whom do you need to stop condemning, including yourself?"],
  ["The man born blind", "JHN 9", "man born blind, blind man healed, i was blind now i see", "9:38", "9:25", "What do you see now that you couldn't before?"],
  ["The raising of Lazarus", "JHN 11", "lazarus, raising of lazarus, jesus wept, lazarus come out", "11:44", "11:25", "Where do you need Him to bring life?"],
  ["Palm Sunday", "MAT 21", "palm sunday, triumphal entry, hosanna, jesus on a donkey", "21:11", "21:9", "How will you welcome Him today?"],
  ["Jesus washes their feet", "JHN 13", "washing of feet, washing feet, jesus washes feet", "13:15", "13:14", "Whose feet can you wash?"],
  ["The Last Supper", "LUK 22", "last supper, eucharist, this is my body, first communion", "22:20", "22:19", "How can you remember Him today?"],
  ["The agony in the garden", "MAT 26:36", "gethsemane, agony in the garden, garden of gethsemane", "26:46", "26:39", "What do you need to pray 'not my will, but yours' about?"],
  ["Peter denies Jesus", "LUK 22:54", "peter denies jesus, peter's denial, rooster crowed", "22:62", "22:61", "When you've let Him down, how do you imagine He looks at you?"],
  ["The crucifixion", "JHN 19", "crucifixion, the cross, good friday, death of jesus, passion", "19:30", "19:30", "What did He carry for you?"],
  ["The empty tomb", "JHN 20", "resurrection, empty tomb, he is risen, easter, easter story", "20:18", "20:16", "Can you hear Him call your name?"],
  ["The road to Emmaus", "LUK 24:13", "emmaus, road to emmaus", "24:35", "24:32", "When has your heart burned within you?"],
  ["Doubting Thomas", "JHN 20:24", "doubting thomas, thomas", "20:29", "20:29", "What would help you believe more deeply?"],
  ["Breakfast by the sea", "JHN 21", "do you love me, feed my sheep, peter restored, breakfast on the beach, 153 fish", "21:19", "21:17", "How would you answer Him: 'Do you love me?'"],
  ["The Ascension", "ACT 1", "ascension, jesus ascends", "1:11", "1:8", "Where are you being sent to be His witness?"],
  ["Pentecost", "ACT 2", "pentecost, holy spirit comes, tongues of fire", "2:41", "2:4", "Where do you need the Spirit's fire?"],
  ["Saul on the road to Damascus", "ACT 9", "road to damascus, conversion of paul, saul, paul's conversion", "9:19", "9:5", "Where might Jesus be turning you around?"],
  ["Paul and Silas in prison", "ACT 16:16", "paul and silas, prison earthquake, singing in prison", "16:34", "16:25", "Can you sing in your prison?"],
  ["Paul's shipwreck", "ACT 27", "shipwreck, paul shipwreck", "27:44", "27:25", "What promise will you trust in the storm?"],
  ["Love is patient", "1CO 13", "love is patient, love chapter, faith hope and love", "13:13", "13:13", "Which part of love is hardest for you right now?"],
  ["The armour of God", "EPH 6:10", "armor of god, armour of god, full armor", "6:18", "6:10", "Which piece of God's armour do you need today?"],
  ["A new heaven and a new earth", "REV 21", "new heaven, new earth, new jerusalem, no more tears", "21:7", "21:4", "What tears do you long for Him to wipe away?"],
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

const INDEX = S.map(([title, ref, aka, end, key, question]) => ({ title, ref, end, key, question, aliases: [title, ...aka.split(",")].map((a) => words(a)).filter((w) => w.length) }));

// The stories inside one book, in Bible order: [{title, book, start:[c,v], end:[c,v], key:[c,v], question}]
export function inBook(book) {
  const cv = (s) => s.split(":").map(Number);
  return INDEX.filter((st) => st.ref.split(" ")[0] === book)
    .map((st) => { const r = parseRef(st.ref); return { title: st.title, book, start: [r.chapter, r.verse || 1], end: cv(st.end), key: cv(st.key), question: st.question }; })
    .sort((a, b) => a.start[0] - b.start[0] || a.start[1] - b.start[1]);
}

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
