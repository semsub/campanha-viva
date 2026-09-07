/**
 * BOOTSTRAP AUTOMÁTICO
 *  - GET  → verifica se o banco/tabelas/super_admin existem
 *  - POST → cria tabelas e o super_admin PADRÃO se ainda não houver nenhum
 *
 * Segurança: POST só funciona se NÃO houver super_admin ativo (deny-by-default).
 * Uma vez inicializado, o endpoint fica bloqueado permanentemente.
 */
import { pool } from "@/db";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_EMAIL = "admin@campanhaviva.com.br";
const DEFAULT_PASSWORD = "230808Deus#";
const DEFAULT_NAME = "Super Admin";

export async function GET() {
  try {
    await runMigrations();
    return Response.json(await checkStatus());
  } catch (e) {
    return Response.json({ error: msg(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await runMigrations();
    const status = await checkStatus();
    if (status.hasAdmin) {
      return Response.json(
        { ok: false, error: "Sistema já inicializado. Use /login normalmente." },
        { status: 400 },
      );
    }
    const body = await safeJson(req);
    const email = (body.email ?? DEFAULT_EMAIL).toLowerCase().trim();
    const password = body.password ?? DEFAULT_PASSWORD;
    const name = body.name ?? DEFAULT_NAME;

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
      message: "Sistema inicializado.",
      login: { email, note: "senha inicial definida na criação" },
    });
  } catch (e) {
    return Response.json({ error: msg(e) }, { status: 500 });
  }
}

async function checkStatus() {
  const info: {
    hasDatabaseUrl: boolean;
    databaseHost: string | null;
    hasUsersTable: boolean;
    hasAdmin: boolean;
    adminEmail: string | null;
  } = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseHost: process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL.replace(/^postgres(ql)?:\/\//, "https://")).host
      : null,
    hasUsersTable: false,
    hasAdmin: false,
    adminEmail: null,
  };
  const t = await pool.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='users'",
  );
  info.hasUsersTable = t.rows.length > 0;
  if (info.hasUsersTable) {
    const u = await pool.query<{ email: string }>(
      "SELECT email FROM users WHERE role='super_admin' AND active=TRUE ORDER BY id ASC LIMIT 1",
    );
    info.hasAdmin = u.rows.length > 0;
    info.adminEmail = u.rows[0]?.email ?? null;
  }
  return info;
}

