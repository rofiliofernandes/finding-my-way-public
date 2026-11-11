"""Build the WEB Catholic Edition data files for the app.

Source: World English Bible USFX (public domain, eBible.org via github.com/seven1m/open-bibles).
The Catholic edition differs from the classic WEB in that it renders the divine name as
"LORD"/"GOD", uses the Catholic book set and order, Greek Esther, Daniel with the Greek
additions (3:24-90, ch. 13 Susanna, ch. 14 Bel), and the Letter of Jeremiah as Baruch 6.

Usage: python3 build_data.py <web.usfx.xml> <out_dir>
"""
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

SKIP_TAGS = {"f", "x", "fe", "id", "ide", "h", "toc", "cl", "rem", "fig", "ref"}
HEADING_SFM = {"mt", "mt1", "mt2", "mt3", "ms", "ms1", "ms2", "mr", "s", "s1", "s2", "ip", "is", "imt", "io", "iot", "r", "sp", "cd"}


def parse(path):
    tree = ET.parse(path)
    root = tree.getroot()
    books = {}
    for book in root.iter("book"):
        bid = book.get("id")
        if bid in ("FRT", "GLO"):
            continue
        st = {"chapters": {}, "ch": None, "verse": None, "para": True, "poetry": False, "level": 1, "title": {}}

        def cur_chapter():
            return st["chapters"].setdefault(st["ch"], [])

        def add_text(txt):
            if not txt or st["verse"] is None:
                return
            st["verse"]["t"] += txt

        def walk(el, in_heading=False, in_title=False):
            tag = el.tag
            if tag in SKIP_TAGS:
                return False  # caller still handles tail
            if tag == "c":
                st["ch"] = int(el.get("id"))
                st["verse"] = None
                st["para"] = True
                return False
            if tag == "v":
                st["verse"] = {"n": el.get("id"), "t": ""}
                if st["para"]:
                    st["verse"]["p"] = 1
                    st["para"] = False
                if st["poetry"]:
                    st["verse"]["q"] = 1
                    if st["level"] > 1:
                        st["verse"]["t"] += "\t"
                cur_chapter().append(st["verse"])
                return False
            if tag == "ve":
                return False
            if tag == "d":  # psalm title
                txt = "".join(el.itertext()).strip()
                # strip footnote text from title
                for f in el.iter("f"):
                    ftxt = "".join(f.itertext())
                    txt = txt.replace(ftxt.strip(), "")
                if st["ch"] is not None:
                    st["title"][st["ch"]] = re.sub(r"\s+", " ", txt).strip()
                st["para"] = True
                return False
            if tag in ("p", "q"):
                sfm = el.get("sfm") or ""
                if tag == "p" and sfm in HEADING_SFM:
                    return False
                is_q = tag == "q" or sfm.startswith("q")
                level = int(el.get("level") or 1)
                if is_q:
                    if st["verse"] is not None and st["verse"]["t"].strip() and st["poetry"]:
                        # continuation line of poetry inside same verse
                        st["verse"]["t"] = st["verse"]["t"].rstrip() + "\n" + ("\t" if level > 1 else "")
                        st["verse"]["q"] = 1
                    elif st["verse"] is not None and st["verse"]["t"].strip():
                        # switching from prose to poetry mid-verse
                        st["verse"]["t"] = st["verse"]["t"].rstrip() + "\n" + ("\t" if level > 1 else "")
                        st["verse"]["q"] = 1
                    else:
                        st["para"] = st["para"] or not st["poetry"]
                    st["poetry"] = True
                    st["level"] = level
                else:
                    st["poetry"] = False
                    st["level"] = 1
                    st["para"] = True
                    if st["verse"] is not None and st["verse"]["t"].strip() and st["verse"].get("q"):
                        # prose paragraph continuing a verse that started as poetry
                        st["verse"]["t"] = st["verse"]["t"].rstrip() + "\n"
                    elif st["verse"] is not None and st["verse"]["t"].strip():
                        st["verse"]["t"] = st["verse"]["t"].rstrip() + " "
                if el.text:
                    add_text(el.text)
                for child in el:
                    walk(child)
                    if child.tail:
                        add_text(child.tail)
                # a stanza break (b) or new p after poetry handled by next element
                return False
            if tag == "b":
                st["para"] = True
                return False
            # inline elements: wj, add, it, k, qs, bk, nd ...
            if el.text:
                add_text(el.text)
            for child in el:
                walk(child)
                if child.tail:
                    add_text(child.tail)
            return False

        for child in book:
            walk(child)
            if child.tail:
                add_text(child.tail)

        chapters = []
        for ch in sorted(st["chapters"]):
            verses = []
            for v in st["chapters"][ch]:
                t = v["t"]
                t = re.sub(r"[  ]+", " ", t)
                t = re.sub(r" *\n *", "\n", t).replace("\n\t ", "\n\t")
                t = t.strip()
                if not t.strip():
                    continue
                out = {"n": v["n"], "t": t}
                if v.get("p"):
                    out["p"] = 1
                if v.get("q"):
                    out["q"] = 1
                verses.append(out)
            chapters.append({"c": ch, "title": st["title"].get(ch), "v": verses})
        books[bid] = chapters
    return books


