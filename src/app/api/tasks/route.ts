import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { coordinatorScopeIdForUser, tasksVisibilityFilter } from "@/lib/scope";
import { audit, ipOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const rows = await db
    .select({
      id: tasks.id, title: tasks.title, description: tasks.description,
      status: tasks.status, priority: tasks.priority,
      startDate: tasks.startDate, dueDate: tasks.dueDate,
      assignedTo: tasks.assignedTo, assignedName: users.name,
      createdBy: tasks.createdBy, coordinatorId: tasks.coordinatorId,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assignedTo, users.id))
    .where(tasksVisibilityFilter(s))
    .orderBy(desc(tasks.createdAt))
    .limit(500);
  return NextResponse.json({ tasks: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const b = (await req.json()) as {
    title?: string; description?: string;
    startDate?: string; dueDate?: string;
    priority?: "baixa"|"media"|"alta"|"urgente"; assignedTo?: number;
  };
  if (!b.title) return NextResponse.json({ error: "título obrigatório" }, { status: 400 });
  const [row] = await db.insert(tasks).values({
    title: b.title.trim(),
    description: b.description ?? null,
    priority: b.priority ?? "media",
    startDate: b.startDate ?? null,
    dueDate: b.dueDate ?? null,
    assignedTo: b.assignedTo ?? null,
    coordinatorId: coordinatorScopeIdForUser(s),
    createdBy: s.id,
  }).returning({ id: tasks.id });
  await audit({ actorId: s.id, actorRole: s.role, action: "task_create", entity: "tasks", entityId: row.id, detail: `Tarefa: ${b.title}`, ip: ipOf(req) });
  return NextResponse.json({ ok: true, id: row.id });
}
