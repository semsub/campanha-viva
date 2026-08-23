import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demands, users } from "@/db/schema";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { ensureSetup } from "@/lib/setup";

function genProtocol() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  return `DEM-${ymd}-${String(Math.floor(Math.random()*100000)).padStart(5,"0")}`;
}

async function getTeamIds(s: { id: number; role: string }): Promise<number[] | null> {
  if (s.role === "super_admin" || s.role === "admin") return null;
  if (s.role === "coordinator") {
    const leaders = await db.select({ id: users.id }).from(users)
      .where(and(eq(users.managerId, s.id), eq(users.role, "leader")));
    return [s.id, ...leaders.map(l => l.id)];
  }
  return [s.id];
}

export async function GET(req: NextRequest) {
  const s = getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await ensureSetup();

  const status = req.nextUrl.searchParams.get("status");
  const voterId = req.nextUrl.searchParams.get("voterId");
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page"))||1);
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit"))||20));

  const conds = [];
  if (status) conds.push(eq(demands.status, status as "aberta"));
  if (voterId) conds.push(eq(demands.voterId, Number(voterId)));

  const teamIds = await getTeamIds(s);
  if (teamIds) conds.push(inArray(demands.createdById, teamIds));

  const where = conds.length ? and(...conds) : undefined;
  const [total] = await db.select({ c: count() }).from(demands).where(where);
  const rows = await db.select().from(demands).where(where).orderBy(desc(demands.createdAt)).limit(limit).offset((page-1)*limit);
  return NextResponse.json({ demands: rows, total: total.c, page, limit });
}

export async function POST(req: NextRequest) {
  const s = getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  // TODOS os perfis podem abrir demandas (inclusive leader)
  await ensureSetup();

  const body = await req.json();
  if (!body.description) return NextResponse.json({ error: "Descrição obrigatória." }, { status: 400 });
  if (!body.voterId) return NextResponse.json({ error: "Selecione o eleitor." }, { status: 400 });

  const [created] = await db.insert(demands).values({
    protocol: genProtocol(), categoryId: body.categoryId ? Number(body.categoryId) : null,
    description: body.description, priority: body.priority ?? "media",
    voterId: Number(body.voterId),
    coordinatorId: s.role === "coordinator" ? s.id : body.coordinatorId,
    assignedToId: body.assignedToId, regionId: body.regionId,
    deadline: body.deadline, notes: body.notes, createdById: s.id,
  }).returning();

  await logAudit({ actorId: s.id, action: "demand_created", entity: "demands", entityId: created.id, ip: req.headers.get("x-forwarded-for") });
  return NextResponse.json({ demand: created }, { status: 201 });
}
