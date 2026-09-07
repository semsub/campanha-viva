import { NextRequest, NextResponse } from "next/server";
import { and, desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { canCreateRole } from "@/lib/permissions";
import { usersVisibilityFilter } from "@/lib/scope";
import { audit, ipOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim();
  const f = usersVisibilityFilter(s);
  const where = q ? and(f, or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)))! : f;
  const rows = await db.select({
    id: users.id, name: users.name, email: users.email, phone: users.phone,
    role: users.role, coordinatorId: users.coordinatorId,
    active: users.active, createdAt: users.createdAt,
  }).from(users).where(where).orderBy(desc(users.createdAt));
  return NextResponse.json({ users: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const b = (await req.json()) as {
    name?: string; email?: string; phone?: string; password?: string;
    role?: "super_admin"|"admin"|"coordinator"|"leader";
    coordinatorId?: number;
  };
  if (!b.name || !b.email || !b.password) return NextResponse.json({ error: "nome, email e senha são obrigatórios" }, { status: 400 });
  if (b.password.length < 6) return NextResponse.json({ error: "senha mínima de 6 caracteres" }, { status: 400 });
  const role = b.role ?? "leader";
  if (!canCreateRole(s.role, role)) {
    await audit({ actorId: s.id, actorRole: s.role, action: "user_create_denied", detail: `→ ${role}`, ip: ipOf(req), success: false });
    return NextResponse.json({ error: `Sem permissão para criar ${role}.` }, { status: 403 });
  }

  // Vinculação:
  // - coord cria leader → coordinatorId = ele mesmo
  // - super/admin cria leader → precisa passar coordinatorId (senão fica solto)
  // - super/admin cria admin/coordinator → coordinatorId = null
  let coordinatorId: number | null = null;
  if (role === "leader") {
    if (s.role === "coordinator") coordinatorId = s.id;
    else if (b.coordinatorId) coordinatorId = Number(b.coordinatorId);
  }

  try {
    const [row] = await db.insert(users).values({
      name: b.name.trim(),
      email: b.email.toLowerCase().trim(),
      phone: b.phone ?? null,
      passwordHash: hashPassword(b.password),
      role, coordinatorId,
    }).returning({ id: users.id });
    await audit({ actorId: s.id, actorRole: s.role, action: "user_create", entity: "users", entityId: row.id, detail: `Criou ${role} ${b.email}`, ip: ipOf(req) });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("users_email_uidx") || msg.includes("duplicate key")) return NextResponse.json({ error: "email já cadastrado" }, { status: 409 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
