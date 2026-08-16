import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demandCategories } from "@/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { getSession, isAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId");

  const conditions = [];
  if (session.campaignId) {
    conditions.push(eq(demandCategories.campaignId, session.campaignId));
  }
  if (parentId) {
    conditions.push(eq(demandCategories.parentId, parseInt(parentId)));
  } else if (!searchParams.has("all")) {
    conditions.push(isNull(demandCategories.parentId));
  }

  const result = await db
    .select()
    .from(demandCategories)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(demandCategories.sortOrder), asc(demandCategories.name));

  return NextResponse.json({ categories: result });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await request.json();
  const { name, parentId, icon, color } = body;

  if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const [cat] = await db.insert(demandCategories).values({
    name,
    parentId: parentId ? parseInt(parentId) : null,
    icon: icon || null,
    color: color || null,
    campaignId: session.campaignId,
  }).returning();

  return NextResponse.json({ category: cat }, { status: 201 });
}
