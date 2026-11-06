/* Vazhikaatti offline support: keeps the app, its libraries and map tiles you've viewed */
const V = "vk-app-v1", TILES = "vk-tiles-v1", MAX_TILES = 800;
const SHELL = ["./", "./index.html", "./manifest.json", "./icon.svg",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V && k !== TILES).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function trimTiles() {
  const c = await caches.open(TILES), ks = await c.keys();
  for (let i = 0; i < ks.length - MAX_TILES; i++) await c.delete(ks[i]);
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // map tiles you've already looked at: from cache first
  if (url.hostname === "tile.openstreetmap.org") {
    e.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok) { c.put(req, r.clone()); trimTiles(); }
      return r;
    }));
    return;
  }

  // the app page: always try for the newest version, fall back to the saved copy
  if (req.mode === "navigate" && url.origin === location.origin) {
    e.respondWith((async () => {
      try {
        const r = await fetch(req, { cache: "no-store" });
        if (r.ok) (await caches.open(V)).put("./index.html", r.clone());
        return r;
      } catch {
        return (await caches.match("./index.html")) || (await caches.match("./")) || Response.error();
      }
    })());
    return;
  }

  // app files, Leaflet and fonts: saved copy now, refresh in the background
  if (url.origin === location.origin || url.hostname === "cdnjs.cloudflare.com" || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(V).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
