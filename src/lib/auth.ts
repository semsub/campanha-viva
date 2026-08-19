import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// Se SESSION_SECRET não for definido, usa um valor derivado do DATABASE_URL
// (permanece estável entre restarts enquanto o banco for o mesmo)
const SECRET =
  process.env.SESSION_SECRET ??
  (process.env.DATABASE_URL
    ? crypto.createHash("sha256").update(process.env.DATABASE_URL).digest("hex")
    : "junior-araujo-coordenacao-secret-2026-static-fallback");

const COOKIE = "jac_session";
const TTL_HOURS = 8;

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "coordinator" | "leader";
  territory: string | null;
  coordinatorId: number | null; // para leader: id do coord dono; para coord: o próprio id
};

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 12);
}

export function verifyPassword(plain: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

export async function createSession(user: SessionUser) {
  const exp = Date.now() + TTL_HOURS * 3600 * 1000;
  const payload = Buffer.from(JSON.stringify({ ...user, exp })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: TTL_HOURS * 3600,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;
    const idx = token.lastIndexOf(".");
    if (idx < 0) return null;
    const payload = token.slice(0, idx);
    const sig = token.slice(idx + 1);
    if (!payload || !sig || sign(payload) !== sig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser & {
      exp: number;
    };
    if (data.exp < Date.now()) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      territory: data.territory,
      coordinatorId: data.coordinatorId ?? null,
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