def lordify(s):
    """Classic WEB "Yahweh" -> Catholic edition "LORD", adding "the" where English needs it.
    Only used for the few verses the WEB Updated source is missing."""
    if "Yahweh" not in s:
        return s
    s = re.sub(r"\bLord Yahweh\b", "Lord GOD", s)
    out = []
    last = 0
    for m in re.finditer(r"\bYahweh\b", s):
        before = s[:m.start()]
        after = s[m.end():]
        out.append(s[last:m.start()])
        prev = re.search(r"(\S+)\s*$", before)
        prevw = prev.group(1) if prev else ""
        sentence_start = (not before.strip()) or re.search(r"([.!?;:\n“‘(]|[.!?]”)\s*$", before)
        vocative = sentence_start and re.match(r"\s*(my God|our God|God of [^,]+)?[,!]", after)
        if prevw.lower() in ("the", "o") or vocative:
            out.append("LORD")
        elif sentence_start and not re.search(r"[“‘]\s*$", before):
            out.append("The LORD")
        elif sentence_start:
            out.append("The LORD")
        else:
            out.append("the LORD")
        last = m.end()
    out.append(s[last:])
    return "".join(out)


CATHOLIC = [
    # id, name, short, testament, group
    ("GEN", "Genesis", "Gen", "OT", "Pentateuch"), ("EXO", "Exodus", "Exod", "OT", "Pentateuch"),
    ("LEV", "Leviticus", "Lev", "OT", "Pentateuch"), ("NUM", "Numbers", "Num", "OT", "Pentateuch"),
    ("DEU", "Deuteronomy", "Deut", "OT", "Pentateuch"),
    ("JOS", "Joshua", "Josh", "OT", "Historical"), ("JDG", "Judges", "Judg", "OT", "Historical"),
    ("RUT", "Ruth", "Ruth", "OT", "Historical"), ("1SA", "1 Samuel", "1 Sam", "OT", "Historical"),
    ("2SA", "2 Samuel", "2 Sam", "OT", "Historical"), ("1KI", "1 Kings", "1 Kgs", "OT", "Historical"),
    ("2KI", "2 Kings", "2 Kgs", "OT", "Historical"), ("1CH", "1 Chronicles", "1 Chr", "OT", "Historical"),
    ("2CH", "2 Chronicles", "2 Chr", "OT", "Historical"), ("EZR", "Ezra", "Ezra", "OT", "Historical"),
    ("NEH", "Nehemiah", "Neh", "OT", "Historical"), ("TOB", "Tobit", "Tob", "OT", "Historical"),
    ("JDT", "Judith", "Jdt", "OT", "Historical"), ("EST", "Esther", "Esth", "OT", "Historical"),
    ("1MA", "1 Maccabees", "1 Macc", "OT", "Historical"), ("2MA", "2 Maccabees", "2 Macc", "OT", "Historical"),
    ("JOB", "Job", "Job", "OT", "Wisdom"), ("PSA", "Psalms", "Ps", "OT", "Wisdom"),
    ("PRO", "Proverbs", "Prov", "OT", "Wisdom"), ("ECC", "Ecclesiastes", "Eccl", "OT", "Wisdom"),
    ("SNG", "Song of Songs", "Song", "OT", "Wisdom"), ("WIS", "Wisdom", "Wis", "OT", "Wisdom"),
    ("SIR", "Sirach", "Sir", "OT", "Wisdom"),
    ("ISA", "Isaiah", "Isa", "OT", "Prophets"), ("JER", "Jeremiah", "Jer", "OT", "Prophets"),
    ("LAM", "Lamentations", "Lam", "OT", "Prophets"), ("BAR", "Baruch", "Bar", "OT", "Prophets"),
    ("EZK", "Ezekiel", "Ezek", "OT", "Prophets"), ("DAN", "Daniel", "Dan", "OT", "Prophets"),
    ("HOS", "Hosea", "Hos", "OT", "Prophets"), ("JOL", "Joel", "Joel", "OT", "Prophets"),
    ("AMO", "Amos", "Amos", "OT", "Prophets"), ("OBA", "Obadiah", "Obad", "OT", "Prophets"),
    ("JON", "Jonah", "Jonah", "OT", "Prophets"), ("MIC", "Micah", "Mic", "OT", "Prophets"),
    ("NAM", "Nahum", "Nah", "OT", "Prophets"), ("HAB", "Habakkuk", "Hab", "OT", "Prophets"),
    ("ZEP", "Zephaniah", "Zeph", "OT", "Prophets"), ("HAG", "Haggai", "Hag", "OT", "Prophets"),
    ("ZEC", "Zechariah", "Zech", "OT", "Prophets"), ("MAL", "Malachi", "Mal", "OT", "Prophets"),
    ("MAT", "Matthew", "Matt", "NT", "Gospels"), ("MRK", "Mark", "Mark", "NT", "Gospels"),
    ("LUK", "Luke", "Luke", "NT", "Gospels"), ("JHN", "John", "John", "NT", "Gospels"),
    ("ACT", "Acts", "Acts", "NT", "Acts"),
    ("ROM", "Romans", "Rom", "NT", "Letters"), ("1CO", "1 Corinthians", "1 Cor", "NT", "Letters"),
    ("2CO", "2 Corinthians", "2 Cor", "NT", "Letters"), ("GAL", "Galatians", "Gal", "NT", "Letters"),
    ("EPH", "Ephesians", "Eph", "NT", "Letters"), ("PHP", "Philippians", "Phil", "NT", "Letters"),
    ("COL", "Colossians", "Col", "NT", "Letters"), ("1TH", "1 Thessalonians", "1 Thess", "NT", "Letters"),
    ("2TH", "2 Thessalonians", "2 Thess", "NT", "Letters"), ("1TI", "1 Timothy", "1 Tim", "NT", "Letters"),
    ("2TI", "2 Timothy", "2 Tim", "NT", "Letters"), ("TIT", "Titus", "Titus", "NT", "Letters"),
    ("PHM", "Philemon", "Phlm", "NT", "Letters"), ("HEB", "Hebrews", "Heb", "NT", "Letters"),
    ("JAS", "James", "Jas", "NT", "Letters"), ("1PE", "1 Peter", "1 Pet", "NT", "Letters"),
    ("2PE", "2 Peter", "2 Pet", "NT", "Letters"), ("1JN", "1 John", "1 John", "NT", "Letters"),
    ("2JN", "2 John", "2 John", "NT", "Letters"), ("3JN", "3 John", "3 John", "NT", "Letters"),
    ("JUD", "Jude", "Jude", "NT", "Letters"), ("REV", "Revelation", "Rev", "NT", "Revelation"),
]


