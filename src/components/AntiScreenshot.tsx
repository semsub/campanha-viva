"use client";

import { useEffect } from "react";

/**
 * Proteção anti-print (mitigadora — nenhuma proteção 100% é possível no navegador):
 * - Bloqueia menu de contexto (botão direito)
 * - Bloqueia atalhos: Ctrl+P, Ctrl+S, Ctrl+U (print/save/view-source)
 * - Bloqueia impressão via @media print (globals.css)
 * - Marca d'água diagonal permanente com identificação do usuário
 *
 * NÃO usa mais heurística de DevTools (dava falso positivo).
 * NÃO cobre a tela quando janela perde foco (dava impressão de "logout").
 */
export default function AntiScreenshot({ userLabel }: { userLabel: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Só bloqueia Ctrl+P, Ctrl+S, Ctrl+U (não bloqueia F12 nem PrintScreen porque
      // isso causa falsos positivos e não impede o print em si)
      if (e.ctrlKey || e.metaKey) {
        if (["p", "s", "u"].includes(key)) {
          e.preventDefault();
          // Notifica servidor
          fetch("/api/audit/screenshot", { method: "POST" }).catch(() => {});
        }
      }
    };
    const onCtx = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("keydown", onKey);
    document.addEventListener("contextmenu", onCtx);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("contextmenu", onCtx);
    };
  }, []);

  return (
    <>
      {/* Marca d'água diagonal com identificação do usuário */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9999,
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "60px",
            transform: "rotate(-30deg) scale(1.4)",
            transformOrigin: "center",
            opacity: 0.06,
            color: "#003B6F",
            fontWeight: 900,
            fontSize: "12px",
            padding: "40px",
          }}
        >
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              {userLabel}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
