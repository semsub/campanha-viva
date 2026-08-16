import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, voters, demands, demandCategories, tasks, events, leaderships, neighborhoods, regions } from "@/db/schema";
import { eq, and, count, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const campaignId = session.campaignId;
  const campaignCondition = campaignId ? sql`campaign_id = ${campaignId}` : sql`1=1`;

  // User counts by role
  const coordinatorCount = await db.select({ total: count() }).from(users).where(and(
    sql`${users.role} IN ('coordenador_geral','coordenador_regional','coordenador_municipal')`,
    campaignId ? eq(users.campaignId, campaignId) : undefined
  ));

  const leadershipCount = await db.select({ total: count() }).from(users).where(and(
    sql`${users.role} = 'lideranca'`,
    campaignId ? eq(users.campaignId, campaignId) : undefined
  ));

  const voterCount = await db.select({ total: count() }).from(voters).where(
    campaignId ? eq(voters.campaignId, campaignId) : undefined
  );

  const demandCount = await db.select({ total: count() }).from(demands).where(
    campaignId ? eq(demands.campaignId, campaignId) : undefined
  );

  const openDemandCount = await db.select({ total: count() }).from(demands).where(and(
    sql`${demands.status} NOT IN ('resolvida','cancelada','encerrada')`,
    campaignId ? eq(demands.campaignId, campaignId) : undefined
  ));

  const resolvedDemandCount = await db.select({ total: count() }).from(demands).where(and(
    sql`${demands.status} = 'resolvida'`,
    campaignId ? eq(demands.campaignId, campaignId) : undefined
  ));

  // Demands by status
  const demandsByStatus = await db.select({
    status: demands.status,
    total: count(),
  }).from(demands).where(
    campaignId ? eq(demands.campaignId, campaignId) : undefined
  ).groupBy(demands.status);

  // Demands by category
  const demandsByCategory = await db.select({
    categoryId: demands.categoryId,
    categoryName: demandCategories.name,
    icon: demandCategories.icon,
    color: demandCategories.color,
    total: count(),
  }).from(demands)
    .leftJoin(demandCategories, eq(demands.categoryId, demandCategories.id))
    .where(campaignId ? eq(demands.campaignId, campaignId) : undefined)
    .groupBy(demands.categoryId, demandCategories.name, demandCategories.icon, demandCategories.color)
    .orderBy(desc(count()));

  // Demands by priority
  const demandsByPriority = await db.select({
    priority: demands.priority,
    total: count(),
  }).from(demands).where(
    campaignId ? eq(demands.campaignId, campaignId) : undefined
  ).groupBy(demands.priority);

  // Recent demands
  const recentDemands = await db.select({
    id: demands.id,
    protocol: demands.protocol,
    description: demands.description,
    status: demands.status,
    priority: demands.priority,
    createdAt: demands.createdAt,
  }).from(demands).where(
    campaignId ? eq(demands.campaignId, campaignId) : undefined
  ).orderBy(desc(demands.createdAt)).limit(10);

  // Tasks count
  const pendingTasks = await db.select({ total: count() }).from(tasks).where(and(
    sql`${tasks.status} = 'pendente'`,
    campaignId ? eq(tasks.campaignId, campaignId) : undefined
  ));

  // Events count
  const upcomingEvents = await db.select({ total: count() }).from(events).where(and(
    sql`${events.eventDate} >= NOW()`,
    campaignId ? eq(events.campaignId, campaignId) : undefined
  ));

  // Demands by region
  const demandsByRegion = await db.select({
    regionName: regions.name,
    total: count(),
  }).from(demands)
    .leftJoin(voters, eq(demands.voterId, voters.id))
    .leftJoin(regions, eq(voters.regionId, regions.id))
    .where(campaignId ? eq(demands.campaignId, campaignId) : undefined)
    .groupBy(regions.name)
    .orderBy(desc(count()))
    .limit(10);

  return NextResponse.json({
    stats: {
      coordinators: coordinatorCount[0].total,
      leaderships: leadershipCount[0].total,
      voters: voterCount[0].total,
      totalDemands: demandCount[0].total,
      openDemands: openDemandCount[0].total,
      resolvedDemands: resolvedDemandCount[0].total,
      pendingTasks: pendingTasks[0].total,
      upcomingEvents: upcomingEvents[0].total,
    },
    demandsByStatus,
    demandsByCategory,
    demandsByPriority,
    demandsByRegion,
    recentDemands,
  });
}
