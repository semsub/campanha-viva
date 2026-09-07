/**
 * REGRAS DE ESCOPO (RBAC + ABAC) — server-side, deny-by-default.
 *
 * super_admin, admin : veem TUDO
 * coordinator        : vê suas lideranças, seus eleitores E TODAS AS DEMANDAS
 *                      criadas por ele ou por suas lideranças
 * leader             : vê SÓ seus eleitores; vê suas próprias demandas E as
 *                      TAREFAS/EVENTOS do coordenador dele
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
// - coord vê tudo do seu escopo (demandas dele e das lideranças subordinadas)
//   → como toda demanda criada por leader recebe coordinator_id = coord do leader,
//     basta filtrar por coordinator_id
// - leader vê SÓ as demandas que ele próprio criou
export function demandsVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") return eq(demands.coordinatorId, s.id);
  return eq(demands.createdBy, s.id);
}

// TASKS
// - coord vê tudo do seu escopo
// - leader vê as próprias E também as do coordenador dele (herança de cima)
export function tasksVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") return eq(tasks.coordinatorId, s.id);
  // leader: própria + as do coord dele
  if (s.coordinatorId) {
    return or(eq(tasks.createdBy, s.id), eq(tasks.coordinatorId, s.coordinatorId)) as SQL;
  }
  return eq(tasks.createdBy, s.id);
}

// EVENTS
// - coord vê tudo do seu escopo
// - leader vê os próprios E também os do coordenador dele
export function eventsVisibilityFilter(s: SessionUser): SQL {
  if (isPlatformStaff(s.role)) return sql`TRUE`;
  if (s.role === "coordinator") return eq(events.coordinatorId, s.id);
  if (s.coordinatorId) {
    return or(eq(events.createdBy, s.id), eq(events.coordinatorId, s.coordinatorId)) as SQL;
  }
  return eq(events.createdBy, s.id);
}

// Autorização em nível de OBJETO (IDOR/BOLA) — LEITURA.
// leader também LÊ registros do coord dele (tarefas/eventos delegados de cima).
export function canAccessRow(
  s: SessionUser,
  row: { coordinatorId?: number | null; createdBy?: number | null; leaderId?: number | null },
): boolean {
  if (isPlatformStaff(s.role)) return true;
  if (s.role === "coordinator") return row.coordinatorId === s.id;
  if (row.createdBy === s.id || row.leaderId === s.id) return true;
  if (s.coordinatorId && row.coordinatorId === s.coordinatorId) return true;
  return false;
}

// Autorização em nível de OBJETO — ESCRITA (edita/exclui).
// Aqui NÃO permite herança de cima: leader só edita/exclui o que ele mesmo criou.
// Assim, tarefas/eventos do coord permanecem intocáveis pela liderança.
export function canWriteRow(
  s: SessionUser,
  row: { coordinatorId?: number | null; createdBy?: number | null; leaderId?: number | null },
): boolean {
  if (isPlatformStaff(s.role)) return true;
  if (s.role === "coordinator") return row.coordinatorId === s.id;
  // leader: só o que ele criou
  return row.createdBy === s.id || row.leaderId === s.id;
}
