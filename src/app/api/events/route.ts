import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { ensureSetup } from "@/lib/setup";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await ensureSetup();
  const rows = await db.select().from(events).where(eq(events.active, true)).orderBy(desc(events.eventDate)).limit(100);
  return NextResponse.json({ events: rows });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await ensureSetup();
  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });
  const [created] = await db.insert(events).values({
    title: body.title, description: body.description, type: body.type ?? "reuniao",
    eventDate: body.eventDate ? new Date(body.eventDate) : null, location: body.location,
    responsibleId: body.responsibleId ?? session.id, regionId: body.regionId, createdById: session.id, notes: body.notes,
  }).returning();
  await logAudit({ actorId: session.id, action: "event_created", entity: "events", entityId: created.id, ip: req.headers.get("x-forwarded-for") });
  return NextResponse.json({ event: created }, { status: 201 });
}
