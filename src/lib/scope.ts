import type { SessionUser } from "@/lib/auth";
import type { SQL } from "drizzle-orm";
import { eq, or, sql } from "drizzle-orm";
import { users, voters, demands } from "@/db/schema";

/**
 * Regras piramidais:
 *
 * SUPER_ADMIN
 *   - vê e gerencia TUDO (todos coordenadores, lideranças, eleitores, demandas)
 *   - único que pode criar coordenadores
 *
 * COORDINATOR
 *   - vê SOMENTE suas próprias lideranças, eleitores e demandas
 *   - cria/edita/remove SOMENTE aquilo criado por ele mesmo (ou por lideranças suas)
 *
 * LEADER
 *   - vê SOMENTE seus próprios eleitores e demandas
 *   - cria eleitores e demandas (que são atribuídos ao coordenador dele)
 *   - NÃO pode ver dados de outras lideranças, mesmo do mesmo coordenador
 */

// Retorna o "coordinator_id" que deve ser associado a novos registros
// criados por este usuário.
export function coordinatorScopeIdForUser(s: SessionUser): number | null {
  if (s.role === "coordinator") return s.id;
  if (s.role === "leader") return s.coordinatorId ?? null;
  return null; // super_admin não tem escopo
}

// Filtro SQL para USERS visíveis por este usuário.
export function usersVisibilityFilter(s: SessionUser): SQL {
  if (s.role === "super_admin") return sql`TRUE`;
  if (s.role === "coordinator") {
    // Só vê suas próprias lideranças (leaders vinculados a este coord)
    return or(eq(users.id, s.id), eq(users.coordinatorId, s.id)) as SQL;
  }
  // leader só vê a si mesmo
  return eq(users.id, s.id);
}

// Filtro SQL para VOTERS visíveis
export function votersVisibilityFilter(s: SessionUser): SQL {
  if (s.role === "super_admin") return sql`TRUE`;
  if (s.role === "coordinator") return eq(voters.coordinatorId, s.id);
  // leader: só os que ele cadastrou
  return eq(voters.leaderId, s.id);
}

// Filtro SQL para DEMANDS visíveis
export function demandsVisibilityFilter(s: SessionUser): SQL {
  if (s.role === "super_admin") return sql`TRUE`;
  if (s.role === "coordinator") return eq(demands.coordinatorId, s.id);
  // leader: demandas que ele criou
  return eq(demands.createdBy, s.id);
}

// Verifica se o usuário `s` pode acessar/editar um registro cujo dono é (coordinatorId, createdBy, leaderId).
export function canAccessRow(
  s: SessionUser,
  row: { coordinatorId?: number | null; createdBy?: number | null; leaderId?: number | null },
): boolean {
  if (s.role === "super_admin") return true;
  if (s.role === "coordinator") return row.coordinatorId === s.id;
  // leader
  return row.leaderId === s.id || row.createdBy === s.id;
}

// Permissões de gestão de usuários
export function canCreateRole(
  actor: SessionUser,
  targetRole: "super_admin" | "coordinator" | "leader",
): boolean {
  if (actor.role === "super_admin") return true; // super cria qualquer perfil
  if (actor.role === "coordinator" && targetRole === "leader") return true; // coord cria líder
  return false;
}
