import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { Role } from "@/lib/permissions";

export type { Role };

// SESSION_SECRET estável entre restarts (derivado do DATABASE_URL se não definido)
const SECRET =
  process.env.SESSION_SECRET ??
  (process.env.DATABASE_URL
    ? crypto.createHash("sha256").update(process.env.DATABASE_URL).digest("hex")
    : "fallback-secret-set-SESSION_SECRET-in-production");

const COOKIE_NAME = "cv_session";
const TTL_HOURS = 8;

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  coordinatorId: number | null; // p/ leader: coord dono; p/ coordinator: o próprio id; senão null
};

const sign = (payload: string) =>
  crypto.createHmac("sha256", SECRET).update(payload).digest("hex");

export const hashPassword = (plain: string) => bcrypt.hashSync(plain, 12);
export const verifyPassword = (plain: string, hash: string) => {
  try { return bcrypt.compareSync(plain, hash); } catch { return false; }
};

export async function createSession(u: SessionUser) {
  const exp = Date.now() + TTL_HOURS * 3600 * 1000;
  const payload = Buffer.from(JSON.stringify({ ...u, exp })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: TTL_HOURS * 3600,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const i = token.lastIndexOf(".");
    if (i < 0) return null;
    const payload = token.slice(0, i);
    const sig = token.slice(i + 1);
    if (sign(payload) !== sig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser & { exp: number };
    if (data.exp < Date.now()) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      coordinatorId: data.coordinatorId ?? null,
    };
  } catch { return null; }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
