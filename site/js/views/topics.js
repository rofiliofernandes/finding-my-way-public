import * as bible from "../bible.js";
import * as act from "../activity.js";
import * as store from "../store.js";
import * as search from "../search.js";
import * as semantic from "../semantic.js";
import { TOPICS, topic as getTopic, parseKey, topicRegex } from "../topics.js";
import { esc, icon, $, $$, toast } from "../ui.js";
import { openNoteEditor } from "./noteEditor.js";
import { expandButton, wireExpand } from "../expand.js";
import { aiEnabled, runInto } from "../ai.js";

const PAGE = 40;

function piece(s) {
  return esc(s)
    .replace(/\bLORD\b/g, '<span class="sc">Lord</span>')
    .replace(/\bGOD\b/g, '<span class="sc">God</span>');
}

// Plain verse text with <mark> around every match of the given regexes.
function marked(plain, regexes) {
  const norm = plain.replace(/[’‘]/g, "'");
  const ranges = [];
  for (const re0 of regexes) {
    const re = new RegExp(re0.source, "gi");
    let m;
    while ((m = re.exec(norm))) {
      if (!m[0].length) {
        re.lastIndex++;
        continue;
      }
      ranges.push([m.index, m.index + m[0].length]);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  let html = "";
  let pos = 0;
  for (const [s, e] of ranges) {
    if (e <= pos) continue;
    const st = Math.max(s, pos);
    html += piece(plain.slice(pos, st)) + "<mark>" + piece(plain.slice(st, e)) + "</mark>";
    pos = e;
  }
  return html + piece(plain.slice(pos));
}

// One result: a verse or a short passage, with save / note / expand.
function resultHTML({ b, c, s, e, html, ref }) {
  e = e ?? s;
  const saved = act.bookmark(b, c, s);
  return `<div class="result">
    <div class="result-top">
      <a href="#/read/${b}/${c}?v=${s}" class="result-ref">${esc(ref || bible.formatRef(b, c, s, e === s ? null : e))}</a>
      <span class="spacer"></span>
      ${expandButton(b, c, s, e)}
      <button class="btn icon ghost" data-save="${b}.${c}.${s}" title="${saved ? "Saved" : "Save"}">${icon(saved ? "bookmarkFill" : "bookmark")}</button>
      <button class="btn icon ghost" data-note="${b}.${c}.${s}.${e}" title="Write a note">${icon("note")}</button>
    </div>
    <div class="result-text">${html}</div>
  </div>`;
}

// Passage text with small verse numbers (for multi-verse results)
function passageHTML(verses, regexes) {
  if (verses.length === 1) return regexes ? marked(bible.plainVerse(verses[0].t), regexes) : piece(bible.plainVerse(verses[0].t));
  return verses
    .map((v) => `<sup class="vn">${v.n}</sup>${regexes ? marked(bible.plainVerse(v.t), regexes) : piece(bible.plainVerse(v.t))}`)
    .join(" ");
}

function fmtMB(bytes) {
  return Math.round(bytes / 1e6) + " MB";
}

export async function renderTopics(main, _params, query) {
  const canon = bible.getCanon();
  const st = {
    topic: query.get("t") || "",
    sub: query.get("s") || "",
    q: query.get("q") || "",
    mode: query.get("m") || store.pref("searchMode") || "meaning",
    testament: query.get("tm") || "all",
    book: query.get("b") || "",
    chapter: parseInt(query.get("c"), 10) || 0,
    shown: PAGE,
  };
  if (st.book && !canon.byId[st.book]) st.book = "";
  let token = 0;

  const scope = () => ({ testament: st.testament, book: st.book || null, chapter: st.chapter || null });
  const scopeText = () => {
    if (st.book && st.chapter) return bible.formatRef(st.book, st.chapter);
    if (st.book) return bible.bookName(st.book);
    return st.testament === "OT" ? "the Old Testament" : st.testament === "NT" ? "the New Testament" : "the whole Bible";
  };
  const syncHash = () => {
    const p = new URLSearchParams();
    if (st.topic) p.set("t", st.topic);
    if (st.sub) p.set("s", st.sub);
    if (st.q) p.set("q", st.q);
    if (st.q && st.mode !== "meaning") p.set("m", st.mode);
    if (st.testament !== "all") p.set("tm", st.testament);
    if (st.book) p.set("b", st.book);
    if (st.chapter) p.set("c", st.chapter);
    const s = p.toString();
    history.replaceState(null, "", "#/topics" + (s ? "?" + s : ""));
  };
  const bookOptions = () =>
    canon.books
      .filter((b) => st.testament === "all" || b.t === st.testament)
      .map((b) => `<option value="${b.id}" ${b.id === st.book ? "selected" : ""}>${esc(b.name)}</option>`)
      .join("");
  const chapterOptions = () => {
    if (!st.book) return "";
    const n = canon.byId[st.book].chapters;
    return Array.from({ length: n }, (_, i) => `<option value="${i + 1}" ${st.chapter === i + 1 ? "selected" : ""}>${st.book === "PSA" ? "Psalm" : "Chapter"} ${i + 1}</option>`).join("");
  };

  main.className = "wide";
  main.innerHTML = `
    <div class="eyebrow">Topics</div>
    <h1 style="margin-top:4px">What's on your heart?</h1>
    <p class="muted" style="margin:6px 0 0">Describe what you're feeling or looking for, or choose a topic. Then decide where to look.</p>

    <div class="card section scopebar">
      <div class="searchwrap"><input type="search" id="tq" placeholder="e.g. love towards my wife · feeling not good enough" value="${esc(st.q)}" autocomplete="off" enterkeyhint="search"></div>
      <div class="seg" role="group" aria-label="Search by">
        <button data-mode="meaning" class="${st.mode === "meaning" ? "on" : ""}" title="Finds passages with the same meaning, even with different words">By meaning</button>
        <button data-mode="words" class="${st.mode === "words" ? "on" : ""}" title="Finds verses containing these exact words">Exact words</button>
      </div>
      <div class="seg" role="group" aria-label="Testament">
        ${[["all", "Both"], ["OT", 'Old<span class="long"> Testament</span>'], ["NT", 'New<span class="long"> Testament</span>']]
          .map(([id, l]) => `<button data-tm="${id}" class="${st.testament === id ? "on" : ""}">${l}</button>`)
          .join("")}
      </div>
      <select id="bookSel" aria-label="Book"><option value="">All books</option>${bookOptions()}</select>
      <select id="chapSel" aria-label="Chapter" ${st.book ? "" : "hidden"}><option value="">All chapters</option>${chapterOptions()}</select>
    </div>

    <div class="section" id="gridToggle" ${st.q ? "" : "hidden"}><button class="btn ghost small" data-showgrid>Browse topics instead</button></div>
    <div class="topic-grid section" id="topicGrid" ${st.q ? "hidden" : ""}>
      ${TOPICS.map((t) => `<button class="topic ${st.topic === t.id ? "on" : ""}" data-topic="${t.id}"><b>${esc(t.name)}</b><span>${esc(t.blurb)}</span></button>`).join("")}
    </div>

    <div id="results" class="section"></div>`;

  const results = $("#results", main);

  const wireResults = (root) => {
    $$("[data-save]", root).forEach(
      (b) =>
        (b.onclick = () => {
          const [bk, c, n] = b.dataset.save.split(".");
          const on = !act.bookmark(bk, +c, +n);
          act.setBookmark(bk, +c, +n, on);
          b.innerHTML = icon(on ? "bookmarkFill" : "bookmark");
          toast(on ? "Saved to your journal" : "Removed");
        })
    );
    $$("[data-note]", root).forEach(
      (b) =>
        (b.onclick = () => {
          const [bk, c, s, e] = b.dataset.note.split(".");
          openNoteEditor({ book: bk, chapter: +c, verse_start: +s, verse_end: +e });
        })
    );
    wireExpand(root);
  };

  // Key verses for a topic or sub-topic, filtered to the current scope.
  const keyVerses = async (keys) => {
    const inScope = new Set(search.scopeBookIds(scope()));
    const out = [];
    for (const k of keys) {
      const r = parseKey(k);
      if (!inScope.has(r.book) || (st.chapter && r.chapter !== st.chapter)) continue;
      const ch = await bible.loadChapter(r.book, r.chapter);
      const vs = ch.v.filter((v) => v.n >= r.vs && v.n <= r.ve);
      if (vs.length) out.push({ b: r.book, c: r.chapter, s: r.vs, e: r.ve, html: passageHTML(vs) });
    }
    return out;
  };

  const verseMap = new Map();
  const versesFor = async (b, c, s, e) => {
    const ch = await bible.loadChapter(b, c);
    return ch.v.filter((v) => v.n >= s && v.n <= e);
  };

  // ----- meaning search (semantic) -----
  const semanticBlock = async (q, title, exclude = []) => {
    const ss = semantic.status();
    if (ss.status !== "ready") {
      const info = await fetch("data/semantic/index.json").then((r) => r.json()).catch(() => null);
      const size = info ? fmtMB(info.downloadBytes) : "about 45 MB";
      const downloaded = store.pref("semanticDownloaded");
      if (!downloaded && ss.status !== "loading") {
        return `<div class="card" id="semGate">
          <h3>Search by meaning</h3>
          <p class="muted small" style="margin:6px 0 12px">This finds passages that <i>mean</i> what you describe, even when they use different words — for example “love towards my wife” finds Ephesians 5 and the Song of Songs. It runs entirely on your device, so it's free, private and works offline. It needs a one-time download of ${size}${info ? "" : ""}.</p>
          <div class="row"><button class="btn primary" data-dl>${icon("search")} Download & search</button><button class="btn ghost" data-words>Use exact words instead</button></div>
        </div>`;
      }
      return `<div class="card" id="semGate"><p class="small muted" id="dlMsg">Preparing search by meaning…</p><div class="dl-bar"><span style="width:${Math.round(ss.progress * 100)}%"></span></div></div>`;
    }
    const books = new Set(search.scopeBookIds(scope()));
    await search.loadScope(scope());
    const textOf = (b, c, s, e) => {
      const key = `${b}.${c}.${s}.${e}`;
      if (!verseMap.has(key)) {
        const all = search.cachedVerses(b) || [];
        verseMap.set(key, all.filter((v) => v.c === c && v.n >= s && v.n <= e).map((v) => v.s).join(" "));
      }
      return verseMap.get(key);
    };
    const { results: found, topics } = await semantic.search(q, { books, chapter: st.chapter || null }, textOf, 40);
    // If the question clearly matches a curated topic, show its hand-picked verses first.
    let picked = [];
    let pickedLabel = "";
    const strong = !st.topic && topics.find((t) => t.strong);
    if (strong) {
      const tp = getTopic(strong.topic);
      const sb = strong.sub ? tp.subs.find((x) => x.id === strong.sub) : null;
      picked = (await keyVerses((sb || tp).key)).slice(0, 4);
      pickedLabel = tp.name + (sb ? " › " + sb.name : "");
    }
    const skip = exclude.concat(picked);
    const ex = (r) => skip.some((k) => k.b === r.b && k.c === r.c && r.s <= k.e && r.e >= k.s);
    const list = found.filter((r) => !ex(r)).slice(0, 25);
    const items = [];
    for (const r of list) items.push({ ...r, html: passageHTML(await versesFor(r.b, r.c, r.s, r.e)) });
    let html = "";
    const label = (t) => {
      const tp = getTopic(t.topic);
      return esc(tp.name) + (t.sub ? " › " + esc(tp.subs.find((x) => x.id === t.sub).name) : "");
    };
    if (topics.length && !st.topic) {
      html += `<div class="suggest"><span class="muted small">Related topics:</span>${topics
        .map((t) => `<button class="chip" data-gosub="${t.topic}.${t.sub || ""}">${label(t)}</button>`)
        .join("")}</div>`;
    }
    if (picked.length) {
      html += `<div class="section-head"><h2>Hand-picked: ${esc(pickedLabel)}</h2><button class="chip" data-gosub="${strong.topic}.${strong.sub || ""}">See all →</button></div>`;
      html += `<div class="card results">${picked.map(resultHTML).join("")}</div><div style="height:26px"></div>`;
    }
    html += `<div class="section-head"><h2>${title}</h2><span class="muted small">closest in meaning · ${esc(scopeText())}</span></div>`;
    html += items.length ? `<div class="card results">${items.map(resultHTML).join("")}</div>` : `<div class="card empty-state" style="padding:30px">Nothing found in ${esc(scopeText())}.</div>`;
    if (aiEnabled() && items.length && st.q) {
      html += `<div class="card section expandable"><div class="row"><div style="flex:1;min-width:200px"><b>Ask AI about this</b><div class="muted small">Sends your question and the top 8 passages above (about 2,500 tokens).</div></div>
        <button class="btn primary" data-ask>${icon("sparkle")} Ask</button></div><div class="ai-host" hidden></div></div>`;
      results._askItems = picked.concat(items).slice(0, 8);
    }
    return html;
  };

  const wireSemanticGate = () => {
    const dl = $("[data-dl]", results);
    if (dl)
      dl.onclick = () => {
        semantic.ensureLoaded().then(
          () => {
            store.pref("semanticDownloaded", true);
            draw();
          },
          () => {}
        );
        draw();
      };
    const w = $("[data-words]", results);
    if (w) w.onclick = () => setMode("words");
    $$("[data-gosub]", results).forEach(
      (b) =>
        (b.onclick = () => {
          const [t, s] = b.dataset.gosub.split(".");
          st.topic = t;
          st.sub = s || "";
          st.q = "";
          $("#tq", main).value = "";
          $$("[data-topic]", main).forEach((x) => x.classList.toggle("on", x.dataset.topic === t));
          draw();
        })
    );
    const ask = $("[data-ask]", results);
    if (ask)
      ask.onclick = () => {
        const host = ask.closest(".expandable").querySelector(".ai-host");
        const passages = results._askItems.map((r) => ({
          ref: bible.formatRef(r.b, r.c, r.s, r.e === r.s ? null : r.e),
          text: r.html.replace(/<sup class="vn">(\d+)<\/sup>/g, "$1 ").replace(/<[^>]+>/g, ""),
        }));
        runInto(host, { mode: "ask", question: st.q, passages });
      };
  };

  const draw = async () => {
    const my = ++token;
    syncHash();
    // while searching, tuck the topic grid away so results sit right under the search box
    $("#topicGrid", main).hidden = !!st.q;
    $("#gridToggle", main).hidden = !st.q;
    const t = st.topic ? getTopic(st.topic) : null;
    if (!t && !st.q) {
      results.innerHTML = `<p class="muted small" style="text-align:center">Type what's on your heart above, or pick a topic.</p>`;
      return;
    }
    if (!search.isLoaded(scope()))
      results.innerHTML = `<div class="card"><div class="spinner" style="margin:20px auto"></div><p class="muted small" style="text-align:center" id="loadMsg">Opening the Bible…</p></div>`;
    const verses = await search.loadScope(scope(), (d, n) => {
      const el = $("#loadMsg", results);
      if (el) el.textContent = `Opening the Bible… ${d} of ${n} books`;
    });
    if (my !== token) return;

    let html = "";
    // ---------- free-text query ----------
    if (st.q) {
      if (st.mode === "meaning") {
        html += await semanticBlock(st.q, `“${esc(st.q)}”`);
      } else {
        const regexes = search.queryRegexes(st.q);
        const matches = search.matchAll(verses, regexes);
        html += mentionsBlock(matches, regexes, `“${esc(st.q)}”`);
      }
    } else {
      // ---------- topic ----------
      const sub = t.subs?.find((s) => s.id === st.sub) || null;
      if (t.subs?.length) {
        html += `<div class="sub-tabs"><button class="chip ${!sub ? "on" : ""}" data-sub="">All ${esc(t.name.toLowerCase())}</button>${t.subs
          .map((s) => `<button class="chip ${sub?.id === s.id ? "on" : ""}" data-sub="${s.id}">${esc(s.name)}</button>`)
          .join("")}</div>`;
      }
      const keys = await keyVerses(sub ? sub.key : t.key);
      if (my !== token) return;
      html += `<div class="section-head"><h2>${esc(sub ? sub.name : t.name)}: key verses</h2><span class="muted small">hand-picked · ${esc(scopeText())}</span></div>`;
      html += keys.length
        ? `<div class="card results">${keys.map(resultHTML).join("")}</div>`
        : `<p class="muted small">None of the key verses for this are in ${esc(scopeText())}. See below for more.</p>`;
      html += `<div style="height:28px"></div>`;
      if (sub) {
        html += await semanticBlock(sub.q, "More passages like these", keys);
      } else {
        const re = topicRegex(t);
        html += mentionsBlock(search.matchTopic(verses, re), [re], "Every mention");
      }
    }
    if (my !== token) return;
    results.innerHTML = html;
    wireResults(results);
    wireSemanticGate();
    wireMentions();
    $$("[data-sub]", results).forEach(
      (b) =>
        (b.onclick = () => {
          st.sub = b.dataset.sub;
          st.shown = PAGE;
          draw();
        })
    );
  };

  // ----- keyword results -----
  let lastMatches = null;
  const mentionsBlock = (matches, regexes, title) => {
    lastMatches = matches;
    const books = new Set(matches.map((m) => m.b));
    let html = `<div class="section-head"><h2>${title}</h2>
      <span class="muted small">${matches.length} verse${matches.length === 1 ? "" : "s"}${matches.length ? ` in ${books.size} book${books.size === 1 ? "" : "s"}` : ""} · ${esc(scopeText())}</span></div>`;
    if (!matches.length) return html + `<div class="card empty-state" style="padding:30px">Nothing found in ${esc(scopeText())}.${st.testament !== "all" || st.book ? " Try widening where you're looking." : ""}</div>`;
    if (!st.book && books.size > 1) {
      const counts = new Map();
      for (const m of matches) counts.set(m.b, (counts.get(m.b) || 0) + 1);
      html += `<div class="chips" style="margin-bottom:12px">${[...counts].map(([b, n]) => `<button class="chip" data-narrow="${b}">${esc(bible.bookName(b))} <span style="opacity:.7">${n}</span></button>`).join("")}</div>`;
    }
    let lastBook = null;
    html += `<div class="card results">`;
    for (const m of matches.slice(0, st.shown)) {
      if (m.b !== lastBook && !st.book) {
        html += `<div class="result-book">${esc(bible.bookName(m.b))}</div>`;
        lastBook = m.b;
      }
      html += resultHTML({ b: m.b, c: m.c, s: m.n, html: marked(bible.plainVerse(m.t), regexes) });
    }
    html += `</div>`;
    if (matches.length > st.shown) html += `<div style="text-align:center;margin-top:14px"><button class="btn" data-more>Show more (${matches.length - st.shown} left)</button></div>`;
    return html;
  };
  const wireMentions = () => {
    $$("[data-narrow]", results).forEach(
      (b) =>
        (b.onclick = () => {
          st.book = b.dataset.narrow;
          st.chapter = 0;
          st.shown = PAGE;
          refreshScope();
          draw();
          main.querySelector(".scopebar").scrollIntoView({ behavior: "smooth", block: "start" });
        })
    );
    const more = $("[data-more]", results);
    if (more)
      more.onclick = () => {
        st.shown += PAGE * 2;
        const y = scrollY;
        draw().then(() => scrollTo(0, y));
      };
  };

  const refreshScope = () => {
    $$("[data-tm]", main).forEach((x) => x.classList.toggle("on", x.dataset.tm === st.testament));
    $("#bookSel", main).innerHTML = `<option value="">All books</option>${bookOptions()}`;
    const cs = $("#chapSel", main);
    cs.innerHTML = `<option value="">All chapters</option>${chapterOptions()}`;
    cs.hidden = !st.book;
  };
  const setMode = (m) => {
    st.mode = m;
    store.pref("searchMode", m);
    $$("[data-mode]", main).forEach((x) => x.classList.toggle("on", x.dataset.mode === m));
    draw();
  };

  $$("[data-mode]", main).forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
  $("[data-showgrid]", main).onclick = () => {
    st.q = "";
    $("#tq", main).value = "";
    draw();
  };
  $$("[data-tm]", main).forEach(
    (b) =>
      (b.onclick = () => {
        st.testament = b.dataset.tm;
        if (st.book && st.testament !== "all" && canon.byId[st.book].t !== st.testament) {
          st.book = "";
          st.chapter = 0;
        }
        st.shown = PAGE;
        refreshScope();
        draw();
      })
  );
  $("#bookSel", main).onchange = (e) => {
    st.book = e.target.value;
    st.chapter = 0;
    st.shown = PAGE;
    refreshScope();
    draw();
  };
  $("#chapSel", main).onchange = (e) => {
    st.chapter = parseInt(e.target.value, 10) || 0;
    st.shown = PAGE;
    draw();
  };
  $$("[data-topic]", main).forEach(
    (b) =>
      (b.onclick = () => {
        st.topic = st.topic === b.dataset.topic ? "" : b.dataset.topic;
        st.sub = "";
        st.q = "";
        $("#tq", main).value = "";
        st.shown = PAGE;
        $$("[data-topic]", main).forEach((x) => x.classList.toggle("on", x.dataset.topic === st.topic));
        draw();
        if (st.topic) results.scrollIntoView({ behavior: "smooth", block: "start" });
      })
  );
  let qt;
  const runQuery = (v) => {
    st.q = v.trim();
    if (st.q) {
      st.topic = "";
      st.sub = "";
      $$("[data-topic]", main).forEach((x) => x.classList.remove("on"));
    }
    st.shown = PAGE;
    draw();
  };
  const tq = $("#tq", main);
  tq.addEventListener("input", (e) => {
    clearTimeout(qt);
    // meaning search runs a model, so wait a little longer for typing to settle
    qt = setTimeout(() => runQuery(e.target.value), st.mode === "meaning" ? 700 : 350);
  });
  tq.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearTimeout(qt);
      runQuery(tq.value);
      tq.blur();
    }
  });

  // live download progress for the meaning model
  const off = semantic.onProgress((s) => {
    const bar = $(".dl-bar span", results);
    const msg = $("#dlMsg", results);
    if (bar) bar.style.width = Math.round(s.progress * 100) + "%";
    if (msg) msg.textContent = s.status === "error" ? "Download failed: " + s.error : `Downloading the search model… ${Math.round(s.progress * 100)}% (one time only)`;
    if (s.status === "ready") draw();
  });
  if (store.pref("semanticDownloaded")) semantic.ensureLoaded().catch(() => {});

  await draw();
  return {
    cleanup: () => {
      clearTimeout(qt);
      off();
      main.className = "";
    },
    refresh: () => {},
  };
}