async function runMigrations() {
  // Enums
  await pool.query(`DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin','admin','coordinator','leader'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  // adiciona 'admin' se enum antigo já existir sem ele
  await pool.query(`DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin' BEFORE 'coordinator'; EXCEPTION WHEN OTHERS THEN NULL; END $$;`);
  await pool.query(`DO $$ BEGIN CREATE TYPE demand_status AS ENUM ('pendente','em_andamento','concluido','cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  await pool.query(`DO $$ BEGIN CREATE TYPE demand_priority AS ENUM ('baixa','media','alta','urgente'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  await pool.query(`DO $$ BEGIN CREATE TYPE task_status AS ENUM ('pendente','em_andamento','concluido','cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  await pool.query(`DO $$ BEGIN CREATE TYPE event_status AS ENUM ('agendado','em_andamento','concluido','cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id),
    name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'leader',
    manager_id INTEGER, coordinator_id INTEGER, territory TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS users_coord_idx ON users(coordinator_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS users_manager_idx ON users(manager_id);`);
  // Migração incremental: adiciona colunas que podem faltar em bases antigas
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='campaign_id')
        THEN ALTER TABLE users ADD COLUMN campaign_id INTEGER REFERENCES campaigns(id); END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login_at')
        THEN ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='manager_id')
        THEN ALTER TABLE users ADD COLUMN manager_id INTEGER; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='coordinator_id')
        THEN ALTER TABLE users ADD COLUMN coordinator_id INTEGER; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='territory')
        THEN ALTER TABLE users ADD COLUMN territory TEXT; END IF;
    END $$;
  `);

  await pool.query(`CREATE TABLE IF NOT EXISTS municipalities (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, uf TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);
  await pool.query(`CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL,
    municipality_id INTEGER REFERENCES municipalities(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);
  await pool.query(`CREATE TABLE IF NOT EXISTS neighborhoods (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL,
    region_id INTEGER REFERENCES regions(id),
    municipality_id INTEGER REFERENCES municipalities(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);

  await pool.query(`CREATE TABLE IF NOT EXISTS voters (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id),
    name TEXT NOT NULL, phone TEXT,
    voter_title TEXT, zone TEXT, section TEXT,
    street TEXT, number TEXT, neighborhood TEXT, city TEXT, uf TEXT,
    birth_date TEXT, notes TEXT,
    leader_id INTEGER REFERENCES users(id),
    coordinator_id INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);
  await pool.query(`CREATE INDEX IF NOT EXISTS voters_coord_idx ON voters(coordinator_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS voters_leader_idx ON voters(leader_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS voters_creator_idx ON voters(created_by);`);
  // Migração incremental — adiciona colunas novas de voters se faltarem
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='voters' AND column_name='campaign_id')
        THEN ALTER TABLE voters ADD COLUMN campaign_id INTEGER REFERENCES campaigns(id); END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='voters' AND column_name='voter_title')
        THEN ALTER TABLE voters ADD COLUMN voter_title TEXT; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='voters' AND column_name='zone')
        THEN ALTER TABLE voters ADD COLUMN zone TEXT; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='voters' AND column_name='section')
        THEN ALTER TABLE voters ADD COLUMN section TEXT; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='voters' AND column_name='street')
        THEN ALTER TABLE voters ADD COLUMN street TEXT; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='voters' AND column_name='number')
        THEN ALTER TABLE voters ADD COLUMN number TEXT; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='voters' AND column_name='uf')
        THEN ALTER TABLE voters ADD COLUMN uf TEXT; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='voters' AND column_name='coordinator_id')
        THEN ALTER TABLE voters ADD COLUMN coordinator_id INTEGER REFERENCES users(id); END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='voters' AND column_name='created_by')
        THEN ALTER TABLE voters ADD COLUMN created_by INTEGER REFERENCES users(id); END IF;
    END $$;
  `);

  await pool.query(`CREATE TABLE IF NOT EXISTS demands (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL, description TEXT, category TEXT NOT NULL,
    status demand_status NOT NULL DEFAULT 'pendente',
    priority demand_priority NOT NULL DEFAULT 'media',
    voter_id INTEGER NOT NULL REFERENCES voters(id),
    assigned_to INTEGER REFERENCES users(id),
    coordinator_id INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
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
    assigned_to INTEGER REFERENCES users(id),
    coordinator_id INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);
  await pool.query(`CREATE INDEX IF NOT EXISTS tasks_coord_idx ON tasks(coordinator_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS tasks_creator_idx ON tasks(created_by);`);
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='start_date')
        THEN ALTER TABLE tasks ADD COLUMN start_date TEXT; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='priority')
        THEN ALTER TABLE tasks ADD COLUMN priority demand_priority NOT NULL DEFAULT 'media'; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='coordinator_id')
        THEN ALTER TABLE tasks ADD COLUMN coordinator_id INTEGER REFERENCES users(id); END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='updated_at')
        THEN ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW(); END IF;
    END $$;
  `);

  await pool.query(`CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT,
    location TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
    event_date TEXT NOT NULL,
    status event_status NOT NULL DEFAULT 'agendado',
    coordinator_id INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);
  await pool.query(`CREATE INDEX IF NOT EXISTS events_coord_idx ON events(coordinator_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS events_creator_idx ON events(created_by);`);
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='latitude')
        THEN ALTER TABLE events ADD COLUMN latitude DOUBLE PRECISION; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='longitude')
        THEN ALTER TABLE events ADD COLUMN longitude DOUBLE PRECISION; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='status')
        THEN ALTER TABLE events ADD COLUMN status event_status NOT NULL DEFAULT 'agendado'; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='coordinator_id')
        THEN ALTER TABLE events ADD COLUMN coordinator_id INTEGER REFERENCES users(id); END IF;
    END $$;
  `);

  await pool.query(`CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id INTEGER REFERENCES users(id),
    actor_role user_role,
    action TEXT NOT NULL, entity TEXT, entity_id INTEGER,
    detail TEXT, ip TEXT, user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`);
  await pool.query(`CREATE INDEX IF NOT EXISTS audit_actor_idx ON audit_logs(actor_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_logs(created_at);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_logs(entity, entity_id);`);
  // Migração incremental do audit
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='actor_role')
        THEN ALTER TABLE audit_logs ADD COLUMN actor_role user_role; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='user_agent')
        THEN ALTER TABLE audit_logs ADD COLUMN user_agent TEXT; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='success')
        THEN ALTER TABLE audit_logs ADD COLUMN success BOOLEAN NOT NULL DEFAULT TRUE; END IF;
      -- remove colunas antigas que davam conflito
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='user_id')
        THEN ALTER TABLE audit_logs DROP COLUMN user_id; END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='old_value')
        THEN ALTER TABLE audit_logs DROP COLUMN old_value; END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='new_value')
        THEN ALTER TABLE audit_logs DROP COLUMN new_value; END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='detail')
        THEN ALTER TABLE audit_logs ADD COLUMN detail TEXT; END IF;
    END $$;
  `);
}

async function safeJson(req: Request): Promise<{ email?: string; password?: string; name?: string }> {
  try { return await req.json(); } catch { return {}; }
}
function msg(e: unknown): string { return e instanceof Error ? e.message : String(e); }
