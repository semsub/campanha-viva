import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { getSession, hashPassword } from "@/lib/auth";

// SUPER ADMIN pode alterar a senha de QUALQUER usuário
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const { newPassword } = (await req.json()) as { newPassword?: string };
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json(
      { error: "A nova senha deve ter ao menos 6 caracteres." },
      { status: 400 },
    );
  }

  const [target] = await db.select().from(users).where(eq(users.id, userId));
  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(users.id, userId));

  await db.insert(auditLogs).values({
    userId: target.id,
    actorId: session.id,
    action: "password_reset_by_super_admin",
    entity: "users",
    entityId: target.id,
    oldValue: "***",
    newValue: "***",
    ip: req.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ ok: true, message: `Senha de ${target.name} redefinida.` });
}
