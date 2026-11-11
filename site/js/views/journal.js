import * as bible from "../bible.js";
import * as act from "../activity.js";
import * as store from "../store.js";
import { esc, icon, $, $$, highlight, confirmBox, toast } from "../ui.js";
import { openNoteEditor } from "./noteEditor.js";

export async function renderJournal(main, _params, query) {
  let filter = query.get("f") || "all";
  let q = "";

  // Saved verses need their text; load the books they're in.
  const marks = store.all("bookmarks");
  const books = [...new Set(marks.map((m) => m.book))];
  const texts = new Map();
  await Promise.all(
    books.map(async (id) => {
      const data = await bible.loadBook(id);
      for (const m of marks.filter((x) => x.book === id)) {
        const v = data.chapters[m.chapter - 1]?.v.find((x) => x.n === m.verse);
        if (v) texts.set(m.id, bible.plainVerse(v.t));
      }
    })
  );

  const items = () => {
    const out = [];
    if (filter === "all" || filter === "notes")
      for (const n of act.notes().filter((n) => n.kind === "note")) out.push({ type: "note", at: n.created_at, n });
    if (filter === "all" || filter === "reflections")
      for (const n of act.notes().filter((n) => n.kind === "reflection")) out.push({ type: "reflection", at: n.week_start + "T23:59", n });
    if (filter === "all" || filter === "saved")
      for (const m of store.all("bookmarks")) out.push({ type: "saved", at: m.created_at, m });
    const ql = q.toLowerCase();
    return out
      .filter((it) => {
        if (!ql) return true;
        if (it.type === "saved") return (texts.get(it.m.id) || "").toLowerCase().includes(ql) || bible.formatRef(it.m.book, it.m.chapter, it.m.verse).toLowerCase().includes(ql);
        return (it.n.body || "").toLowerCase().includes(ql) || act.noteRef(it.n).toLowerCase().includes(ql);
      })
      .sort((a, b) => (a.at < b.at ? 1 : -1));
  };

  const entryHTML = (it) => {
    if (it.type === "saved") {
      const m = it.m;
      return `<div class="entry">
        <div class="meta"><span class="kind">${m.color ? "Highlight" : "Saved verse"}</span>
          <a href="#/read/${m.book}/${m.chapter}?v=${m.verse}">${esc(bible.formatRef(m.book, m.chapter, m.verse))}</a>
          <span class="muted small">${esc(new Date(m.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }))}</span>
          <span class="spacer"></span>
          <button class="btn icon ghost" data-unsave="${m.id}" title="Remove">${icon("trash")}</button></div>
        <div class="verse">${m.color ? `<span class="v hl-${m.color}" style="padding:1px 3px">` : "<span>"}${highlight(texts.get(m.id) || "", q)}</span></div>
      </div>`;
    }
    const n = it.n;
    const link =
      n.kind === "reflection"
        ? `<a href="#/history?week=${n.week_start}">${esc(act.noteRef(n))}</a>`
        : `<a href="#/read/${n.book}/${n.chapter}?v=${n.verse_start}">${esc(act.noteRef(n))}</a>`;
    return `<div class="entry">
      <div class="meta"><span class="kind">${n.kind === "reflection" ? "Reflection" : "Note"}</span>${link}
        <span class="muted small">${n.kind === "note" ? esc(new Date(n.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })) : ""}</span>
        <span class="spacer"></span>
        ${n.kind === "note" ? `<button class="btn icon ghost" data-edit="${n.id}" title="Edit">${icon("edit")}</button>` : `<a class="btn icon ghost" href="#/history?week=${n.week_start}" title="Edit">${icon("edit")}</a>`}
      </div>
      <div class="body">${highlight(n.body, q)}</div>
    </div>`;
  };

  main.innerHTML = `
    <div class="eyebrow">Your journal</div>
    <h1 style="margin-top:4px">Notes & saved verses</h1>
    <div style="margin-top:16px"><input type="search" id="q" placeholder="Search your notes and saved verses…" autocomplete="off"></div>
    <div class="chips" style="margin-top:12px" id="filters">
      ${[
        ["all", "Everything"],
        ["notes", "Notes"],
        ["reflections", "Weekly reflections"],
        ["saved", "Saved & highlighted"],
      ]
        .map(([id, label]) => `<button class="chip ${filter === id ? "on" : ""}" data-f="${id}">${label}</button>`)
        .join("")}
    </div>
    <section class="card section" id="list"></section>`;

  const list = $("#list", main);
  const draw = () => {
    const its = items();
    if (!its.length) {
      list.innerHTML = q
        ? `<div class="empty-state"><h2>Nothing found</h2>No notes or verses match “${esc(q)}”.</div>`
        : `<div class="empty-state"><h2>Nothing here yet</h2>While reading, tap a verse to save it, highlight it, or write a note.<br><br><a class="btn primary" href="#/books">Start reading</a></div>`;
      return;
    }
    list.innerHTML = its.map(entryHTML).join("");
    $$("[data-edit]", list).forEach(
      (b) =>
        (b.onclick = async () => {
          const note = store.get("notes", b.dataset.edit);
          if (note) await openNoteEditor({ note });
          draw();
        })
    );
    $$("[data-unsave]", list).forEach(
      (b) =>
        (b.onclick = async () => {
          if (await confirmBox("Remove this saved verse?", "Remove")) {
            store.remove("bookmarks", b.dataset.unsave);
            toast("Removed");
            draw();
          }
        })
    );
  };
  $("#q", main).addEventListener("input", (e) => {
    q = e.target.value.trim();
    draw();
  });
  $$("[data-f]", main).forEach(
    (b) =>
      (b.onclick = () => {
        filter = b.dataset.f;
        $$("[data-f]", main).forEach((x) => x.classList.toggle("on", x === b));
        history.replaceState(null, "", `#/journal?f=${filter}`);
        draw();
      })
  );
  draw();
  return { refresh: () => document.activeElement?.id !== "q" };
}
