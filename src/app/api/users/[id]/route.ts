import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canManageTarget } from "@/lib/permissions";
import { audit, ipOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadTarget(id: number) {
  const [u] = await db.select().from(users).where(eq(users.id, id));
  return u ?? null;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const uid = Number(id);
  if (!Number.isInteger(uid)) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const t = await loadTarget(uid);
  if (!t) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canManageTarget({ id: s.id, role: s.role }, { id: t.id, role: t.role, coordinatorId: t.coordinatorId })) {
    await audit({ actorId: s.id, actorRole: s.role, action: "user_update_denied", entity: "users", entityId: uid, ip: ipOf(req), success: false });
    return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  }
  const b = (await req.json()) as { name?: string; phone?: string; active?: boolean; role?: "super_admin"|"admin"|"coordinator"|"leader" };
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (b.name !== undefined) patch.name = b.name;
  if (b.phone !== undefined) patch.phone = b.phone;
  if (b.active !== undefined) patch.active = b.active;
  if (b.role !== undefined) {
    if (b.role === "super_admin" && s.role !== "super_admin") return NextResponse.json({ error: "somente super_admin promove a super_admin" }, { status: 403 });
    if (s.role !== "super_admin" && s.role !== "admin") return NextResponse.json({ error: "sem permissão" }, { status: 403 });
    patch.role = b.role;
  }
  await db.update(users).set(patch).where(eq(users.id, uid));
  await audit({ actorId: s.id, actorRole: s.role, action: "user_update", entity: "users", entityId: uid, ip: ipOf(req) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const uid = Number(id);
  if (uid === s.id) return NextResponse.json({ error: "não pode excluir a si mesmo" }, { status: 400 });
  const t = await loadTarget(uid);
  if (!t) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canManageTarget({ id: s.id, role: s.role }, { id: t.id, role: t.role, coordinatorId: t.coordinatorId })) {
    await audit({ actorId: s.id, actorRole: s.role, action: "user_delete_denied", entity: "users", entityId: uid, ip: ipOf(req), success: false });
    return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  }
  try {
    await db.delete(users).where(eq(users.id, uid));
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const cause = (e as { cause?: { code?: string; detail?: string } })?.cause;
    // Postgres codes: 23503 = foreign_key_violation
    const isFk = cause?.code === "23503" || raw.includes("foreign key") || raw.includes("violates");
    if (isFk) {
      return NextResponse.json({
        error: "Não pode excluir: usuário possui eleitores, demandas, tarefas ou eventos vinculados. Desative-o em vez de excluir, ou apague os registros vinculados antes."
      }, { status: 409 });
    }
    return NextResponse.json({ error: `Erro ao excluir: ${raw}` }, { status: 500 });
  }
  await audit({ actorId: s.id, actorRole: s.role, action: "user_delete", entity: "users", entityId: uid, ip: ipOf(req) });
  return NextResponse.json({ ok: true });
}
