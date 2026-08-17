import { NextRequest } from "next/server";
import { pool } from "@/db";
import { hashPassword } from "@/lib/auth";

// POST /api/setup?token=SETUP_TOKEN
// Cria as tabelas necessárias (idempotente) e o Super Admin.
// Body opcional: { email, password, name }
export async function POST(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  const expected = process.env.SETUP_TOKEN;
  if (!expected) {
    return Response.json(
      { error: "Configure SETUP_TOKEN nas variáveis de ambiente do Render." },
      { status: 500 },
    );
  }
  if (token !== expected) {
    return Response.json({ error: "token inválido" }, { status: 401 });
  }

  let body: { email?: string; password?: string; name?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* body vazio ok */
  }
  const email = (body.email ?? "admin@campanhaviva.com.br").toLowerCase().trim();
  const password = body.password ?? "Admin@2026";
  const name = body.name ?? "Júnior Araújo";

  try {
    // 1) Enum de role (idempotente)
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('super_admin', 'coordinator', 'leader');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // 2) Tabelas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        active BOOLEAN DEFAULT TRUE
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'leader',
        manager_id INTEGER,
        territory TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        actor_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        entity TEXT,
        entity_id INTEGER,
        old_value TEXT,
        new_value TEXT,
        ip TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 3) Super Admin (upsert por email)
    const hash = hashPassword(password);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, active)
       VALUES ($1, $2, $3, 'super_admin', TRUE)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = 'super_admin',
             active = TRUE,
             updated_at = NOW();`,
      [name, email, hash],
    );

    return Response.json({
      ok: true,
      message: "Banco preparado e Super Admin criado.",
      login: { email, password: "***(a definida acima)***" },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
