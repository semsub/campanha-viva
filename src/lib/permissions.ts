// Perfis do sistema (hierarquia piramidal)
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

// "Staff" = super_admin e admin veem tudo (RBAC)
export function isPlatformStaff(role: Role): boolean {
  return role === "super_admin" || role === "admin";
}

export function canCreateRole(actor: Role, target: Role): boolean {
  if (actor === "super_admin") return true;
  if (actor === "admin") return target !== "super_admin";
  if (actor === "coordinator") return target === "leader";
  return false;
}

export function canManageTarget(
  actor: { id: number; role: Role },
  target: { id: number; role: Role; coordinatorId: number | null },
): boolean {
  if (actor.role === "super_admin") return true;
  if (actor.role === "admin") return target.role !== "super_admin";
  if (actor.role === "coordinator") {
    return target.role === "leader" && target.coordinatorId === actor.id;
  }
  return false;
}

export function canResetPassword(actor: Role, target: Role): boolean {
  if (actor === "super_admin") return true;
  if (actor === "admin") return target !== "super_admin";
  return false;
}

// Restrição de campos sensíveis para leader
// Leader NÃO vê: voter_title, zone, section
export const LEADER_HIDDEN_FIELDS = ["voterTitle", "zone", "section"] as const;
export type SensitiveField = typeof LEADER_HIDDEN_FIELDS[number];

export function canSeeVoterSensitive(role: Role): boolean {
  return role !== "leader";
}
