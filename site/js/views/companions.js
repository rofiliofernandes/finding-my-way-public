// Journey with: #/companions (you, search, invites, companions) and #/u/<username> (someone's journey).
import { $, $$, esc, icon, openModal, toast, confirmBox } from "../ui.js";
import * as social from "../social.js";
import * as sync from "../sync.js";
import * as synced from "../synced.js";
import { formatRef } from "../bible.js";

const A = social.avatar;

function signedOut() {
  return `<div class="card section" style="text-align:center;padding:28px 22px">
      <h2 style="margin:0 0 6px">Journey with others</h2>
      <p class="muted" style="max-width:44ch;margin:0 auto 16px">Sign in to find the people you love on the app, journey together, see each other's badges and Tree of Life, and share lights on the verses you read.</p>
      <a class="btn primary" href="#/settings">Sign in on the You page</a></div>`;
}

/* ---------- choosing your username ---------- */
function profileForm(p) {
  const meta = sync.user()?.user_metadata || {};
  const u = p?.username || social.suggestUsername(), name = p?.display_name ?? (String(synced.get("name") || "").trim() || String(meta.given_name || meta.full_name || meta.name || "").trim().split(/\s+/)[0] || ""), col = p?.color || social.COLORS[0];
  return `<form class="card section prof-form" autocomplete="off">
      <div class="prof-head">${A({ display_name: name || u, color: col }, 64)}<div>
        <h2 style="margin:0">${p ? "Edit your journey" : "Choose your username"}</h2>
        <p class="muted small" style="margin:4px 0 0">${p ? "How your companions see you." : "So your partner, family and friends can find you. Only companions see your journey."}</p></div></div>
      <label class="fld"><span>Username</span><div class="at"><b>@</b><input name="u" value="${esc(u)}" maxlength="20" spellcheck="false" autocapitalize="none" inputmode="url"></div>
        <em class="hint" data-hint>3–20 letters, numbers, dots or underscores.</em></label>
      <label class="fld"><span>Name</span><input name="name" value="${esc(name)}" maxlength="40" placeholder="Your name"></label>
      <div class="fld"><span>Colour</span><div class="swatches">${social.COLORS.map((c) => `<button type="button" class="sw ${c === col ? "on" : ""}" data-col="${c}" style="--sw:${c}" aria-label="Colour ${c}"></button>`).join("")}</div></div>
      <div class="actions">${p ? '<button type="button" class="btn ghost" data-cancel>Cancel</button>' : ""}<button class="btn primary" data-save>${p ? "Save" : "Start my journey"}</button></div>
    </form>`;
}
function wireProfileForm(form, p, done) {
  let col = p?.color || social.COLORS[0], free = true, t = null;
  const u = form.elements.u, nm = form.elements.name, hint = $("[data-hint]", form), av = $(".prof-head .avatar", form);
  const paint = () => { av.outerHTML = A({ display_name: nm.value || u.value, color: col }, 64); };
  const check = () => {
    clearTimeout(t);
    const v = u.value.trim().toLowerCase(); u.value = v;
    if (!social.usernameOk(v)) { free = false; hint.textContent = "3–20 letters, numbers, dots or underscores."; hint.className = "hint"; return; }
    if (p && v === p.username) { free = true; hint.textContent = "This is your username."; hint.className = "hint"; return; }
    hint.textContent = "Checking…"; hint.className = "hint";
    t = setTimeout(async () => {
      try { free = await social.usernameFree(v); } catch { free = true; }
      if (u.value.trim().toLowerCase() !== v) return;
      hint.textContent = free ? `✓ @${v} is free` : `@${v} is taken. Try another.`;
      hint.className = "hint " + (free ? "good" : "bad");
    }, 350);
  };
  u.addEventListener("input", check); nm.addEventListener("input", () => setTimeout(() => { const a = $(".prof-head .avatar", form); a.outerHTML = A({ display_name: nm.value || u.value, color: col }, 64); }));
  $$("[data-col]", form).forEach((b) => b.addEventListener("click", () => { col = b.dataset.col; $$("[data-col]", form).forEach((x) => x.classList.toggle("on", x === b)); const a = $(".prof-head .avatar", form); a.outerHTML = A({ display_name: nm.value || u.value, color: col }, 64); }));
  $("[data-cancel]", form)?.addEventListener("click", () => done(null));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = u.value.trim().toLowerCase();
    if (!social.usernameOk(v) || !free) { u.focus(); check(); return; }
    const btn = $("[data-save]", form); btn.disabled = true;
    try { const me = await social.setProfile(v, nm.value.trim(), col); if (!synced.get("name") && nm.value.trim()) synced.set("name", nm.value.trim()); done(me); }
    catch (err) { btn.disabled = false; hint.textContent = /duplicate|unique|taken/i.test(err.message) ? `@${v} is taken. Try another.` : "Couldn't save. Check your connection."; hint.className = "hint bad"; }
  });
  check(); void paint;
}

