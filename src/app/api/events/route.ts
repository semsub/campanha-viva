import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { coordinatorScopeIdForUser, eventsVisibilityFilter } from "@/lib/scope";
import { audit, ipOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const rows = await db.select().from(events).where(eventsVisibilityFilter(s)).orderBy(desc(events.eventDate)).limit(500);
  return NextResponse.json({ events: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const b = (await req.json()) as {
    title?: string; description?: string; location?: string;
    latitude?: number; longitude?: number; eventDate?: string;
  };
  if (!b.title || !b.eventDate) return NextResponse.json({ error: "título e data obrigatórios" }, { status: 400 });
  const [row] = await db.insert(events).values({
    title: b.title.trim(),
    description: b.description ?? null,
    location: b.location ?? null,
    latitude: typeof b.latitude === "number" ? b.latitude : null,
    longitude: typeof b.longitude === "number" ? b.longitude : null,
    eventDate: b.eventDate,
    coordinatorId: coordinatorScopeIdForUser(s),
    createdBy: s.id,
  }).returning({ id: events.id });
  await audit({ actorId: s.id, actorRole: s.role, action: "event_create", entity: "events", entityId: row.id, detail: `Evento: ${b.title}`, ip: ipOf(req) });
  return NextResponse.json({ ok: true, id: row.id });
}
