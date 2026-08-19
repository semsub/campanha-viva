import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { voters, users } from "@/db/schema";
import { eq, like, or, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const leaderIdParam = searchParams.get("leaderId");

    let query = db
      .select({
        id: voters.id,
        name: voters.name,
        phone: voters.phone,
        voterTitle: voters.voterTitle,
        zone: voters.zone,
        section: voters.section,
        street: voters.street,
        number: voters.number,
        neighborhood: voters.neighborhood,
        city: voters.city,
        birthDate: voters.birthDate,
        notes: voters.notes,
        leaderId: voters.leaderId,
        leaderName: users.name,
        createdAt: voters.createdAt,
      })
      .from(voters)
      .leftJoin(users, eq(voters.leaderId, users.id));

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(voters.name, `%${search}%`),
          like(voters.phone, `%${search}%`),
          like(voters.neighborhood, `%${search}%`)
        )
      );
    }

    if (leaderIdParam) {
      conditions.push(eq(voters.leaderId, Number(leaderIdParam)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro ao listar eleitores:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar eleitores" },
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
    const {
      name,
      phone,
      voterTitle,
      zone,
      section,
      street,
      number,
      neighborhood,
      city,
      birthDate,
      notes,
      leaderId,
      coordinatorId,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "O nome do eleitor é obrigatório" },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(voters)
      .values({
        name: name.trim(),
        phone: phone ? phone.trim() : undefined,
        voterTitle: voterTitle ? voterTitle.trim() : undefined,
        zone: zone ? zone.trim() : undefined,
        section: section ? section.trim() : undefined,
        street: street ? street.trim() : undefined,
        number: number ? number.trim() : undefined,
        neighborhood: neighborhood ? neighborhood.trim() : undefined,
        city: city ? city.trim() : undefined,
        birthDate: birthDate ? birthDate.trim() : undefined,
        notes: notes ? notes.trim() : undefined,
        leaderId: leaderId ? Number(leaderId) : session.role === "leader" ? Number(session.id) : undefined,
        coordinatorId: coordinatorId ? Number(coordinatorId) : undefined,
        createdBy: session.id ? Number(session.id) : undefined,
      })
      .returning();

    return NextResponse.json({ success: true, voter: row }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar eleitor:", error);
    return NextResponse.json(
      { error: "Erro interno ao cadastrar eleitor" },
      { status: 500 }
    );
  }
}
