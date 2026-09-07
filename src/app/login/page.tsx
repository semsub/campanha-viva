"use client";
import { useEffect, useState } from "react";

type Status = { hasAdmin: boolean; hasUsersTable: boolean; adminEmail: string | null; error?: string };

export default function LoginPage() {
  const [email, setEmail] = useState("admin@campanhaviva.com.br");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    fetch("/api/bootstrap")
      .then(async (r) => {
        const t = await r.text();
        try { return JSON.parse(t); } catch { throw new Error(`HTTP ${r.status}`); }
      })
      .then(setStatus)
      .catch((e) => setStatus({ hasAdmin: false, hasUsersTable: false, adminEmail: null, error: String(e) }));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const t = await r.text();
      let d: { ok?: boolean; error?: string } = {};
      try { d = JSON.parse(t); } catch { setError(`Servidor: HTTP ${r.status}`); return; }
      if (!r.ok) { setError(d.error ?? "Falha ao entrar."); return; }
      window.location.href = "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de rede");
    } finally { setLoading(false); }
  }

  async function initializeSystem() {
    setInitializing(true);
    try {
      const r = await fetch("/api/bootstrap", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@campanhaviva.com.br", password: "230808Deus#", name: "Super Admin" }),
      });
      const d = await r.json();
      if (d.ok) {
        const s = await fetch("/api/bootstrap").then((r) => r.json());
        setStatus(s);
      } else setError(d.error);
    } finally { setInitializing(false); }
  }

  const needsBootstrap = status && !status.hasAdmin && !status.error;

  return (
    <main className="min-h-screen grid md:grid-cols-2 bg-white">
      <section className="relative hidden md:flex flex-col items-center justify-center bg-gradient-to-b from-[#003B6F] via-[#00264D] to-[#001A33] text-white p-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 75% 15%, rgba(240,122,26,.28), transparent 55%)" }} />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="rounded-3xl bg-white p-4 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="" width={280} height={280} style={{ display: "block", objectFit: "contain" }} />
          </div>
          <h1 className="mt-8 text-3xl font-extrabold">
            Plataforma de <span className="text-[#F07A1A]">Coordenação</span>
          </h1>
        </div>
      </section>

      <section className="relative flex items-center justify-center p-6">
        <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#003B6F] via-[#0B4F8A] to-[#F07A1A]" />
        <div className="w-full max-w-sm">
          <div className="md:hidden flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="" width={140} height={140} />
          </div>
          <h2 className="text-3xl font-extrabold text-center text-[#003B6F]">Acesso ao Sistema</h2>
          <p className="text-center text-xs uppercase tracking-[0.2em] text-[#6B7A8F] mt-1">Júnior Araújo Coordenação</p>

          {status?.error && (
            <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-800 break-words">
              <b>Erro:</b> {status.error}
            </div>
          )}

          {needsBootstrap && (
            <div className="mt-6 rounded-xl bg-orange-50 border border-orange-200 p-4">
              <div className="text-xs text-orange-800 mb-3">
                <b>Sistema ainda não inicializado.</b>
              </div>
              <button type="button" onClick={initializeSystem} disabled={initializing}
                className="w-full rounded-lg bg-orange-600 text-white text-sm font-bold py-2.5 hover:bg-orange-700 disabled:opacity-50">
                {initializing ? "Inicializando…" : "🚀 Inicializar sistema"}
              </button>
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#003B6F] mb-1">E-mail</label>
              <input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-[1.5px] border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 outline-none focus:border-[#F07A1A] focus:bg-white focus:ring-4 focus:ring-[#F07A1A]/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#003B6F] mb-1">Senha</label>
              <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border-[1.5px] border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 outline-none focus:border-[#F07A1A] focus:bg-white focus:ring-4 focus:ring-[#F07A1A]/20" />
            </div>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 break-words"><b>Erro:</b> {error}</div>}
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-gradient-to-br from-[#F07A1A] to-[#FF9A3A] px-4 py-3.5 font-bold tracking-wide text-white shadow-lg disabled:opacity-60">
              {loading ? "ENTRANDO..." : "ENTRAR"}
            </button>
          </form>

          {status && status.hasAdmin && !status.error && (
            <div className="mt-4 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
              ✅ Sistema pronto. Admin: <b>{status.adminEmail}</b>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
