import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, leaderships, voters, demands } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const coordinators = await db
      .select()
      .from(users)
      .where(eq(users.role, "coordinator"));

    const report = await Promise.all(
      coordinators.map(async (c) => {
        const [nl] = await db
          .select({ n: count() })
          .from(leaderships)
          .where(eq(leaderships.coordinatorId, c.id));

        const [nv] = await db
          .select({ n: count() })
          .from(voters)
          .where(eq(voters.coordinatorId, c.id));

        const [nd] = await db
          .select({ n: count() })
          .from(demands)
          .where(eq(demands.coordinatorId, c.id));

        const [nOpen] = await db
          .select({ n: count() })
          .from(demands)
          .where(and(eq(demands.coordinatorId, c.id), eq(demands.status, "aberta")));

        const [nResolved] = await db
          .select({ n: count() })
          .from(demands)
          .where(and(eq(demands.coordinatorId, c.id), eq(demands.status, "resolvida")));

        return {
          coordinator: c,
          leadersCount: nl?.n || 0,
          votersCount: nv?.n || 0,
          demandsCount: nd?.n || 0,
          openDemands: nOpen?.n || 0,
          resolvedDemands: nResolved?.n || 0,
        };
      })
    );

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Erro ao gerar relatório por coordenador:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
