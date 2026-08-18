import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { getSession, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const targetId = parseInt(params.id, 10);
  if (isNaN(targetId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // Buscar usuário alvo
  const [targetUser] = await db.select().from(users).where(eq(users.id, targetId));
  if (!targetUser) return NextResponse.json({ error: "usuário não encontrado" }, { status: 404 });

  // Regra: Coordenador não pode modificar um super_admin sob hipótese alguma
  if (targetUser.role === "super_admin" && s.role !== "super_admin") {
    return NextResponse.json({ error: "você não tem permissão para modificar um super administrador" }, { status: 403 });
  }

  // Verificar se o usuário logado tem permissão geral de gerenciamento
  if (s.role !== "super_admin" && s.role !== "coordinator" && s.role !== "coordenador_regional") {
    return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  }

  const b = (await req.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: "super_admin" | "coordinator" | "coordenador_regional" | "leader" | "lideranca";
    territory?: string;
    active?: boolean;
  };

  // Impedir que não-superadmins promovam alguém a super_admin
  if (b.role === "super_admin" && s.role !== "super_admin") {
    return NextResponse.json({ error: "apenas super_admin pode definir papéis de super_admin" }, { status: 403 });
  }

  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (b.name !== undefined) updateData.name = b.name.trim();
  if (b.email !== undefined) updateData.email = b.email.toLowerCase().trim();
  if (b.phone !== undefined) updateData.phone = b.phone;
  if (b.territory !== undefined) updateData.territory = b.territory;
  if (b.active !== undefined) updateData.active = b.active;
  if (b.role !== undefined) updateData.role = b.role;
  if (b.password && b.password.length >= 6) {
    updateData.passwordHash = hashPassword(b.password);
  }

  try {
    await db.update(users).set(updateData).where(eq(users.id, targetId));

    await db.insert(auditLogs).values({
      actorId: s.id,
      userId: targetId,
      action: "user_update",
      entity: "users",
      entityId: targetId,
      detail: `Atualizou dados do usuário ID ${targetId}`,
      ip: req.headers.get("x-forwarded-for"),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  // REGRA CRÍCITICA: APENAS O SUPER_ADMIN PODE REMOVER USUÁRIOS
  if (s.role !== "super_admin") {
    return NextResponse.json({ error: "apenas o super_admin pode remover usuários do sistema" }, { status: 403 });
  }

  const targetId = parseInt(params.id, 10);
  if (isNaN(targetId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // Impedir que o super_admin delete a si mesmo por engano
  if (targetId === s.id) {
    return NextResponse.json({ error: "você não pode remover sua própria conta de super_admin" }, { status: 400 });
  }

  const [targetUser] = await db.select().from(users).where(eq(users.id, targetId));
  if (!targetUser) return NextResponse.json({ error: "usuário não encontrado" }, { status: 404 });

  try {
    // Remover fisicamente ou desativar em cascata
    await db.delete(users).where(eq(users.id, targetId));

    await db.insert(auditLogs).values({
      actorId: s.id,
      userId: targetId,
      action: "user_delete",
      entity: "users",
      entityId: targetId,
      detail: `Removeu permanentemente o usuário ${targetUser.email}`,
      ip: req.headers.get("x-forwarded-for"),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
