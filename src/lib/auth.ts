import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const SECRET = process.env.SESSION_SECRET ?? "junior-araujo-coordenacao-2026";
const COOKIE = "jac_session";
const TTL_HOURS = 8;

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "coordinator" | "leader";
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

export async function createSession(user: SessionUser) {
  const exp = Date.now() + TTL_HOURS * 3600 * 1000;
  const payload = Buffer.from(JSON.stringify({ ...user, exp })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: TTL_HOURS * 3600,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || sign(payload) !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser & {
      exp: number;
    };
    if (data.exp < Date.now()) return null;
    return { id: data.id, name: data.name, email: data.email, role: data.role, territory: data.territory };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
