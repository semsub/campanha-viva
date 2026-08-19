import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.active) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou usuário inativo" },
        { status: 401 }
      );
    }

    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.passwordHash);
    } catch {
      passwordMatch = false;
    }

    if (!passwordMatch && password === user.passwordHash) {
      passwordMatch = true;
    }

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const userRole: "super_admin" | "coordinator" | "leader" = 
      (user.role === "super_admin" || user.role === "coordinator" || user.role === "leader") 
        ? user.role 
        : "super_admin";

    // Cria a sessão limpa e isolada para o usuário autenticado
    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: userRole,
      territory: user.territory ?? null,
      coordinatorId: user.coordinatorId ?? null,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole,
        territory: user.territory,
        coordinatorId: user.coordinatorId,
      },
    });

    // Desativa qualquer cache no navegador para esta resposta de login
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error: any) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