/* ---------- one person in a list ---------- */
function personRow(p, extra = "") {
  return `<div class="person" data-uid="${p.id}">
      <a class="person-main" href="#/u/${esc(p.username)}">${A(p)}<span><b>${esc(social.who(p))}</b><em>@${esc(p.username)}</em></span></a>
      <span class="person-act">${extra}</span></div>`;
}
const actionFor = (p) =>
  p.relation === "companion" ? `<span class="tag">Companion ✓</span>` :
  p.relation === "invited" ? `<span class="tag">Invited</span>` :
  p.relation === "invites_you" ? `<button class="btn primary small" data-accept="${p.id}">Accept</button>` :
  `<button class="btn small" data-invite="${p.id}">Journey with</button>`;

export async function renderCompanions(main) {
  main.innerHTML = `<div class="eyebrow">Journey with</div><h1 style="margin-top:4px">Companions</h1><div id="cmp"><p class="muted">Loading…</p></div>`;
  const box = $("#cmp", main);
  if (!sync.status.configured || !sync.user()) { box.innerHTML = signedOut(); return; }
  let me;
  try { me = await social.me(true); } catch { me = null; }
  if (social.notSetUp()) {
    box.innerHTML = `<div class="card section" style="padding:24px"><h2 style="margin:0 0 6px">Almost ready</h2>
      <p class="muted" style="margin:0">Companions needs one more step on the server: run <b>supabase/social.sql</b> in Supabase → SQL Editor. Then come back here.</p></div>`;
    return;
  }
  if (!me) {
    box.innerHTML = profileForm(null);
    wireProfileForm($("form", box), null, (p) => { if (p) { toast(`Welcome, @${p.username}`); renderCompanions(main); } });
    return;
  }
  let list = [];
  try { list = await social.circle(); } catch (e) { box.innerHTML = `<p class="muted">Couldn't load your companions. ${esc(e.message)}</p>`; return; }
  social.countInvites();
  const inv = list.filter((p) => p.relation === "invites_you"), comp = list.filter((p) => p.relation === "companion"), sent = list.filter((p) => p.relation === "invited");
  box.innerHTML = `
    <div class="card section me-card">
      <a class="person-main" href="#/u/${esc(me.username)}">${A(me, 52)}<span><b>${esc(social.who(me))}</b><em>@${esc(me.username)} · ${comp.length} companion${comp.length === 1 ? "" : "s"}</em></span></a>
      <button class="btn ghost small" data-edit>Edit</button></div>
    <div class="section"><input type="search" id="find" placeholder="Find people by name or @username" autocomplete="off" spellcheck="false" autocapitalize="none"><div id="found"></div></div>
    ${inv.length ? `<h2 class="section-title">Invites to journey together</h2><div class="card people">${inv.map((p) => personRow(p, `<button class="btn primary small" data-accept="${p.id}">Accept</button><button class="btn ghost small" data-part="${p.id}">Decline</button>`)).join("")}</div>` : ""}
    <h2 class="section-title">Your companions</h2>
    ${comp.length ? `<div class="card people">${comp.map((p) => personRow(p, `<span class="muted small">since ${new Date(p.since).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>`)).join("")}</div>`
      : `<p class="muted">No companions yet. Search above for your partner, family or friends, and tap <b>Journey with</b>. When they accept, you'll see each other's journey.</p>`}
    ${sent.length ? `<h2 class="section-title">Invited</h2><div class="card people">${sent.map((p) => personRow(p, `<button class="btn ghost small" data-part="${p.id}">Cancel</button>`)).join("")}</div>` : ""}
    <p class="muted small" style="margin-top:22px"><button class="linkish" data-blocked>Blocked people</button></p><div id="blockedBox"></div>`;
  const refresh = () => renderCompanions(main);
  const wireActs = (root) => {
    $$("[data-invite]", root).forEach((b) => b.onclick = async () => { b.disabled = true; try { const r = await social.invite(b.dataset.invite); b.outerHTML = r === "companion" ? `<span class="tag">Companion ✓</span>` : `<span class="tag">Invited</span>`; toast(r === "companion" ? "You're companions now" : "Invite sent"); if (r === "companion") refresh(); } catch (e) { b.disabled = false; toast(e.message); } });
    $$("[data-accept]", root).forEach((b) => b.onclick = async () => { b.disabled = true; try { await social.accept(b.dataset.accept); toast("You're companions now"); refresh(); } catch (e) { b.disabled = false; toast(e.message); } });
    $$("[data-part]", root).forEach((b) => b.onclick = async () => { b.disabled = true; try { await social.part(b.dataset.part); refresh(); } catch (e) { b.disabled = false; toast(e.message); } });
  };
  wireActs(box);
  $("[data-edit]", box).onclick = () => openModal(profileForm(me), (dlg, close) => wireProfileForm($("form", dlg), me, (p) => { close(); if (p) { toast("Saved"); refresh(); } }));
  // search as you type
  const find = $("#find", box), found = $("#found", box); let t = null, seq = 0;
  find.addEventListener("input", () => {
    clearTimeout(t);
    const q = find.value.trim();
    if (q.replace(/^@/, "").length < 2) { found.innerHTML = ""; return; }
    t = setTimeout(async () => {
      const my = ++seq;
      let rows = [];
      try { rows = await social.search(q); } catch (e) { found.innerHTML = `<p class="muted small">${esc(e.message)}</p>`; return; }
      if (my !== seq) return;
      found.innerHTML = rows.length ? `<div class="card people">${rows.map((p) => personRow(p, actionFor(p))).join("")}</div>` : `<p class="muted small" style="margin:10px 2px">Nobody found for “${esc(q)}”. Only people who have chosen a username can be found.</p>`;
      wireActs(found);
    }, 300);
  });
  $("[data-blocked]", box).onclick = async () => {
    const bb = $("#blockedBox", box);
    let rows = [];
    try { rows = await social.blocks(); } catch {}
    bb.innerHTML = rows.length ? `<div class="card people">${rows.map((p) => `<div class="person"><span class="person-main">${A(p)}<span><b>${esc(social.who(p))}</b><em>@${esc(p.username)}</em></span></span><span class="person-act"><button class="btn ghost small" data-unblock="${p.id}">Unblock</button></span></div>`).join("")}</div>` : `<p class="muted small">You haven't blocked anyone.</p>`;
    $$("[data-unblock]", bb).forEach((b) => b.onclick = async () => { await social.unblock(b.dataset.unblock); toast("Unblocked"); $("[data-blocked]", box).click(); });
  };
}

