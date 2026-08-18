import { NextRequest } from "next/server";
import { pool } from "@/db";
import { hashPassword } from "@/lib/auth";

// POST /api/setup?token=SETUP_TOKEN — cria/atualiza tabelas e Super Admin

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  const expected = process.env.SETUP_TOKEN;
  if (!expected) {
    return Response.json(
      { error: "Configure SETUP_TOKEN nas variáveis de ambiente." },
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
  const name = body.name ?? "Junior Araujo";

  try {
    // ENUMS
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('super_admin', 'coordinator', 'leader');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE demand_status AS ENUM ('aberta','em_andamento','resolvida','cancelada');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE demand_priority AS ENUM ('baixa','media','alta','urgente');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE task_status AS ENUM ('pendente','em_andamento','concluida');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // TABELAS
    await pool.query(`CREATE TABLE IF NOT EXISTS campaigns (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(), active BOOLEAN DEFAULT TRUE
    );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL,
      phone TEXT, password_hash TEXT NOT NULL,
      role user_role NOT NULL DEFAULT 'leader',
      manager_id INTEGER, territory TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS voters (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT, cpf TEXT,
      address TEXT, neighborhood TEXT, city TEXT, birth_date TEXT, notes TEXT,
      leader_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS demands (
      id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT,
      category TEXT NOT NULL,
      status demand_status NOT NULL DEFAULT 'aberta',
      priority demand_priority NOT NULL DEFAULT 'media',
      voter_id INTEGER REFERENCES voters(id),
      assigned_to INTEGER REFERENCES users(id),
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT,
      status task_status NOT NULL DEFAULT 'pendente',
      due_date TEXT,
      assigned_to INTEGER REFERENCES users(id),
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT,
      location TEXT, event_date TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      actor_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL, entity TEXT, entity_id INTEGER,
      detail TEXT, ip TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`);

    // Compatibilidade com versões antigas do schema (renomeia colunas se existirem)
    await pool.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='audit_logs' AND column_name='old_value') THEN
          ALTER TABLE audit_logs DROP COLUMN old_value;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='audit_logs' AND column_name='new_value') THEN
          ALTER TABLE audit_logs DROP COLUMN new_value;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name='audit_logs' AND column_name='detail') THEN
          ALTER TABLE audit_logs ADD COLUMN detail TEXT;
        END IF;
      END $$;
    `);

    // Super Admin (upsert)
    const hash = hashPassword(password);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, active)
       VALUES ($1, $2, $3, 'super_admin', TRUE)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = 'super_admin', active = TRUE, updated_at = NOW();`,
      [name, email, hash],
    );

    return Response.json({
      ok: true,
      message: "Banco preparado e Super Admin criado.",
      login: { email, senha: "(a definida acima)" },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
