import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function logAudit(params: {
  userId?: number | null;
  actorId?: number | null;
  action: string;
  entity?: string;
  entityId?: number;
  oldValue?: string;
  newValue?: string;
  ip?: string | null;
}) {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId ?? undefined,
      actorId: params.actorId ?? undefined,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      oldValue: params.oldValue,
      newValue: params.newValue,
      ip: params.ip ?? undefined,
    });
  } catch (err) {
    console.error("[AUDIT] Falha ao registrar log:", err);
  }
}
