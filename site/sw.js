// Offline support: app files are fetched fresh when online (falling back to cache),
// Bible text is cached on first read and served from cache afterwards.
const VERSION = "fmw-v4";
// Big, rarely-changing files (Bible text, search model) live in their own cache so app
// updates don't re-download them. Bump DATA when those files change.
const DATA = "fmw-data-1";
const SHELL = [
  "./", "index.html", "css/app.css", "js/app.js", "js/bible.js", "js/store.js", "js/sync.js", "js/ui.js",
  "js/activity.js", "js/config.js", "js/views/home.js", "js/views/read.js", "js/views/history.js",
  "js/views/journal.js", "js/views/topics.js", "js/topics.js", "js/search.js", "js/semantic.js", "js/embed.js", "js/expand.js", "js/ai.js", "js/views/settings.js", "js/views/noteEditor.js", "data/canon.json", "icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== DATA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.includes("/api/")) return;
  if (url.pathname.includes("/data/books/") || url.pathname.includes("/data/semantic/") || url.pathname.includes("/vendor/")) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(DATA).then((c) => c.put(e.request, copy));
        }
        return res;
      }))
    );
    return;
  }
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
