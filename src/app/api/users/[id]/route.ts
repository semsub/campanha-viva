import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/api-auth";
import { hashPassword, isSuperAdmin, isAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ensureSetup } from "@/lib/setup";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = getSessionFromRequest(req);
  if (!s || s.role === "leader") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  await ensureSetup();

  const { id } = await ctx.params;
  const uid = Number(id);
  const body = await req.json();

  const [target] = await db.select().from(users).where(eq(users.id, uid));
  if (!target) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  // Coordenador só edita quem ele criou
  if (s.role === "coordinator" && target.managerId !== s.id)
    return NextResponse.json({ error: "Você só pode editar seus subordinados." }, { status: 403 });

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name) data.name = body.name;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.territory !== undefined) data.territory = body.territory;
  if (body.active !== undefined) data.active = body.active;
  if (body.role && isSuperAdmin(s)) data.role = body.role;
  if (body.password && (isSuperAdmin(s) || isAdmin(s) || (s.role === "coordinator" && target.managerId === s.id)))
    data.passwordHash = hashPassword(body.password);

  const [updated] = await db.update(users).set(data).where(eq(users.id, uid))
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active });

  await logAudit({ actorId: s.id, action: body.password ? "password_reset" : "user_updated", entity: "users", entityId: uid, ip: req.headers.get("x-forwarded-for") });
  return NextResponse.json({ user: updated });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = getSessionFromRequest(req);
  if (!s || s.role === "leader") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  await ensureSetup();

  const { id } = await ctx.params;
  const uid = Number(id);
  const [target] = await db.select().from(users).where(eq(users.id, uid));
  if (!target) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  if (s.role === "coordinator" && target.managerId !== s.id)
    return NextResponse.json({ error: "Você só pode remover seus subordinados." }, { status: 403 });

  await db.update(users).set({ active: false, updatedAt: new Date() }).where(eq(users.id, uid));
  await logAudit({ actorId: s.id, action: "user_deactivated", entity: "users", entityId: uid, ip: req.headers.get("x-forwarded-for") });
  return NextResponse.json({ ok: true });
}
