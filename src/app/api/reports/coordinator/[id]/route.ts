import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, leaderships, voters, demands } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !["super_admin", "admin", "coordinator"].includes(session.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const cid = parseInt(id);
    if (isNaN(cid)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Buscar dados do coordenador
    const [coordinator] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, cid), eq(users.role, "coordinator")))
      .limit(1);

    if (!coordinator) {
      return NextResponse.json({ error: "Coordenador não encontrado" }, { status: 404 });
    }

    // Buscar líderes associados a este coordenador via tabela leaderships
    const rowsLeaders = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        active: users.active,
        createdAt: users.createdAt,
      })
      .from(leaderships)
      .innerJoin(users, eq(leaderships.userId, users.id))
      .where(eq(leaderships.coordinatorId, cid));

    // Buscar eleitores do coordenador
    const rowsVoters = await db
      .select({
        id: voters.id,
        name: voters.name,
        phone: voters.phone,
        status: voters.status,
        createdAt: voters.createdAt,
      })
      .from(voters)
      .where(eq(voters.coordinatorId, cid));

    // Buscar demandas do coordenador
    const rowsDemands = await db
      .select()
      .from(demands)
      .where(eq(demands.coordinatorId, cid));

    return NextResponse.json({
      coordinator,
      leaders: rowsLeaders,
      voters: rowsVoters,
      demands: rowsDemands,
      stats: {
        leadersCount: rowsLeaders.length,
        votersCount: rowsVoters.length,
        demandsCount: rowsDemands.length,
        openDemands: rowsDemands.filter((d) => d.status === "aberta").length,
        resolvedDemands: rowsDemands.filter((d) => d.status === "resolvida").length,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório detalhado do coordenador:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
