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

  // FORÇAR: Se o role for 'coordinator', ele NUNCA será admin.
  // Isso protege contra qualquer dado vindo errado do servidor.
  const isActuallyAdmin = user.role === "super_admin";

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
          <Link href="/app" className="menu-link">📊 Dashboard</Link>
          
          {/* Aba Coordenadores: Apenas para ADMINS */}
          {isActuallyAdmin && (
            <Link href="/app/coordenadores" className="menu-link">👥 Coordenadores</Link>
          )}

          <Link href="/app/eleitores" className="menu-link">🗳️ Eleitores</Link>
          <Link href="/app/demandas" className="menu-link">📋 Demandas</Link>
          <Link href="/app/tarefas" className="menu-link">✅ Tarefas</Link>
          <Link href="/app/eventos" className="menu-link">📅 Eventos</Link>
          <Link href="/app/usuarios" className="menu-link">👥 Usuários</Link>

          {/* Aba Auditoria: Apenas para ADMINS */}
          {isActuallyAdmin && (
            <Link href="/app/auditoria" className="menu-link">🛡️ Auditoria</Link>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{user.role}</p>
        <a href="/api/auth/logout" className="mt-3 block w-full bg-red-600/80 text-white text-center text-xs py-2 rounded-lg">🚪 Sair</a>
      </div>
    </aside>
  );
}
