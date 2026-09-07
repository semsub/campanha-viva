import { redirect } from "next/navigation";
import { getSession, type SessionUser } from "@/lib/auth";
import type { Role } from "@/lib/permissions";

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireRole(allowed: readonly Role[]): Promise<SessionUser> {
  const s = await requireSession();
  if (!allowed.includes(s.role)) redirect("/app");
  return s;
}
