import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-key-change-in-production-2024"
);

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
  campaignId: number | null;
  parentUserId: number | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload as unknown as { user: SessionUser }).user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function canManageCoordinators(role: string): boolean {
  return ["super_admin", "admin"].includes(role);
}

export function canManageLeaderships(role: string): boolean {
  return ["super_admin", "admin", "coordenador_geral", "coordenador_regional", "coordenador_municipal"].includes(role);
}

export function canManageVoters(role: string): boolean {
  return ["super_admin", "admin", "coordenador_geral", "coordenador_regional", "coordenador_municipal", "lideranca", "mobilizador"].includes(role);
}

export function canManageDemands(role: string): boolean {
  return ["super_admin", "admin", "coordenador_geral", "coordenador_regional", "coordenador_municipal", "lideranca", "atendente"].includes(role);
}

export function canViewAudit(role: string): boolean {
  return ["super_admin", "admin", "auditor"].includes(role);
}

export function canExportData(role: string): boolean {
  return ["super_admin", "admin", "coordenador_geral"].includes(role);
}

export function isCoordinator(role: string): boolean {
  return ["coordenador_geral", "coordenador_regional", "coordenador_municipal"].includes(role);
}

export function isAdmin(role: string): boolean {
  return ["super_admin", "admin"].includes(role);
}
