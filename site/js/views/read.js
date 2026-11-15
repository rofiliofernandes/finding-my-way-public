import * as bible from "../bible.js";
import * as act from "../activity.js";
import * as store from "../store.js";
import { esc, icon, toast, $, $$ } from "../ui.js";
import { openNoteEditor } from "./noteEditor.js";
import { expandButton, wireExpand } from "../expand.js";
import { aiEnabled, runInto } from "../ai.js";
import { openModal } from "../ui.js";
import * as eggs from "../eggs.js";

/* =========================================================
   Book & chapter picker   #/books   #/books/GEN
   ========================================================= */
export function renderBooks(main, [bookId]) {
  const canon = bible.getCanon();
  const read = act.chaptersRead();
  const last = act.lastRead(["chapter"]);

  if (bookId && canon.byId[bookId]) {
    const b = canon.byId[bookId];
    const chips = Array.from({ length: b.chapters }, (_, i) => {
      const c = i + 1;
      return `<a class="chapbtn ${read.has(b.id + "." + c) ? "done" : ""}" href="#/read/${b.id}/${c}" style="display:grid;place-items:center;color:inherit">${c}</a>`;
    }).join("");
    const done = Array.from({ length: b.chapters }, (_, i) => read.has(b.id + "." + (i + 1))).filter(Boolean).length;
    main.innerHTML = `
      <div class="row"><a class="btn ghost" href="#/books">${icon("left")} All books</a></div>
      <div style="margin-top:10px">
        <div class="eyebrow">${b.t === "OT" ? "Old Testament" : "New Testament"} · ${esc(b.g)}</div>
        <h1 style="margin-top:4px">${esc(b.name)}</h1>
        <p class="muted small" style="margin:6px 0 0">${b.chapters} chapter${b.chapters > 1 ? "s" : ""} · ${done} read</p>
      </div>
      <div class="chapgrid">${chips}</div>
      <div class="row section">
        <a class="btn" href="#/verse/${b.id}/1/1">${icon("cards")} Verse by verse from the start</a>
        <a class="btn" href="#/random?scope=book:${b.id}">${icon("shuffle")} Random verse from ${esc(b.name)}</a>
      </div>`;
    return;
  }

  const groups = [];
  for (const b of canon.books) {
    const key = b.t + "|" + b.g;
    let g = groups.find((x) => x.key === key);
    if (!g) groups.push((g = { key, t: b.t, name: b.g, books: [] }));
    g.books.push(b);
  }
  const bookBtn = (b) => {
    let done = 0;
    for (let c = 1; c <= b.chapters; c++) if (read.has(b.id + "." + c)) done++;
    const pct = Math.round((done / b.chapters) * 100);
    return `<a class="bookbtn" href="#/books/${b.id}" style="color:inherit">${esc(b.name)}<small>${b.chapters} ch${done ? ` · ${pct}%` : ""}</small>${done ? `<span class="fill" style="width:${pct}%"></span>` : ""}</a>`;
  };
  let html = `
    <div class="row" style="align-items:flex-end">
      <div><div class="eyebrow">World English Bible · Catholic Edition</div><h1 style="margin-top:4px">Read</h1></div>
      <span class="spacer"></span>
      ${last ? `<a class="btn primary" href="#/read/${last.book}/${last.chapter}">Back to ${esc(bible.formatRef(last.book, last.chapter))}</a>` : ""}
    </div>
    <div class="row" style="margin-top:14px">
      <a class="btn" href="#/random">${icon("shuffle")} Random verse</a>
      <a class="btn" href="#/verse/GEN/1/1">${icon("cards")} Verse by verse</a>
    </div>`;
  let lastT = null;
  for (const g of groups) {
    if (g.t !== lastT) {
      html += `<h2 class="section">${g.t === "OT" ? "Old Testament" : "New Testament"}</h2>`;
      lastT = g.t;
    }
    html += `<div class="bookgroup"><div class="eyebrow">${esc(g.name)}</div><div class="bookgrid">${g.books.map(bookBtn).join("")}</div></div>`;
  }
  main.innerHTML = html;
}

