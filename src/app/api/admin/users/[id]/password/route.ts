import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { canResetPassword } from "@/lib/permissions";
import { audit, ipOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const uid = Number(id);
  if (!Number.isInteger(uid)) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const [target] = await db.select().from(users).where(eq(users.id, uid));
  if (!target) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canResetPassword(s.role, target.role)) {
    await audit({ actorId: s.id, actorRole: s.role, action: "password_reset_denied", entity: "users", entityId: uid, ip: ipOf(req), success: false });
    return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  }
  const { newPassword } = (await req.json()) as { newPassword?: string };
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "A senha deve ter ao menos 6 caracteres." }, { status: 400 });
  }
  await db.update(users).set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() }).where(eq(users.id, uid));
  await audit({ actorId: s.id, actorRole: s.role, action: "password_reset", entity: "users", entityId: uid, detail: `Redefiniu senha de ${target.email}`, ip: ipOf(req) });
  return NextResponse.json({ ok: true, message: `Senha de ${target.name} redefinida.` });
}
