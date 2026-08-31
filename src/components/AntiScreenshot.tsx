"use client";

import { useEffect } from "react";

/**
 * Proteção anti-print (mitigadora — nenhuma proteção 100% é possível no navegador):
 * - Bloqueia menu de contexto (botão direito)
 * - Bloqueia seleção de texto e drag
 * - Bloqueia atalhos: PrintScreen, Ctrl+P, Ctrl+S, Ctrl+Shift+I/J/C, F12, Ctrl+U
 * - Detecta perda de foco (Alt+Tab / troca de janela para tirar print) e cobre a tela
 * - Detecta DevTools aberto (heurística de tamanho de janela) e cobre a tela
 * - Cobre a tela ao imprimir (@media print CSS global) — feito no globals.css
 */
export default function AntiScreenshot({ userLabel }: { userLabel: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // PrintScreen
      if (key === "printscreen") { blockAndAlert(); }
      // F12 / DevTools
      if (key === "f12") { e.preventDefault(); blockAndAlert(); }
      // Ctrl combos
      if (e.ctrlKey || e.metaKey) {
        if (["p", "s", "u"].includes(key)) { e.preventDefault(); blockAndAlert(); }
        if (e.shiftKey && ["i", "j", "c"].includes(key)) { e.preventDefault(); blockAndAlert(); }
      }
    };
    const onCtx = (e: MouseEvent) => e.preventDefault();
    const onDrag = (e: DragEvent) => e.preventDefault();
    const onCopy = (e: ClipboardEvent) => {
      // Permite cópia dentro de inputs; bloqueia em outros lugares
      const t = e.target as HTMLElement | null;
      if (!t || (t.tagName !== "INPUT" && t.tagName !== "TEXTAREA")) e.preventDefault();
    };
    const onBlur = () => showOverlay();
    const onFocus = () => hideOverlay();

    // Detector básico de devtools (mede diferença entre janela e viewport)
    let devtoolsOpen = false;
    const check = () => {
      const w = window.outerWidth - window.innerWidth > 160;
      const h = window.outerHeight - window.innerHeight > 160;
      const open = w || h;
      if (open !== devtoolsOpen) {
        devtoolsOpen = open;
        if (open) showOverlay(); else hideOverlay();
      }
    };
    const iv = setInterval(check, 900);

    document.addEventListener("keydown", onKey);
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("dragstart", onDrag);
    document.addEventListener("copy", onCopy);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("dragstart", onDrag);
      document.removeEventListener("copy", onCopy);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      clearInterval(iv);
    };
  }, []);

  return (
    <>
      {/* Overlay que cobre o conteúdo quando a janela perde foco ou DevTools abre */}
      <div id="__anti_screenshot_overlay" style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "linear-gradient(135deg,#003B6F,#00264D)",
        color: "white", display: "none",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "2rem",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛡️</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>Conteúdo protegido</div>
          <div style={{ marginTop: "0.5rem", opacity: 0.8 }}>
            Retorne o foco à janela para visualizar. Tentativas de captura são registradas.
          </div>
        </div>
      </div>

      {/* Marca d'água diagonal com identificação do usuário */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999,
        overflow: "hidden", userSelect: "none",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage:
            `repeating-linear-gradient(-30deg, transparent 0 220px, rgba(0,59,111,.05) 220px 221px)`,
        }} />
        {/* Textos repetidos */}
        <div style={{
          position: "absolute", inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "60px",
          transform: "rotate(-30deg) scale(1.4)",
          transformOrigin: "center",
          opacity: 0.08,
          color: "#003B6F",
          fontWeight: 900,
          fontSize: "12px",
          padding: "40px",
          userSelect: "none",
        }}>
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

function showOverlay() {
  const el = document.getElementById("__anti_screenshot_overlay");
  if (el) el.style.display = "flex";
}
function hideOverlay() {
  const el = document.getElementById("__anti_screenshot_overlay");
  if (el) el.style.display = "none";
}
function blockAndAlert() {
  showOverlay();
  setTimeout(hideOverlay, 3000);
  // Notifica servidor (audit)
  fetch("/api/audit/screenshot", { method: "POST" }).catch(() => {});
}