/* ---------- someone's journey ---------- */
function reportBox(p, lightId) {
  openModal(`<h2 style="margin:0 0 6px">Report @${esc(p.username)}</h2>
      <p class="muted small" style="margin:0 0 12px">Reports go privately to the app's owner. ${esc(social.who(p))} won't know who reported.</p>
      <div class="radios">${["Something hurtful or inappropriate", "Spam or a fake account", "They're bothering me", "Something else"].map((r, i) => `<label><input type="radio" name="why" value="${esc(r)}" ${i ? "" : "checked"}> ${esc(r)}</label>`).join("")}</div>
      <textarea id="why" placeholder="Anything else we should know? (optional)" maxlength="400" style="min-height:80px"></textarea>
      <label class="chk"><input type="checkbox" id="alsoBlock" checked> Also block @${esc(p.username)}</label>
      <div class="actions"><button class="btn ghost" data-cancel>Cancel</button><button class="btn primary" data-send>Send report</button></div>`,
    (dlg, close) => {
      $("[data-cancel]", dlg).onclick = close;
      $("[data-send]", dlg).onclick = async () => {
        const why = $("input[name=why]:checked", dlg).value + ($("#why", dlg).value.trim() ? ": " + $("#why", dlg).value.trim() : "");
        try { await social.report(p.id, why, lightId || null); if ($("#alsoBlock", dlg).checked) await social.block(p.id); close(); toast("Thank you. Reported."); if ($("#alsoBlock", dlg).checked) location.hash = "#/companions"; }
        catch (e) { toast(e.message); }
      };
    });
}

