import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demands } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { ensureSetup } from "@/lib/setup";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await ensureSetup();
  const { id } = await ctx.params;
  const [demand] = await db.select().from(demands).where(eq(demands.id, Number(id)));
  if (!demand) return NextResponse.json({ error: "Não encontrada." }, { status: 404 });
  return NextResponse.json({ demand });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await ensureSetup();
  const { id } = await ctx.params;
  const body = await req.json();
  const [existing] = await db.select().from(demands).where(eq(demands.id, Number(id)));
  if (!existing) return NextResponse.json({ error: "Não encontrada." }, { status: 404 });

  const [updated] = await db.update(demands).set({
    ...body, updatedAt: new Date(),
    ...(body.status === "resolvida" || body.status === "encerrada" ? { closedAt: new Date() } : {}),
  }).where(eq(demands.id, Number(id))).returning();

  await logAudit({ actorId: session.id, action: "demand_updated", entity: "demands", entityId: updated.id, oldValue: existing.status, newValue: body.status, ip: req.headers.get("x-forwarded-for") });
  return NextResponse.json({ demand: updated });
}
