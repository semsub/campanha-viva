import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demandCategories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/api-auth";
import { isAdmin } from "@/lib/auth";
import { ensureSetup } from "@/lib/setup";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await ensureSetup();
  const rows = await db.select().from(demandCategories).where(eq(demandCategories.active, true)).orderBy(asc(demandCategories.sortOrder));
  return NextResponse.json({ categories: rows });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  await ensureSetup();
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  const [created] = await db.insert(demandCategories).values({ name: body.name, parentId: body.parentId, icon: body.icon, color: body.color, sortOrder: body.sortOrder }).returning();
  return NextResponse.json({ category: created }, { status: 201 });
}
