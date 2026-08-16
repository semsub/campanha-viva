import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const conditions = [];
  if (session.campaignId) conditions.push(eq(tasks.campaignId, session.campaignId));
  if (status) conditions.push(sql`${tasks.status} = ${status}`);

  const result = await db.select().from(tasks)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(tasks.createdAt));

  return NextResponse.json({ tasks: result });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { title, description, assignedToId, deadline, priority, demandId, voterId, regionId } = body;

  if (!title) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });

  const [task] = await db.insert(tasks).values({
    title,
    description: description || null,
    assignedToId: assignedToId ? parseInt(assignedToId) : null,
    createdById: session.id,
    deadline: deadline ? new Date(deadline) : null,
    priority: priority || "media",
    status: "pendente",
    demandId: demandId ? parseInt(demandId) : null,
    voterId: voterId ? parseInt(voterId) : null,
    regionId: regionId ? parseInt(regionId) : null,
    campaignId: session.campaignId,
  }).returning();

  await logAudit({ userId: session.id, action: "create", entity: "tasks", entityId: task.id, newValue: { title } });

  return NextResponse.json({ task }, { status: 201 });
}
