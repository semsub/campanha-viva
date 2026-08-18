import { NextRequest, NextResponse } from "next/server";
import { desc, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      territory: users.territory,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(q ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)) : sql`TRUE`)
    .orderBy(desc(users.createdAt));
  return NextResponse.json({ users: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  if (!canManageUsers(s.role)) {
    return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  }
  const b = (await req.json()) as {
    name?: string; email?: string; phone?: string;
    password?: string; role?: "super_admin" | "coordinator" | "leader";
    territory?: string;
  };
  if (!b.name || !b.email || !b.password) {
    return NextResponse.json({ error: "nome, email e senha são obrigatórios" }, { status: 400 });
  }
  if (b.password.length < 6) {
    return NextResponse.json({ error: "a senha deve ter ao menos 6 caracteres" }, { status: 400 });
  }
  // Somente super_admin pode criar outro super_admin
  const role = b.role ?? "leader";
  if (role === "super_admin" && s.role !== "super_admin") {
    return NextResponse.json({ error: "somente super_admin pode criar outro super_admin" }, { status: 403 });
  }
  try {
    const [row] = await db
      .insert(users)
      .values({
        name: b.name.trim(),
        email: b.email.toLowerCase().trim(),
        phone: b.phone ?? null,
        passwordHash: hashPassword(b.password),
        role,
        territory: b.territory ?? null,
        managerId: s.id,
      })
      .returning({ id: users.id });
    await db.insert(auditLogs).values({
      actorId: s.id,
      userId: row.id,
      action: "user_create",
      entity: "users",
      entityId: row.id,
      detail: `Criou usuário ${b.email} (${role})`,
      ip: req.headers.get("x-forwarded-for"),
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("users_email_unique")) {
      return NextResponse.json({ error: "email já cadastrado" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
