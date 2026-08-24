export interface SessionUser {
  id: number;
  role: string;
  coordinatorId?: number | null;
  [key: string]: any;
}

export function coordinatorScopeIdForUser(s: SessionUser): number | null {
  if (s.role === "coordinator") return s.id;
  if (s.role === "leader") return s.coordinatorId ?? null;
  return null; // super_admin não tem escopo
}
