import { NextRequest, NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const rows = await db.select().from(events).where(sql`TRUE`).orderBy(desc(events.eventDate)).limit(500);
  return NextResponse.json({ events: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const b = (await req.json()) as {
    title?: string; description?: string; location?: string; eventDate?: string;
  };
  if (!b.title || !b.eventDate) {
    return NextResponse.json({ error: "título e data são obrigatórios" }, { status: 400 });
  }
  const [row] = await db.insert(events).values({
    title: b.title.trim(),
    description: b.description ?? null,
    location: b.location ?? null,
    eventDate: b.eventDate,
    createdBy: s.id,
  }).returning({ id: events.id });
  await db.insert(auditLogs).values({
    actorId: s.id, action: "event_create", entity: "events", entityId: row.id,
    detail: `Novo evento: ${b.title}`, ip: req.headers.get("x-forwarded-for"),
  });
  return NextResponse.json({ ok: true, id: row.id });
}