export async function renderJourney(main, uname) {
  main.innerHTML = `<a class="back-link" href="#/companions">${icon("left")} Companions</a><div id="jr"><p class="muted">Loading…</p></div>`;
  const box = $("#jr", main);
  if (!sync.status.configured || !sync.user()) { box.innerHTML = signedOut(); return; }
  let j;
  try { j = await social.journeyOf(uname); } catch (e) { box.innerHTML = `<p class="muted">${esc(e.message)}</p>`; return; }
  if (!j) { box.innerHTML = `<div class="card section"><h2 style="margin:0 0 6px">@${esc(uname)} isn't here</h2><p class="muted">No one has this username, or it isn't available to you.</p></div>`; return; }
  const close = j.relation === "companion" || j.me;
  const btns = j.me ? `<a class="btn small" href="#/companions">Edit on Companions</a>` :
    j.relation === "companion" ? `<span class="tag big">Companions ✓</span>` :
    j.relation === "invited" ? `<span class="tag big">Invited</span><button class="btn ghost small" data-part>Cancel invite</button>` :
    j.relation === "invites_you" ? `<button class="btn primary" data-accept>Accept invite</button><button class="btn ghost small" data-part>Decline</button>` :
    `<button class="btn primary" data-invite>Journey with ${esc(social.who(j).split(" ")[0])}</button>`;
  const jr = j.journey || {};
  const lastRead = jr.last_read ? (jr.last_read.slice(0, 10) === new Date().toISOString().slice(0, 10) ? "today" : new Date(jr.last_read).toLocaleDateString(undefined, { month: "short", day: "numeric" })) : null;
  box.innerHTML = `
    <div class="journey-head">${A(j, 84)}<div><h1 style="margin:0">${esc(social.who(j))}</h1><p class="muted" style="margin:2px 0 0">@${esc(j.username)}</p>
      ${j.relation === "invites_you" ? `<p class="small" style="margin:8px 0 0">${esc(social.who(j))} invites you to journey together.</p>` : ""}</div></div>
    <div class="journey-acts">${btns}${j.me ? "" : `<span class="spacer"></span><button class="btn icon ghost" data-more aria-label="More">⋯</button>`}</div>
    ${j.me ? `<p class="muted small">This is how your companions see you.</p>` : ""}
    ${close ? `
      <div class="tiles">
        <div class="tile"><b>${jr.weeks ?? 0}</b><span>weekly badge${jr.weeks === 1 ? "" : "s"}</span></div>
        <div class="tile"><b>${jr.months ?? 0}</b><span>fruit on the Tree of Life</span></div>
        <div class="tile"><b>${jr.streak ?? 0}</b><span>day${jr.streak === 1 ? "" : "s"} in a row</span></div>
      </div>
      ${jr.reading ? `<p class="muted small" style="margin:10px 2px 0">Reading ${esc(jr.reading)}${lastRead ? ` · last read ${lastRead}` : ""}</p>` : ""}
      <h2 class="section-title">Lights shared</h2>
      ${j.lights.length ? j.lights.map((l) => `<div class="card light-card"><a class="small" style="font-weight:600" href="#/read/${l.book}/${l.chapter}?v=${l.verse_start || 1}">${esc(formatRef(l.book, l.chapter, l.verse_start, l.verse_end))}</a><p>${esc(l.body)}</p><span class="muted small">${social.ago(l.created_at)}</span></div>`).join("")
        : `<p class="muted">${j.me ? "Notes you share as a light appear here. When you write a note, tick <b>Share as a light</b>." : "No lights shared yet."}</p>`}
      <h2 class="section-title">Along the way</h2>
      ${j.moments.length ? `<div class="card people">${j.moments.map((m) => `<div class="moment"><i>${m.kind === "week" ? "✦" : "🌳"}</i><span><b>${esc(m.title)}</b><em>${social.ago(m.created_at)}</em></span></div>`).join("")}</div>` : `<p class="muted">Weekly badges and months on the Tree of Life will appear here.</p>`}`
    : `<div class="card section private"><div class="lock">🔒</div><h2 style="margin:0 0 6px">${esc(social.who(j).split(" ")[0])}'s journey is private</h2>
        <p class="muted" style="margin:0">When you journey together, you'll see each other's badges, Tree of Life and the lights you share.</p></div>`}`;
  const again = () => renderJourney(main, uname);
  $("[data-invite]", box)?.addEventListener("click", async (e) => { e.target.disabled = true; try { const r = await social.invite(j.id); toast(r === "companion" ? "You're companions now" : "Invite sent"); again(); } catch (err) { e.target.disabled = false; toast(err.message); } });
  $("[data-accept]", box)?.addEventListener("click", async () => { await social.accept(j.id); toast("You're companions now"); again(); });
  $("[data-part]", box)?.addEventListener("click", async () => { await social.part(j.id); again(); });
  $("[data-more]", box)?.addEventListener("click", () => openModal(`<h2 style="margin:0 0 12px">@${esc(j.username)}</h2>
      <div class="menu-list">
        ${j.relation === "companion" ? `<button data-leave>Stop journeying together</button>` : ""}
        <button data-block class="danger">Block @${esc(j.username)}</button>
        <button data-report class="danger">Report</button>
        <button data-cancel>Cancel</button></div>`, (dlg, close) => {
      $("[data-cancel]", dlg).onclick = close;
      $("[data-leave]", dlg)?.addEventListener("click", async () => { close(); if (await confirmBox(`Stop journeying with ${social.who(j)}? You'll no longer see each other's journey.`, "Stop")) { await social.part(j.id); toast("Done"); again(); } });
      $("[data-block]", dlg).onclick = async () => { close(); if (await confirmBox(`Block @${j.username}? They won't be able to find you or invite you, and you won't see each other. They aren't told.`, "Block")) { await social.block(j.id); toast("Blocked"); location.hash = "#/companions"; } };
      $("[data-report]", dlg).onclick = () => { close(); setTimeout(() => reportBox(j), 260); };
    }));
}

