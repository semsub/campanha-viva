import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const conditions = [];
  if (session.campaignId) conditions.push(eq(events.campaignId, session.campaignId));

  const result = await db.select().from(events)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(events.eventDate));

  return NextResponse.json({ events: result });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { title, type, description, eventDate, endDate, location, regionId, observations } = body;

  if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

  const [event] = await db.insert(events).values({
    title,
    type: type || null,
    description: description || null,
    eventDate: eventDate ? new Date(eventDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    location: location || null,
    responsibleId: session.id,
    campaignId: session.campaignId,
    regionId: regionId ? parseInt(regionId) : null,
    observations: observations || null,
    createdBy: session.id,
  }).returning();

  await logAudit({ userId: session.id, action: "create", entity: "events", entityId: event.id, newValue: { title } });

  return NextResponse.json({ event }, { status: 201 });
}
