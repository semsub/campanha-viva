/**
 * BOOTSTRAP + MIGRAÇÕES INCREMENTAIS.
 * Se banco vazio → cria tudo. Se já existe → adiciona colunas novas em falta.
 */
import { pool } from "@/db";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_EMAIL = "admin@campanhaviva.com.br";
const DEFAULT_PASSWORD = "230808Deus#";
const DEFAULT_NAME = "Super Admin";

export async function GET() {
  try { await runMigrations(); return Response.json(await status()); }
  catch (e) { return Response.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    await runMigrations();
    const s = await status();
    if (s.hasAdmin) return Response.json({ ok: false, error: "Sistema já inicializado." }, { status: 400 });
    const body = await req.json().catch(() => ({} as Record<string, string>));
    const email = (body.email ?? DEFAULT_EMAIL).toLowerCase().trim();
    const password = body.password ?? DEFAULT_PASSWORD;
    const name = body.name ?? DEFAULT_NAME;
    const hash = hashPassword(password);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, active)
       VALUES ($1, $2, $3, 'super_admin', TRUE)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash, role='super_admin', active=TRUE, updated_at=NOW();`,
      [name, email, hash],
    );
    return Response.json({ ok: true, message: "Inicializado.", login: { email } });
  } catch (e) { return Response.json({ error: String(e) }, { status: 500 }); }
}

async function status() {
  const info: {
    hasDatabaseUrl: boolean; databaseHost: string | null;
    hasUsersTable: boolean; hasAdmin: boolean; adminEmail: string | null;
  } = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseHost: process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL.replace(/^postgres(ql)?:\/\//, "https://")).host : null,
    hasUsersTable: false, hasAdmin: false, adminEmail: null,
  };
  const t = await pool.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='users'",
  );
  info.hasUsersTable = t.rows.length > 0;
  if (info.hasUsersTable) {
    const u = await pool.query<{ email: string }>(
      "SELECT email FROM users WHERE role='super_admin' AND active=TRUE LIMIT 1",
    );
    info.hasAdmin = u.rows.length > 0;
    info.adminEmail = u.rows[0]?.email ?? null;
  }
  return info;
}

async function runMigrations() {
  // Enums
  await pool.query(`DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin','admin','coordinator','leader'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  await pool.query(`DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin' BEFORE 'coordinator'; EXCEPTION WHEN OTHERS THEN NULL; END $$;`);
  await pool.query(`DO $$ BEGIN CREATE TYPE demand_status AS ENUM ('pendente','em_andamento','concluido','cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  await pool.query(`DO $$ BEGIN CREATE TYPE demand_priority AS ENUM ('baixa','media','alta','urgente'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  await pool.query(`DO $$ BEGIN CREATE TYPE task_status AS ENUM ('pendente','em_andamento','concluido','cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  await pool.query(`DO $$ BEGIN CREATE TYPE event_status AS ENUM ('agendado','em_andamento','concluido','cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT,
    password_hash TEXT NOT NULL, role user_role NOT NULL DEFAULT 'leader',
    coordinator_id INTEGER,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_uidx ON users(email);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS users_coord_idx ON users(coordinator_id);`);
  // Migração: remove colunas antigas que possam existir
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='coordinator_id')
        THEN ALTER TABLE users ADD COLUMN coordinator_id INTEGER; END IF;
    END $$;
  `);

  await pool.query(`CREATE TABLE IF NOT EXISTS voters (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT,
    voter_title TEXT, zone TEXT, section TEXT,
    street TEXT, number TEXT, neighborhood TEXT, city TEXT,
    birth_date TEXT, notes TEXT,
    leader_id INTEGER REFERENCES users(id),
    coordinator_id INTEGER REFERENCES users(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);
  await pool.query(`CREATE INDEX IF NOT EXISTS voters_coord_idx ON voters(coordinator_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS voters_leader_idx ON voters(leader_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS voters_creator_idx ON voters(created_by);`);

  await pool.query(`CREATE TABLE IF NOT EXISTS demands (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, category TEXT NOT NULL,
    status demand_status NOT NULL DEFAULT 'pendente',
    priority demand_priority NOT NULL DEFAULT 'media',
    voter_id INTEGER NOT NULL REFERENCES voters(id),
    coordinator_id INTEGER REFERENCES users(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);
  await pool.query(`CREATE INDEX IF NOT EXISTS demands_coord_idx ON demands(coordinator_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS demands_creator_idx ON demands(created_by);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS demands_voter_idx ON demands(voter_id);`);

  await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT,
    status task_status NOT NULL DEFAULT 'pendente',
    priority demand_priority NOT NULL DEFAULT 'media',
    start_date TEXT, due_date TEXT,
    coordinator_id INTEGER REFERENCES users(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, location TEXT,
    event_date TEXT NOT NULL,
    status event_status NOT NULL DEFAULT 'agendado',
    coordinator_id INTEGER REFERENCES users(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id INTEGER REFERENCES users(id),
    actor_role user_role,
    action TEXT NOT NULL, entity TEXT, entity_id INTEGER,
    detail TEXT, ip TEXT,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);
  await pool.query(`CREATE INDEX IF NOT EXISTS audit_actor_idx ON audit_logs(actor_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_logs(created_at);`);
}
