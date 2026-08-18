import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks, auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const b = (await req.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const k of ["title","description","status","dueDate","assignedTo"] as const) {
    if (b[k] !== undefined) patch[k] = b[k];
  }
  await db.update(tasks).set(patch).where(eq(tasks.id, Number(id)));
  await db.insert(auditLogs).values({
    actorId: s.id, action: "task_update", entity: "tasks", entityId: Number(id),
    detail: JSON.stringify(patch),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  await db.delete(tasks).where(eq(tasks.id, Number(id)));
  await db.insert(auditLogs).values({
    actorId: s.id, action: "task_delete", entity: "tasks", entityId: Number(id),
  });
  return NextResponse.json({ ok: true });
}
