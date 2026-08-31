import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { Role } from "@/lib/permissions";

const JWT_SECRET = process.env.JWT_SECRET || "segredo_super_secreto_padrao";
export const COOKIE_NAME = "auth_token";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  campaignId?: number | null;
  coordinatorId?: number | null;
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export function createSession(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { maxAge: 0 });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "admin" || user?.role === "super_admin";
}

export function verifyPassword(password: string, hash: string): boolean {
  return password === hash;
}

export function hashPassword(password: string): string {
  return password;
}
