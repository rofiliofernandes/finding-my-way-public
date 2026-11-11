import { openModal, esc, toast, confirmBox } from "../ui.js";
import { loadChapter, formatRef, verseHTML } from "../bible.js";
import * as act from "../activity.js";
import * as store from "../store.js";

// Open the note editor for a verse range (new note) or an existing note.
export async function openNoteEditor({ book, chapter, verse_start, verse_end, note }) {
  if (note) ({ book, chapter, verse_start, verse_end } = note);
  verse_end = verse_end ?? verse_start;
  const ch = await loadChapter(book, chapter);
  const verses = ch.v.filter((v) => v.n >= verse_start && v.n <= verse_end);
  const quote = verses
    .map((v) => `<sup class="vn">${v.n}</sup>${verseHTML(v.t.replace(/\n\t?/g, " "))}`)
    .join(" ");
  return new Promise((resolve) => {
    openModal(
      `<div class="eyebrow">${note ? "Edit note" : "New note"}</div>
       <h2 style="margin-top:4px">${esc(formatRef(book, chapter, verse_start, verse_end))}</h2>
       <div class="quote">${quote}</div>
       <textarea id="noteBody" placeholder="What stands out to you? A thought, a prayer, a question…">${esc(note?.body || "")}</textarea>
       <div class="actions">
         ${note ? '<button class="btn ghost danger" data-del>Delete</button><span class="spacer"></span>' : ""}
         <button class="btn ghost" data-cancel>Cancel</button>
         <button class="btn primary" data-save>Save note</button>
       </div>`,
      (dlg, close) => {
        const ta = dlg.querySelector("#noteBody");
        setTimeout(() => ta.focus(), 30);
        dlg.querySelector("[data-cancel]").onclick = () => (close(), resolve(null));
        const save = () => {
          const body = ta.value.trim();
          if (!body) {
            ta.focus();
            return;
          }
          const rec = act.saveNote({ id: note?.id, book, chapter, verse_start, verse_end, body });
          close();
          toast("Note saved");
          resolve(rec);
        };
        dlg.querySelector("[data-save]").onclick = save;
        ta.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
        });
        const del = dlg.querySelector("[data-del]");
        if (del)
          del.onclick = async () => {
            close();
            if (await confirmBox("Delete this note?")) {
              store.remove("notes", note.id);
              toast("Note deleted");
            }
            resolve(null);
          };
      }
    );
  });
}
