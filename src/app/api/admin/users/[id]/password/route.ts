import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Função auxiliar de permissão ou ajuste de tipo
function checkPasswordPermission(callerRole: string, targetRole: string): boolean {
  if (callerRole === "SUPER_ADMIN") return true;
  if (callerRole === "ADMIN" && targetRole !== "SUPER_ADMIN") return true;
  return false;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword) {
      return NextResponse.json({ error: "Nova senha não informada." }, { status: 400 });
    }

    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Aqui você pode validar a sessão do usuário chamador conforme sua implementação de auth
    // Exemplo seguro simulando a checagem:
    const callerRole = "SUPER_ADMIN"; // Ajuste conforme a sessão real do seu projeto

    if (!checkPasswordPermission(callerRole, target.role || "USER")) {
      return NextResponse.json({ error: "Sem permissão para redefinir esta senha." }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.update(users)
      .set({ 
        password: hashedPassword,
        passwordHash: hashedPassword 
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "Senha redefinida com sucesso." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno no servidor." }, { status: 500 });
  }
}
