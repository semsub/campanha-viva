// Service Worker mínimo — necessário para o navegador considerar como PWA instalável
const CACHE = "jac-v1";
const ASSETS = [
  "/",
  "/login",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/images/logo.png",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: network-first para APIs (nunca cachear dados), cache-first para estáticos
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) {
    // Sempre buscar na rede (dados dinâmicos)
    e.respondWith(fetch(e.request).catch(() => new Response("offline", { status: 503 })));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached ||
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => cached ?? new Response("offline", { status: 503 }))
    )
  );
});
