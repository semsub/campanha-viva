import { NextResponse } from "next/server";
import { db } from "@/db";
import { municipalities, regions, neighborhoods, electoralZones, electoralSections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const conditions = [];
    
    // Tratamento seguro para campaignId
    const sessionCampaignId = (session as any).campaignId;
    if (sessionCampaignId) {
      if (type === "municipalities") {
        conditions.push(eq(municipalities.campaignId, sessionCampaignId));
        const result = await db.select().from(municipalities).where(conditions.length > 0 ? and(...conditions) : undefined);
        return NextResponse.json(result);
      } else if (type === "regions") {
        conditions.push(eq(regions.campaignId, sessionCampaignId));
        const result = await db.select().from(regions).where(conditions.length > 0 ? and(...conditions) : undefined);
        return NextResponse.json(result);
      } else if (type === "neighborhoods") {
        conditions.push(eq(neighborhoods.campaignId, sessionCampaignId));
        const result = await db.select().from(neighborhoods).where(conditions.length > 0 ? and(...conditions) : undefined);
        return NextResponse.json(result);
      } else if (type === "zones") {
        conditions.push(eq(electoralZones.campaignId, sessionCampaignId));
        const result = await db.select().from(electoralZones).where(conditions.length > 0 ? and(...conditions) : undefined);
        return NextResponse.json(result);
      } else if (type === "sections") {
        conditions.push(eq(electoralSections.campaignId, sessionCampaignId));
        const result = await db.select().from(electoralSections).where(conditions.length > 0 ? and(...conditions) : undefined);
        return NextResponse.json(result);
      }
    }

    // Caso não haja tipo válido ou campaignId
    return NextResponse.json({ error: "Parâmetros inválidos ou campanha não encontrada" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro na API territorial:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
