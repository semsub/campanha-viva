import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function logAudit(params: {
  userId: number | null;
  action: string;
  entity?: string;
  entityId?: number;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  await db.insert(auditLogs).values({
    userId: params.userId,
    action: params.action,
    entity: params.entity || null,
    entityId: params.entityId || null,
    previousValue: params.previousValue ? params.previousValue : null,
    newValue: params.newValue ? params.newValue : null,
    ipAddress: params.ipAddress || null,
    userAgent: params.userAgent || null,
  });
}
