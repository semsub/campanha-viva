/**
 * Guard de página server-side. Se o usuário não tem uma das roles permitidas,
 * redireciona para /app (dashboard) — assim ele NUNCA vê a página.
 * Isso é DEFESA EM PROFUNDIDADE: além do sidebar esconder o link,
 * a URL direta também é bloqueada.
 */
import { redirect } from "next/navigation";
import { getSession, type SessionUser } from "@/lib/auth";
import type { Role } from "@/lib/permissions";

export async function requireRole(allowed: Role[]): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!allowed.includes(s.role)) redirect("/app");
  return s;
}
