import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { voters } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canAccessRow } from "@/lib/scope";
import { audit, ipOf } from "@/lib/audit";
import { canSeeVoterSensitive } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadVoter(id: number) {
  const [v] = await db.select().from(voters).where(eq(voters.id, id));
  return v ?? null;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const vid = Number(id);
  if (!Number.isInteger(vid)) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const v = await loadVoter(vid);
  if (!v) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: v.coordinatorId, createdBy: v.createdBy, leaderId: v.leaderId })) {
    // Genérico 404 (não revela existência)
    await audit({ actorId: s.id, actorRole: s.role, action: "voter_read_denied", entity: "voters", entityId: vid, ip: ipOf(req), success: false });
    return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  }
  const canSee = canSeeVoterSensitive(s.role);
  return NextResponse.json({
    voter: canSee ? v : { ...v, voterTitle: null, zone: null, section: null },
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const vid = Number(id);
  if (!Number.isInteger(vid)) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const v = await loadVoter(vid);
  if (!v) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: v.coordinatorId, createdBy: v.createdBy, leaderId: v.leaderId })) {
    await audit({ actorId: s.id, actorRole: s.role, action: "voter_update_denied", entity: "voters", entityId: vid, ip: ipOf(req), success: false });
    return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  }
  const b = (await req.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  const editable = ["name","phone","street","number","neighborhood","city","uf","birthDate","notes"] as const;
  const sensitive = ["voterTitle","zone","section"] as const;
  for (const k of editable) if (b[k] !== undefined) patch[k] = b[k];
  // Leader NÃO pode alterar campos sensíveis
  if (s.role !== "leader") {
    for (const k of sensitive) if (b[k] !== undefined) patch[k] = b[k];
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
  if (!Number.isInteger(vid)) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const v = await loadVoter(vid);
  if (!v) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: v.coordinatorId, createdBy: v.createdBy, leaderId: v.leaderId })) {
    await audit({ actorId: s.id, actorRole: s.role, action: "voter_delete_denied", entity: "voters", entityId: vid, ip: ipOf(req), success: false });
    return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  }
  await db.delete(voters).where(eq(voters.id, vid));
  await audit({ actorId: s.id, actorRole: s.role, action: "voter_delete", entity: "voters", entityId: vid, ip: ipOf(req) });
  return NextResponse.json({ ok: true });
}
