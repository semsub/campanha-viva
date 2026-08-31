import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function verifyPassword(plain: string, hashed: string | null): Promise<boolean> {
  if (!hashed) return false;
  return bcrypt.compare(plain, hashed);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const ip = req.headers.get("x-forwarded-for") ?? null;

    const isValidPassword = user ? await verifyPassword(password, user.passwordHash) : false;

    if (!user || !user.active || !isValidPassword) {
      try {
        if (user) {
          await db.insert(auditLogs).values({
            actorId: user.id,
            userId: user.id,
            action: "login_failed",
            entity: "auth",
            ip,
            detail: "Tentativa de login falhou",
          });
        }
      } catch (logErr) {
        console.error("Erro ao registrar log de auditoria:", logErr);
      }

      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    try {
      await db.insert(auditLogs).values({
        actorId: user.id,
        userId: user.id,
        action: "login_success",
        entity: "auth",
        ip,
        detail: "Login realizado com sucesso",
      });
    } catch (logErr) {
      console.error("Erro ao registrar log de auditoria:", logErr);
    }

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno no servidor." }, { status: 500 });
  }
}
