import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { verifyPassword, createSession } from "@/lib/auth";

// O e-mail + senha definem automaticamente o painel conforme o role:
// super_admin → console total | coordinator → região | leader → campo
export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return Response.json({ error: "Informe e-mail e senha." }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    const ip = req.headers.get("x-forwarded-for") ?? null;

    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      if (user) {
        await db.insert(auditLogs).values({
          userId: user.id,
          action: "login_failed",
          entity: "users",
          entityId: user.id,
          ip,
        });
      }
      return Response.json({ error: "Credenciais inválidas ou usuário inativo." }, { status: 401 });
    }

    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      territory: user.territory,
    });

    await db.insert(auditLogs).values({
      userId: user.id,
      action: "login_success",
      entity: "users",
      entityId: user.id,
      ip,
    });

    return Response.json({ ok: true, role: user.role, name: user.name });
  } catch (e) {
    // Exibe a causa real (banco não configurado, tabela ausente, SSL, etc.)
    const msg = e instanceof Error ? e.message : String(e);
    console.error("login error:", msg);
    return Response.json(
      { error: `Falha no servidor: ${msg}` },
      { status: 500 },
    );
  }
}
