import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { voters, demands, demandCategories, tasks, events, leaderships, neighborhoods, regions, users } from "@/db/schema";
import { count, desc, eq } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/api-auth";
import { ensureSetup } from "@/lib/setup";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    await ensureSetup();
    const [voterCount] = await db.select({ c: count() }).from(voters);
    const [demandCount] = await db.select({ c: count() }).from(demands);
    const [taskCount] = await db.select({ c: count() }).from(tasks);
    const [eventCount] = await db.select({ c: count() }).from(events);
    const [leaderCount] = await db.select({ c: count() }).from(leaderships);
    const [regionCount] = await db.select({ c: count() }).from(regions);
    const [neighborhoodCount] = await db.select({ c: count() }).from(neighborhoods);
    const [coordCount] = await db.select({ c: count() }).from(users).where(eq(users.role, "coordinator"));

    const demandsByStatus = await db.select({ status: demands.status, c: count() }).from(demands).groupBy(demands.status);
    const demandsByCategory = await db.select({ categoryId: demands.categoryId, c: count() }).from(demands).groupBy(demands.categoryId).orderBy(desc(count())).limit(10);

    return NextResponse.json({
      voters: voterCount.c, demands: demandCount.c, tasks: taskCount.c, events: eventCount.c,
      leaderships: leaderCount.c, regions: regionCount.c, neighborhoods: neighborhoodCount.c,
      coordinators: coordCount.c, demandsByStatus, demandsByCategory,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro" }, { status: 500 });
  }
}