/* =========================================================
   Chapter reader   #/read/GEN/1?v=3
   ========================================================= */
function scriptureHTML(ch, book) {
  const marks = new Map(act.bookmarksFor(book, ch.c).map((b) => [b.verse, b]));
  const noted = new Set();
  for (const n of act.notesFor(book, ch.c)) noted.add(n.verse_end ?? n.verse_start);

  let html = "";
  let open = null; // 'p' | 'poem'
  const close = () => {
    if (open === "p") html += "</p>";
    if (open === "poem") html += "</div>";
    open = null;
  };
  const extras = (n) => {
    const m = marks.get(n);
    let s = "";
    if (m && !m.color) s += '<span class="vmark" title="Bookmarked"></span>';
    if (noted.has(n)) s += '<span class="vmark note" title="Note"></span>';
    return s;
  };
  const cls = (n) => {
    const m = marks.get(n);
    return m && m.color ? ` hl-${m.color}` : "";
  };

  for (const v of ch.v) {
    const num = `<sup class="vn">${v.n}</sup>`;
    if (v.q) {
      if (open !== "poem" || v.p) {
        close();
        html += `<div class="poem${v.p && ch.v[0] !== v ? " stanza" : ""}">`;
        open = "poem";
      }
      const lines = v.t.split("\n");
      html += `<div class="v${cls(v.n)}" data-v="${v.n}">${lines
        .map((ln, i) => {
          const indent = ln.startsWith("\t");
          return `<span class="line${indent ? " indent" : ""}">${i === 0 ? num : ""}${bible.verseHTML(ln.replace(/^\t/, ""))}${
            i === lines.length - 1 ? extras(v.n) : ""
          }</span>`;
        })
        .join("")}</div>`;
    } else {
      if (open !== "p" || v.p) {
        close();
        html += "<p>";
        open = "p";
      }
      html += `<span class="v${cls(v.n)}" data-v="${v.n}">${num}${bible.verseHTML(v.t).replace(/\n\t?/g, "<br>")}${extras(v.n)}</span> `;
    }
  }
  close();
  return html;
}

