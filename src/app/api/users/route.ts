import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { canCreateRole, Role } from "@/lib/permissions";
import bcrypt from "bcrypt";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const roleFilter = searchParams.get("role");

  const allUsers = await db.select().from(users);
  
  let filtered = allUsers;
  if (search) {
    filtered = filtered.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  }
  if (roleFilter) {
    filtered = filtered.filter(u => u.role === roleFilter);
  }

  return NextResponse.json({ users: filtered });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const b = await req.json();
  if (!b.name || !b.email) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 });
  }

  const role = b.role ?? "leader";
  if (!canCreateRole(s.role as Role, role as Role)) {
    return NextResponse.json(
      { error: `Sem permissão: seu perfil (${s.role}) não pode criar ${role}.` },
      { status: 403 },
    );
  }

  const [existing] = await db.select().from(users).where(eq(users.email, b.email));
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 400 });
  }

  const tempPassword = b.password || Math.random().toString(36).slice(-8);
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const [created] = await db.insert(users).values({
    name: b.name,
    email: b.email,
    passwordHash,
    role: role,
    campaignId: b.campaignId || s.campaignId,
    coordinatorId: b.coordinatorId || (s.role === "coordinator" ? s.id : null),
    leaderId: b.leaderId || (s.role === "leader" ? s.id : null),
    territory: b.territory,
    phone: b.phone,
    document: b.document,
    city: b.city,
    active: true,
  }).returning();

  return NextResponse.json({ success: true, user: created, tempPassword });
}
