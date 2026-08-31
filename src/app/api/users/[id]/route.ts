import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { canManageTarget, Role } from "@/lib/permissions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const resolvedParams = await params;
  const userId = parseInt(resolvedParams.id);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const [target] = await db.select().from(users).where(eq(users.id, userId));
  if (!target) {
    return NextResponse.json({ error: "usuário não encontrado" }, { status: 404 });
  }

  if (!canManageTarget(
    { id: session.id, role: session.role as Role },
    { id: target.id, role: target.role as Role, coordinatorId: target.coordinatorId },
  )) {
    return NextResponse.json({ error: "sem permissão para editar este usuário" }, { status: 403 });
  }

  const body = await req.json();
  const [updated] = await db.update(users)
    .set({
      name: body.name ?? target.name,
      email: body.email ?? target.email,
      role: body.role ?? target.role,
      active: body.active ?? target.active,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return NextResponse.json({ success: true, user: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const resolvedParams = await params;
  const userId = parseInt(resolvedParams.id);
  if (isNaN(userId)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const [target] = await db.select().from(users).where(eq(users.id, userId));
  if (!target) {
    return NextResponse.json({ error: "usuário não encontrado" }, { status: 404 });
  }

  if (!canManageTarget(
    { id: session.id, role: session.role as Role },
    { id: target.id, role: target.role as Role, coordinatorId: target.coordinatorId },
  )) {
    return NextResponse.json({ error: "sem permissão para excluir este usuário" }, { status: 403 });
  }

  await db.delete(users).where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
