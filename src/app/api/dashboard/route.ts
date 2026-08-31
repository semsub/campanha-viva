import { NextResponse } from "next/server";
import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, voters, demands, tasks, events } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { demandsVisibilityFilter, usersVisibilityFilter, votersVisibilityFilter } from "@/lib/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const uf = usersVisibilityFilter(s);
  const vf = votersVisibilityFilter(s);
  const df = demandsVisibilityFilter(s);

  const [usersCount] = await db.select({ n: count() }).from(users).where(uf);
  const [votersCount] = await db.select({ n: count() }).from(voters).where(vf);
  const [demandsCount] = await db.select({ n: count() }).from(demands).where(df);
  const [openDemands] = await db.select({ n: count() }).from(demands).where(and(df, eq(demands.status, "aberta"))!);
  const [resolvedDemands] = await db.select({ n: count() }).from(demands).where(and(df, eq(demands.status, "resolvida"))!);
  const [tasksCount] = await db.select({ n: count() }).from(tasks).where(
    s.role === "super_admin" ? sql`TRUE` : eq(tasks.createdBy, s.id),
  );
  const [openTasks] = await db.select({ n: count() }).from(tasks).where(
    and(
      s.role === "super_admin" ? sql`TRUE` : eq(tasks.createdBy, s.id),
      eq(tasks.status, "pendente"),
    )!,
  );
  const [eventsCount] = await db.select({ n: count() }).from(events).where(
    s.role === "super_admin" ? sql`TRUE` : eq(events.createdBy, s.id),
  );

  const roleBreakdown = await db
    .select({ role: users.role, n: count() })
    .from(users)
    .where(uf)
    .groupBy(users.role);

  const byCategory = await db
    .select({ category: demands.category, n: count() })
    .from(demands)
    .where(df)
    .groupBy(demands.category)
    .orderBy(sql`count(*) DESC`);

  const byStatus = await db
    .select({ status: demands.status, n: count() })
    .from(demands)
    .where(df)
    .groupBy(demands.status);

  return NextResponse.json({
    stats: {
      users: usersCount.n, voters: votersCount.n,
      demands: demandsCount.n, openDemands: openDemands.n, resolvedDemands: resolvedDemands.n,
      tasks: tasksCount.n, openTasks: openTasks.n, events: eventsCount.n,
    },
    roleBreakdown, byCategory, byStatus,
  });
}
