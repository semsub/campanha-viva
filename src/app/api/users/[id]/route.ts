import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, isAdmin, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const userId = parseInt(id);

  const [user] = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    phone: users.phone,
    active: users.active,
    campaignId: users.campaignId,
    parentUserId: users.parentUserId,
    createdAt: users.createdAt,
    lastLoginAt: users.lastLoginAt,
  }).from(users).where(eq(users.id, userId)).limit(1);

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const userId = parseInt(id);
  const body = await request.json();

  const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!existing) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  // Permission: admin can edit anyone, others can only edit subordinates
  if (!isAdmin(session.role) && existing.parentUserId !== session.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.active !== undefined) updateData.active = body.active;
  if (body.role !== undefined && isAdmin(session.role)) updateData.role = body.role;

  // Super Admin can change password of any user
  if (body.newPassword && isAdmin(session.role)) {
    const newHash = await hashPassword(body.newPassword);
    updateData.passwordHash = newHash;
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));

  await logAudit({
    userId: session.id,
    action: "update",
    entity: "users",
    entityId: userId,
    previousValue: { name: existing.name, active: existing.active, role: existing.role },
    newValue: { ...updateData, passwordHash: body.newPassword ? "[ALTERADA]" : undefined },
  });

  return NextResponse.json({ success: true });
}
