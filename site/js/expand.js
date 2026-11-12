// "Expand": grow a verse into its surrounding passage, a few verses at a time.
import * as bible from "./bible.js";
import { esc, icon, $ } from "./ui.js";
import { aiEnabled, runInto } from "./ai.js";

export function expandButton(b, c, s, e) {
  return `<button class="btn ghost small" data-expand="${b}.${c}.${s}.${e ?? s}" title="Show the verses around it">${icon("expand")} Expand</button>`;
}

async function draw(box, b, c, s, e, radius) {
  const ch = await bible.loadChapter(b, c);
  const i0 = Math.max(0, ch.v.findIndex((v) => v.n >= s));
  let i1 = ch.v.findIndex((v) => v.n > e);
  i1 = i1 === -1 ? ch.v.length - 1 : i1 - 1;
  const from = Math.max(0, i0 - radius);
  const to = Math.min(ch.v.length - 1, i1 + radius);
  const verses = ch.v.slice(from, to + 1);
  const whole = from === 0 && to === ch.v.length - 1;
  box.innerHTML = `
    <div class="ctx-head"><span>${esc(bible.formatRef(b, c, verses[0].n, verses[verses.length - 1].n))}</span></div>
    <div class="ctx-text">${verses
      .map((v) => `<span class="${v.n >= s && v.n <= e ? "ctx-focus" : ""}"><sup class="vn">${v.n}</sup>${bible.verseHTML(v.t).replace(/\n\t?/g, " ")}</span>`)
      .join(" ")}</div>
    <div class="row ctx-tools">
      ${whole ? "" : `<button class="btn small" data-more>${icon("expand")} More</button>`}
      <a class="btn ghost small" href="#/read/${b}/${c}?v=${s}">${icon("book")} Open chapter</a>
      ${aiEnabled() ? `<button class="btn ghost small" data-ai="explain">${icon("sparkle")} Explain</button><button class="btn ghost small" data-ai="reflect">${icon("note")} Help me reflect</button>` : ""}
    </div>
    <div class="ai-host" hidden></div>`;
  const more = $("[data-more]", box);
  if (more) more.onclick = () => draw(box, b, c, s, e, radius + 6);
  box.querySelectorAll("[data-ai]").forEach(
    (btn) =>
      (btn.onclick = () =>
        runInto($(".ai-host", box), {
          mode: btn.dataset.ai,
          passages: [
            {
              ref: bible.formatRef(b, c, verses[0].n, verses[verses.length - 1].n),
              focus: bible.formatRef(b, c, s, e === s ? null : e),
              text: verses.map((v) => `${v.n} ${bible.plainVerse(v.t)}`).join(" "),
            },
          ],
        }))
  );
}

// Wire every [data-expand] button inside root. The context box is inserted after the
// closest ".result" / ".expandable" element.
export function wireExpand(root) {
  root.querySelectorAll("[data-expand]").forEach((btn) => {
    btn.onclick = async () => {
      const host = btn.closest(".result, .expandable") || btn.parentElement;
      let box = host.querySelector(":scope > .ctx");
      if (box) {
        box.remove();
        btn.innerHTML = `${icon("expand")} Expand`;
        return;
      }
      box = document.createElement("div");
      box.className = "ctx";
      host.appendChild(box);
      btn.innerHTML = `${icon("collapse")} Less`;
      const [b, c, s, e] = btn.dataset.expand.split(".");
      await draw(box, b, +c, +s, +e, 3);
    };
  });
}