def apply_webu(books, vref_path, webu_path):
    """Replace classic WEB wording with WEB Updated wording (the text the Catholic edition uses),
    keeping the classic file's verse numbering and paragraph/poetry layout."""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from align import load_webu, norm_words, sim, transfer_breaks
    wb, wi = load_webu(vref_path, webu_path)
    stats = {"updated": 0, "fallback": 0}
    fallbacks = []
    for bid, chs in books.items():
        lst = wb.get(bid)
        if not lst:
            continue
        nl = [norm_words(t) for _, _, t in lst]
        pos = 0
        for ch in chs:
            for v in ch["v"]:
                cw = norm_words(v["t"])
                exp = wi[bid].get((ch["c"], int(v["n"])), pos)
                cands = sorted(set([exp] + list(range(pos - 10, pos + 11))))
                best = (0, None)
                for k in cands:
                    if 0 <= k < len(lst):
                        sc = sim(cw, nl[k])
                        if sc > best[0]:
                            best = (sc, k)
                        if sc > 0.97:
                            break
                if best[0] >= 0.45:
                    k = best[1]
                    new = lst[k][2]
                    v["t"] = transfer_breaks(v["t"], new) if best[0] >= 0.85 else new
                    if best[0] < 0.85 and v.get("q"):
                        v["t"] = new
                    pos = k + 1
                    stats["updated"] += 1
                else:
                    pos += 1
                    stats["fallback"] += 1
                    fallbacks.append((bid, ch["c"], v["n"]))
    print("WEBU alignment:", stats, fallbacks[:30])


