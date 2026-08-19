"use client";

import { useEffect, useState } from "react";
import InstallPwaButton from "@/components/InstallPwaButton";

type BootstrapStatus = {
  hasDatabaseUrl: boolean;
  databaseHost: string | null;
  hasUsersTable: boolean;
  hasAdmin: boolean;
  adminEmail: string | null;
  error?: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState("admin@campanhaviva.com.br");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<BootstrapStatus | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [initMsg, setInitMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bootstrap")
      .then((r) => r.json())
      .then(setStatus)
      .catch((e) => setStatus({ hasDatabaseUrl: false, databaseHost: null, hasUsersTable: false, hasAdmin: false, adminEmail: null, error: String(e) }));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao entrar.");
        return;
      }
      window.location.href = "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  async function initializeSystem() {
    setInitializing(true);
    setInitMsg(null);
    try {
      const res = await fetch("/api/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@campanhaviva.com.br",
          password: "Admin@2026",
          name: "Junior Araujo",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInitMsg("Erro: " + (data.error ?? "falha"));
      } else {
        setInitMsg("Sistema pronto! Login: admin@campanhaviva.com.br / Admin@2026");
        // Recarrega status
        const s = await fetch("/api/bootstrap").then((r) => r.json());
        setStatus(s);
      }
    } catch (e) {
      setInitMsg("Erro: " + String(e));
    } finally {
      setInitializing(false);
    }
  }

  const needsBootstrap = status && (!status.hasUsersTable || !status.hasAdmin);
  const dbError = status?.error;

  return (
    <main className="min-h-screen grid md:grid-cols-2 bg-white">
      {/* Lateral com marca */}
      <section className="relative hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-[#003B6F] via-[#00264D] to-[#001A33] text-white p-10 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(circle at 75% 20%, rgba(240,122,26,.35), transparent 55%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="rounded-3xl bg-white p-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="Júnior Araújo Coordenação"
              style={{ width: 260, height: 260, objectFit: "contain", display: "block" }}
            />
          </div>
          <h1 className="mt-10 text-3xl font-extrabold">
            Plataforma de <span className="text-[#F07A1A]">Coordenação</span>
          </h1>
          <p className="mt-3 max-w-md text-white/70 leading-relaxed">
            Gestão hierárquica de campanha: Super Admin → Coordenadores → Lideranças → Eleitores.
          </p>
        </div>
        <p className="absolute bottom-4 text-xs text-white/40">campanhaviva.com.br</p>
      </section>

      {/* Formulário */}
      <section className="relative flex items-center justify-center p-6">
        <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#003B6F] via-[#0B4F8A] to-[#F07A1A]" />

        <div className="w-full max-w-sm">
          <div className="md:hidden flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Júnior Araújo Coordenação" style={{ width: 140, height: 140, objectFit: "contain" }} />
          </div>

          <h2 className="text-3xl font-extrabold text-center text-[#003B6F]">Acesso ao Sistema</h2>
          <p className="text-center text-xs uppercase tracking-[0.2em] text-[#6B7A8F] mt-1">
            Júnior Araújo Coordenação
          </p>

          {dbError && (
            <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-800">
              <b>⚠️ Erro no banco de dados:</b>
              <div className="mt-1 break-words">{dbError}</div>
              <div className="mt-2 text-red-600">
                Configure a variável <code>DATABASE_URL</code> no Render (deve terminar com{" "}
                <code>?sslmode=require</code>).
              </div>
            </div>
          )}

          {status && !dbError && needsBootstrap && (
            <div className="mt-6 rounded-xl bg-orange-50 border border-orange-200 p-4">
              <div className="text-xs text-orange-800 mb-3">
                <b>Sistema ainda não inicializado.</b> Clique abaixo para criar as tabelas e o
                Super Admin padrão.
              </div>
              <button
                type="button"
                onClick={initializeSystem}
                disabled={initializing}
                className="w-full rounded-lg bg-orange-600 text-white text-sm font-bold py-2.5 hover:bg-orange-700 disabled:opacity-50"
              >
                {initializing ? "Inicializando…" : "🚀 Inicializar sistema agora"}
              </button>
              {initMsg && (
                <div className="mt-2 text-xs text-orange-900 bg-white p-2 rounded">{initMsg}</div>
              )}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-[#003B6F] mb-1">
                E-mail autorizado
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@campanhaviva.com.br"
                className="w-full rounded-xl border-[1.5px] border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 outline-none transition focus:border-[#F07A1A] focus:bg-white focus:ring-4 focus:ring-[#F07A1A]/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest text-[#003B6F] mb-1">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border-[1.5px] border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 outline-none transition focus:border-[#F07A1A] focus:bg-white focus:ring-4 focus:ring-[#F07A1A]/20"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 break-words">
                <b>Erro:</b> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-br from-[#F07A1A] to-[#FF9A3A] px-4 py-3.5 font-bold tracking-wide text-white shadow-[0_12px_28px_rgba(240,122,26,0.35)] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading ? "ENTRANDO..." : "ENTRAR"}
            </button>
          </form>

          {status && !dbError && status.hasAdmin && (
            <div className="mt-4 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
              ✅ Sistema pronto. Admin: <b>{status.adminEmail}</b>
            </div>
          )}

          <InstallPwaButton />

          <p className="mt-6 text-center text-xs text-[#6B7A8F] leading-relaxed">
            Esqueceu a senha? Solicite ao <b>Super Admin</b>.<br />
            Desenvolvido por <b>Júnior Araújo Sistemas</b> —{" "}
            <span className="text-[#F07A1A]">(91) 98212-2175</span>
          </p>
        </div>
      </section>
    </main>
  );
}
