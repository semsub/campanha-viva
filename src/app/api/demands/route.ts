import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demands, demandHistory, voters, demandCategories, users } from "@/db/schema";
import { eq, and, desc, count, ilike, or, sql } from "drizzle-orm";
import { getSession, canManageDemands } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { generateProtocol } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  const conditions = [];
  if (session.campaignId) {
    conditions.push(eq(demands.campaignId, session.campaignId));
  }
  if (status) {
    conditions.push(sql`${demands.status} = ${status}`);
  }
  if (categoryId) {
    conditions.push(eq(demands.categoryId, parseInt(categoryId)));
  }
  if (priority) {
    conditions.push(sql`${demands.priority} = ${priority}`);
  }
  if (search) {
    conditions.push(or(ilike(demands.protocol, `%${search}%`), ilike(demands.description, `%${search}%`)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      id: demands.id,
      protocol: demands.protocol,
      description: demands.description,
      priority: demands.priority,
      status: demands.status,
      categoryId: demands.categoryId,
      subcategoryId: demands.subcategoryId,
      voterId: demands.voterId,
      openedAt: demands.openedAt,
      deadline: demands.deadline,
      closedAt: demands.closedAt,
      observations: demands.observations,
      result: demands.result,
      createdAt: demands.createdAt,
    })
    .from(demands)
    .where(whereClause)
    .orderBy(desc(demands.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db.select({ total: count() }).from(demands).where(whereClause);

  return NextResponse.json({
    demands: result,
    total: totalResult.total,
    page,
    totalPages: Math.ceil(totalResult.total / limit),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!canManageDemands(session.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const { categoryId, subcategoryId, description, priority, voterId, deadline, observations } = body;

  if (!description || !categoryId) {
    return NextResponse.json({ error: "Descrição e categoria são obrigatórios" }, { status: 400 });
  }

  const protocol = generateProtocol();

  const [newDemand] = await db.insert(demands).values({
    protocol,
    categoryId: parseInt(categoryId),
    subcategoryId: subcategoryId ? parseInt(subcategoryId) : null,
    description,
    priority: priority || "media",
    status: "aberta",
    voterId: voterId ? parseInt(voterId) : null,
    coordinatorId: session.id,
    campaignId: session.campaignId,
    deadline: deadline ? new Date(deadline) : null,
    observations: observations || null,
    createdBy: session.id,
  }).returning();

  // Create history entry
  await db.insert(demandHistory).values({
    demandId: newDemand.id,
    userId: session.id,
    action: "criação",
    description: "Demanda criada",
    newStatus: "aberta",
  });

  await logAudit({
    userId: session.id,
    action: "create",
    entity: "demands",
    entityId: newDemand.id,
    newValue: { protocol, categoryId, description },
  });

  return NextResponse.json({ demand: newDemand }, { status: 201 });
}
