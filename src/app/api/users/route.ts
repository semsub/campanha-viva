import { NextRequest, NextResponse } from "next/server";
import { and, desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { usersVisibilityFilter } from "@/lib/scope";
import { canCreateRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim();
  const filter = usersVisibilityFilter(s);
  const where = q
    ? and(filter, or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)))!
    : filter;

  const rows = await db
    .select({
      id: users.id, name: users.name, email: users.email, phone: users.phone,
      role: users.role, territory: users.territory, active: users.active,
      managerId: users.managerId, coordinatorId: users.coordinatorId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt));
  return NextResponse.json({ users: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const b = (await req.json()) as {
    name?: string; email?: string; phone?: string;
    password?: string; role?: "super_admin" | "admin" | "coordinator" | "leader";
    territory?: string;
  };
  if (!b.name || !b.email || !b.password) {
    return NextResponse.json({ error: "nome, email e senha são obrigatórios" }, { status: 400 });
  }
  if (b.password.length < 6) {
    return NextResponse.json({ error: "a senha deve ter ao menos 6 caracteres" }, { status: 400 });
  }
  const role = b.role ?? "leader";
  if (!canCreateRole(s.role, role)) {
    return NextResponse.json(
      { error: `Sem permissão: seu perfil (${s.role}) não pode criar ${role}.` },
      { status: 403 },
    );
  }

  // Vinculação hierárquica:
  // - super/admin criando coordinator → managerId = quem criou, coordinatorId = null
  // - super/admin criando leader (opcional coordinatorId no body) → fica sob aquele coord
  // - coordinator criando leader → coordinatorId = s.id, managerId = s.id
  const bAny = b as { coordinatorId?: number };
  let managerId: number | null = s.id;
  let coordinatorId: number | null = null;
  if (role === "leader") {
    if (s.role === "coordinator") coordinatorId = s.id;
    else if (bAny.coordinatorId) coordinatorId = Number(bAny.coordinatorId);
  }
  if (role === "coordinator" || role === "admin" || role === "super_admin") {
    managerId = s.id;
    coordinatorId = null;
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
        managerId,
        coordinatorId,
      })
      .returning({ id: users.id });
    await db.insert(auditLogs).values({
      actorId: s.id, userId: row.id, action: "user_create",
      entity: "users", entityId: row.id,
      detail: `Criou ${role} ${b.email}`, ip: req.headers.get("x-forwarded-for"),
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
