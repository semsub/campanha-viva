import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { canResetPassword } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Super Admin pode redefinir a senha de QUALQUER usuário.
// Admin pode redefinir a senha de qualquer um EXCETO outro super_admin.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const [target] = await db.select().from(users).where(eq(users.id, userId));
  if (!target) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  if (!canResetPassword(session.role, target.role)) {
    return NextResponse.json({ error: "Sem permissão para redefinir esta senha." }, { status: 403 });
  }

  const { newPassword } = (await req.json()) as { newPassword?: string };
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "A nova senha deve ter ao menos 6 caracteres." }, { status: 400 });
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(users.id, userId));

  await db.insert(auditLogs).values({
    userId: target.id,
    actorId: session.id,
    action: "password_reset",
    entity: "users",
    entityId: target.id,
    detail: `${session.role} ${session.email} redefiniu senha de ${target.email} (${target.role})`,
    ip: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ ok: true, message: `Senha de ${target.name} redefinida.` });
}
