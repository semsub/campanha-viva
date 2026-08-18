import { NextResponse } from "next/server";
import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, voters, demands, tasks, events } from "@/db/schema";
import { getSession } from "@/lib/auth";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const [usersCount] = await db.select({ n: count() }).from(users);
  const [votersCount] = await db.select({ n: count() }).from(voters);
  const [demandsCount] = await db.select({ n: count() }).from(demands);
  const [openDemands] = await db.select({ n: count() }).from(demands).where(eq(demands.status, "aberta"));
  const [resolvedDemands] = await db.select({ n: count() }).from(demands).where(eq(demands.status, "resolvida"));
  const [tasksCount] = await db.select({ n: count() }).from(tasks);
  const [openTasks] = await db.select({ n: count() }).from(tasks).where(eq(tasks.status, "pendente"));
  const [eventsCount] = await db.select({ n: count() }).from(events);

  const roleBreakdown = await db
    .select({ role: users.role, n: count() })
    .from(users)
    .groupBy(users.role);

  const byCategory = await db
    .select({ category: demands.category, n: count() })
    .from(demands)
    .groupBy(demands.category)
    .orderBy(sql`count(*) DESC`);

  const byStatus = await db
    .select({ status: demands.status, n: count() })
    .from(demands)
    .groupBy(demands.status);

  return NextResponse.json({
    stats: {
      users: usersCount.n,
      voters: votersCount.n,
      demands: demandsCount.n,
      openDemands: openDemands.n,
      resolvedDemands: resolvedDemands.n,
      tasks: tasksCount.n,
      openTasks: openTasks.n,
      events: eventsCount.n,
    },
    roleBreakdown,
    byCategory,
    byStatus,
  });
}
