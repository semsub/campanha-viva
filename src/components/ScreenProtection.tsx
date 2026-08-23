"use client";

import { useEffect } from "react";

export function ScreenProtection() {
  useEffect(() => {
    // Bloqueia PrintScreen
    function blockPrint(e: KeyboardEvent) {
      // PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        document.body.style.filter = "blur(20px)";
        setTimeout(() => { document.body.style.filter = "none"; }, 2000);
        alert("⚠️ Captura de tela bloqueada — Dados confidenciais");
        return;
      }
      // Ctrl+P (print)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        alert("⚠️ Impressão bloqueada — Dados confidenciais");
        return;
      }
      // Ctrl+Shift+S (screenshot no Windows), Ctrl+Shift+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["s", "i", "j", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      // F12 (DevTools)
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }
      // Ctrl+U (view source)
      if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault();
        return;
      }
      // Ctrl+S (save page)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        return;
      }
    }

    // Bloqueia menu de contexto (right-click)
    function blockContext(e: MouseEvent) {
      e.preventDefault();
    }

    // Blur quando perde foco (dificulta screenshot por apps externos)
    function handleBlur() {
      document.body.style.filter = "blur(8px)";
    }
    function handleFocus() {
      document.body.style.filter = "none";
    }

    document.addEventListener("keydown", blockPrint);
    document.addEventListener("keyup", (e) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("").catch(() => {});
      }
    });
    document.addEventListener("contextmenu", blockContext);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("keydown", blockPrint);
      document.removeEventListener("contextmenu", blockContext);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return null;
}
