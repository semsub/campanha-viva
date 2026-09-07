import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { isPlatformStaff } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  if (!isPlatformStaff(s.role)) return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  const rows = await db.select({
    id: auditLogs.id, action: auditLogs.action, entity: auditLogs.entity, entityId: auditLogs.entityId,
    detail: auditLogs.detail, ip: auditLogs.ip, success: auditLogs.success, createdAt: auditLogs.createdAt,
    actorName: users.name, actorEmail: users.email, actorRole: users.role,
  })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(500);
  return NextResponse.json({ logs: rows });
}