def main(src, out, vref=None, webu=None):
    books = parse(src)
    if vref and webu:
        apply_webu(books, vref, webu)
    # Catholic arrangement
    cat = dict(books)
    cat["EST"] = books["ESG"]  # Greek Esther with additions

    # Daniel 3: insert Prayer of Azariah / Song of the Three as 3:24-90, Hebrew 3:24-30 -> 3:91-97
    def flatten(chs):
        for ch in chs:
            for v in ch["v"]:
                v["t"] = re.sub(r"\s*\n\t?\s*", " ", v["t"]).strip()
                v.pop("q", None)
        return chs
    for k in ("S3Y", "SUS", "BEL", "LJE"):
        flatten(books[k])
    dan = json.loads(json.dumps(books["DAN"]))
    s3y = [v for ch in books["S3Y"] for v in ch["v"]]
    ch3 = next(c for c in dan if c["c"] == 3)
    before = [v for v in ch3["v"] if int(v["n"]) <= 23]
    after = [v for v in ch3["v"] if int(v["n"]) >= 24]
    # Song of the Three 1-33 -> Dan 3:24-56, 34-68 -> 3:56-90 (Catholic numbering; 3:56 merges two)
    ins = []
    for v in s3y:
        n = int(v["n"])
        nv = dict(v)
        nv["n"] = str(n + 23 if n <= 33 else n + 22)
        if ins and ins[-1]["n"] == nv["n"]:
            ins[-1] = dict(ins[-1], t=ins[-1]["t"].rstrip() + " " + nv["t"])
            continue
        ins.append(nv)
    if ins:
        ins[0]["p"] = 1
    shift = 91 - 24
    for v in after:
        v["n"] = str(int(v["n"]) + shift)
    if after:
        after[0]["p"] = 1
    ch3["v"] = before + ins + after
    print("Daniel 3 verses:", len(ch3["v"]), "(inserted", len(ins), ")")
    sus = books["SUS"][0]
    bel = books["BEL"][0]
    dan.append({"c": 13, "title": "Susanna", "v": sus["v"]})
    dan.append({"c": 14, "title": "Bel and the Dragon", "v": bel["v"]})
    cat["DAN"] = dan

    bar = json.loads(json.dumps(books["BAR"]))
    lje = books["LJE"][0]
    if len(bar) == 5:
        bar.append({"c": 6, "title": "The Letter of Jeremiah", "v": lje["v"]})
    cat["BAR"] = bar

    os.makedirs(os.path.join(out, "books"), exist_ok=True)
    meta = []
    total = 0
    for bid, name, short, test, group in CATHOLIC:
        chs = cat[bid]
        data = {"id": bid, "name": name, "chapters": []}
        counts = []
        for ch in chs:
            vs = []
            for v in ch["v"]:
                v = dict(v)
                v["t"] = lordify(v["t"]).replace("\u2303", "")
                v["n"] = int(v["n"])
                vs.append(v)
            entry = {"c": ch["c"], "v": vs}
            if ch.get("title"):
                entry["title"] = lordify(ch["title"])
            data["chapters"].append(entry)
            counts.append(len(vs))
            total += len(vs)
        # sanity: chapters numbered 1..n
        assert [c["c"] for c in data["chapters"]] == list(range(1, len(chs) + 1)), bid
        with open(os.path.join(out, "books", bid + ".json"), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        meta.append({"id": bid, "name": name, "short": short, "t": test, "g": group, "vc": counts})
    with open(os.path.join(out, "canon.json"), "w", encoding="utf-8") as f:
        json.dump({"translation": "World English Bible, Catholic Edition", "abbr": "WEB-C", "books": meta}, f,
                  ensure_ascii=False, separators=(",", ":"))
    print("books:", len(meta), "verses:", total)


if __name__ == "__main__":
    main(*sys.argv[1:5])
