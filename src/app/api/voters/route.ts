import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { voters, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { coordinatorScopeIdForUser, votersVisibilityFilter } from "@/lib/scope";
import { audit, ipOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Row = {
  id: number; name: string; phone: string | null;
  voterTitle: string | null; zone: string | null; section: string | null;
  street: string | null; number: string | null;
  neighborhood: string | null; city: string | null;
  birthDate: string | null; notes: string | null;
  leaderId: number | null; leaderName: string | null;
  coordinatorId: number | null; createdBy: number;
  createdByName: string | null;
  createdAt: Date;
};

/**
 * Para LEADER: retorna APENAS nome e telefone (todos os demais campos vêm null).
 * Regra de negócio: leader cadastra tudo, mas depois de salvo só vê nome/telefone.
 * Para SUPER/ADMIN e COORDINATOR: retorna tudo, inclusive quem cadastrou.
 */
const sanitize = (rows: Row[], role: "super_admin" | "admin" | "coordinator" | "leader"): Row[] => {
  if (role !== "leader") return rows;
  return rows.map((r) => ({
    ...r,
    voterTitle: null,
    zone: null,
    section: null,
    street: null,
    number: null,
    neighborhood: null,
    city: null,
    birthDate: null,
    notes: null,
    leaderName: null,
    createdByName: null,
  }));
};

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim();
  const isLeader = s.role === "leader";
  const f = votersVisibilityFilter(s);
  // Para leader, a busca só nos campos que ele pode ver (nome/telefone)
  const search = q
    ? isLeader
      ? or(ilike(voters.name, `%${q}%`), ilike(voters.phone, `%${q}%`))
      : or(ilike(voters.name, `%${q}%`), ilike(voters.phone, `%${q}%`), ilike(voters.voterTitle, `%${q}%`), ilike(voters.neighborhood, `%${q}%`), ilike(voters.city, `%${q}%`))
    : undefined;
  const where = search ? and(f, search)! : f;

  // Usamos alias para trazer o NOME de QUEM CADASTROU (createdBy) — importante para o coordenador saber
  const creator = alias(users, "creator");

  const rows = await db.select({
    id: voters.id, name: voters.name, phone: voters.phone,
    voterTitle: voters.voterTitle, zone: voters.zone, section: voters.section,
    street: voters.street, number: voters.number,
    neighborhood: voters.neighborhood, city: voters.city,
    birthDate: voters.birthDate, notes: voters.notes,
    leaderId: voters.leaderId, leaderName: users.name,
    coordinatorId: voters.coordinatorId, createdBy: voters.createdBy,
    createdByName: creator.name,
    createdAt: voters.createdAt,
  })
    .from(voters)
    .leftJoin(users, eq(voters.leaderId, users.id))
    .leftJoin(creator, eq(voters.createdBy, creator.id))
    .where(where)
    .orderBy(desc(voters.createdAt))
    .limit(500);
  return NextResponse.json({ voters: sanitize(rows, s.role) });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const b = (await req.json()) as {
    name?: string; phone?: string; voterTitle?: string;
    zone?: string; section?: string;
    street?: string; number?: string; neighborhood?: string; city?: string;
    birthDate?: string; notes?: string; leaderId?: number;
  };
  if (!b.name) return NextResponse.json({ error: "nome obrigatório" }, { status: 400 });

  // Leader PODE cadastrar todos os campos (incluindo Título/Zona/Seção).
  // Depois de salvo, ao LISTAR, esses campos não são exibidos para ele — mas ficam salvos.

  let leaderId: number | null = null;
  let coordinatorId: number | null = null;
  if (s.role === "leader") {
    leaderId = s.id;
    coordinatorId = coordinatorScopeIdForUser(s);
  } else if (s.role === "coordinator") {
    coordinatorId = s.id;
    if (b.leaderId) {
      const [ld] = await db.select().from(users).where(eq(users.id, Number(b.leaderId)));
      if (!ld || ld.coordinatorId !== s.id) return NextResponse.json({ error: "liderança não pertence a você" }, { status: 403 });
      leaderId = ld.id;
    }
  } else {
    if (b.leaderId) {
      const [ld] = await db.select().from(users).where(eq(users.id, Number(b.leaderId)));
      if (ld) { leaderId = ld.id; coordinatorId = ld.coordinatorId ?? null; }
    }
  }

  const [row] = await db.insert(voters).values({
    name: b.name.trim(),
    phone: b.phone ?? null,
    voterTitle: b.voterTitle ?? null,
    zone: b.zone ?? null, section: b.section ?? null,
    street: b.street ?? null, number: b.number ?? null,
    neighborhood: b.neighborhood ?? null, city: b.city ?? null,
    birthDate: b.birthDate ?? null, notes: b.notes ?? null,
    leaderId, coordinatorId, createdBy: s.id,
  }).returning({ id: voters.id });

  await audit({ actorId: s.id, actorRole: s.role, action: "voter_create", entity: "voters", entityId: row.id, detail: `Eleitor ${b.name}`, ip: ipOf(req) });
  return NextResponse.json({ ok: true, id: row.id });
}
