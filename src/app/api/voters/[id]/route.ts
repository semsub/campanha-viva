import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { voters } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canAccessRow } from "@/lib/scope";
import { audit, ipOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function load(id: number) {
  const [v] = await db.select().from(voters).where(eq(voters.id, id));
  return v ?? null;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const vid = Number(id);
  const v = await load(vid);
  if (!v) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: v.coordinatorId, createdBy: v.createdBy, leaderId: v.leaderId })) {
    return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  }
  const b = (await req.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  // Leader agora pode gravar todos os campos (mas só vê nome/telefone depois de salvo)
  for (const k of ["name","phone","voterTitle","zone","section","street","number","neighborhood","city","birthDate","notes"] as const) {
    if (b[k] !== undefined) patch[k] = b[k];
  }
  await db.update(voters).set(patch).where(eq(voters.id, vid));
  await audit({ actorId: s.id, actorRole: s.role, action: "voter_update", entity: "voters", entityId: vid, ip: ipOf(req) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const vid = Number(id);
  const v = await load(vid);
  if (!v) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: v.coordinatorId, createdBy: v.createdBy, leaderId: v.leaderId })) {
    return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  }
  try { await db.delete(voters).where(eq(voters.id, vid)); }
  catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("foreign key")) return NextResponse.json({ error: "Eleitor com demandas vinculadas — apague as demandas antes." }, { status: 409 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  await audit({ actorId: s.id, actorRole: s.role, action: "voter_delete", entity: "voters", entityId: vid, ip: ipOf(req) });
  return NextResponse.json({ ok: true });
}
