import re, difflib
from collections import defaultdict

def norm_words(s):
    s = s.lower().replace("yahweh", "lord")
    s = re.sub(r"[^\w\s]", " ", s)
    return [w for w in s.split() if w not in ("the",)]

def load_webu(vref_path, txt_path):
    vref = open(vref_path).read().split("\n")
    txt = open(txt_path, encoding="utf-8").read().split("\n")
    books = defaultdict(list)
    for r, t in zip(vref, txt):
        if t.strip() and t.strip() != "<range>":
            b, cv = r.split()
            c, v = cv.split(":")
            books[b].append((int(c), int(v), t.strip()))
    index = {b: {(c, v): i for i, (c, v, _) in enumerate(lst)} for b, lst in books.items()}
    return books, index

def sim(a, b):
    return difflib.SequenceMatcher(None, a, b, autojunk=False).ratio()

def transfer_breaks(classic, new):
    """Copy poetry line breaks (\n and \n\t) from classic text into new text by word alignment."""
    if "\n" not in classic:
        return new
    lines = classic.split("\n")
    starts = []  # (word index in classic, prefix)
    words = []
    for li, line in enumerate(lines):
        prefix = "\t" if line.startswith("\t") else ""
        toks = line.split()
        if li > 0 and toks:
            starts.append((len(words), prefix))
        words.extend(toks)
    lead = "\t" if lines[0].startswith("\t") else ""
    nw = new.split()
    a = [re.sub(r"[^\w]", "", w.lower().replace("yahweh", "lord")) for w in words]
    b = [re.sub(r"[^\w]", "", w.lower()) for w in nw]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    def map_idx(i):
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if i1 <= i < i2 or (i1 == i2 == i):
                if tag == "equal":
                    return j1 + (i - i1)
                return j1
        return len(b)
    breaks = {}
    for i, prefix in starts:
        j = map_idx(i)
        # if classic inserted "the" before LORD, step back so "the" moves with the line
        if j > 0 and b[j - 1] == "the" and (i == 0 or a[i - 1] != "the"):
            j -= 1
        if 0 < j < len(nw):
            breaks[j] = prefix
    out = lead
    for j, w in enumerate(nw):
        if j in breaks:
            out = out.rstrip() + "\n" + breaks[j]
        elif j > 0:
            out += " "
        out += w
    return out
