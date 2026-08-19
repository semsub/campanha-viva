import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users, voters, demands } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Retorna todos os dados de um coordenador específico:
// - as lideranças dele
// - os eleitores dele
// - as demandas do escopo
// EXCLUSIVO do Super Admin.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  if (s.role !== "super_admin") return NextResponse.json({ error: "sem permissão" }, { status: 403 });

  const { id } = await ctx.params;
  const cid = Number(id);

  const [coord] = await db.select().from(users).where(eq(users.id, cid));
  if (!coord || coord.role !== "coordinator") {
    return NextResponse.json({ error: "coordenador não encontrado" }, { status: 404 });
  }

  const leaders = await db
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, active: users.active, createdAt: users.createdAt })
    .from(users)
    .where(and(eq(users.role, "leader"), eq(users.coordinatorId, cid))!);

  const rowsVoters = await db
    .select({
      id: voters.id, name: voters.name, phone: voters.phone,
      voterTitle: voters.voterTitle, zone: voters.zone, section: voters.section,
      neighborhood: voters.neighborhood, city: voters.city,
      leaderId: voters.leaderId, leaderName: users.name,
      createdAt: voters.createdAt,
    })
    .from(voters)
    .leftJoin(users, eq(voters.leaderId, users.id))
    .where(eq(voters.coordinatorId, cid))
    .orderBy(desc(voters.createdAt))
    .limit(500);

  const rowsDemands = await db
    .select({
      id: demands.id, title: demands.title, category: demands.category,
      status: demands.status, priority: demands.priority,
      voterId: demands.voterId, voterName: voters.name,
      createdAt: demands.createdAt,
    })
    .from(demands)
    .leftJoin(voters, eq(demands.voterId, voters.id))
    .where(eq(demands.coordinatorId, cid))
    .orderBy(desc(demands.createdAt))
    .limit(500);

  return NextResponse.json({
    coordinator: {
      id: coord.id, name: coord.name, email: coord.email,
      phone: coord.phone, active: coord.active, territory: coord.territory,
    },
    leaders,
    voters: rowsVoters,
    demands: rowsDemands,
  });
}
