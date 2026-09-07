import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { Role } from "@/lib/permissions";

export async function audit(params: {
  actorId?: number | null;
  actorRole?: Role | null;
  action: string;
  entity?: string;
  entityId?: number | null;
  detail?: string;
  ip?: string | null;
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
      success: params.success ?? true,
    });
  } catch { /* auditoria não pode quebrar fluxo */ }
}

export const ipOf = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  ?? req.headers.get("x-real-ip")
  ?? "unknown";
