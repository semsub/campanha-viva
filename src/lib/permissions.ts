export type Role = "super_admin" | "admin" | "coordinator" | "leader";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  coordinator: "Coordenador",
  leader: "Liderança",
};

export const ROLE_COLORS: Record<Role, string> = {
  super_admin: "bg-[#003B6F] text-white",
  admin: "bg-[#0B4F8A] text-white",
  coordinator: "bg-[#F07A1A] text-white",
  leader: "bg-emerald-600 text-white",
};

// Descrição sintética de cada perfil (usada em telas)
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Gestor máximo. Acesso irrestrito a tudo, auditoria e configurações globais.",
  admin: "Assistente do Super. Gerencia coordenadores/lideranças, monitora dashboards e modera.",
  coordinator: "Responsável por uma região. Gerencia suas lideranças e seus eleitores.",
  leader: "Ponta de contato com o eleitor. Cadastra eleitores e abre demandas.",
};

// Nível hierárquico numérico (para comparações rápidas: quanto MAIOR, mais poder)
export const ROLE_LEVEL: Record<Role, number> = {
  super_admin: 4,
  admin: 3,
  coordinator: 2,
  leader: 1,
};

// ============ Regras de gestão ============

export function isPlatformStaff(role: Role): boolean {
  // "Staff da plataforma" = pode ver tudo (super_admin e admin)
  return role === "super_admin" || role === "admin";
}

export function canManageUsers(role: Role): boolean {
  return role === "super_admin" || role === "admin" || role === "coordinator";
}

export function canAccessAudit(role: Role): boolean {
  return role === "super_admin" || role === "admin";
}

// Quem pode criar quem
export function canCreateRole(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === "super_admin") return true; // super cria qualquer coisa
  if (actorRole === "admin") {
    // admin cria admin, coordenador e liderança (mas NÃO super_admin)
    return targetRole !== "super_admin";
  }
  if (actorRole === "coordinator") return targetRole === "leader";
  return false;
}

// Quem pode editar/apagar um usuário-alvo
export function canManageTarget(
  actor: { id: number; role: Role },
  target: { id: number; role: Role; coordinatorId: number | null },
): boolean {
  if (actor.role === "super_admin") return true;
  if (actor.role === "admin") {
    // admin gerencia todos EXCETO outros super_admin
    return target.role !== "super_admin";
  }
  if (actor.role === "coordinator") {
    // coord só mexe nos leaders vinculados a ele
    return target.role === "leader" && target.coordinatorId === actor.id;
  }
  return false;
}

// Quem pode alterar a SENHA de outro usuário
export function canResetPassword(actor: Role, target: Role): boolean {
  if (actor === "super_admin") return true;
  if (actor === "admin") return target !== "super_admin";
  return false;
}
