import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "segredo_super_secreto_padrao";
export const COOKIE_NAME = "auth_token";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "ADMIN" || user?.role === "admin";
}

export function verifyPassword(password: string, hash: string): boolean {
  return password === hash;
}
