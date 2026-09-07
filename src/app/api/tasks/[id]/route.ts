import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canAccessRow } from "@/lib/scope";
import { audit, ipOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function load(id: number) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, id));
  return t ?? null;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const tid = Number(id);
  const t = await load(tid);
  if (!t) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: t.coordinatorId, createdBy: t.createdBy })) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  const b = (await req.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const k of ["title","description","status","priority","startDate","dueDate"] as const) if (b[k] !== undefined) patch[k] = b[k];
  await db.update(tasks).set(patch).where(eq(tasks.id, tid));
  await audit({ actorId: s.id, actorRole: s.role, action: "task_update", entity: "tasks", entityId: tid, ip: ipOf(req) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const tid = Number(id);
  const t = await load(tid);
  if (!t) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: t.coordinatorId, createdBy: t.createdBy })) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  await db.delete(tasks).where(eq(tasks.id, tid));
  await audit({ actorId: s.id, actorRole: s.role, action: "task_delete", entity: "tasks", entityId: tid, ip: ipOf(req) });
  return NextResponse.json({ ok: true });
}
