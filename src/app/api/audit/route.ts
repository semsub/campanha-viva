import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { eq, desc, and, ilike, or } from "drizzle-orm";
import { getSession, canViewAudit } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!canViewAudit(session.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;
  const entity = searchParams.get("entity");
  const action = searchParams.get("action");

  const conditions = [];
  if (entity) conditions.push(eq(auditLogs.entity, entity));
  if (action) conditions.push(eq(auditLogs.action, action));

  const result = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      userName: users.name,
      action: auditLogs.action,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      previousValue: auditLogs.previousValue,
      newValue: auditLogs.newValue,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ logs: result });
}
