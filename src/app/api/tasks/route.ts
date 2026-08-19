import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tasks, users, auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { coordinatorScopeIdForUser } from "@/lib/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const where = s.role === "super_admin"
    ? sql`TRUE`
    : s.role === "coordinator"
      ? eq(tasks.coordinatorId, s.id)
      : eq(tasks.createdBy, s.id);
  const rows = await db
    .select({
      id: tasks.id, title: tasks.title, description: tasks.description,
      status: tasks.status, dueDate: tasks.dueDate,
      assignedTo: tasks.assignedTo, assignedName: users.name,
      createdBy: tasks.createdBy, coordinatorId: tasks.coordinatorId,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assignedTo, users.id))
    .where(where)
    .orderBy(desc(tasks.createdAt))
    .limit(500);
  return NextResponse.json({ tasks: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const b = (await req.json()) as {
    title?: string; description?: string; dueDate?: string; assignedTo?: number;
  };
  if (!b.title) return NextResponse.json({ error: "título obrigatório" }, { status: 400 });
  const [row] = await db.insert(tasks).values({
    title: b.title.trim(),
    description: b.description ?? null,
    dueDate: b.dueDate ?? null,
    assignedTo: b.assignedTo ?? null,
    coordinatorId: coordinatorScopeIdForUser(s),
    createdBy: s.id,
  }).returning({ id: tasks.id });
  await db.insert(auditLogs).values({
    actorId: s.id, action: "task_create", entity: "tasks", entityId: row.id,
    detail: `Nova tarefa: ${b.title}`, ip: req.headers.get("x-forwarded-for"),
  });
  return NextResponse.json({ ok: true, id: row.id });
}
