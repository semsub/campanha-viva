import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { Role } from "@/lib/permissions";

// Utilitário central de auditoria — nunca registra senha/token
export async function audit(params: {
  actorId?: number | null;
  actorRole?: Role | null;
  action: string;
  entity?: string;
  entityId?: number | null;
  detail?: string;
  ip?: string | null;
  userAgent?: string | null;
  success?: boolean;
}) {
  try {
    await db.insert(auditLogs).values({
      actorId: params.actorId ?? null,
      actorRole: params.actorRole ?? null,
      action: params.action,
      entity: params.entity ?? null,
      entityId: params.entityId ?? null,
      detail: params.detail ?? null,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
      success: params.success ?? true,
    });
  } catch {
    // Não pode quebrar o fluxo principal se auditoria falhar
  }
}

export function ipOf(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

export function uaOf(req: Request): string {
  return req.headers.get("user-agent") ?? "unknown";
}
