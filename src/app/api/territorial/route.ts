import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { municipalities, regions, neighborhoods } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/api-auth";
import { isAdmin } from "@/lib/auth";
import { ensureSetup } from "@/lib/setup";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await ensureSetup();
  const result: Record<string, unknown> = {};
  result.municipalities = await db.select().from(municipalities).where(eq(municipalities.active, true)).orderBy(asc(municipalities.name));
  result.regions = await db.select().from(regions).where(eq(regions.active, true)).orderBy(asc(regions.name));
  result.neighborhoods = await db.select().from(neighborhoods).where(eq(neighborhoods.active, true)).orderBy(asc(neighborhoods.name));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  await ensureSetup();
  const body = await req.json();
  if (body.type === "municipality") { const [c] = await db.insert(municipalities).values({ name: body.name, state: body.state ?? "PA" }).returning(); return NextResponse.json({ item: c }, { status: 201 }); }
  if (body.type === "region") { const [c] = await db.insert(regions).values({ name: body.name, municipalityId: body.municipalityId }).returning(); return NextResponse.json({ item: c }, { status: 201 }); }
  if (body.type === "neighborhood") { const [c] = await db.insert(neighborhoods).values({ name: body.name, regionId: body.regionId, municipalityId: body.municipalityId }).returning(); return NextResponse.json({ item: c }, { status: 201 }); }
  return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
}
