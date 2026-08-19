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

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    coordinator: "Coordenador",
    coordenador_regional: "Coordenador Regional",
    leader: "Liderança",
  };

  // Verifica se o usuário tem permissão de administrador total
  const isAdmin = user.role === "super_admin";

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
          <Link href="/app" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === "/app" ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"}`}>
            📊 Dashboard
          </Link>

          {/* Oculta aba Coordenadores se não for admin */}
          {isAdmin && (
            <Link href="/app/coordenadores" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname.includes("/coordenadores") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"}`}>
              👥 Coordenadores
            </Link>
          )}

          <Link href="/app/eleitores" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname.includes("/eleitores") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"}`}>
            🗳️ Eleitores
          </Link>

          <Link href="/app/demandas" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname.includes("/demandas") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"}`}>
            📋 Demandas
          </Link>

          <Link href="/app/tarefas" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname.includes("/tarefas") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"}`}>
            ✅ Tarefas
          </Link>

          <Link href="/app/eventos" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname.includes("/eventos") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"}`}>
            📅 Eventos
          </Link>

          <Link href="/app/usuarios" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname.includes("/usuarios") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"}`}>
            👥 Usuários
          </Link>

          {/* Oculta aba Auditoria se não for admin */}
          {isAdmin && (
            <Link href="/app/auditoria" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname.includes("/auditoria") ? "bg-brand-orange text-white" : "text-gray-300 hover:bg-white/5"}`}>
              🛡️ Auditoria
            </Link>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="mb-3">
          <p className="font-semibold text-sm truncate">{user.name}</p>
          <span className="inline-block mt-1 text-[10px] bg-brand-orange/20 text-brand-orange-light px-2 py-0.5 rounded uppercase font-bold tracking-wider">
            {roleLabels[user.role] || user.role}
          </span>
        </div>
        <a href="/api/auth/logout" className="w-full bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
          🚪 Sair
        </a>
      </div>
    </aside>
  );
}