export async function renderChapter(main, [bookId, c], query) {
  const canon = bible.getCanon();
  const b = canon.byId[bookId];
  const chapter = parseInt(c, 10);
  if (!b || !(chapter >= 1 && chapter <= b.chapters)) {
    main.innerHTML = `<div class="empty-state"><h2>Passage not found</h2><a href="#/books">Choose a book</a></div>`;
    return;
  }
  main.innerHTML = `<div class="spinner"></div>`;
  const ch = await bible.loadChapter(bookId, chapter);
  store.pref("lastChapter", { book: bookId, chapter });
  const prev = bible.prevChapter(bookId, chapter);
  const next = bible.nextChapter(bookId, chapter);
  const selected = new Set();
  const started = Date.now();
  let autoTimer = null;

  const draw = () => {
    const notes = act.notesFor(bookId, chapter);
    const isRead = act.readToday(bookId, chapter);
    main.innerHTML = `
      <div class="reader-head">
        <a class="btn icon ghost" ${prev ? `href="#/read/${prev.book}/${prev.chapter}"` : 'aria-disabled="true" style="visibility:hidden"'} title="Previous chapter">${icon("left")}</a>
        <a class="reader-title" href="#/books/${bookId}" style="color:inherit" title="Choose chapter">
          <small>${esc(b.name)}</small>${bookId === "PSA" ? "Psalm" : "Chapter"} ${chapter}
        </a>
        <a class="btn icon ghost" ${next ? `href="#/read/${next.book}/${next.chapter}"` : 'style="visibility:hidden"'} title="Next chapter">${icon("right")}</a>
      </div>
      ${ch.title ? `<div class="psalm-title">${bible.verseHTML(ch.title)}</div>` : ""}
      <article class="scripture" id="scripture">${scriptureHTML(ch, bookId)}</article>
      ${
        notes.length
          ? `<section class="section"><div class="eyebrow" style="margin-bottom:6px">Your notes on this chapter</div>${notes
              .map(
                (n) => `<div class="inline-note"><a href="#" data-note="${n.id}">${esc(bible.formatRef(n.book, n.chapter, n.verse_start, n.verse_end))} · edit</a>${esc(n.body)}</div>`
              )
              .join("")}</section>`
          : ""
      }
      <div class="chapter-foot" id="foot">
        ${
          isRead
            ? `<span class="read-badge">${icon("check")} Read today</span>`
            : `<button class="btn" data-markread>${icon("check")} Mark as read</button>`
        }
        <span class="spacer"></span>
        <a class="btn ghost" href="#/verse/${bookId}/${chapter}/${ch.v[0].n}" title="Read this chapter one verse at a time">${icon("cards")} Verse by verse</a>
        ${next ? `<button class="btn primary" data-next>Next: ${esc(bible.formatRef(next.book, next.chapter))} ${icon("right")}</button>` : ""}
      </div>
      <p class="muted small" style="margin-top:10px">Tip: tap verses to bookmark, highlight or write a note. A chapter is marked read when you reach the end.</p>`;
    wire();
  };

  const markRead = (silent) => {
    clearTimeout(autoTimer);
    const r = act.logRead({ book: bookId, chapter, mode: "chapter" });
    if (r && !silent) toast(`${bible.formatRef(bookId, chapter)} marked as read`);
    if (r) setTimeout(() => eggs.checkMilestones(), silent ? 600 : 1800);
  };

  const wire = () => {
    const art = $("#scripture", main);
    art.addEventListener("click", (e) => {
      const el = e.target.closest(".v");
      if (!el) return;
      const n = parseInt(el.dataset.v, 10);
      eggs.onVerse(bookId, chapter, n, { x: e.clientX, y: e.clientY });
      if (selected.has(n)) selected.delete(n);
      else selected.add(n);
      el.classList.toggle("sel", selected.has(n));
      showSheet();
    });
    $$("[data-note]", main).forEach((a) =>
      a.addEventListener("click", async (e) => {
        e.preventDefault();
        const note = store.get("notes", a.dataset.note);
        if (note) {
          await openNoteEditor({ note });
          draw();
        }
      })
    );
    const mr = $("[data-markread]", main);
    if (mr)
      mr.onclick = () => {
        markRead();
        draw();
      };
    const nx = $("[data-next]", main);
    if (nx)
      nx.onclick = () => {
        markRead(true);
        location.hash = `#/read/${next.book}/${next.chapter}`;
      };
    // Auto-mark as read once the end of the chapter is visible and you've spent a little time here.
    const foot = $("#foot", main);
    if (foot && "IntersectionObserver" in window && !act.readToday(bookId, chapter)) {
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) {
          clearTimeout(autoTimer);
          return;
        }
        const wait = Math.max(0, 12000 - (Date.now() - started));
        clearTimeout(autoTimer);
        autoTimer = setTimeout(() => {
          if (!document.body.contains(foot) || act.readToday(bookId, chapter)) return;
          markRead();
          const badge = $("[data-markread]", main);
          if (badge) badge.outerHTML = `<span class="read-badge">${icon("check")} Read today</span>`;
        }, wait);
      });
      io.observe(foot);
    }
  };

  const sheet = $("#sheet");
  const hideSheet = () => {
    sheet.hidden = true;
    sheet.innerHTML = "";
  };
  const showSheet = () => {
    if (!selected.size) return hideSheet();
    const nums = [...selected].sort((a, z) => a - z);
    const vs = nums[0];
    const ve = nums[nums.length - 1];
    const allMarked = nums.every((n) => act.bookmark(bookId, chapter, n));
    const colorOf = (n) => act.bookmark(bookId, chapter, n)?.color || null;
    const sameColor = nums.every((n) => colorOf(n) === colorOf(nums[0])) ? colorOf(nums[0]) : null;
    sheet.innerHTML = `
      <span class="label">${esc(bible.formatRef(bookId, chapter, nums.length > 1 ? null : vs) + (nums.length > 1 ? ":" + bible.rangesText(nums) : ""))}</span>
      ${act.COLORS.map((c) => `<button class="swatch ${c} ${sameColor === c && allMarked ? "on" : ""}" data-color="${c}" title="Highlight ${c}"></button>`).join("")}
      <button class="btn icon ghost" data-bm title="${allMarked ? "Remove bookmark" : "Bookmark"}">${icon(allMarked ? "bookmarkFill" : "bookmark")}</button>
      <button class="btn icon ghost" data-note title="Write a note">${icon("note")}</button>
      <button class="btn icon ghost" data-copy title="Copy">${icon("copy")}</button>
      ${aiEnabled() ? `<button class="btn icon ghost" data-explain title="Explain with AI">${icon("sparkle")}</button>` : ""}
      <button class="btn icon ghost" data-x title="Clear selection">${icon("close")}</button>`;
    sheet.hidden = false;
    sheet.querySelectorAll("[data-color]").forEach((btn) => {
      btn.onclick = () => {
        const c = btn.dataset.color;
        const off = allMarked && sameColor === c;
        nums.forEach((n) => act.setBookmark(bookId, chapter, n, !off, off ? null : c));
        toast(off ? "Highlight removed" : "Highlighted");
        finish();
      };
    });
    sheet.querySelector("[data-bm]").onclick = () => {
      nums.forEach((n) => act.setBookmark(bookId, chapter, n, !allMarked, allMarked ? undefined : colorOf(n)));
      toast(allMarked ? "Bookmark removed" : "Bookmarked");
      finish();
    };
    sheet.querySelector("[data-note]").onclick = async () => {
      hideSheet();
      const saved = await openNoteEditor({ book: bookId, chapter, verse_start: vs, verse_end: ve });
      if (saved) finish();
      else showSheet();
    };
    sheet.querySelector("[data-copy]").onclick = async () => {
      const text = ch.v
        .filter((v) => selected.has(v.n))
        .map((v) => bible.plainVerse(v.t))
        .join(" ");
      const ref = bible.formatRef(bookId, chapter, vs, ve === vs ? null : ve);
      try {
        await navigator.clipboard.writeText(`“${text}” — ${ref} (WEB)`);
        toast("Copied");
      } catch {
        toast("Couldn't copy");
      }
    };
    sheet.querySelector("[data-x]").onclick = finish;
    const ex = sheet.querySelector("[data-explain]");
    if (ex)
      ex.onclick = () => {
        // send the selected verses plus a little context around them
        const i0 = ch.v.findIndex((v) => v.n === vs);
        const i1 = ch.v.findIndex((v) => v.n === ve);
        const ctx = ch.v.slice(Math.max(0, i0 - 3), i1 + 4);
        const refText = bible.formatRef(bookId, chapter, vs, ve === vs ? null : ve);
        openModal(
          `<div class="eyebrow">${esc(refText)}</div>
           <div class="row" style="margin-top:10px"><button class="btn primary" data-m="explain">${icon("sparkle")} Explain</button><button class="btn" data-m="reflect">${icon("note")} Help me reflect</button></div>
           <div class="ai-host" hidden></div>
           <div class="actions"><button class="btn ghost" data-close>Close</button></div>`,
          (dlg, close) => {
            dlg.querySelector("[data-close]").onclick = close;
            dlg.querySelectorAll("[data-m]").forEach(
              (b) =>
                (b.onclick = () =>
                  runInto(dlg.querySelector(".ai-host"), {
                    mode: b.dataset.m,
                    passages: [{ ref: bible.formatRef(bookId, chapter, ctx[0].n, ctx[ctx.length - 1].n), focus: refText, text: ctx.map((v) => `${v.n} ${bible.plainVerse(v.t)}`).join(" ") }],
                  }))
            );
          }
        );
      };
  };
  const finish = () => {
    selected.clear();
    hideSheet();
    const y = scrollY;
    draw();
    scrollTo(0, y);
  };

  draw();
  eggs.onChapterOpen();
  const target = parseInt(query.get("v"), 10);
  if (target) {
    const el = $(`.v[data-v="${target}"]`, main);
    if (el) {
      el.scrollIntoView({ block: "center" });
      el.classList.add("flash");
    }
  } else {
    scrollTo(0, 0);
  }

  return {
    cleanup: () => {
      clearTimeout(autoTimer);
      hideSheet();
    },
    refresh: () => {
      if (!selected.size) {
        const y = scrollY;
        draw();
        scrollTo(0, y);
      }
    },
  };
}

