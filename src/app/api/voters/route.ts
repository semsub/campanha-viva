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

    if (session.role === "coordinator") {
      conditions.push(eq(voters.coordinatorId, session.id));
    } else if (session.role === "leader") {
      conditions.push(eq(voters.userId, session.id));
    }

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
