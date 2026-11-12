// Topics: human emotions and struggles, each with hand-picked key verses
// and the words used to find every other passage about it.
// Key verse format: "BOOK chapter:verse" or "BOOK chapter:start-end".

export const TOPICS = [
  {
    id: "anger", name: "Anger", blurb: "When you're hurt, frustrated or furious", q: "feeling angry",
    words: ["anger", "angry", "angered", "wrath", "wrathful", "rage", "raging", "fury", "furious", "indignation", "hot-tempered", "quick-tempered", "provoked", "provoke", "temper"],
    key: ["EPH 4:26-27", "EPH 4:31-32", "JAS 1:19-20", "PRO 15:1", "PRO 29:11", "PSA 37:8", "PRO 14:29", "PRO 16:32", "ECC 7:9", "COL 3:8", "MAT 5:22", "SIR 28:3"],
    subs: [
      { id: "temper", name: "My temper", q: "controlling my temper and staying calm", key: ["JAS 1:19-20", "PRO 15:1", "PRO 16:32", "PRO 14:29", "PRO 29:11", "ECC 7:9", "PSA 37:8", "EPH 4:31"] },
      { id: "wronged", name: "Someone wronged me", q: "angry because someone wronged me, wanting revenge", key: ["EPH 4:26-27", "ROM 12:19", "ROM 12:17-18", "MAT 5:23-24", "PRO 19:11", "LEV 19:18", "COL 3:13"] },
      { id: "god", name: "Angry with God", q: "angry with God, why have you abandoned me", key: ["JON 4:1-4", "JOB 7:11", "PSA 13:1-2", "JER 20:7", "HAB 1:2-3", "PSA 22:1"] },
    ],
  },
  {
    id: "love", name: "Love", blurb: "God's love for you, and loving others", q: "love",
    words: ["love", "loves", "loved", "loving", "beloved", "lovingkindness", "charity", "compassion", "affection"],
    key: ["1CO 13:4-7", "JHN 3:16", "ROM 8:38-39", "1JN 4:7-8", "1JN 4:18-19", "JHN 15:12-13", "MAT 22:37-39", "ROM 5:8", "JHN 13:34-35", "SNG 8:6-7", "DEU 6:5", "1CO 16:14"],
    subs: [
      { id: "partner", name: "Husband, wife & partner", q: "love between husband and wife in marriage", key: ["EPH 5:25", "EPH 5:28", "EPH 5:33", "1CO 7:3-4", "PRO 5:18-19", "COL 3:19", "1PE 3:7", "GEN 2:24", "SNG 8:6-7", "PRO 31:10-11", "TOB 8:7"] },
      { id: "family", name: "Family", q: "love within the family between parents and children", key: ["EXO 20:12", "EPH 6:1-4", "COL 3:20-21", "1TI 5:8", "PRO 22:6", "PSA 127:3", "RUT 1:16", "PSA 133:1", "SIR 3:12", "LUK 15:20"] },
      { id: "friends", name: "Friends", q: "a faithful friend and true friendship", key: ["PRO 17:17", "JHN 15:13-15", "PRO 18:24", "PRO 27:6", "PRO 27:17", "ECC 4:9-10", "SIR 6:14-16", "1SA 18:1", "PRO 27:9"] },
      { id: "neighbour", name: "Neighbour & strangers", q: "love your neighbor and care for people in need", key: ["MAT 22:39", "LEV 19:18", "LUK 10:33-34", "ROM 13:10", "GAL 5:14", "1JN 3:17-18", "JAS 2:8", "MAT 25:35-36", "1JN 4:20"] },
      { id: "enemies", name: "Enemies & difficult people", q: "love your enemies and bless those who hurt you", key: ["MAT 5:44", "LUK 6:27-28", "LUK 6:35", "ROM 12:14", "ROM 12:20-21", "PRO 25:21", "1PE 3:9", "LUK 23:34"] },
      { id: "gods", name: "God's love for you", q: "God's great love for me", key: ["JHN 3:16", "ROM 5:8", "ROM 8:38-39", "1JN 4:9-10", "EPH 2:4-5", "JER 31:3", "ZEP 3:17", "ISA 54:10", "1JN 3:1"] },
      { id: "god", name: "Loving God", q: "loving God with all my heart", key: ["DEU 6:5", "MAT 22:37", "JHN 14:15", "1JN 5:3", "PSA 18:1", "PSA 116:1"] },
    ],
  },
  {
    id: "fear", name: "Fear", blurb: "When you are afraid", q: "feeling afraid and scared",
    words: ["afraid", "fear", "fears", "feared", "fearful", "terror", "terrified", "dread", "frightened", "dismayed", "tremble", "trembled", "trembling"],
    key: ["ISA 41:10", "PSA 23:4", "PSA 27:1", "JOS 1:9", "2TI 1:7", "PSA 56:3-4", "JHN 14:27", "PSA 34:4", "ISA 43:1-2", "MAT 10:31", "1JN 4:18", "PSA 46:1-2"],
    subs: [
      { id: "future", name: "The future", q: "afraid of the future and what will happen", key: ["MAT 6:34", "JER 29:11", "ISA 41:10", "JOS 1:9", "PHP 4:6-7", "LAM 3:22-23"] },
      { id: "death", name: "Death", q: "fear of death and dying", key: ["JHN 11:25-26", "1CO 15:55", "PSA 23:4", "HEB 2:14-15", "JHN 14:1-3", "ROM 14:8", "REV 21:4"] },
      { id: "people", name: "What people think or do", q: "afraid of what people think or can do to me", key: ["PSA 56:11", "PSA 118:6", "PRO 29:25", "MAT 10:28", "HEB 13:6", "GAL 1:10", "ISA 51:12"] },
    ],
  },
  {
    id: "anxiety", name: "Worry & anxiety", blurb: "When your mind won't rest", q: "anxious and worried",
    words: ["anxious", "anxiety", "worry", "worried", "worries", "troubled", "trouble", "distress", "distressed", "burden", "burdened", "cares", "fret", "be still"],
    key: ["PHP 4:6-7", "MAT 6:34", "1PE 5:7", "PSA 55:22", "MAT 11:28-30", "PSA 94:19", "LUK 12:25-26", "JHN 14:1", "PRO 12:25", "MAT 6:31-33", "PSA 46:10"],
    subs: [
      { id: "money", name: "Money & provision", q: "worried about money and having enough", key: ["MAT 6:31-33", "PHP 4:19", "HEB 13:5", "PSA 37:25", "1TI 6:6-8", "PRO 30:8-9", "LUK 12:15"] },
      { id: "sleep", name: "Can't sleep", q: "lying awake at night unable to sleep from worry", key: ["PSA 4:8", "PSA 127:2", "PRO 3:24", "PSA 3:5", "PSA 121:3-4", "MAT 11:28"] },
      { id: "health", name: "Health & illness", q: "sick and worried about my health", key: ["JAS 5:14-15", "PSA 41:3", "JER 17:14", "2CO 4:16-18", "PSA 103:2-3", "SIR 38:9", "ISA 53:5"] },
    ],
  },
  {
    id: "grief", name: "Sadness & grief", blurb: "When you're mourning or heartbroken", q: "sad and grieving",
    words: ["grief", "grieve", "grieved", "grieving", "sorrow", "sorrows", "sorrowful", "mourn", "mourning", "mourns", "weep", "wept", "weeping", "tears", "brokenhearted", "broken heart", "broken in heart", "despair", "comfort", "comforted", "sad", "lament"],
    key: ["PSA 34:18", "MAT 5:4", "REV 21:4", "PSA 147:3", "JHN 11:35", "PSA 30:5", "PSA 42:11", "2CO 1:3-4", "ISA 61:1-3", "LAM 3:22-23", "JHN 16:22", "1TH 4:13-14"],
    subs: [
      { id: "death", name: "Losing someone", q: "grieving the death of a loved one", key: ["1TH 4:13-14", "JHN 11:25-26", "JHN 11:35", "REV 21:4", "2SA 12:23", "ISA 25:8", "WIS 3:1-3", "2CO 5:8"] },
      { id: "heartbreak", name: "Heartbreak", q: "heartbroken, betrayed, crushed in spirit", key: ["PSA 34:18", "PSA 147:3", "PSA 73:26", "ISA 61:1", "MAT 11:28", "PSA 42:11", "ISA 43:18-19"] },
    ],
  },
  {
    id: "loneliness", name: "Loneliness", blurb: "When you feel alone or forgotten", q: "feeling lonely, alone and abandoned",
    words: ["alone", "lonely", "forsake", "forsaken", "forsook", "abandon", "abandoned", "desolate", "forgotten", "forget", "leave you", "with you always", "I am with you"],
    key: ["DEU 31:6", "HEB 13:5", "MAT 28:20", "PSA 68:6", "PSA 25:16", "JHN 14:18", "PSA 27:10", "ISA 49:15-16", "PSA 139:7-10", "ISA 41:10"],
  },
  {
    id: "joy", name: "Joy", blurb: "Gladness, delight and celebration", q: "feeling joyful and happy",
    words: ["joy", "joyful", "joyfully", "rejoice", "rejoices", "rejoiced", "rejoicing", "glad", "gladness", "delight", "delights", "cheerful", "happy"],
    key: ["NEH 8:10", "PSA 16:11", "PHP 4:4", "JHN 15:11", "ROM 15:13", "PSA 30:11-12", "JAS 1:2-3", "1TH 5:16-18", "PSA 118:24", "LUK 15:7", "PSA 126:5"],
  },
  {
    id: "hope", name: "Hope", blurb: "When you need something to hold on to", q: "needing hope when things look hopeless",
    words: ["hope", "hopes", "hoped", "hoping", "wait for", "waited for", "expectation", "future", "promise", "promises"],
    key: ["JER 29:11", "ROM 15:13", "ROM 5:3-5", "ISA 40:31", "HEB 11:1", "LAM 3:24-26", "ROM 8:28", "1PE 1:3", "HEB 6:19", "PSA 42:5", "ROM 12:12"],
  },
  {
    id: "peace", name: "Peace", blurb: "Calm in the middle of everything", q: "longing for peace and calm",
    words: ["peace", "peaceful", "peaceably", "rest", "quiet", "quietness", "still", "calm", "tranquil"],
    key: ["JHN 14:27", "PHP 4:7", "ISA 26:3", "NUM 6:24-26", "COL 3:15", "JHN 16:33", "MAT 5:9", "ROM 12:18", "PSA 4:8", "PSA 46:10", "MAT 11:28"],
  },
  {
    id: "forgiveness", name: "Forgiveness", blurb: "Forgiving others, and being forgiven", q: "forgiveness",
    words: ["forgive", "forgives", "forgiven", "forgiving", "forgiveness", "pardon", "pardoned", "pardons", "mercy", "merciful", "white as snow", "condemn"],
    key: ["1JN 1:9", "EPH 4:32", "MAT 6:14-15", "COL 3:13", "LUK 23:34", "MAT 18:21-22", "PSA 103:10-12", "ISA 1:18", "MIC 7:18-19", "LUK 6:37", "SIR 28:2"],
    subs: [
      { id: "others", name: "Forgiving others", q: "forgiving someone who hurt me", key: ["MAT 18:21-22", "COL 3:13", "EPH 4:32", "MAT 6:14-15", "LUK 17:3-4", "MRK 11:25", "LUK 6:37", "SIR 28:2"] },
      { id: "god", name: "God forgiving me", q: "God forgiving my sins", key: ["1JN 1:9", "PSA 103:10-12", "ISA 1:18", "MIC 7:18-19", "ISA 43:25", "LUK 15:20-24", "ACT 3:19", "PSA 32:5"] },
      { id: "self", name: "Forgiving myself", q: "letting go of past mistakes and regret", key: ["ROM 8:1", "2CO 5:17", "PHP 3:13-14", "ISA 43:18-19", "1JN 3:20", "PSA 103:12", "LAM 3:22-23"] },
    ],
  },
  {
    id: "guilt", name: "Guilt & shame", blurb: "When you feel unworthy or carry regret", q: "feeling guilty and ashamed of what I did",
    words: ["guilt", "guilty", "shame", "ashamed", "condemnation", "condemn", "condemned", "iniquity", "transgression", "transgressions", "repent", "repentance"],
    key: ["ROM 8:1", "1JN 1:9", "PSA 51:10-12", "2CO 5:17", "ISA 43:25", "PSA 32:5", "LUK 15:20", "PSA 103:12", "HEB 4:16", "ISA 1:18", "JHN 8:10-11"],
  },
  {
    id: "jealousy", name: "Jealousy & envy", blurb: "Comparing yourself with others", q: "jealous and envious of other people",
    words: ["jealous", "jealousy", "envy", "envious", "envies", "covet", "coveted", "coveting", "rivalry", "selfish ambition"],
    key: ["PRO 14:30", "JAS 3:16", "1CO 13:4", "GAL 5:26", "PRO 27:4", "PSA 37:1-2", "PRO 23:17", "PHP 2:3", "EXO 20:17", "1PE 2:1"],
  },
  {
    id: "pride", name: "Pride & humility", blurb: "Keeping a humble heart", q: "struggling with pride, wanting humility",
    words: ["pride", "proud", "arrogant", "arrogance", "haughty", "boast", "boasting", "humble", "humbled", "humility", "lowly"],
    key: ["PRO 16:18", "JAS 4:6", "PHP 2:3-4", "MIC 6:8", "1PE 5:6", "MAT 23:12", "PRO 11:2", "LUK 14:11", "SIR 3:18", "ROM 12:3"],
  },
  {
    id: "patience", name: "Patience", blurb: "Waiting, enduring, not giving up", q: "losing patience, needing to wait and endure",
    words: ["patience", "patient", "patiently", "endure", "endured", "endurance", "persevere", "perseverance", "long-suffering", "enduring", "give up", "wait", "waits", "waited"],
    key: ["GAL 5:22-23", "ROM 12:12", "JAS 5:7-8", "PSA 37:7", "ECC 7:8", "ISA 40:31", "COL 3:12", "GAL 6:9", "PSA 27:14", "HEB 12:1"],
  },
  {
    id: "gratitude", name: "Gratitude", blurb: "A thankful heart", q: "being thankful and grateful",
    words: ["thank", "thanks", "thankful", "thanksgiving", "grateful", "gratitude", "praise", "bless the"],
    key: ["1TH 5:18", "PSA 100:4", "PSA 107:1", "COL 3:17", "PSA 136:1", "PHP 4:6", "HEB 12:28", "PSA 9:1", "EPH 5:20", "COL 3:15"],
  },
  {
    id: "temptation", name: "Temptation", blurb: "When you're struggling to do what's right", q: "struggling with temptation and sin",
    words: ["tempt", "tempted", "temptation", "temptations", "tempter", "lust", "lusts", "desires of the flesh", "flesh", "resist", "devil"],
    key: ["1CO 10:13", "JAS 1:12-14", "MAT 26:41", "HEB 4:15", "JAS 4:7", "MAT 6:13", "GAL 5:16", "PSA 119:11", "HEB 2:18", "1PE 5:8-9"],
  },
  {
    id: "doubt", name: "Doubt & faith", blurb: "When believing feels hard", q: "doubt and faith",
    words: ["doubt", "doubted", "doubting", "doubts", "unbelief", "believe", "believed", "faith", "trust", "trusted"],
    key: ["MRK 9:24", "HEB 11:1", "HEB 11:6", "JAS 1:5-6", "MAT 14:31", "JHN 20:27-29", "PRO 3:5-6", "MAT 17:20", "ROM 10:17", "2CO 5:7"],
    subs: [
      { id: "self", name: "Self-doubt: not good enough", q: "feeling inadequate, weak, not good enough", key: ["2CO 12:9-10", "2CO 3:5", "1CO 1:27-29", "PHP 4:13", "EXO 4:10-12", "JER 1:6-8", "PSA 139:13-14", "EPH 2:10", "1SA 16:7", "2TI 1:7"] },
      { id: "god", name: "Doubting God", q: "doubting God and struggling to believe", key: ["MRK 9:24", "MAT 14:31", "JHN 20:27-29", "JAS 1:5-6", "PSA 13:1-2", "HAB 1:2"] },
      { id: "trust", name: "Learning to trust", q: "trusting God when I don't understand", key: ["PRO 3:5-6", "PSA 56:3", "ISA 26:3-4", "PSA 37:5", "HEB 11:6", "2CO 5:7", "ROM 10:17"] },
    ],
  },
  {
    id: "weariness", name: "Tiredness & strength", blurb: "When you're worn out", q: "exhausted, tired and worn out",
    words: ["weary", "tired", "faint", "exhausted", "weak", "weakness", "strength", "strengthen", "strengthens", "renew"],
    key: ["ISA 40:29-31", "MAT 11:28", "PHP 4:13", "2CO 12:9-10", "GAL 6:9", "PSA 73:26", "NEH 8:10", "PSA 46:1", "2CO 4:16", "ISA 41:10"],
  },
];

export function topic(id) {
  return TOPICS.find((t) => t.id === id);
}

export function parseKey(ref) {
  const m = ref.match(/^(\w+) (\d+):(\d+)(?:-(\d+))?$/);
  if (!m) return null;
  return { book: m[1], chapter: +m[2], vs: +m[3], ve: m[4] ? +m[4] : +m[3] };
}

// One regular expression per topic; whole words, case-insensitive.
export function topicRegex(t) {
  const parts = t.words
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+"));
  return new RegExp("\\b(" + parts.join("|") + ")\\b", "gi");
}