/* ---------- lights on the verses you read ---------- */
const lightCache = new Map();
export async function showLights(root, book, chapter) {
  if (!social.can() || !social.cachedMe()) return;
  // kept for a minute, so redrawing the chapter (a bookmark, a note) doesn't ask again
  const key = book + chapter, hit = lightCache.get(key);
  let rows = [];
  if (hit && Date.now() - hit.at < 60000) rows = hit.rows;
  else { try { rows = await social.lightsOn(book, chapter); lightCache.set(key, { rows, at: Date.now() }); } catch { return; } }
  if (!rows.length || !root.isConnected) return;
  const byVerse = new Map();
  for (const l of rows) { const k = l.verse_end || l.verse_start || 1; (byVerse.get(k) || byVerse.set(k, []).get(k)).push(l); }
  for (const [v, ls] of byVerse) {
    const el = $(`.v[data-v="${v}"]`, root); if (!el || $(".light-mark", el)) continue;
    const b = document.createElement("button");
    b.className = "light-mark"; b.type = "button";
    const names = [...new Set(ls.map((l) => social.who(l).split(" ")[0]))];
    b.innerHTML = `<span class="lm-dots">${ls.slice(0, 3).map((l) => `<i style="background:${l.color}"></i>`).join("")}</span>✦ ${esc(names.slice(0, 2).join(", "))}${names.length > 2 ? ` +${names.length - 2}` : ""}`;
    b.setAttribute("aria-label", `Light shared by ${names.join(", ")}`);
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal(`<div class="eyebrow">Lights on ${esc(formatRef(book, chapter, ls[0].verse_start, ls[0].verse_end))}</div>
        ${ls.map((l) => `<div class="light-full"><a class="person-main" href="#/u/${esc(l.username)}">${social.avatar(l, 34)}<span><b>${esc(social.who(l))}</b><em>${social.ago(l.created_at)}</em></span></a><p>${esc(l.body)}</p>
          <button class="linkish small" data-rep="${l.id}" data-user="${l.user_id}" data-uname="${esc(l.username)}">Report</button></div>`).join("")}
        <div class="actions"><button class="btn primary" data-cancel>Close</button></div>`, (dlg, close) => {
        $("[data-cancel]", dlg).onclick = close;
        $$("[data-rep]", dlg).forEach((r) => r.onclick = () => { close(); setTimeout(() => reportBox({ id: r.dataset.user, username: r.dataset.uname }, r.dataset.rep), 260); });
        $$("a", dlg).forEach((a) => a.addEventListener("click", close));
      });
    });
    el.appendChild(b);
  }
}

/* ---------- Along the way, on Today ---------- */
export async function alongHTML() {
  if (!social.can() || !social.cachedMe()) return "";
  let rows = [];
  try { rows = await social.alongTheWay(6); } catch { return ""; }
  if (!rows.length) return "";
  return `<div class="card section along"><div class="along-head"><div class="eyebrow">Along the way</div><a class="small" href="#/companions">Companions →</a></div>
    ${rows.map((r) => `<a class="along-row" href="${r.kind === "light" ? `#/read/${r.book}/${r.chapter}?v=${r.verse_start || 1}` : `#/u/${esc(r.username)}`}">${social.avatar(r, 34)}
      <span><span class="along-line"><b>${esc(social.who(r).split(" ")[0])}</b> ${r.kind === "light" ? `shared a light on <b>${esc(formatRef(r.book, r.chapter, r.verse_start))}</b>` : r.kind === "week" ? `earned <b>${esc(r.title)}</b>` : `grew <b>${esc(r.title)}</b>`}</span>
      ${r.kind === "light" ? `<em class="along-q">“${esc(r.body)}${r.body.length >= 160 ? "…" : ""}”</em>` : ""}<em>${social.ago(r.created_at)}</em></span></a>`).join("")}</div>`;
}
