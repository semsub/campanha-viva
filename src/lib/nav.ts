import type { Role } from "@/lib/permissions";

export type NavItem = {
  href: string; label: string; icon: string; roles: readonly Role[];
};

// ORDEM FIXA no menu — nunca muda
export const NAV: readonly NavItem[] = [
  { href: "/app",               label: "Dashboard",     icon: "📊", roles: ["super_admin","admin","coordinator","leader"] },
  { href: "/app/coordenadores", label: "Coordenadores", icon: "🏛️", roles: ["super_admin","admin"] },
  { href: "/app/eleitores",     label: "Eleitores",     icon: "🧑‍🤝‍🧑", roles: ["super_admin","admin","coordinator","leader"] },
  { href: "/app/demandas",      label: "Demandas",      icon: "📋", roles: ["super_admin","admin","coordinator","leader"] },
  { href: "/app/tarefas",       label: "Tarefas",       icon: "✅", roles: ["super_admin","admin","coordinator","leader"] },
  { href: "/app/eventos",       label: "Eventos",       icon: "📅", roles: ["super_admin","admin","coordinator","leader"] },
  { href: "/app/usuarios",      label: "Usuários",      icon: "👥", roles: ["super_admin","admin","coordinator"] },
  { href: "/app/auditoria",     label: "Auditoria",     icon: "🛡️", roles: ["super_admin","admin"] },
] as const;

export const menuFor = (role: Role) => NAV.filter((i) => i.roles.includes(role));
