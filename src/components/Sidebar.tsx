"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", roles: ["all"] },
  { href: "/dashboard/coordenadores", label: "Coordenadores", icon: "", roles: ["super_admin", "admin"] },
  { href: "/dashboard/liderancas", label: "Lideranças", icon: "", roles: ["super_admin", "admin", "coordenador_geral", "coordenador_regional", "coordenador_municipal"] },
  { href: "/dashboard/eleitores", label: "Eleitores", icon: "👥", roles: ["all"] },
  { href: "/dashboard/demandas", label: "Demandas", icon: "📋", roles: ["all"] },
  { href: "/dashboard/tarefas", label: "Tarefas", icon: "✅", roles: ["all"] },
  { href: "/dashboard/eventos", label: "Eventos", icon: "📅", roles: ["all"] },
  { href: "/dashboard/categorias", label: "Categorias", icon: "🏷️", roles: ["super_admin", "admin"] },
  { href: "/dashboard/territorial", label: "Territorial", icon: "🗺️", roles: ["super_admin", "admin", "coordenador_geral", "coordenador_regional", "coordenador_municipal"] },
  { href: "/dashboard/usuarios", label: "Usuários", icon: "⚙️", roles: ["super_admin", "admin"] },
  { href: "/dashboard/auditoria", label: "Auditoria", icon: "🔍", roles: ["super_admin", "admin", "auditor"] },
];

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  const filteredItems = menuItems.filter(
    (item) => item.roles.includes("all") || item.roles.includes(user.role)
  );

  return (
    <aside className="w-[280px] gradient-blue flex flex-col flex-shrink-0 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-brand-orange/5 blur-2xl" />
      <div className="absolute bottom-20 left-0 w-24 h-24 rounded-full bg-brand-blue-accent/10 blur-2xl" />

      {/* Logo */}
      <div className="p-5 border-b border-white/10 relative z-10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Logo variant="icon" size="sm" />
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-sm leading-tight truncate">Júnior Araújo</h1>
            <p className="text-brand-orange-light text-[10px] font-semibold tracking-widest uppercase">Coordenação</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 relative z-10">
        <p className="px-4 py-2 text-[10px] font-bold text-blue-300/30 uppercase tracking-widest">Menu</p>
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "sidebar-link-active" : "sidebar-link"}
            >
              <span className="text-base w-6 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/10 relative z-10">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
          <div className="w-9 h-9 rounded-xl gradient-orange flex items-center justify-center text-white text-xs font-bold shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user.name}</p>
            <p className="text-brand-orange-light/60 text-[10px] font-medium truncate uppercase tracking-wider">
              {user.role.replace(/_/g, " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Developer credit */}
      <div className="px-4 pb-3 relative z-10">
        <div className="text-center text-[9px] text-blue-300/20 leading-relaxed">
          <p>campanhaviva.com.br</p>
        </div>
      </div>
    </aside>
  );
}
