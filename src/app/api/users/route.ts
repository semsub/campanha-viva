import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, sql, ilike, or } from "drizzle-orm";
import { getSession, hashPassword, isAdmin, canManageCoordinators } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const search = searchParams.get("search");
  const parentId = searchParams.get("parentId");

  const conditions = [];
  if (session.campaignId) {
    conditions.push(eq(users.campaignId, session.campaignId));
  }
  if (role) {
    conditions.push(sql`${users.role} = ${role}`);
  }
  if (parentId) {
    conditions.push(eq(users.parentUserId, parseInt(parentId)));
  }
  if (search) {
    conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)));
  }

  // Non-admins can only see their subordinates
  if (!isAdmin(session.role)) {
    conditions.push(eq(users.parentUserId, session.id));
  }

  const result = await db
    .select({
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
    })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(users.name);

  return NextResponse.json({ users: result });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, email, password, role, phone } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Campos obrigatórios: nome, email, senha, perfil" }, { status: 400 });
  }

  // Permission check
  const coordinatorRoles = ["coordenador_geral", "coordenador_regional", "coordenador_municipal"];
  if (coordinatorRoles.includes(role) && !canManageCoordinators(session.role)) {
    return NextResponse.json({ error: "Sem permissão para criar coordenadores" }, { status: 403 });
  }

  // Check duplicate email
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db.insert(users).values({
    name,
    email,
    passwordHash,
    role,
    phone: phone || null,
    campaignId: session.campaignId,
    parentUserId: session.id,
    active: true,
  }).returning();

  await logAudit({
    userId: session.id,
    action: "create",
    entity: "users",
    entityId: newUser.id,
    newValue: { name, email, role },
  });

  return NextResponse.json({ user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } }, { status: 201 });
}
