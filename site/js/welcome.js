// The first time someone opens the app: sign in with Google, with email, or carry on without an account.
// Also the email sign-in form used on the You page, and one gentle "sign in to keep your journal safe"
// reminder a week later for people who chose no account.
import * as store from "./store.js";
import * as sync from "./sync.js";
import * as synced from "./synced.js";
import { openModal, toast } from "./ui.js";

export const GOOGLE = `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.8 6.1C12.3 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-4-13.6-9.6l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>`;
const MAIL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/></svg>`;
const WEEK = 7 * 24 * 3600 * 1000;

/* ---------- the email form: email → code (or tap the link) ---------- */

export function emailFormHTML() {
  return `<div class="email-flow">
    <form class="ef-step ef-email">
      <label class="ef-label" for="efEmail">Your email</label>
      <div class="ef-row"><input id="efEmail" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" required>
        <button class="btn primary" type="submit">Send code</button></div>
      <p class="muted small ef-msg" role="status"></p>
    </form>
    <form class="ef-step ef-code" hidden>
      <p class="ef-sent">We sent an email to <b class="ef-to"></b>. Tap the link in it, or type the 6-digit code here:</p>
      <div class="ef-row"><input id="efCode" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="10" placeholder="123456" required>
        <button class="btn primary" type="submit">Sign in</button></div>
      <p class="muted small ef-msg" role="status"></p>
      <p class="small ef-links"><button type="button" class="linkbtn" data-ef-resend disabled>Send again</button> · <button type="button" class="linkbtn" data-ef-change>Use a different email</button></p>
    </form>
  </div>`;
}

export function wireEmailForm(root, onSignedIn) {
  const step1 = root.querySelector(".ef-email"), step2 = root.querySelector(".ef-code");
  const msg1 = step1.querySelector(".ef-msg"), msg2 = step2.querySelector(".ef-msg");
  const resend = root.querySelector("[data-ef-resend]");
  let email = "", wait = 0, timer = 0;
  const countdown = () => {
    clearInterval(timer);
    wait = 60;
    resend.disabled = true;
    resend.textContent = `Send again (${wait}s)`;
    timer = setInterval(() => {
      wait--;
      resend.textContent = wait > 0 ? `Send again (${wait}s)` : "Send again";
      if (wait <= 0) (clearInterval(timer), (resend.disabled = false));
    }, 1000);
  };
  const send = async (button, msg) => {
    button.disabled = true;
    msg.textContent = "Sending…";
    const { error } = await sync.sendEmailCode(email);
    button.disabled = false;
    if (error) return (msg.textContent = error), false;
    msg.textContent = "";
    return true;
  };
  step1.onsubmit = async (e) => {
    e.preventDefault();
    email = step1.querySelector("#efEmail").value.trim();
    if (!email) return;
    if (await send(step1.querySelector("button[type=submit]"), msg1)) {
      step1.hidden = true;
      step2.hidden = false;
      step2.querySelector(".ef-to").textContent = email;
      step2.querySelector("#efCode").focus();
      countdown();
    }
  };
  step2.onsubmit = async (e) => {
    e.preventDefault();
    const code = step2.querySelector("#efCode").value.replace(/\D/g, "");
    if (code.length < 6) return (msg2.textContent = "The code has 6 digits.");
    const b = step2.querySelector("button[type=submit]");
    b.disabled = true;
    msg2.textContent = "Checking…";
    const { error } = await sync.verifyEmailCode(email, code);
    b.disabled = false;
    if (error) return (msg2.textContent = error);
    clearInterval(timer);
    onSignedIn?.();
  };
  resend.onclick = async () => {
    if (await send(resend, msg2)) (countdown(), (msg2.textContent = "Sent again. Check your inbox (and spam)."));
  };
  root.querySelector("[data-ef-change]").onclick = () => {
    clearInterval(timer);
    step2.hidden = true;
    step1.hidden = false;
    msg1.textContent = msg2.textContent = "";
    step1.querySelector("#efEmail").focus();
  };
}

// The email form in a sheet, for the You page
export function openEmailSignIn() {
  openModal(
    `<div class="eyebrow">Sign in with email</div><h2 style="margin:4px 0 14px">We'll email you a code</h2>${emailFormHTML()}
     <div class="actions"><button class="btn ghost" data-cancel>Cancel</button></div>`,
    (dlg, close) => {
      dlg.querySelector("[data-cancel]").onclick = close;
      wireEmailForm(dlg, () => (close(), toast("Signed in. Your things will sync now.")));
      setTimeout(() => dlg.querySelector("#efEmail")?.focus(), 50);
    }
  );
}

/* ---------- the welcome screen ---------- */

function hasHistory() {
  return store.all("reading_log").length > 0 || store.all("notes").some((n) => n.kind === "note" || n.kind === "prayer");
}

// Call once sign-in has been checked. Shows the welcome screen to a new visitor,
// or (a week later) one gentle reminder to someone who chose no account.
export function maybeShow() {
  if (!sync.status.configured) return;
  if (!store.meta("firstOpen")) store.meta("firstOpen", Date.now());
  if (sync.user()) return store.meta("welcomed") || store.meta("welcomed", "account"); // the name is asked after the first sync (app.js)
  if (!store.meta("welcomed")) {
    if (hasHistory()) return store.meta("welcomed", "existing"); // already using the app on this device
    return show();
  }
  if (store.meta("welcomed") === "skip" && !store.meta("remindedSignIn") && Date.now() - store.meta("firstOpen") > WEEK) return remind();
  maybeAskName();
}

/* ---------- "What would you like to be called?" ---------- */
// Asked once per person, after the account choice (with Google or email: after the first sync, so another device's
// answer arrives first). With an account, the box starts with the account's first name, but it's still asked.
export function maybeAskName() {
  // signed in without leaving the page (some browsers, or a sign-in that finished in the background): the first card is done
  const first = document.querySelector(".welcome:not(.name-ask)");
  if (first && sync.user()) { first.remove(); document.body.classList.remove("welcome-open"); if (!store.meta("welcomed")) store.meta("welcomed", "account"); }
  if (!store.meta("welcomed") || synced.get("nameAsked") || document.querySelector(".welcome, .name-ask")) return;
  askName();
}
function suggestion() {
  const saved = String(synced.get("name") || "").trim();
  if (saved) return saved;
  const m = sync.user()?.user_metadata || {};
  const first = String(m.given_name || m.full_name || m.name || "").trim().split(/\s+/)[0];
  return first && first.length <= 30 && !first.includes("@") ? first : "";
}
export function askName() {
  document.querySelector(".name-ask")?.remove();
  const el = document.createElement("div");
  el.className = "welcome name-ask";
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Your name");
  const v = suggestion().replace(/"/g, "&quot;");
  el.innerHTML = `<form class="welcome-card name-card">
      <img class="welcome-icon" src="icon.svg" alt="">
      <h1>What would you like to be called?</h1>
      <p class="welcome-lede">This is how the app will greet you. You can change it any time under <b>You</b>.</p>
      <input id="askName" maxlength="30" autocomplete="given-name" placeholder="Your name" value="${v}">
      <button class="btn primary welcome-btn" type="submit">Continue</button>
      <button class="btn ghost welcome-btn" type="button" data-n-skip>Skip</button>
    </form>`;
  document.body.appendChild(el);
  document.body.classList.add("welcome-open");
  requestAnimationFrame(() => el.classList.add("in"));
  const input = el.querySelector("#askName");
  setTimeout(() => { input.focus(); input.select(); }, 350);
  let finished = false;
  const done = (name) => {
    if (finished) return; // a double tap closes it once
    finished = true;
    if (name !== null) synced.set("name", name);
    synced.set("nameAsked", true);
    el.classList.remove("in");
    document.body.classList.remove("welcome-open");
    setTimeout(() => el.remove(), 350);
    window.dispatchEvent(new HashChangeEvent("hashchange")); // redraw the page behind with the name
    if (name) toast(`Nice to meet you, ${name}`);
  };
  el.querySelector("form").onsubmit = (e) => { e.preventDefault(); const n = input.value.trim().slice(0, 30); done(n || null); };
  el.querySelector("[data-n-skip]").onclick = () => done(null);
}

export function show() {
  document.querySelector(".welcome")?.remove();
  const el = document.createElement("div");
  el.className = "welcome";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Welcome");
  el.innerHTML = `<div class="welcome-card">
      <img class="welcome-icon" src="icon.svg" alt="">
      <div class="welcome-latin">Iter ad Dominum</div>
      <h1>Finding my way to Jesus Christ</h1>
      <p class="welcome-lede">Read the Bible, keep a journal, and let it follow you to every device.</p>
      <div class="welcome-choices">
        <button class="btn google-btn welcome-btn" data-w-google>${GOOGLE} Continue with Google</button>
        <button class="btn welcome-btn" data-w-email>${MAIL} Continue with email</button>
        <div class="welcome-email" hidden>${emailFormHTML()}</div>
        <div class="welcome-or"><span>or</span></div>
        <button class="btn ghost welcome-btn" data-w-skip>Continue without an account</button>
        <p class="muted small welcome-note">Your reading, notes and treasures stay on this device only, with no syncing. You can sign in any time under <b>You</b>.</p>
      </div>
    </div>`;
  document.body.appendChild(el);
  document.body.classList.add("welcome-open");
  requestAnimationFrame(() => el.classList.add("in"));
  const close = (how) => {
    store.meta("welcomed", how);
    el.classList.remove("in");
    document.body.classList.remove("welcome-open");
    setTimeout(() => el.remove(), 350);
    window.dispatchEvent(new HashChangeEvent("hashchange")); // redraw the page behind, now with the name
  };
  el.querySelector("[data-w-google]").onclick = () => {
    store.meta("welcomed", "google");
    sync.signIn(); // leaves for Google and comes back signed in
  };
  const emailBtn = el.querySelector("[data-w-email]"), emailBox = el.querySelector(".welcome-email");
  emailBtn.onclick = () => {
    emailBtn.hidden = true;
    emailBox.hidden = false;
    emailBox.querySelector("#efEmail").focus();
  };
  wireEmailForm(emailBox, () => (close("email"), toast("Welcome! You're signed in.")));
  el.querySelector("[data-w-skip]").onclick = () => { close("skip"); setTimeout(maybeAskName, 380); };
}

// One gentle nudge, a week after choosing no account
function remind() {
  store.meta("remindedSignIn", Date.now());
  const el = document.createElement("div");
  el.className = "signin-nudge";
  el.innerHTML = `<div><b>Keep your journal safe</b><span>Sign in so your reading and notes aren't lost if you change phones.</span></div>
    <button class="btn small primary" data-n-yes>Sign in</button><button class="btn icon ghost" data-n-no aria-label="Not now">✕</button>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("in"));
  const close = () => (el.classList.remove("in"), setTimeout(() => el.remove(), 300));
  el.querySelector("[data-n-no]").onclick = close;
  el.querySelector("[data-n-yes]").onclick = () => (close(), (location.hash = "#/settings"));
}

