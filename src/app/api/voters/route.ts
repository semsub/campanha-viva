import { NextRequest, NextResponse } from "next/server";
import { desc, ilike, or, sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { voters, users, auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim();
  const base = db
    .select({
      id: voters.id, name: voters.name, phone: voters.phone, cpf: voters.cpf,
      address: voters.address, neighborhood: voters.neighborhood, city: voters.city,
      birthDate: voters.birthDate, notes: voters.notes,
      leaderId: voters.leaderId, leaderName: users.name,
      createdAt: voters.createdAt,
    })
    .from(voters)
    .leftJoin(users, eq(voters.leaderId, users.id));
  const rows = await (q
    ? base.where(
        or(
          ilike(voters.name, `%${q}%`),
          ilike(voters.phone, `%${q}%`),
          ilike(voters.cpf, `%${q}%`),
          ilike(voters.neighborhood, `%${q}%`),
        ),
      )
    : base.where(sql`TRUE`)
  ).orderBy(desc(voters.createdAt)).limit(500);
  return NextResponse.json({ voters: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const b = (await req.json()) as {
    name?: string; phone?: string; cpf?: string; address?: string;
    neighborhood?: string; city?: string; birthDate?: string; notes?: string;
    leaderId?: number;
  };
  if (!b.name) return NextResponse.json({ error: "nome é obrigatório" }, { status: 400 });
  const [row] = await db.insert(voters).values({
    name: b.name.trim(),
    phone: b.phone ?? null, cpf: b.cpf ?? null,
    address: b.address ?? null, neighborhood: b.neighborhood ?? null,
    city: b.city ?? null, birthDate: b.birthDate ?? null, notes: b.notes ?? null,
    leaderId: b.leaderId ?? (s.role === "leader" ? s.id : null),
  }).returning({ id: voters.id });
  await db.insert(auditLogs).values({
    actorId: s.id, action: "voter_create", entity: "voters", entityId: row.id,
    detail: `Cadastrou eleitor ${b.name}`, ip: req.headers.get("x-forwarded-for"),
  });
  return NextResponse.json({ ok: true, id: row.id });
}
