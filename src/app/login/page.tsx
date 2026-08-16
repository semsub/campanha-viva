"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao fazer login");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-blue" />
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(232,117,26,0.08) 0%, transparent 60%),
                          radial-gradient(ellipse at 80% 20%, rgba(44,143,217,0.1) 0%, transparent 50%),
                          radial-gradient(ellipse at 60% 80%, rgba(232,117,26,0.05) 0%, transparent 40%)`
      }} />
      {/* Decorative shapes */}
      <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-brand-orange/5 blur-3xl" />
      <div className="absolute bottom-[-150px] left-[-80px] w-[400px] h-[400px] rounded-full bg-brand-blue-accent/10 blur-3xl" />
      <div className="absolute top-1/4 left-1/3 w-2 h-2 rounded-full bg-brand-orange/40 animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-brand-orange-light/30 animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-1/3 left-1/4 w-1 h-1 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between flex-1 relative z-10 p-12">
        <div>
          <Logo variant="text" size="xl" className="items-start mb-8" />
          <h1 className="text-white text-3xl font-bold leading-tight mt-8">
            Plataforma de gestão territorial de campanha
          </h1>
          <p className="text-blue-200/60 text-base mt-4 max-w-md leading-relaxed">
            Sistema completo com controle hierárquico, demandas, atendimentos e inteligência territorial.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><span className="text-lg">️</span></div>
            <div>
              <p className="text-white text-sm font-semibold">Gestão Hierárquica</p>
              <p className="text-blue-300/50 text-xs">Super Admin → Coordenador → Liderança → Eleitor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><span className="text-lg">📋</span></div>
            <div>
              <p className="text-white text-sm font-semibold">Demandas Inteligentes</p>
              <p className="text-blue-300/50 text-xs">Saúde, Social, Educação, Infraestrutura e +17 categorias</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><span className="text-lg">🔒</span></div>
            <div>
              <p className="text-white text-sm font-semibold">Segurança e LGPD</p>
              <p className="text-blue-300/50 text-xs">Auditoria completa, controle de permissões e consentimento</p>
            </div>
          </div>
        </div>

        <div className="text-blue-300/30 text-xs">
          campanhaviva.com.br
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Logo variant="full" size="lg" />
          </div>

          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/20 p-8 lg:p-10 border border-white/50">
            <div className="text-center mb-8">
              <div className="hidden lg:block mb-6">
                <Logo variant="full" size="lg" />
              </div>
              <h2 className="text-2xl font-bold text-brand-blue" style={{ fontFamily: "'Playfair Display', serif" }}>
                Acesso ao Sistema
              </h2>
              <p className="text-gray-400 text-sm mt-1">Entre com suas credenciais</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-brand-blue/70 uppercase tracking-wider mb-2">E-mail</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-blue/70 uppercase tracking-wider mb-2">Senha</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔑</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3.5 flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide
                  bg-gradient-to-r from-brand-orange to-brand-orange-light
                  hover:shadow-xl hover:shadow-brand-orange/30 hover:scale-[1.02]
                  active:scale-[0.98] transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : "Entrar"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-blue-200/30 text-[11px] flex items-center justify-center gap-1">
              🔒 Sistema protegido por autenticação e auditoria
            </p>
            <div className="text-blue-200/20 text-[10px] space-y-0.5">
              <p>Desenvolvido por</p>
              <p className="font-semibold text-blue-200/40">Júnior Araújo Sistemas</p>
              <p>(91) 98212-2175 | junior.araujo21@yahoo.com.br</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
