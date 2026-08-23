import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { verifyPassword, createToken, COOKIE_NAME } from "@/lib/auth";
import { ensureSetup } from "@/lib/setup";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });

  try { await ensureSetup(); } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[LOGIN] DB setup:", msg);
    return NextResponse.json({ error: "Banco indisponível. Verifique DATABASE_URL.", detail: msg }, { status: 503 });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    const ip = req.headers.get("x-forwarded-for") ?? "—";

    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      if (user) { try { await db.insert(auditLogs).values({ userId: user.id, action: "login_failed", entity: "users", entityId: user.id, ip }); } catch {} }
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }

    const token = createToken({ id: user.id, name: user.name, email: user.email, role: user.role, territory: user.territory });

    const res = NextResponse.json({
      ok: true, role: user.role, name: user.name,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", secure: false, maxAge: 12 * 3600, path: "/" });

    try { await db.insert(auditLogs).values({ userId: user.id, action: "login_success", entity: "users", entityId: user.id, ip }); } catch {}

    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[LOGIN]", msg);
    return NextResponse.json({ error: "Falha ao consultar banco.", detail: msg }, { status: 500 });
  }
}
