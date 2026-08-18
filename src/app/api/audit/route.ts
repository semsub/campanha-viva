import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { getSession } from "@/lib/auth";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  if (s.role !== "super_admin") return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  const rows = await db
    .select({
      id: auditLogs.id, action: auditLogs.action,
      entity: auditLogs.entity, entityId: auditLogs.entityId,
      detail: auditLogs.detail, ip: auditLogs.ip,
      createdAt: auditLogs.createdAt,
      actorId: auditLogs.actorId, actorName: users.name, actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .where(sql`TRUE`)
    .orderBy(desc(auditLogs.createdAt))
    .limit(300);
  return NextResponse.json({ logs: rows });
}
