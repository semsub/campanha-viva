import { NextResponse } from "next/server";
import { db } from "@/db";
import { demandCategories } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth"; // Ajuste o caminho se necessário conforme o seu projeto

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parentIdParam = searchParams.get("parentId");

    const conditions = [];
    
    // Tratamento seguro para campaignId caso exista na sessão
    const sessionCampaignId = (session as any).campaignId;
    if (sessionCampaignId) {
      conditions.push(eq(demandCategories.campaignId, sessionCampaignId));
    }

    if (parentIdParam === "null" || parentIdParam === "0") {
      conditions.push(isNull(demandCategories.parentId));
    } else if (parentIdParam) {
      conditions.push(eq(demandCategories.parentId, parseInt(parentIdParam, 10)));
    }

    const categories = await db
      .select()
      .from(demandCategories)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar categorias." },
      { status: 500 }
    );
  }
}
