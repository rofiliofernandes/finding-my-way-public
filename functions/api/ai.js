// Cloudflare Pages Function: POST /api/ai
// Explains or reflects on Bible passages with Claude. Your API key stays here on the server.
//
// Settings (Cloudflare → your Pages project → Settings → Variables and Secrets):
//   ANTHROPIC_API_KEY  (secret)  your key from console.anthropic.com
//   SUPABASE_URL                 same as in site/js/config.js
//   SUPABASE_ANON_KEY            same as in site/js/config.js
//   ALLOWED_EMAILS               your Google email (comma-separate several)
//   ANTHROPIC_MODEL   (optional) defaults to claude-haiku-5-5
//   MONTHLY_LIMIT     (optional) max requests per month per person; default 600

const SYSTEM = `You are a warm, knowledgeable companion helping a Catholic reader pray and think about Scripture.
The reader uses the World English Bible (Catholic Edition). Ground everything in the passages you are given;
quote at most a few words and always cite references like "John 3:16".
Draw on Catholic tradition where it helps (the Church Fathers, the Catechism) without lecturing.
Be gentle, honest and concise: at most about 250 words, in short paragraphs, no headings.
If something is a matter of interpretation, say so. Never claim certainty you don't have.
If the reader seems to be in crisis or danger, encourage them kindly to reach out to someone they trust,
a priest, or local emergency help.`;

const PROMPTS = {
  explain: (p, q) => `Explain this passage for me: what is happening, what it meant to its first readers, and what it means for a Christian today.${q ? `\nMy question: ${q}` : ""}\n\n${p}`,
  reflect: (p, q) => `Help me reflect and pray with this passage, in the spirit of lectio divina. Offer two or three short questions for me to sit with, and a one-sentence prayer.${q ? `\nWhat's on my heart: ${q}` : ""}\n\n${p}`,
  ask: (p, q) => `My question: ${q}\n\nAnswer using these passages (they were found by searching the Bible for my question). Point me to the most relevant ones by reference, and explain briefly how each speaks to my question.\n\n${p}`,
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY is not set on the server." }, 500);

  // 1. Only signed-in, allowed accounts may use your API key.
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Please sign in first." }, 401);
  const u = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { authorization: auth, apikey: env.SUPABASE_ANON_KEY },
  });
  if (!u.ok) return json({ error: "Your sign-in has expired. Please sign in again." }, 401);
  const user = await u.json();
  const allowed = (env.ALLOWED_EMAILS || "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes((user.email || "").toLowerCase())) return json({ error: "This account isn't allowed to use AI here." }, 403);

  // 2. Validate input and keep it small.
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  const mode = PROMPTS[body.mode] ? body.mode : "explain";
  const question = String(body.question || "").slice(0, 500);
  if (mode === "ask" && !question.trim()) return json({ error: "Please type a question." }, 400);
  const passages = (Array.isArray(body.passages) ? body.passages : []).slice(0, 10);
  let text = passages
    .map((p) => `[${String(p.ref || "").slice(0, 60)}]${p.focus ? ` (focus: ${String(p.focus).slice(0, 60)})` : ""}\n${String(p.text || "").slice(0, 2500)}`)
    .join("\n\n");
  text = text.slice(0, 12000);
  if (!text) return json({ error: "No passage was sent." }, 400);

  // 3. Monthly limit per person, counted in your Supabase database (see supabase/schema.sql).
  const limit = parseInt(env.MONTHLY_LIMIT || "600", 10);
  const c = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/ai_use`, {
    method: "POST",
    headers: { authorization: auth, apikey: env.SUPABASE_ANON_KEY, "content-type": "application/json" },
    body: "{}",
  });
  const used = c.ok ? parseInt(await c.text(), 10) || 0 : 0;
  if (used > limit) return json({ error: `Monthly AI limit reached (${limit}). It resets next month.` }, 429);

  // 4. Ask Claude.
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 700,
      system: SYSTEM,
      messages: [{ role: "user", content: PROMPTS[mode](text, question) }],
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return json({ error: data?.error?.message || `AI service error (${r.status})` }, 502);

  const out = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
  return json({ text: out, usage: data.usage, used, limit });
}

export async function onRequest() {
  return json({ error: "Use POST." }, 405);
}
