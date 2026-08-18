import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events, auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  await db.delete(events).where(eq(events.id, Number(id)));
  await db.insert(auditLogs).values({
    actorId: s.id, action: "event_delete", entity: "events", entityId: Number(id),
  });
  return NextResponse.json({ ok: true });
}