/* =========================================================
   Single-verse card (shared by verse-by-verse and random)
   ========================================================= */
function verseCard(ref, text) {
  const lines = text.split("\n");
  const marked = act.bookmark(ref.book, ref.chapter, ref.verse);
  return `
    <div class="card focus expandable">
      <div class="ref">${esc(bible.formatRef(ref.book, ref.chapter, ref.verse))}</div>
      <div class="text">${lines.map((l) => `<span class="line${l.startsWith("\t") ? " indent" : ""}">${bible.verseHTML(l.replace(/^\t/, ""))}</span>`).join("")}</div>
      <div class="row" style="margin-top:22px">
        <button class="btn ghost" data-bm>${icon(marked ? "bookmarkFill" : "bookmark")} ${marked ? "Saved" : "Save"}</button>
        <button class="btn ghost" data-note>${icon("note")} Note</button>
        ${expandButton(ref.book, ref.chapter, ref.verse, ref.verse).replace("btn ghost small", "btn ghost")}
        <a class="btn ghost" href="#/read/${ref.book}/${ref.chapter}?v=${ref.verse}">${icon("book")} Open chapter</a>
      </div>
    </div>`;
}

function wireCard(root, ref, rerender) {
  wireExpand(root);
  $("[data-bm]", root).onclick = () => {
    const on = !act.bookmark(ref.book, ref.chapter, ref.verse);
    act.setBookmark(ref.book, ref.chapter, ref.verse, on);
    toast(on ? "Saved to your journal" : "Removed");
    rerender();
  };
  $("[data-note]", root).onclick = async () => {
    await openNoteEditor({ book: ref.book, chapter: ref.chapter, verse_start: ref.verse });
  };
}

