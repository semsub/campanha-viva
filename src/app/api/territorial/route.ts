import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { municipalities, regions, neighborhoods, electoralZones, electoralSections } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const conditions = [];
  if (session.campaignId) {
    if (type === "municipalities") {
      conditions.push(eq(municipalities.campaignId, session.campaignId));
      const result = await db.select().from(municipalities).where(and(...conditions)).orderBy(asc(municipalities.name));
      return NextResponse.json({ data: result });
    }
    if (type === "regions") {
      const munId = searchParams.get("municipalityId");
      conditions.push(eq(regions.campaignId, session.campaignId));
      if (munId) conditions.push(eq(regions.municipalityId, parseInt(munId)));
      const result = await db.select().from(regions).where(and(...conditions)).orderBy(asc(regions.name));
      return NextResponse.json({ data: result });
    }
    if (type === "neighborhoods") {
      const regId = searchParams.get("regionId");
      conditions.push(eq(neighborhoods.campaignId, session.campaignId));
      if (regId) conditions.push(eq(neighborhoods.regionId, parseInt(regId)));
      const result = await db.select().from(neighborhoods).where(and(...conditions)).orderBy(asc(neighborhoods.name));
      return NextResponse.json({ data: result });
    }
    if (type === "zones") {
      conditions.push(eq(electoralZones.campaignId, session.campaignId));
      const result = await db.select().from(electoralZones).where(and(...conditions));
      return NextResponse.json({ data: result });
    }
    if (type === "sections") {
      const zoneId = searchParams.get("zoneId");
      conditions.push(eq(electoralSections.campaignId, session.campaignId));
      if (zoneId) conditions.push(eq(electoralSections.zoneId, parseInt(zoneId)));
      const result = await db.select().from(electoralSections).where(and(...conditions));
      return NextResponse.json({ data: result });
    }
  }

  return NextResponse.json({ data: [] });
}
