import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { voters, users } from "@/db/schema";
import { eq, and, ilike, or, desc, count, inArray } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { ensureSetup } from "@/lib/setup";

async function getTeamIds(s: { id: number; role: string }): Promise<number[] | null> {
  if (s.role === "super_admin" || s.role === "admin") return null; // vê tudo
  if (s.role === "coordinator") {
    const leaders = await db.select({ id: users.id }).from(users)
      .where(and(eq(users.managerId, s.id), eq(users.role, "leader")));
    return [s.id, ...leaders.map(l => l.id)];
  }
  return [s.id]; // leader vê só os que ele cadastrou
}

export async function GET(req: NextRequest) {
  const s = getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await ensureSetup();

  const search = req.nextUrl.searchParams.get("search") ?? "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const limit = Math.min(1000, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 20));

  const conds = [eq(voters.active, true)];
  if (search) conds.push(or(ilike(voters.name, `%${search}%`), ilike(voters.phone ?? "", `%${search}%`))!);

  const teamIds = await getTeamIds(s);
  if (teamIds) conds.push(inArray(voters.registeredById, teamIds));

  const where = and(...conds);
  const [total] = await db.select({ c: count() }).from(voters).where(where);
  const rows = await db.select().from(voters).where(where).orderBy(desc(voters.createdAt)).limit(limit).offset((page - 1) * limit);
  return NextResponse.json({ voters: rows, total: total.c, page, limit });
}

export async function POST(req: NextRequest) {
  const s = getSessionFromRequest(req);
  if (!s) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  // TODOS os perfis podem cadastrar eleitores (inclusive leader)
  await ensureSetup();

  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });

  const [created] = await db.insert(voters).values({
    name: body.name, phone: body.phone, email: body.email,
    address: body.address, addressNumber: body.addressNumber,
    neighborhoodId: body.neighborhoodId, municipalityId: body.municipalityId,
    cep: body.cep, electoralZone: body.electoralZone,
    electoralSection: body.electoralSection, votingLocation: body.votingLocation,
    birthDate: body.birthDate, referencePoint: body.referencePoint,
    coordinatorId: s.role === "coordinator" ? s.id : body.coordinatorId,
    registeredById: s.id, notes: body.notes,
  }).returning();

  await logAudit({ actorId: s.id, action: "voter_created", entity: "voters", entityId: created.id, ip: req.headers.get("x-forwarded-for") });
  return NextResponse.json({ voter: created }, { status: 201 });
}
