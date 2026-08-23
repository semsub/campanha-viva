import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, users, voters, demands } from "@/db/schema";
import { desc, count, eq, and, inArray, sql } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/api-auth";
import { isAdmin } from "@/lib/auth";
import { ensureSetup } from "@/lib/setup";

export async function GET(req: NextRequest) {
  const s = getSessionFromRequest(req);
  if (!s || !isAdmin(s)) return NextResponse.json({ error: "Acesso restrito ao Super Admin." }, { status: 403 });
  await ensureSetup();

  const view = req.nextUrl.searchParams.get("view") ?? "logs";

  // VIEW: coordinators — mostra cada coordenador com totais
  if (view === "coordinators") {
    const coords = await db.select({
      id: users.id, name: users.name, email: users.email,
      phone: users.phone, territory: users.territory, active: users.active,
    }).from(users).where(eq(users.role, "coordinator")).orderBy(desc(users.createdAt));

    const result = [];
    for (const c of coords) {
      // Líderes deste coordenador
      const leaders = await db.select({ id: users.id, name: users.name })
        .from(users).where(and(eq(users.managerId, c.id), eq(users.role, "leader")));
      const leaderIds = [c.id, ...leaders.map(l => l.id)];

      // Eleitores registrados pelo coordenador e seus líderes
      const [vc] = await db.select({ c: count() }).from(voters)
        .where(inArray(voters.registeredById, leaderIds));

      // Demandas criadas pelo coordenador e seus líderes
      const [dc] = await db.select({ c: count() }).from(demands)
        .where(inArray(demands.createdById, leaderIds));

      result.push({
        ...c, leaders: leaders.length, leadersNames: leaders.map(l => l.name),
        voters: vc.c, demands: dc.c,
      });
    }
    return NextResponse.json({ coordinators: result });
  }

  // VIEW: coordinator-detail — detalhes de um coordenador específico
  if (view === "coordinator-detail") {
    const coordId = Number(req.nextUrl.searchParams.get("coordId"));
    if (!coordId) return NextResponse.json({ error: "coordId obrigatório." }, { status: 400 });

    const leaders = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, active: users.active })
      .from(users).where(and(eq(users.managerId, coordId), eq(users.role, "leader")));
    const leaderIds = [coordId, ...leaders.map(l => l.id)];

    const votersList = await db.select().from(voters)
      .where(inArray(voters.registeredById, leaderIds)).orderBy(desc(voters.createdAt));

    const demandsList = await db.select().from(demands)
      .where(inArray(demands.createdById, leaderIds)).orderBy(desc(demands.createdAt));

    return NextResponse.json({ leaders, voters: votersList, demands: demandsList });
  }

  // VIEW: logs — trilha de auditoria padrão
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 30));
  const [total] = await db.select({ c: count() }).from(auditLogs);
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset((page - 1) * limit);
  return NextResponse.json({ logs: rows, total: total.c, page, limit });
}
