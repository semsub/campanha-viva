import { pool } from "@/db";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Endpoint de bootstrap AUTOMÁTICO:
// - GET: retorna o status atual (existe tabela users? existe super admin?)
// - POST: cria tabelas + super admin PADRÃO se ainda não houver nenhum usuário
//   (não requer token porque é seguro: só executa quando o banco está vazio)
export async function GET() {
  try {
    const info = await checkStatus();
    return Response.json(info);
  } catch (e) {
    return Response.json({ error: msg(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Se já houver qualquer usuário, este endpoint fica bloqueado (segurança)
    const status = await checkStatus();
    if (status.hasAdmin) {
      return Response.json(
        { ok: false, error: "Sistema já inicializado. Use /login normalmente." },
        { status: 400 },
      );
    }

    // Cria todas as tabelas
    await runMigrations();

    // Cria super admin padrão
    const body = await safeJson(req);
    const email = (body.email ?? "admin@campanhaviva.com.br").toLowerCase().trim();
    const password = body.password ?? "Admin@2026";
    const name = body.name ?? "Junior Araujo";

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
      message: "Sistema inicializado com sucesso.",
      login: { email, password: "(a definida na criação)" },
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
      "SELECT email FROM users WHERE role='super_admin' AND active=TRUE LIMIT 1",
    );
    info.hasAdmin = u.rows.length > 0;
    info.adminEmail = u.rows[0]?.email ?? null;
  }
  return info;
}

async function runMigrations() {
  await pool.query(`DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin','coordinator','leader'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  await pool.query(`DO $$ BEGIN CREATE TYPE demand_status AS ENUM ('aberta','em_andamento','resolvida','cancelada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  await pool.query(`DO $$ BEGIN CREATE TYPE demand_priority AS ENUM ('baixa','media','alta','urgente'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  await pool.query(`DO $$ BEGIN CREATE TYPE task_status AS ENUM ('pendente','em_andamento','concluida'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS campaigns (id SERIAL PRIMARY KEY, name TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW(), active BOOLEAN DEFAULT TRUE);`);
  await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, password_hash TEXT NOT NULL, role user_role NOT NULL DEFAULT 'leader', manager_id INTEGER, territory TEXT, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW());`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email);`);
  await pool.query(`CREATE TABLE IF NOT EXISTS voters (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT, cpf TEXT, address TEXT, neighborhood TEXT, city TEXT, birth_date TEXT, notes TEXT, leader_id INTEGER REFERENCES users(id), created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW());`);
  await pool.query(`CREATE TABLE IF NOT EXISTS demands (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, category TEXT NOT NULL, status demand_status NOT NULL DEFAULT 'aberta', priority demand_priority NOT NULL DEFAULT 'media', voter_id INTEGER REFERENCES voters(id), assigned_to INTEGER REFERENCES users(id), created_by INTEGER REFERENCES users(id), created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW());`);
  await pool.query(`CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, status task_status NOT NULL DEFAULT 'pendente', due_date TEXT, assigned_to INTEGER REFERENCES users(id), created_by INTEGER REFERENCES users(id), created_at TIMESTAMP NOT NULL DEFAULT NOW());`);
  await pool.query(`CREATE TABLE IF NOT EXISTS events (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, location TEXT, event_date TEXT NOT NULL, created_by INTEGER REFERENCES users(id), created_at TIMESTAMP NOT NULL DEFAULT NOW());`);
  await pool.query(`CREATE TABLE IF NOT EXISTS audit_logs (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), actor_id INTEGER REFERENCES users(id), action TEXT NOT NULL, entity TEXT, entity_id INTEGER, detail TEXT, ip TEXT, created_at TIMESTAMP NOT NULL DEFAULT NOW());`);
}

async function safeJson(req: Request): Promise<{ email?: string; password?: string; name?: string }> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
