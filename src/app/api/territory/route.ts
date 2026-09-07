import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { municipalities, regions, neighborhoods } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { isPlatformStaff } from "@/lib/permissions";
import { audit, ipOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET → lista consolidada de território (visível para qualquer autenticado)
 * POST → cria município/região/bairro (só staff)
 */

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const [mun, reg, nb] = await Promise.all([
    db.select().from(municipalities).orderBy(asc(municipalities.name)),
    db.select().from(regions).orderBy(asc(regions.name)),
    db.select().from(neighborhoods).orderBy(asc(neighborhoods.name)),
  ]);
  return NextResponse.json({ municipalities: mun, regions: reg, neighborhoods: nb });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  if (!isPlatformStaff(s.role)) return NextResponse.json({ error: "sem permissão" }, { status: 403 });

  const b = (await req.json()) as {
    kind: "municipality" | "region" | "neighborhood";
    name?: string; uf?: string;
    municipalityId?: number; regionId?: number;
  };
  if (!b.name) return NextResponse.json({ error: "nome obrigatório" }, { status: 400 });

  if (b.kind === "municipality") {
    const [row] = await db.insert(municipalities).values({ name: b.name.trim(), uf: b.uf ?? null }).returning({ id: municipalities.id });
    await audit({ actorId: s.id, actorRole: s.role, action: "municipality_create", entity: "municipalities", entityId: row.id, ip: ipOf(req) });
    return NextResponse.json({ ok: true, id: row.id });
  }
  if (b.kind === "region") {
    if (!b.municipalityId) return NextResponse.json({ error: "municipalityId obrigatório" }, { status: 400 });
    const [row] = await db.insert(regions).values({ name: b.name.trim(), municipalityId: b.municipalityId }).returning({ id: regions.id });
    await audit({ actorId: s.id, actorRole: s.role, action: "region_create", entity: "regions", entityId: row.id, ip: ipOf(req) });
    return NextResponse.json({ ok: true, id: row.id });
  }
  if (b.kind === "neighborhood") {
    if (!b.municipalityId) return NextResponse.json({ error: "municipalityId obrigatório" }, { status: 400 });
    const [row] = await db.insert(neighborhoods).values({
      name: b.name.trim(),
      municipalityId: b.municipalityId,
      regionId: b.regionId ?? null,
    }).returning({ id: neighborhoods.id });
    await audit({ actorId: s.id, actorRole: s.role, action: "neighborhood_create", entity: "neighborhoods", entityId: row.id, ip: ipOf(req) });
    return NextResponse.json({ ok: true, id: row.id });
  }
  return NextResponse.json({ error: "kind inválido" }, { status: 400 });
}
