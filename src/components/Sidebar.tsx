"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  // Trava rigorosa: Apenas super_admin visualiza abas administrativas.
  // Se o email for o do coordenador ou a role for diferente de super_admin, ele nunca verá.
  const isAdmin = user.role === "super_admin" && user.email === "admin@campanhaviva.com.br";

  return (
    <aside className="w-64 bg-brand-blue text-white flex flex-col h-screen justify-between shadow-lg">
      <div>
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="bg-brand-orange text-white p-2 rounded-lg font-bold text-lg">CV</div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Campanha Viva</h1>
            <p className="text-xs text-brand-orange-light">Coordenação</p>
          </div>
        </div>

        <nav className="p-4 space-y-1.5">
          <Link
            href="/app"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/app" ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"
            }`}
          >
            📊 Dashboard
          </Link>

          {isAdmin && (
            <Link
              href="/app/coordenadores"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname.includes("/coordenadores") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"
              }`}
            >
              👥 Coordenadores
            </Link>
          )}

          <Link
            href="/app/eleitores"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname.includes("/eleitores") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"
            }`}
          >
            🗳️ Eleitores
          </Link>

          <Link
            href="/app/demandas"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname.includes("/demandas") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"
            }`}
          >
            📋 Demandas
          </Link>

          <Link
            href="/app/tarefas"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname.includes("/tarefas") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"
            }`}
          >
            ✅ Tarefas
          </Link>

          <Link
            href="/app/eventos"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname.includes("/eventos") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"
            }`}
          >
            📅 Eventos
          </Link>

          <Link
            href="/app/usuarios"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname.includes("/usuarios") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"
            }`}
          >
            👥 Usuários
          </Link>

          {isAdmin && (
            <Link
              href="/app/auditoria"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                pathname.includes("/auditoria") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"
              }`}
            >
              🛡️ Auditoria
            </Link>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="mb-2">
          <p className="font-semibold text-sm truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
          <p className="text-[10px] text-brand-orange-light uppercase tracking-widest mt-1 font-bold">{user.role}</p>
        </div>
        <a
          href="/api/auth/logout"
          className="w-full bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          🚪 Sair
        </a>
      </div>
    </aside>
  );
}
