import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  if (s.role !== "super_admin" && s.role !== "admin") return NextResponse.json({ error: "sem permissão" }, { status: 403 });

  const url = new URL(req.url);
  const coordinatorFilter = url.searchParams.get("coordinatorId");
  const q = url.searchParams.get("q")?.trim();

  const rows = await db
    .select({
      id: auditLogs.id, action: auditLogs.action,
      entity: auditLogs.entity, entityId: auditLogs.entityId,
      detail: auditLogs.detail, ip: auditLogs.ip,
      createdAt: auditLogs.createdAt,
      actorId: auditLogs.actorId, actorName: users.name, actorEmail: users.email,
      actorRole: users.role, actorCoordinatorId: users.coordinatorId,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .where(sql`TRUE`)
    .orderBy(desc(auditLogs.createdAt))
    .limit(1000);

  let filtered = rows;
  if (coordinatorFilter) {
    const cid = Number(coordinatorFilter);
    // Ações executadas pelo próprio coord (actorId=cid) OU por leaders vinculados (actorCoordinatorId=cid)
    filtered = filtered.filter((r) => r.actorId === cid || r.actorCoordinatorId === cid);
  }
  if (q) {
    const s = q.toLowerCase();
    filtered = filtered.filter((r) =>
      (r.action ?? "").toLowerCase().includes(s) ||
      (r.entity ?? "").toLowerCase().includes(s) ||
      (r.detail ?? "").toLowerCase().includes(s) ||
      (r.actorName ?? "").toLowerCase().includes(s) ||
      (r.actorEmail ?? "").toLowerCase().includes(s),
    );
  }
  return NextResponse.json({ logs: filtered });
}
