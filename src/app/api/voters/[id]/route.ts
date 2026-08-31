import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { voters, auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canAccessRow } from "@/lib/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadVoter(id: number) {
  const [v] = await db.select().from(voters).where(eq(voters.id, id));
  return v ?? null;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const vid = Number(id);
  const v = await loadVoter(vid);
  if (!v) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: v.coordinatorId, createdBy: v.createdBy, leaderId: v.leaderId })) {
    return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  }
  const b = (await req.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of [
    "name","phone","voterTitle","zone","section",
    "street","number","neighborhood","city",
    "birthDate","notes"
  ] as const) {
    if (b[k] !== undefined) patch[k] = b[k];
  }
  await db.update(voters).set(patch).where(eq(voters.id, vid));
  await db.insert(auditLogs).values({
    actorId: s.id, action: "voter_update", entity: "voters", entityId: vid,
    ip: req.headers.get("x-forwarded-for"),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const vid = Number(id);
  const v = await loadVoter(vid);
  if (!v) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: v.coordinatorId, createdBy: v.createdBy, leaderId: v.leaderId })) {
    return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  }
  await db.delete(voters).where(eq(voters.id, vid));
  await db.insert(auditLogs).values({
    actorId: s.id, action: "voter_delete", entity: "voters", entityId: vid,
    ip: req.headers.get("x-forwarded-for"),
  });
  return NextResponse.json({ ok: true });
}
