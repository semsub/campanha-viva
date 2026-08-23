import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const SECRET = process.env.SESSION_SECRET ?? "junior-araujo-coordenacao-2026";
export const COOKIE_NAME = "jac_session";
const TTL_HOURS = 12;

export type UserRole = "super_admin" | "admin" | "coordinator" | "leader";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  territory: string | null;
};

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 12);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function createToken(user: SessionUser): string {
  const exp = Date.now() + TTL_HOURS * 3600 * 1000;
  const payload = Buffer.from(JSON.stringify({ ...user, exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string): SessionUser | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig || sign(payload) !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser & { exp: number };
    if (data.exp < Date.now()) return null;
    return { id: data.id, name: data.name, email: data.email, role: data.role, territory: data.territory };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    store.delete(COOKIE_NAME);
  } catch { /* ok */ }
}

/* ============================================
   HIERARQUIA DE PERMISSÕES
   super_admin > admin > coordinator > leader
   ============================================ */

/** Super Admin — acesso total irrestrito */
export function isSuperAdmin(s: SessionUser | null) { return s?.role === "super_admin"; }

/** Admin ou superior — gestão operacional ampla */
export function isAdmin(s: SessionUser | null) { return s?.role === "super_admin" || s?.role === "admin"; }

/** Coordenador ou superior */
export function isCoordinator(s: SessionUser | null) { return isAdmin(s) || s?.role === "coordinator"; }

/** Líder ou superior */
export function isLeader(s: SessionUser | null) { return isCoordinator(s) || s?.role === "leader"; }

/** Pode gerenciar usuários: super_admin, admin, coordinator */
export function canManageUsers(s: SessionUser | null) { return isCoordinator(s); }

/** Pode cadastrar eleitores: todos exceto quem não está logado */
export function canManageVoters(s: SessionUser | null) { return s !== null; }

/** Pode criar/gerenciar demandas: todos logados */
export function canManageDemands(s: SessionUser | null) { return s !== null; }
