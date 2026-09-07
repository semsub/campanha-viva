import { NextResponse } from "next/server";
import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, voters, demands, tasks, events } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { demandsVisibilityFilter, eventsVisibilityFilter, tasksVisibilityFilter, usersVisibilityFilter, votersVisibilityFilter } from "@/lib/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const uf = usersVisibilityFilter(s);
  const vf = votersVisibilityFilter(s);
  const df = demandsVisibilityFilter(s);
  const tf = tasksVisibilityFilter(s);
  const ef = eventsVisibilityFilter(s);

  const [u] = await db.select({ n: count() }).from(users).where(uf);
  const [v] = await db.select({ n: count() }).from(voters).where(vf);
  const [d] = await db.select({ n: count() }).from(demands).where(df);
  const [pd] = await db.select({ n: count() }).from(demands).where(and(df, eq(demands.status, "pendente"))!);
  const [cd] = await db.select({ n: count() }).from(demands).where(and(df, eq(demands.status, "concluido"))!);
  const [t] = await db.select({ n: count() }).from(tasks).where(tf);
  const [pt] = await db.select({ n: count() }).from(tasks).where(and(tf, eq(tasks.status, "pendente"))!);
  const [e] = await db.select({ n: count() }).from(events).where(ef);

  const byCategory = await db.select({ category: demands.category, n: count() }).from(demands).where(df).groupBy(demands.category).orderBy(sql`count(*) DESC`);
  const byStatus = await db.select({ status: demands.status, n: count() }).from(demands).where(df).groupBy(demands.status);

  return NextResponse.json({
    stats: {
      users: u.n, voters: v.n,
      demands: d.n, pendingDemands: pd.n, doneDemands: cd.n,
      tasks: t.n, openTasks: pt.n, events: e.n,
    },
    byCategory, byStatus,
  });
}
