import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { municipalities, regions } from "@/db/schema";
import { getSessionFromRequest } from "@/lib/api-auth";
import { isAdmin } from "@/lib/auth";
import { ensureSetup } from "@/lib/setup";
import { count } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  await ensureSetup();
  const results: string[] = [];
  const [mc] = await db.select({ c: count() }).from(municipalities);
  if (mc.c === 0) {
    await db.insert(municipalities).values([{ name: "Belém", state: "PA" }, { name: "Ananindeua", state: "PA" }, { name: "Marituba", state: "PA" }]);
    results.push("Municípios criados");
  }
  const [rc] = await db.select({ c: count() }).from(regions);
  if (rc.c === 0) {
    const munis = await db.select().from(municipalities);
    if (munis.length > 0) { await db.insert(regions).values([{ name: "Centro", municipalityId: munis[0].id }, { name: "Periferia", municipalityId: munis[0].id }]); results.push("Regiões criadas"); }
  }
  return NextResponse.json({ ok: true, results });
}
