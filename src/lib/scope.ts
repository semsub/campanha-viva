/**
 * SEGURANÇA — Autorização server-side (RBAC + ABAC)
 *
 * Regras piramidais:
 *  - super_admin : vê e gerencia TUDO
 *  - admin       : vê TUDO (menos os próprios super_admin); pode moderar quase tudo
 *  - coordinator : vê SOMENTE suas próprias lideranças, eleitores e demandas
 *  - leader      : vê SOMENTE aquilo que ele mesmo cadastrou
 *
 * REGRA ABSOLUTA (do prompt):
 *  "NUNCA CONFIE NO CLIENTE. AUTENTIQUE O USUÁRIO, DETERMINE O TENANT,
 *   IDENTIFIQUE O RECURSO NO SERVIDOR E VERIFIQUE A AUTORIZAÇÃO PARA
 *   CADA OPERAÇÃO." — deny-by-default.
 */

import type { SessionUser } from "@/lib/auth";
import type { SQL } from "drizzle-orm";
import { eq, or, sql } from "drizzle-orm";
import { users, voters, demands, tasks, events } from "@/db/schema";
import { isPlatformStaff } from "@/lib/permissions";

// coordinatorId a ser vinculado aos NOVOS registros criados por este usuário
export function coordinatorScopeIdForUser(s: SessionUser): number | null {
  if (s.role === "coordinator") return s.id;
  if (s.role === "leader") return s.coordinatorId ?? null;
  return null; // super_admin / admin criam "solto"
}

// Filtros de VISIBILIDADE — devolvem cláusulas SQL para uso em .where()
export function usersVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") {
    return or(eq(users.id, s.id), eq(users.coordinatorId, s.id)) as SQL;
  }
  return eq(users.id, s.id); // leader só vê a si
}

export function votersVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") return eq(voters.coordinatorId, s.id);
  return eq(voters.createdBy, s.id); // leader vê SÓ o que ELE cadastrou
}

export function demandsVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") return eq(demands.coordinatorId, s.id);
  return eq(demands.createdBy, s.id);
}

export function tasksVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") return eq(tasks.coordinatorId, s.id);
  return or(eq(tasks.createdBy, s.id), eq(tasks.assignedTo, s.id)) as SQL;
}

export function eventsVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") return eq(events.coordinatorId, s.id);
  return eq(events.createdBy, s.id);
}

/**
 * canAccessRow — verifica AUTORIZAÇÃO EM NÍVEL DE OBJETO (BOLA/IDOR).
 * Só devolve true quando o usuário DE FATO é dono do registro pela hierarquia.
 */
export function canAccessRow(
  s: SessionUser,
  row: { coordinatorId?: number | null; createdBy?: number | null; leaderId?: number | null; assignedTo?: number | null },
): boolean {
  if (isPlatformStaff(s.role)) return true;
  if (s.role === "coordinator") return row.coordinatorId === s.id;
  // leader
  return row.createdBy === s.id
    || row.leaderId === s.id
    || row.assignedTo === s.id;
}
