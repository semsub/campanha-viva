export type Role = "super_admin" | "coordinator" | "leader";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  coordinator: "Coordenador",
  leader: "Liderança",
};

export const ROLE_COLORS: Record<Role, string> = {
  super_admin: "bg-[#003B6F] text-white",
  coordinator: "bg-[#F07A1A] text-white",
  leader: "bg-emerald-600 text-white",
};

export function canManageUsers(role: Role): boolean {
  return role === "super_admin" || role === "coordinator";
}

export function canManageAll(role: Role): boolean {
  return role === "super_admin";
}
