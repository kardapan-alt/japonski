// Service worker wersji na telefon: zapisuje kurs w pamięci telefonu, żeby działał bez internetu.
// Przy każdej nowej wersji zmienia się VERSION, więc telefon pobiera nowe pliki przy następnym otwarciu z internetem.
// Dane kolejności kresek (duże) mają osobną pamięć i pobierają się ponownie tylko wtedy, gdy same się zmienią.
const VERSION = "f418696a13";
const CACHE = "nauka-japonskiego-" + VERSION;
const SCACHE = "nauka-japonskiego-kreski-776346a74e";
const FILES = ["./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];
const SFILES = ["./strokes/kana.json", "./strokes/n5.json", "./strokes/n4.json", "./strokes/n3.json", "./strokes/n2.json", "./strokes/n1.json", "./strokes/x.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" }))))
    .then(() => caches.open(SCACHE)).then(c => Promise.all(SFILES.map(f => c.match(f).then(hit => hit || c.add(f).catch(() => { })))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("nauka-japonskiego-") && k !== CACHE && k !== SCACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Najpierw kopia z telefonu (szybko i offline); strona główna przy nawigacji zawsze z kopii index.html.
  e.respondWith((async () => {
    const c = await caches.open(CACHE), s = await caches.open(SCACHE);
    const hit = await c.match(req, { ignoreSearch: true }) || await s.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await c.match("./index.html") : null);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && new URL(req.url).pathname.includes("/strokes/")) s.put(req, res.clone());
      return res;
    } catch (x) { return new Response("Offline", { status: 503 }); }
  })());
});
