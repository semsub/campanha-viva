import { NextRequest } from "next/server";
import { pool } from "@/db";

// GET /api/debug?token=SETUP_TOKEN — retorna status do banco

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  const expected = process.env.SETUP_TOKEN;
  if (!expected) {
    return Response.json({ error: "SETUP_TOKEN não configurado no servidor." }, { status: 500 });
  }
  if (token !== expected) {
    return Response.json({ error: "token inválido" }, { status: 401 });
  }

  const info: Record<string, unknown> = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseHost: process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL.replace(/^postgres(ql)?:\/\//, "https://")).host
      : null,
    nodeVersion: process.version,
  };

  try {
    const now = await pool.query<{ now: string }>("SELECT NOW() as now");
    info.dbNow = now.rows[0]?.now;
    const t = await pool.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
    );
    info.tables = t.rows.map((r) => r.tablename);
    try {
      const u = await pool.query<{ id: number; email: string; role: string; active: boolean }>(
        "SELECT id, email, role, active FROM users ORDER BY id",
      );
      info.users = u.rows;
    } catch (e) {
      info.usersError = e instanceof Error ? e.message : String(e);
    }
    return Response.json(info);
  } catch (e) {
    return Response.json(
      { ...info, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
