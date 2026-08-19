import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadTarget(id: number) {
  const [u] = await db.select().from(users).where(eq(users.id, id));
  return u ?? null;
}

function canManageTarget(session: { id: number; role: string }, target: { id: number; coordinatorId: number | null; managerId: number | null; role: string }): boolean {
  if (session.role === "super_admin") return true;
  if (session.role === "coordinator") {
    // Coordenador só gerencia leaders vinculados a ele mesmo
    return target.role === "leader" && target.coordinatorId === session.id;
  }
  return false;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const uid = Number(id);
  const target = await loadTarget(uid);
  if (!target) return NextResponse.json({ error: "usuário não encontrado" }, { status: 404 });
  if (!canManageTarget(s, target)) {
    return NextResponse.json({ error: "sem permissão para editar este usuário" }, { status: 403 });
  }

  const b = (await req.json()) as {
    name?: string; phone?: string; territory?: string;
    role?: "super_admin" | "coordinator" | "leader";
    active?: boolean;
  };
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (b.name !== undefined) patch.name = b.name;
  if (b.phone !== undefined) patch.phone = b.phone;
  if (b.territory !== undefined) patch.territory = b.territory;
  if (b.active !== undefined) patch.active = b.active;
  if (b.role !== undefined) {
    if (s.role !== "super_admin") {
      return NextResponse.json({ error: "somente super_admin pode alterar perfil" }, { status: 403 });
    }
    patch.role = b.role;
  }
  await db.update(users).set(patch).where(eq(users.id, uid));
  await db.insert(auditLogs).values({
    actorId: s.id, userId: uid, action: "user_update", entity: "users", entityId: uid,
    detail: JSON.stringify(patch), ip: req.headers.get("x-forwarded-for"),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const uid = Number(id);
  if (uid === s.id) return NextResponse.json({ error: "não pode excluir a si mesmo" }, { status: 400 });
  const target = await loadTarget(uid);
  if (!target) return NextResponse.json({ error: "usuário não encontrado" }, { status: 404 });
  if (!canManageTarget(s, target)) {
    return NextResponse.json({ error: "sem permissão para excluir este usuário" }, { status: 403 });
  }
  await db.delete(users).where(eq(users.id, uid));
  await db.insert(auditLogs).values({
    actorId: s.id, action: "user_delete", entity: "users", entityId: uid,
    ip: req.headers.get("x-forwarded-for"),
  });
  return NextResponse.json({ ok: true });
}
