import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/api-auth";
import { hashPassword, isSuperAdmin, isAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ensureSetup } from "@/lib/setup";

export async function GET(req: NextRequest) {
  const s = getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await ensureSetup();

  const search = req.nextUrl.searchParams.get("search") ?? "";
  const role = req.nextUrl.searchParams.get("role");

  // Leader não vê lista de usuários
  if (s.role === "leader") return NextResponse.json({ users: [] });

  const conds = [];
  if (search) conds.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))!);
  if (role) conds.push(eq(users.role, role as "coordinator"));

  // super_admin e admin vêem todos
  // coordinator vê apenas seus líderes
  if (s.role === "coordinator") {
    conds.push(eq(users.managerId, s.id));
    conds.push(eq(users.role, "leader"));
  }

  const where = conds.length ? and(...conds) : undefined;
  const rows = await db.select({
    id: users.id, name: users.name, email: users.email, phone: users.phone,
    role: users.role, active: users.active, territory: users.territory,
    managerId: users.managerId, createdAt: users.createdAt,
  }).from(users).where(where).orderBy(desc(users.createdAt));

  return NextResponse.json({ users: rows });
}

export async function POST(req: NextRequest) {
  const s = getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (s.role === "leader") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  await ensureSetup();

  const body = await req.json();
  if (!body.name || !body.email || !body.password)
    return NextResponse.json({ error: "Nome, e-mail e senha obrigatórios." }, { status: 400 });

  /*  QUEM CRIA QUEM:
      super_admin → admin, coordinator, leader
      admin       → coordinator, leader
      coordinator → leader (somente)
      leader      → ninguém                    */
  let role = body.role ?? "leader";
  if (s.role === "coordinator") role = "leader";
  if (role === "super_admin" && !isSuperAdmin(s))
    return NextResponse.json({ error: "Apenas Super Admin cria outro Super Admin." }, { status: 403 });
  if (role === "admin" && !isSuperAdmin(s))
    return NextResponse.json({ error: "Apenas Super Admin cria Administradores." }, { status: 403 });
  if (role === "coordinator" && !isAdmin(s))
    return NextResponse.json({ error: "Apenas Admin ou superior cria Coordenadores." }, { status: 403 });

  try {
    const [created] = await db.insert(users).values({
      name: body.name, email: body.email.toLowerCase().trim(), phone: body.phone,
      passwordHash: hashPassword(body.password), role,
      managerId: s.id, territory: body.territory,
    }).returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    await logAudit({ actorId: s.id, action: "user_created", entity: "users", entityId: created.id, ip: req.headers.get("x-forwarded-for") });
    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("users_email_unique"))
      return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
    throw err;
  }
}
