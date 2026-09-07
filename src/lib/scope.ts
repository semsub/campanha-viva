/**
 * REGRAS DE ESCOPO (RBAC + ABAC) — server-side, deny-by-default.
 *
 * super_admin, admin : veem TUDO
 * coordinator        : vê SÓ suas próprias lideranças, eleitores e demandas
 * leader             : vê SÓ o que ele próprio cadastrou
 *
 * `canAccessRow` valida em cada request qual usuário é dono do registro
 * (proteção contra IDOR/BOLA — ignora o ID enviado pelo cliente).
 */
import type { SessionUser } from "@/lib/auth";
import type { SQL } from "drizzle-orm";
import { eq, or, sql } from "drizzle-orm";
import { users, voters, demands, tasks, events } from "@/db/schema";
import { isPlatformStaff } from "@/lib/permissions";

export function coordinatorScopeIdForUser(s: SessionUser): number | null {
  if (s.role === "coordinator") return s.id;
  if (s.role === "leader") return s.coordinatorId ?? null;
  return null;
}

// USERS
export function usersVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") {
    return or(eq(users.id, s.id), eq(users.coordinatorId, s.id)) as SQL;
  }
  return eq(users.id, s.id);
}

// VOTERS
export function votersVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") return eq(voters.coordinatorId, s.id);
  return eq(voters.createdBy, s.id);
}

// DEMANDS
export function demandsVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") return eq(demands.coordinatorId, s.id);
  return eq(demands.createdBy, s.id);
}

// TASKS
export function tasksVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") return eq(tasks.coordinatorId, s.id);
  return eq(tasks.createdBy, s.id);
}

// EVENTS
export function eventsVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") return eq(events.coordinatorId, s.id);
  return eq(events.createdBy, s.id);
}

// Autorização em nível de OBJETO
export function canAccessRow(
  s: SessionUser,
  row: { coordinatorId?: number | null; createdBy?: number | null; leaderId?: number | null },
): boolean {
  if (isPlatformStaff(s.role)) return true;
  if (s.role === "coordinator") return row.coordinatorId === s.id;
  return row.createdBy === s.id || row.leaderId === s.id;
}
