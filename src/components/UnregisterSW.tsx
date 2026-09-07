"use client";
import { useEffect } from "react";

/**
 * Remove qualquer Service Worker antigo do navegador do usuário.
 * Isso é necessário porque instalamos um SW no passado e agora precisamos
 * garantir que nenhuma versão cacheada de página apareça.
 */
export default function UnregisterSW() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) await reg.unregister();
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        /* silencia */
      }
    })();
  }, []);
  return null;
}
