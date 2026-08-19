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

  // Forçar a restrição baseada na role do usuário
  // Se for 'coordinator', ele NUNCA deve ver admin/auditoria
  const isSuperAdmin = user.role === "super_admin";

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
          <Link href="/app" className={`menu-link ${pathname === "/app" ? "active" : ""}`}>📊 Dashboard</Link>
          
          {isSuperAdmin && (
            <Link href="/app/coordenadores" className={`menu-link ${pathname.includes("/coordenadores") ? "active" : ""}`}>👥 Coordenadores</Link>
          )}

          <Link href="/app/eleitores" className={`menu-link ${pathname.includes("/eleitores") ? "active" : ""}`}>🗳️ Eleitores</Link>
          <Link href="/app/demandas" className={`menu-link ${pathname.includes("/demandas") ? "active" : ""}`}>📋 Demandas</Link>
          <Link href="/app/tarefas" className={`menu-link ${pathname.includes("/tarefas") ? "active" : ""}`}>✅ Tarefas</Link>
          <Link href="/app/eventos" className={`menu-link ${pathname.includes("/eventos") ? "active" : ""}`}>📅 Eventos</Link>
          <Link href="/app/usuarios" className={`menu-link ${pathname.includes("/usuarios") ? "active" : ""}`}>👥 Usuários</Link>

          {isSuperAdmin && (
            <Link href="/app/auditoria" className={`menu-link ${pathname.includes("/auditoria") ? "active" : ""}`}>🛡️ Auditoria</Link>
          )}
        </nav>
      </div>
      {/* ... rodapé ... */}
    </aside>
  );
}
