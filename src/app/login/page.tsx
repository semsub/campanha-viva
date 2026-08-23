"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Credenciais inválidas.");
        setLoading(false);
        return;
      }

      // Login OK — cookie foi definido pelo servidor. Redirect via window.location
      // para garantir que o browser envia o cookie na próxima requisição.
      window.location.href = "/dashboard";
    } catch {
      setError("Sem conexão com o servidor.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ===== LADO ESQUERDO ===== */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, #003B6F 0%, #00264D 55%, #001A33 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 75% 20%, rgba(240,122,26,0.3), transparent 55%)" }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full" style={{ border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 0 0 70px rgba(255,255,255,0.025), 0 0 0 160px rgba(255,255,255,0.015)" }} />

        <div className="relative z-10 flex flex-col items-center px-10">
          <div className="bg-white rounded-3xl p-8 shadow-[0_40px_90px_rgba(0,0,0,0.5)]">
            <Logo size="lg" />
          </div>

          <h1 className="mt-8 text-white text-center text-3xl font-extrabold tracking-tight">
            Gestão Territorial <span className="text-[#F07A1A]">Inteligente</span>
          </h1>
          <p className="mt-4 text-white/70 text-center max-w-md leading-relaxed">
            Plataforma hierárquica de coordenação — lideranças, eleitores, demandas, tarefas, eventos e auditoria em um só lugar.
          </p>

          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            {["Super Admin", "Coordenadores", "Lideranças", "Eleitores"].map((t, i) => (
              <span key={t} className={`text-xs uppercase tracking-[0.14em] px-4 py-2 rounded-full border ${i === 0 ? "bg-[#F07A1A] border-[#F07A1A] text-white font-semibold" : "border-white/25 text-white/80"}`}>{t}</span>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 w-full max-w-sm">
            {[
              { icon: "🏛️", title: "Gestão Hierárquica", desc: "Super Admin → Coordenador → Liderança → Eleitor" },
              { icon: "📋", title: "Demandas Inteligentes", desc: "Saúde, Social, Educação, Infraestrutura e +17 categorias" },
              { icon: "🔒", title: "Segurança e LGPD", desc: "Auditoria completa, controle de permissões e consentimento" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <span className="text-2xl mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{f.title}</p>
                  <p className="text-white/50 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== LADO DIREITO ===== */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-white px-6 py-12 min-h-screen lg:min-h-0">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#003B6F] via-[#0B4F8A] to-[#F07A1A]" />

        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
              <Logo size="md" />
            </div>
          </div>

          <div className="hidden lg:flex justify-center mb-6">
            <Logo size="sm" />
          </div>

          <h2 className="text-center text-3xl font-extrabold text-[#003B6F]" style={{ fontFamily: "'Sora', sans-serif" }}>
            Acesso ao Sistema
          </h2>
          <p className="text-center text-sm text-[#6b7a8f] mt-2 tracking-widest uppercase">
            Entre com suas credenciais
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#003B6F] mb-2">E-mail</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">✉️</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@campanhaviva.com.br" required autoComplete="username"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#F5F8FB] border-2 border-[#E2EAF3] text-[#00264D] placeholder:text-[#9fb0c3] outline-none transition-all focus:border-[#F07A1A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(240,122,26,0.15)]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#003B6F] mb-2">Senha</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔑</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#F5F8FB] border-2 border-[#E2EAF3] text-[#00264D] placeholder:text-[#9fb0c3] outline-none transition-all focus:border-[#F07A1A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(240,122,26,0.15)]" />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white tracking-widest uppercase transition-all disabled:opacity-60 cursor-pointer hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #F07A1A, #FF9A3A)", boxShadow: loading ? "none" : "0 12px 30px rgba(240,122,26,0.4)" }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Entrando...
                </span>
              ) : "Entrar"}
            </button>
          </form>

          <div className="flex items-center gap-4 mt-8 text-[#9fb0c3]">
            <div className="flex-1 h-px bg-[#E2EAF3]" />
            <span className="text-xs uppercase tracking-widest">Acesso hierárquico</span>
            <div className="flex-1 h-px bg-[#E2EAF3]" />
          </div>
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {["Super Admin", "Coordenador", "Liderança"].map((r) => (
              <span key={r} className="text-xs text-[#6b7a8f] border border-[#E2EAF3] px-3 py-1.5 rounded-full">{r}</span>
            ))}
          </div>
        </div>

        <div className="mt-12 lg:absolute lg:bottom-4 lg:left-0 lg:w-full text-center text-xs text-[#8fa1b5] leading-relaxed">
          <p>Desenvolvido por <b className="text-[#003B6F]">Júnior Araújo Sistemas</b></p>
          <p><span className="text-[#F07A1A]">(91) 98212-2175</span> · junior.araujo21@yahoo.com.br</p>
        </div>
      </div>
    </div>
  );
}
