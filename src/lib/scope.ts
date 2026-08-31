import type { SessionUser } from "@/lib/auth";
import type { SQL } from "drizzle-orm";
import { eq, or, sql } from "drizzle-orm";
import { users, voters, demands } from "@/db/schema";
import { isPlatformStaff } from "@/lib/permissions";

/**
 * Regras piramidais (4 níveis):
 *
 * SUPER_ADMIN — vê e gerencia TUDO (inclui outros super_admin)
 * ADMIN       — vê TUDO e gerencia todos exceto outros super_admin
 * COORDINATOR — vê SOMENTE suas próprias lideranças, eleitores e demandas
 * LEADER      — vê SOMENTE seus próprios eleitores e demandas
 */

// coordinator_id a ser vinculado aos NOVOS registros criados por este usuário
export function coordinatorScopeIdForUser(s: SessionUser): number | null {
  if (s.role === "coordinator") return s.id;
  if (s.role === "leader") return s.coordinatorId ?? null;
  return null; // super_admin e admin não têm escopo — criam "solto"
}

export function usersVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`; // super_admin e admin veem todos
  if (s.role === "coordinator") {
    return or(eq(users.id, s.id), eq(users.coordinatorId, s.id)) as SQL;
  }
  return eq(users.id, s.id); // leader
}

export function votersVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") return eq(voters.coordinatorId, s.id);
  return eq(voters.leaderId, s.id);
}

export function demandsVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") return eq(demands.coordinatorId, s.id);
  return eq(demands.createdBy, s.id);
}

// Pode acessar/editar um registro cujo dono é (coordinatorId, createdBy, leaderId)?
export function canAccessRow(
  s: SessionUser,
  row: { coordinatorId?: number | null; createdBy?: number | null; leaderId?: number | null },
): boolean {
  if (isPlatformStaff(s.role)) return true;
  if (s.role === "coordinator") return row.coordinatorId === s.id;
  return row.leaderId === s.id || row.createdBy === s.id;
}
