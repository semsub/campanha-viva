import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { ensureSetup } from "@/lib/setup";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await ensureSetup();
  const status = req.nextUrl.searchParams.get("status");
  const conds = [];
  if (status) conds.push(eq(tasks.status, status as "pendente"));
  if (session.role === "leader") conds.push(eq(tasks.assignedToId, session.id));
  const where = conds.length ? and(...conds) : undefined;
  const rows = await db.select().from(tasks).where(where).orderBy(desc(tasks.createdAt)).limit(100);
  return NextResponse.json({ tasks: rows });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await ensureSetup();
  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });
  const [created] = await db.insert(tasks).values({
    title: body.title, description: body.description, assignedToId: body.assignedToId,
    createdById: session.id, demandId: body.demandId, voterId: body.voterId,
    priority: body.priority ?? "media", regionId: body.regionId, deadline: body.deadline, notes: body.notes,
  }).returning();
  await logAudit({ actorId: session.id, action: "task_created", entity: "tasks", entityId: created.id, ip: req.headers.get("x-forwarded-for") });
  return NextResponse.json({ task: created }, { status: 201 });
}
