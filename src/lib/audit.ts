import { db } from "@/db";
import { auditLogs } from "@/db/schema";

interface LogAuditParams {
  userId?: number | null;
  actorId?: number | null;
  action: string;
  entity?: string | null;
  entityId?: number | null;
  detail?: string | null;
  ip?: string | null;
}

export async function logAudit(params: LogAuditParams) {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId || params.actorId || null,
      actorId: params.actorId || params.userId || null,
      action: params.action,
      entity: params.entity || null,
      entityId: params.entityId || null,
      detail: params.detail || null,
      ip: params.ip || null,
    });
  } catch (error) {
    console.error("Erro ao registrar log de auditoria:", error);
  }
}
