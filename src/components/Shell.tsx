"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/lib/permissions";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";

type Me = { id: number; name: string; email: string; role: Role };

// Apenas as abas permitidas no escopo geral ou filtradas rigorosamente
const NAV = [
  { href: "/app", label: "Dashboard", icon: "📊" },
  { href: "/app/eleitores", label: "Eleitores", icon: "🧑🤝🧑" },
  { href: "/app/demandas", label: "Demandas", icon: "📋" },
  { href: "/app/tarefas", label: "Tarefas", icon: "✅" },
  { href: "/app/eventos", label: "Eventos", icon: "📅" },
  { href: "/app/usuarios", label: "Usuários", icon: "👥", roles: ["super_admin", "coordinator"] as Role[] },
  { href: "/app/coordenadores", label: "Coordenadores", icon: "🏛️", roles: ["super_admin"] as Role[] },
  { href: "/app/auditoria", label: "Auditoria", icon: "🛡️", roles: ["super_admin"] as Role[] },
];

export default function Shell({ user, children }: { user: Me; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMobile, setOpenMobile] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const items = NAV.filter((i) => !i.roles || i.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-[#003B6F] via-[#00264D] to-[#001A33] text-white sticky top-0 h-screen">
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" className="w-11 h-11 rounded-xl bg-white p-1" />
          <div>
            <div className="font-extrabold leading-tight">Júnior Araújo</div>
            <div className="text-[10px] tracking-widest text-[#F07A1A] font-bold uppercase">Coordenação</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((i) => {
            const active = pathname === i.href || (i.href !== "/app" && pathname.startsWith(i.href));
            return (
              <Link key={i.href} href={i.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active ? "bg-[#F07A1A] text-white shadow-lg" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}>
                <span className="text-base">{i.icon}</span>
                <span>{i.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#F07A1A] flex items-center justify-center font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{user.name}</div>
              <div className="text-white/50 truncate">{user.email}</div>
            </div>
          </div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${ROLE_COLORS[user.role]}`}>
            {ROLE_LABELS[user.role]}
          </span>
          <button onClick={logout}
            className="mt-3 w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition">
            Sair
          </button>
        </div>
      </aside>

      {/* Topbar mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#003B6F] text-white px-4 h-14 flex items-center justify-between shadow">
        <button onClick={() => setOpenMobile(!openMobile)} className="text-2xl" aria-label="menu">☰</button>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" className="w-8 h-8 rounded bg-white p-0.5" />
          <span className="font-bold text-sm">Júnior Araújo</span>
        </div>
        <button onClick={logout} className="text-xs">Sair</button>
      </div>

      {openMobile && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setOpenMobile(false)}>
          <div className="w-64 h-full bg-gradient-to-b from-[#003B6F] to-[#00264D] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 pb-3 border-b border-white/10 text-white">
              <div className="font-bold">{user.name}</div>
              <div className="text-xs text-white/50">{user.email}</div>
            </div>
            {items.map((i) => (
              <Link key={i.href} href={i.href} onClick={() => setOpenMobile(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/80 hover:bg-white/10">
                <span>{i.icon}</span> {i.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 mt-14 md:mt-0 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
