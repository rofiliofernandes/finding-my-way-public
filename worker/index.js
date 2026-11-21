// The Cloudflare Worker for the app.
// Everything is served straight from the site/ folder; only /api/* runs code here.
// /api/ai is the optional AI helper (off unless AI_ENABLED is true in site/js/config.js).
import { onRequestPost as aiPost } from "../functions/api/ai.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/ai") {
      if (request.method === "POST") return aiPost({ request, env });
      return new Response("Use POST", { status: 405, headers: { allow: "POST" } });
    }
    // rough location from the connection (Cloudflare already knows it); used to choose Verse for today. Not stored.
    if (url.pathname === "/api/where") {
      const cf = request.cf || {};
      const body = JSON.stringify({ country: cf.country || null, region: cf.region || null, city: cf.city || null, timezone: cf.timezone || null });
      return new Response(body, { headers: { "content-type": "application/json", "cache-control": "private, no-store" } });
    }
    if (url.pathname.startsWith("/api/")) return new Response("Not found", { status: 404 });
    return env.ASSETS.fetch(request);
  },
};
