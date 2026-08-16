import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demands, demandHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const [demand] = await db.select().from(demands).where(eq(demands.id, parseInt(id))).limit(1);
  if (!demand) return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });

  const history = await db.select().from(demandHistory).where(eq(demandHistory.demandId, demand.id)).orderBy(demandHistory.createdAt);

  return NextResponse.json({ demand, history });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const demandId = parseInt(id);
  const body = await request.json();

  const [existing] = await db.select().from(demands).where(eq(demands.id, demandId)).limit(1);
  if (!existing) return NextResponse.json({ error: "Demanda não encontrada" }, { status: 404 });

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status !== undefined) updateData.status = body.status;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId;
  if (body.observations !== undefined) updateData.observations = body.observations;
  if (body.result !== undefined) updateData.result = body.result;
  if (body.status === "resolvida" || body.status === "encerrada") updateData.closedAt = new Date();

  await db.update(demands).set(updateData).where(eq(demands.id, demandId));

  // History
  if (body.status && body.status !== existing.status) {
    await db.insert(demandHistory).values({
      demandId,
      userId: session.id,
      action: "alteração de status",
      description: body.historyNote || `Status alterado de ${existing.status} para ${body.status}`,
      previousStatus: existing.status,
      newStatus: body.status,
    });
  }

  await logAudit({
    userId: session.id,
    action: "update",
    entity: "demands",
    entityId: demandId,
    previousValue: { status: existing.status, priority: existing.priority },
    newValue: updateData,
  });

  return NextResponse.json({ success: true });
}