/* =========================================================
   Verse by verse   #/verse/GEN/1/1
   ========================================================= */
export async function renderVerse(main, [bookId, c, v]) {
  const canon = bible.getCanon();
  const b = canon.byId[bookId];
  const chapter = parseInt(c, 10);
  let verse = parseInt(v, 10);
  if (!b || !(chapter >= 1 && chapter <= b.chapters)) {
    main.innerHTML = `<div class="empty-state"><h2>Passage not found</h2><a href="#/books">Choose a book</a></div>`;
    return;
  }
  const ch = await bible.loadChapter(bookId, chapter);
  let item = ch.v.find((x) => x.n === verse) || ch.v[0];
  verse = item.n;
  const ref = { book: bookId, chapter, verse };
  act.logRead({ book: bookId, chapter, verse_start: verse, verse_end: verse, mode: "verse" });
  store.pref("lastVerse", ref);
  setTimeout(() => eggs.onVerse(bookId, chapter, verse), 500);
  const idx = ch.v.indexOf(item);
  const pct = Math.round(((idx + 1) / ch.v.length) * 100);

  const draw = () => {
    main.innerHTML = `
      <div class="row" style="margin-bottom:12px">
        <div><div class="eyebrow">Verse by verse</div></div>
        <span class="spacer"></span>
        <a class="btn ghost small" href="#/books/${bookId}">${esc(b.name)} ${chapter} · ${idx + 1} of ${ch.v.length}</a>
      </div>
      <div class="progress-bar" style="margin-bottom:14px"><span style="width:${pct}%"></span></div>
      <div id="card">${verseCard(ref, item.t)}</div>
      <div class="focus-nav">
        <button class="btn" data-prev>${icon("left")} Previous</button>
        <span class="muted small">← → keys or swipe</span>
        <button class="btn primary" data-next>Next ${icon("right")}</button>
      </div>`;
    wireCard(main, ref, draw);
    $("[data-prev]", main).onclick = () => go(-1);
    $("[data-next]", main).onclick = () => go(1);
  };
  const go = async (dir) => {
    const n = await bible.stepVerse(bookId, chapter, verse, dir);
    // replace, not push: Back should leave verse-by-verse reading, not step back one verse at a time
    if (n) location.replace(`#/verse/${n.book}/${n.chapter}/${n.verse}`);
    else toast(dir > 0 ? "You've reached the end of the Bible" : "This is the first verse");
  };
  const onKey = (e) => {
    if (e.target.closest("input,textarea") || !$("#modal").hidden) return;
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };
  let tx = null;
  const onTs = (e) => (tx = e.touches[0].clientX);
  const onTe = (e) => {
    if (tx == null) return;
    const dx = e.changedTouches[0].clientX - tx;
    tx = null;
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
  };
  document.addEventListener("keydown", onKey);
  main.addEventListener("touchstart", onTs, { passive: true });
  main.addEventListener("touchend", onTe);
  draw();
  return {
    cleanup: () => {
      document.removeEventListener("keydown", onKey);
      main.removeEventListener("touchstart", onTs);
      main.removeEventListener("touchend", onTe);
    },
  };
}

