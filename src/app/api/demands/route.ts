import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demands, voters } from "@/db/schema";
import { eq, like, or } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    let query = db
      .select({
        id: demands.id,
        title: demands.title,
        description: demands.description,
        category: demands.category,
        status: demands.status,
        priority: demands.priority,
        voterId: demands.voterId,
        voterName: voters.name,
        createdAt: demands.createdAt,
      })
      .from(demands)
      .leftJoin(voters, eq(demands.voterId, voters.id));

    if (search) {
      query = query.where(
        or(
          like(demands.title, `%${search}%`),
          like(demands.category, `%${search}%`)
        )
      ) as any;
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro ao listar demandas:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar demandas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, priority, voterId, assignedTo, coordinatorId } = body;

    if (!title || !category || !voterId) {
      return NextResponse.json(
        { error: "Título, categoria e eleitor são obrigatórios" },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(demands)
      .values({
        title: title.trim(),
        description: description ? description.trim() : undefined,
        category,
        priority: priority || "media",
        voterId: Number(voterId),
        assignedTo: assignedTo ? Number(assignedTo) : undefined,
        coordinatorId: coordinatorId ? Number(coordinatorId) : undefined,
        createdBy: session.id ? Number(session.id) : undefined,
      })
      .returning();

    return NextResponse.json({ success: true, demand: row }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar demanda:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar demanda" },
      { status: 500 }
    );
  }
}
