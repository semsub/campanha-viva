import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { voters } from "@/db/schema";
import { like, or, eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("q") || searchParams.get("search") || "";

    let conditions = [];

    // Uso de coerção (as any) para evitar conflitos de tipos do enum de roles no TypeScript
    const role = (session as any).role;

    if (role === "coordinator" || role === "coordenador_regional") {
      conditions.push(eq(voters.coordinatorId, session.id));
    } else if (role === "leader" || role === "lideranca") {
      conditions.push(
        or(
          eq(voters.leaderId, session.id),
          eq(voters.createdBy, session.id)
        )
      );
    }
    // Se for super_admin, não aplica restrição extra (vê tudo)

    if (search) {
      conditions.push(
        or(
          like(voters.name, `%${search}%`),
          like(voters.phone, `%${search}%`),
          like(voters.neighborhood, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const allVoters = await db.select().from(voters).where(whereClause);

    const response = NextResponse.json({ voters: allVoters });
    response.headers.set("Cache-Control", "no-store, no-cache, must-validate, proxy-revalidate");
    return response;
  } catch (error: any) {
    console.error("Erro ao listar eleitores:", error);
    return NextResponse.json({ error: "Erro interno ao buscar eleitores" }, { status: 500 });
  }
}
