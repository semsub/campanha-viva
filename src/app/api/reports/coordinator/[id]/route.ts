import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, voters, demands } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { isPlatformStaff } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  if (!isPlatformStaff(s.role)) return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  const { id } = await ctx.params;
  const cid = Number(id);
  const [c] = await db.select().from(users).where(eq(users.id, cid));
  if (!c || c.role !== "coordinator") return NextResponse.json({ error: "não encontrado" }, { status: 404 });

  const leaders = await db.select({
    id: users.id, name: users.name, email: users.email, phone: users.phone, active: users.active,
  }).from(users).where(and(eq(users.role, "leader"), eq(users.coordinatorId, cid))!);

  const rvs = await db.select({
    id: voters.id, name: voters.name, phone: voters.phone,
    voterTitle: voters.voterTitle, zone: voters.zone, section: voters.section,
    neighborhood: voters.neighborhood, city: voters.city,
    leaderName: users.name, createdAt: voters.createdAt,
  }).from(voters).leftJoin(users, eq(voters.leaderId, users.id))
    .where(eq(voters.coordinatorId, cid)).orderBy(desc(voters.createdAt)).limit(500);

  const rds = await db.select({
    id: demands.id, title: demands.title, category: demands.category,
    status: demands.status, priority: demands.priority,
    voterName: voters.name, createdAt: demands.createdAt,
  }).from(demands).leftJoin(voters, eq(demands.voterId, voters.id))
    .where(eq(demands.coordinatorId, cid)).orderBy(desc(demands.createdAt)).limit(500);

  return NextResponse.json({
    coordinator: { id: c.id, name: c.name, email: c.email, phone: c.phone, active: c.active },
    leaders, voters: rvs, demands: rds,
  });
}
