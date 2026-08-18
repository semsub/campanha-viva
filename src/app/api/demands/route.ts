import { NextRequest, NextResponse } from "next/server";
import { desc, ilike, or, sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { demands, voters, users, auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");
  const base = db
    .select({
      id: demands.id, title: demands.title, description: demands.description,
      category: demands.category, status: demands.status, priority: demands.priority,
      voterId: demands.voterId, voterName: voters.name,
      assignedTo: demands.assignedTo, assignedName: users.name,
      createdAt: demands.createdAt, updatedAt: demands.updatedAt,
    })
    .from(demands)
    .leftJoin(voters, eq(demands.voterId, voters.id))
    .leftJoin(users, eq(demands.assignedTo, users.id));

  const conds = [] as unknown[];
  if (q) conds.push(or(ilike(demands.title, `%${q}%`), ilike(demands.description, `%${q}%`)));
  if (category) conds.push(eq(demands.category, category));
  if (status) conds.push(eq(demands.status, status as "aberta"|"em_andamento"|"resolvida"|"cancelada"));

  const rows = await (conds.length
    ? base.where(sql.join(conds as never[], sql` AND `))
    : base.where(sql`TRUE`)
  ).orderBy(desc(demands.createdAt)).limit(500);
  return NextResponse.json({ demands: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const b = (await req.json()) as {
    title?: string; description?: string; category?: string;
    priority?: "baixa"|"media"|"alta"|"urgente";
    voterId?: number; assignedTo?: number;
  };
  if (!b.title || !b.category) return NextResponse.json({ error: "título e categoria são obrigatórios" }, { status: 400 });
  const [row] = await db.insert(demands).values({
    title: b.title.trim(),
    description: b.description ?? null,
    category: b.category,
    priority: b.priority ?? "media",
    voterId: b.voterId ?? null,
    assignedTo: b.assignedTo ?? null,
    createdBy: s.id,
  }).returning({ id: demands.id });
  await db.insert(auditLogs).values({
    actorId: s.id, action: "demand_create", entity: "demands", entityId: row.id,
    detail: `Criou demanda: ${b.title}`, ip: req.headers.get("x-forwarded-for"),
  });
  return NextResponse.json({ ok: true, id: row.id });
}
