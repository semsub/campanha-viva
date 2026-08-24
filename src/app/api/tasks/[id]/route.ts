import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const s = await getSession();
    if (!s) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = Number(id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const patch: any = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.status !== undefined) patch.status = body.status;
    if (body.priority !== undefined) patch.priority = body.priority;
    if (body.dueDate !== undefined) patch.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    patch.updatedAt = new Date();

    await db.update(tasks).set(patch).where(eq(tasks.id, taskId));

    await db.insert(auditLogs).values({
      userId: s.id,
      action: "task_update",
      entity: "tasks",
      entityId: taskId,
      newValue: JSON.stringify(patch),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
