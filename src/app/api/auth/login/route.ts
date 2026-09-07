import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword, createSession } from "@/lib/auth";
import { audit, ipOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = ipOf(req);
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) return Response.json({ error: "Informe e-mail e senha." }, { status: 400 });

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      await audit({
        actorId: user?.id ?? null, actorRole: user?.role ?? null,
        action: "login_failed", entity: "users", entityId: user?.id ?? null,
        detail: `Tentativa: ${email}`, ip, success: false,
      });
      return Response.json({ error: "Credenciais inválidas ou usuário inativo." }, { status: 401 });
    }

    // coord: coordinatorId = ele mesmo; leader: coordinator_id do banco; senão: null
    const coordinatorId =
      user.role === "coordinator" ? user.id
      : user.role === "leader" ? (user.coordinatorId ?? null)
      : null;

    await createSession({
      id: user.id, name: user.name, email: user.email,
      role: user.role, coordinatorId,
    });

    await audit({
      actorId: user.id, actorRole: user.role,
      action: "login_success", entity: "users", entityId: user.id, ip,
    });

    return Response.json({ ok: true, role: user.role, name: user.name });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: `Falha no servidor: ${msg}` }, { status: 500 });
  }
}
