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

// Super e admin veem TUDO
export const isPlatformStaff = (r: Role) => r === "super_admin" || r === "admin";

// Quem pode criar quem
export function canCreateRole(actor: Role, target: Role): boolean {
  if (actor === "super_admin") return true;
  if (actor === "admin") return target !== "super_admin";
  if (actor === "coordinator") return target === "leader";
  return false;
}

// Quem pode editar/apagar um usuário-alvo
export function canManageTarget(
  actor: { id: number; role: Role },
  target: { id: number; role: Role; coordinatorId: number | null },
): boolean {
  if (actor.id === target.id) return false; // ninguém mexe em si mesmo aqui (só via /me)
  if (actor.role === "super_admin") return true;
  if (actor.role === "admin") return target.role !== "super_admin";
  if (actor.role === "coordinator")
    return target.role === "leader" && target.coordinatorId === actor.id;
  return false;
}

// Reset de senha: super pode em qualquer um; admin em todos menos super
export function canResetPassword(actor: Role, target: Role): boolean {
  if (actor === "super_admin") return true;
  if (actor === "admin") return target !== "super_admin";
  return false;
}

// Leader NÃO enxerga estes campos de voter
export const LEADER_HIDDEN_FIELDS = ["voterTitle", "zone", "section"] as const;
export const canSeeVoterSensitive = (r: Role) => r !== "leader";
