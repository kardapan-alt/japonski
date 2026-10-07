// Service worker wersji na telefon: zapisuje kurs w pamięci telefonu, żeby działał bez internetu.
// Przy każdej nowej wersji zmienia się VERSION, więc telefon pobiera nowe pliki przy następnym otwarciu z internetem.
const VERSION = "9a4fd37292";
const CACHE = "nauka-japonskiego-" + VERSION;
const FILES = ["./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("nauka-japonskiego-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Najpierw kopia z telefonu (szybko i offline); strona główna przy nawigacji zawsze z kopii index.html.
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await c.match("./index.html") : null);
    if (hit) return hit;
    try { return await fetch(req); } catch (x) { return new Response("Offline", { status: 503 }); }
  }));
});
