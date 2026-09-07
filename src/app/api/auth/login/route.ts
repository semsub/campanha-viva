import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword, createSession } from "@/lib/auth";
import { audit, ipOf, uaOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = ipOf(req);
  const ua = uaOf(req);
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return Response.json({ error: "Informe e-mail e senha." }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));

    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      await audit({
        actorId: user?.id ?? null,
        actorRole: user?.role ?? null,
        action: "login_failed",
        entity: "users",
        entityId: user?.id ?? null,
        detail: `Tentativa falha: ${email}`,
        ip, userAgent: ua, success: false,
      });
      return Response.json({ error: "Credenciais inválidas ou usuário inativo." }, { status: 401 });
    }

    // Para coord: coordinatorId = ele mesmo; para leader: valor da coluna; para super/admin: null
    const coordinatorId =
      user.role === "coordinator" ? user.id :
      user.role === "leader" ? (user.coordinatorId ?? null) : null;

    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      campaignId: user.campaignId,
      coordinatorId,
    });

    // Atualiza último login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    await audit({
      actorId: user.id, actorRole: user.role,
      action: "login_success", entity: "users", entityId: user.id,
      ip, userAgent: ua,
    });

    return Response.json({ ok: true, role: user.role, name: user.name });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("login error:", msg);
    return Response.json({ error: `Falha no servidor: ${msg}` }, { status: 500 });
  }
}