/* =========================================================
   Random verse   #/random?scope=NT
   ========================================================= */
export async function renderRandom(main, _params, query) {
  let scope = query.get("scope") || store.pref("randomScope") || "all";
  const draw = async () => {
    store.pref("randomScope", scope);
    const pick = await bible.randomVerse(scope);
    const ref = { book: pick.book, chapter: pick.chapter, verse: pick.verse };
    act.logRead({ book: pick.book, chapter: pick.chapter, verse_start: pick.verse, verse_end: pick.verse, mode: "random" });
    const scopes = [...bible.SCOPES];
    if (scope.startsWith("book:")) scopes.push({ id: scope, label: bible.scopeLabel(scope) });
    main.innerHTML = `
      <div class="eyebrow">Random verse</div>
      <div class="chips" style="margin:12px 0 16px">${scopes
        .map((s) => `<button class="chip ${s.id === scope ? "on" : ""}" data-scope="${s.id}">${esc(s.label)}</button>`)
        .join("")}</div>
      <div id="card">${verseCard(ref, pick.text)}</div>
      <div class="focus-nav">
        <a class="btn" href="#/verse/${pick.book}/${pick.chapter}/${pick.verse}">${icon("cards")} Continue verse by verse</a>
        <button class="btn primary" data-again>${icon("shuffle")} Another verse</button>
      </div>`;
    const redrawCard = () => {
      $("#card", main).innerHTML = verseCard(ref, pick.text);
      wireCard(main, ref, redrawCard);
    };
    wireCard(main, ref, redrawCard);
    $$("[data-scope]", main).forEach((btn) => (btn.onclick = () => ((scope = btn.dataset.scope), draw())));
    $("[data-again]", main).onclick = draw;
  };
  main.innerHTML = `<div class="spinner"></div>`;
  await draw();
}
