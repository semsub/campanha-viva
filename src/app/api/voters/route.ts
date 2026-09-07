import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { voters, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { coordinatorScopeIdForUser, votersVisibilityFilter } from "@/lib/scope";
import { audit, ipOf } from "@/lib/audit";
import { canSeeVoterSensitive } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type VoterRow = {
  id: number; name: string; phone: string | null;
  voterTitle: string | null; zone: string | null; section: string | null;
  street: string | null; number: string | null;
  neighborhood: string | null; city: string | null; uf: string | null;
  birthDate: string | null; notes: string | null;
  leaderId: number | null; leaderName: string | null;
  coordinatorId: number | null; createdBy: number | null;
  createdAt: Date;
};

function sanitize(rows: VoterRow[], sensitive: boolean): VoterRow[] {
  if (sensitive) return rows;
  // Para leader: OCULTA voter_title, zone, section
  return rows.map((r) => ({ ...r, voterTitle: null, zone: null, section: null }));
}

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim();

  const filter = votersVisibilityFilter(s);
  const canSeeSensitive = canSeeVoterSensitive(s.role);

  // Se leader, NÃO permitir buscar por campos sensíveis
  const searchExpr = q
    ? canSeeSensitive
      ? or(
          ilike(voters.name, `%${q}%`),
          ilike(voters.phone, `%${q}%`),
          ilike(voters.voterTitle, `%${q}%`),
          ilike(voters.neighborhood, `%${q}%`),
          ilike(voters.city, `%${q}%`),
        )
      : or(
          ilike(voters.name, `%${q}%`),
          ilike(voters.phone, `%${q}%`),
          ilike(voters.neighborhood, `%${q}%`),
          ilike(voters.city, `%${q}%`),
        )
    : undefined;

  const where = searchExpr ? and(filter, searchExpr)! : filter;

  const rows = await db
    .select({
      id: voters.id, name: voters.name, phone: voters.phone,
      voterTitle: voters.voterTitle, zone: voters.zone, section: voters.section,
      street: voters.street, number: voters.number,
      neighborhood: voters.neighborhood, city: voters.city, uf: voters.uf,
      birthDate: voters.birthDate, notes: voters.notes,
      leaderId: voters.leaderId, leaderName: users.name,
      coordinatorId: voters.coordinatorId, createdBy: voters.createdBy,
      createdAt: voters.createdAt,
    })
    .from(voters)
    .leftJoin(users, eq(voters.leaderId, users.id))
    .where(where)
    .orderBy(desc(voters.createdAt))
    .limit(500);

  return NextResponse.json({ voters: sanitize(rows, canSeeSensitive) });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const b = (await req.json()) as {
    name?: string; phone?: string; voterTitle?: string;
    zone?: string; section?: string;
    street?: string; number?: string; neighborhood?: string; city?: string; uf?: string;
    birthDate?: string; notes?: string;
    leaderId?: number;
  };
  if (!b.name) return NextResponse.json({ error: "nome é obrigatório" }, { status: 400 });

  let leaderId: number | null = null;
  let coordinatorId: number | null = null;

  if (s.role === "leader") {
    leaderId = s.id;
    coordinatorId = coordinatorScopeIdForUser(s);
    // leader NÃO pode gravar campos sensíveis (mesmo que envie no body)
    b.voterTitle = undefined;
    b.zone = undefined;
    b.section = undefined;
  } else if (s.role === "coordinator") {
    coordinatorId = s.id;
    if (b.leaderId) {
      const [ld] = await db.select().from(users).where(eq(users.id, Number(b.leaderId)));
      if (!ld || ld.coordinatorId !== s.id) {
        return NextResponse.json({ error: "liderança não pertence a você" }, { status: 403 });
      }
      leaderId = ld.id;
    }
  } else {
    // super_admin / admin
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
    neighborhood: b.neighborhood ?? null, city: b.city ?? null, uf: b.uf ?? null,
    birthDate: b.birthDate ?? null, notes: b.notes ?? null,
    leaderId, coordinatorId, createdBy: s.id,
  }).returning({ id: voters.id });

  await audit({ actorId: s.id, actorRole: s.role, action: "voter_create", entity: "voters", entityId: row.id, detail: `Cadastrou eleitor ${b.name}`, ip: ipOf(req) });
  return NextResponse.json({ ok: true, id: row.id });
}
