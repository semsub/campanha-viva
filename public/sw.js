// Service Worker DESATIVADO — apenas remove caches antigos e se auto-desregistra
// Isso é necessário porque usuários que já tinham o SW antigo instalado
// continuavam recebendo páginas velhas do cache.
self.addEventListener("install", () => { self.skipWaiting(); });

self.addEventListener("activate", async (event) => {
  event.waitUntil((async () => {
    // Apaga TODOS os caches antigos
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    // Desregistra este service worker
    const regs = await self.registration.unregister();
    // Força reload de todas as abas abertas
    const clientsList = await self.clients.matchAll({ type: "window" });
    for (const client of clientsList) client.navigate(client.url);
  })());
});

// Nunca intercepta requisição — deixa tudo passar direto para o servidor
self.addEventListener("fetch", () => { /* no-op */ });
