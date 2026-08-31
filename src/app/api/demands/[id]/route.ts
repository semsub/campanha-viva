import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { demands, auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canAccessRow } from "@/lib/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadDemand(id: number) {
  const [d] = await db.select().from(demands).where(eq(demands.id, id));
  return d ?? null;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const did = Number(id);
  const d = await loadDemand(did);
  if (!d) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: d.coordinatorId, createdBy: d.createdBy })) {
    return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  }

  const b = (await req.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["title","description","category","status","priority"] as const) {
    if (b[k] !== undefined) patch[k] = b[k];
  }
  await db.update(demands).set(patch).where(eq(demands.id, did));
  await db.insert(auditLogs).values({
    actorId: s.id, action: "demand_update", entity: "demands", entityId: did,
    detail: JSON.stringify(patch), ip: req.headers.get("x-forwarded-for"),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const did = Number(id);
  const d = await loadDemand(did);
  if (!d) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: d.coordinatorId, createdBy: d.createdBy })) {
    return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  }
  await db.delete(demands).where(eq(demands.id, did));
  await db.insert(auditLogs).values({
    actorId: s.id, action: "demand_delete", entity: "demands", entityId: did,
    ip: req.headers.get("x-forwarded-for"),
  });
  return NextResponse.json({ ok: true });
}
