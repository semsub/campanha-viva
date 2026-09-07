import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { demands, voters, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { canAccessRow, coordinatorScopeIdForUser, demandsVisibilityFilter } from "@/lib/scope";
import { audit, ipOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Status = "pendente" | "em_andamento" | "concluido" | "cancelado";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status") as Status | null;
  const voterId = url.searchParams.get("voterId");

  const conds = [demandsVisibilityFilter(s)];
  if (q) conds.push(ilike(demands.title, `%${q}%`));
  if (category) conds.push(eq(demands.category, category));
  if (status) conds.push(eq(demands.status, status));
  if (voterId) conds.push(eq(demands.voterId, Number(voterId)));

  const rows = await db
    .select({
      id: demands.id, title: demands.title, description: demands.description,
      category: demands.category, status: demands.status, priority: demands.priority,
      voterId: demands.voterId, voterName: voters.name,
      assignedTo: demands.assignedTo, assignedName: users.name,
      coordinatorId: demands.coordinatorId, createdBy: demands.createdBy,
      createdAt: demands.createdAt, updatedAt: demands.updatedAt,
    })
    .from(demands)
    .leftJoin(voters, eq(demands.voterId, voters.id))
    .leftJoin(users, eq(demands.assignedTo, users.id))
    .where(and(...conds))
    .orderBy(desc(demands.createdAt))
    .limit(500);
  return NextResponse.json({ demands: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const b = (await req.json()) as {
    title?: string; description?: string; category?: string;
    priority?: "baixa"|"media"|"alta"|"urgente"; voterId?: number;
  };
  if (!b.title || !b.category) return NextResponse.json({ error: "título e categoria obrigatórios" }, { status: 400 });
  if (!b.voterId) return NextResponse.json({ error: "eleitor obrigatório" }, { status: 400 });

  // Autorização em nível de objeto: o eleitor precisa pertencer ao escopo
  const [v] = await db.select().from(voters).where(eq(voters.id, Number(b.voterId)));
  if (!v) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (!canAccessRow(s, { coordinatorId: v.coordinatorId, createdBy: v.createdBy, leaderId: v.leaderId })) {
    await audit({ actorId: s.id, actorRole: s.role, action: "demand_create_denied", entity: "voters", entityId: v.id, ip: ipOf(req), success: false });
    return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  }
  const coordinatorId = v.coordinatorId ?? coordinatorScopeIdForUser(s);

  const [row] = await db.insert(demands).values({
    title: b.title.trim(),
    description: b.description ?? null,
    category: b.category,
    priority: b.priority ?? "media",
    voterId: v.id, coordinatorId, createdBy: s.id,
  }).returning({ id: demands.id });

  await audit({ actorId: s.id, actorRole: s.role, action: "demand_create", entity: "demands", entityId: row.id, detail: `Demanda p/ eleitor #${v.id}: ${b.title}`, ip: ipOf(req) });
  return NextResponse.json({ ok: true, id: row.id });
}
