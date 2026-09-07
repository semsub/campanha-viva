import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canAccessRow } from "@/lib/scope";
import { audit, ipOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadEvent(id: number) {
  const [e] = await db.select().from(events).where(eq(events.id, id));
  return e ?? null;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const eid = Number(id);
  const e = await loadEvent(eid);
  if (!e) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: e.coordinatorId, createdBy: e.createdBy })) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  const b = (await req.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const k of ["title","description","location","latitude","longitude","eventDate","status"] as const) if (b[k] !== undefined) patch[k] = b[k];
  await db.update(events).set(patch).where(eq(events.id, eid));
  await audit({ actorId: s.id, actorRole: s.role, action: "event_update", entity: "events", entityId: eid, ip: ipOf(req) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const eid = Number(id);
  const e = await loadEvent(eid);
  if (!e) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: e.coordinatorId, createdBy: e.createdBy })) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  await db.delete(events).where(eq(events.id, eid));
  await audit({ actorId: s.id, actorRole: s.role, action: "event_delete", entity: "events", entityId: eid, ip: ipOf(req) });
  return NextResponse.json({ ok: true });
}
