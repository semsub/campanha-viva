import { NextResponse } from "next/server";
import { and, count, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { users, voters, demands } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Retorna, para cada coordenador, quantos leaders, quantos eleitores e quantas demandas.
// EXCLUSIVO do Super Admin.
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  if (s.role !== "super_admin" && s.role !== "admin") return NextResponse.json({ error: "sem permissão" }, { status: 403 });

  const coords = await db
    .select({ id: users.id, name: users.name, email: users.email, active: users.active, territory: users.territory })
    .from(users)
    .where(eq(users.role, "coordinator"))
    .orderBy(users.name);

  const report = await Promise.all(
    coords.map(async (c) => {
      const [nl] = await db.select({ n: count() }).from(users)
        .where(and(eq(users.role, "leader"), eq(users.coordinatorId, c.id))!);
      const [nv] = await db.select({ n: count() }).from(voters).where(eq(voters.coordinatorId, c.id));
      const [nd] = await db.select({ n: count() }).from(demands).where(eq(demands.coordinatorId, c.id));
      const [nOpen] = await db.select({ n: count() }).from(demands)
        .where(and(eq(demands.coordinatorId, c.id), eq(demands.status, "aberta"))!);
      const [nResolved] = await db.select({ n: count() }).from(demands)
        .where(and(eq(demands.coordinatorId, c.id), eq(demands.status, "resolvida"))!);
      return {
        ...c,
        leaders: nl.n, voters: nv.n, demands: nd.n,
        openDemands: nOpen.n, resolvedDemands: nResolved.n,
      };
    }),
  );

  // Registros "sem coord" (super_admin ou órfãos)
  const [orphanV] = await db.select({ n: count() }).from(voters).where(isNull(voters.coordinatorId));
  const [orphanD] = await db.select({ n: count() }).from(demands).where(isNull(demands.coordinatorId));

  return NextResponse.json({
    coordinators: report,
    orphanVoters: orphanV.n,
    orphanDemands: orphanD.n,
  });
}
