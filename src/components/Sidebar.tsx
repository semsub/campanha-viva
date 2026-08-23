"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const ALL_NAV = [
  { href: "/dashboard", icon: "📊", label: "Painel", roles: ["super_admin","admin","coordinator","leader"] },
  { href: "/dashboard/eleitores", icon: "👥", label: "Eleitores", roles: ["super_admin","admin","coordinator","leader"] },
  { href: "/dashboard/demandas", icon: "📋", label: "Demandas", roles: ["super_admin","admin","coordinator","leader"] },
  { href: "/dashboard/usuarios", icon: "🛡️", label: "Usuários", roles: ["super_admin","admin","coordinator"] },
  { href: "/dashboard/territorio", icon: "🗺️", label: "Território", roles: ["super_admin","admin"] },
  { href: "/dashboard/tarefas", icon: "✅", label: "Tarefas", roles: ["super_admin","admin","coordinator","leader"] },
  { href: "/dashboard/eventos", icon: "📅", label: "Eventos", roles: ["super_admin","admin","coordinator","leader"] },
  { href: "/dashboard/auditoria", icon: "🔍", label: "Auditoria", roles: ["super_admin"] },
];

const roleLabel: Record<string,string> = { super_admin: "Super Admin", admin: "Administrador", coordinator: "Coordenador", leader: "Liderança" };

export function Sidebar({ user }: { user: { name: string; email: string; role: string } }) {
  const pathname = usePathname();
  const nav = ALL_NAV.filter(n => n.roles.includes(user.role));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[#E2EAF3] bg-white shadow-lg">
      <div className="flex flex-col items-center gap-1 border-b border-[#E2EAF3] px-4 py-5">
        <Logo size="sm" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map(n => {
          const active = n.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${active
                ? "bg-gradient-to-r from-[#003B6F] to-[#0B5FAA] text-white shadow-md"
                : "text-[#5B6E85] hover:bg-[#F5F8FB] hover:text-[#003B6F]"}`}>
              <span className="text-lg">{n.icon}</span>{n.label}
            </Link>
          );
        })}
      </nav>

      {/* Hierarquia */}
      <div className="border-t border-[#E2EAF3] px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b7a8f] mb-2">Hierarquia</p>
        <div className="text-[10px] text-[#5B6E85] space-y-0.5">
          <p className={user.role === "super_admin" ? "font-bold text-[#F07A1A]" : ""}>🔺 Super Admin</p>
          <p className={`ml-3 ${user.role === "admin" ? "font-bold text-[#F07A1A]" : ""}`}>├─ Administrador</p>
          <p className={`ml-6 ${user.role === "coordinator" ? "font-bold text-[#F07A1A]" : ""}`}>├─ Coordenador</p>
          <p className={`ml-9 ${user.role === "leader" ? "font-bold text-[#F07A1A]" : ""}`}>├─ Liderança</p>
          <p className="ml-12">└─ Eleitores</p>
        </div>
      </div>

      {/* User info */}
      <div className="border-t border-[#E2EAF3] px-4 py-4">
        <p className="text-sm font-bold text-[#003B6F] truncate">{user.name}</p>
        <p className="text-xs text-[#6b7a8f] truncate">{user.email}</p>
        <span className="mt-1 inline-block rounded-full bg-[#F07A1A]/10 px-2 py-0.5 text-[10px] font-bold text-[#F07A1A] uppercase tracking-wider">
          {roleLabel[user.role] ?? user.role}
        </span>
        <button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
          🚪 Sair
        </button>
      </div>

      <div className="border-t border-[#E2EAF3] px-4 py-2 text-center">
        <p className="text-[10px] text-[#8fa1b5]">Júnior Araújo Sistemas</p>
        <p className="text-[10px] text-[#F07A1A]">(91) 98212-2175</p>
      </div>
    </aside>
  );
}
