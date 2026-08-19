import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { like, or, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    let query = db.select().from(users);

    if (search) {
      query = query.where(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      ) as any;
    }

    const allUsers = await query;

    // Remove passwordHash before sending to client
    const safeUsers = allUsers.map(({ passwordHash, ...user }) => user);

    return NextResponse.json(safeUsers);
  } catch (error: any) {
    console.error("Erro ao listar usuários:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar usuários" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "super_admin" && session.role !== "coordinator")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, territory, coordinatorId, campaignId } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios" },
        { status: 400 }
      );
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "E-mail já cadastrado no sistema" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role,
        territory: territory || null,
        coordinatorId: coordinatorId ? Number(coordinatorId) : null,
        campaignId: campaignId ? Number(campaignId) : null,
        active: true,
      })
      .returning();

    const { passwordHash: _, ...safeUser } = newUser;

    return NextResponse.json({ success: true, user: safeUser }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno ao cadastrar usuário" },
      { status: 500 }
    );
  }
}
