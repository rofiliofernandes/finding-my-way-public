import { openModal, esc, toast, confirmBox } from "../ui.js";
import { loadChapter, formatRef, verseHTML } from "../bible.js";
import * as act from "../activity.js";
import * as store from "../store.js";
import * as eggs from "../eggs.js";
import * as social from "../social.js";

// Open the note editor for a verse range (new note) or an existing note.
export async function openNoteEditor({ book, chapter, verse_start, verse_end, note }) {
  if (note) ({ book, chapter, verse_start, verse_end } = note);
  verse_end = verse_end ?? verse_start;
  const ch = await loadChapter(book, chapter);
  const verses = ch.v.filter((v) => v.n >= verse_start && v.n <= verse_end);
  const quote = verses
    .map((v) => `<sup class="vn">${v.n}</sup>${verseHTML(v.t.replace(/\n\t?/g, " "))}`)
    .join(" ");
  // Share as a light: only once you have a username (Journey with)
  const canShare = social.can() && !!social.cachedMe();
  const wasShared = canShare && note ? (await social.sharedNoteIds()).has(note.id) : false;
  return new Promise((resolve) => {
    openModal(
      `<div class="eyebrow">${note ? "Edit note" : "New note"}</div>
       <h2 style="margin-top:4px">${esc(formatRef(book, chapter, verse_start, verse_end))}</h2>
       <div class="quote">${quote}</div>
       <textarea id="noteBody" placeholder="What stands out to you? A thought, a prayer, a question…">${esc(note?.body || "")}</textarea>
       ${canShare ? `<label class="chk share-light"><input type="checkbox" id="asLight" ${wasShared ? "checked" : ""}> <span>✦ Share as a light with your companions</span></label>` : ""}
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
          const light = canShare && dlg.querySelector("#asLight")?.checked;
          if (light) social.shareLight(rec).then(() => toast("Note saved and shared as a light ✦")).catch(() => toast("Note saved. Couldn't share it right now."));
          else if (wasShared) social.unshareLight(rec.id).catch(() => {});
          if (!light) toast("Note saved");
          eggs.onNoteSaved(body);
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
              if (wasShared) social.unshareLight(note.id).catch(() => {});
              toast("Note deleted");
            }
            resolve(null);
          };
      }
    );
  });
}
