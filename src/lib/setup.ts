import { pool } from "@/db";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL ?? "admin@campanhaviva.com.br").toLowerCase();
const ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? "Admin@2026";
const ADMIN_NAME = process.env.SUPER_ADMIN_NAME ?? "Júnior Araújo";

let setupDone = false;

export async function ensureSetup() {
  if (setupDone) return;
  const client = await pool.connect();
  try {
    // Enums
    await client.query(`DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin','admin','coordinator','leader'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    // Add 'admin' to existing enum if it was created without it
    await client.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin' BEFORE 'coordinator';`).catch(() => {});
    await client.query(`DO $$ BEGIN CREATE TYPE demand_status AS ENUM ('aberta','em_analise','aguardando_info','encaminhada','em_atendimento','aguardando_terceiro','resolvida','cancelada','encerrada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await client.query(`DO $$ BEGIN CREATE TYPE demand_priority AS ENUM ('baixa','media','alta','urgente'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await client.query(`DO $$ BEGIN CREATE TYPE task_status AS ENUM ('pendente','em_andamento','concluida','cancelada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);

    // Tabelas
    await client.query(`CREATE TABLE IF NOT EXISTS campaigns (id SERIAL PRIMARY KEY, name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), active BOOLEAN DEFAULT true);`);
    await client.query(`CREATE TABLE IF NOT EXISTS municipalities (id SERIAL PRIMARY KEY, name TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'PA', active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE TABLE IF NOT EXISTS regions (id SERIAL PRIMARY KEY, name TEXT NOT NULL, municipality_id INTEGER REFERENCES municipalities(id), active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE TABLE IF NOT EXISTS neighborhoods (id SERIAL PRIMARY KEY, name TEXT NOT NULL, region_id INTEGER REFERENCES regions(id), municipality_id INTEGER REFERENCES municipalities(id), active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, campaign_id INTEGER REFERENCES campaigns(id), name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, password_hash TEXT NOT NULL, role user_role NOT NULL DEFAULT 'leader', manager_id INTEGER, territory TEXT, region_id INTEGER REFERENCES regions(id), neighborhood_id INTEGER REFERENCES neighborhoods(id), municipality_id INTEGER REFERENCES municipalities(id), active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);`);
    await client.query(`CREATE TABLE IF NOT EXISTS leaderships (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) NOT NULL, coordinator_id INTEGER REFERENCES users(id), region_id INTEGER REFERENCES regions(id), neighborhood_id INTEGER REFERENCES neighborhoods(id), municipality_id INTEGER REFERENCES municipalities(id), community TEXT, active BOOLEAN NOT NULL DEFAULT true, entry_date DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE TABLE IF NOT EXISTS voters (id SERIAL PRIMARY KEY, name TEXT NOT NULL, social_name TEXT, birth_date DATE, cpf TEXT, phone TEXT, email TEXT, address TEXT, address_number TEXT, complement TEXT, neighborhood_id INTEGER REFERENCES neighborhoods(id), municipality_id INTEGER REFERENCES municipalities(id), region_id INTEGER REFERENCES regions(id), cep TEXT, reference_point TEXT, electoral_zone TEXT, electoral_section TEXT, voting_location TEXT, leadership_id INTEGER REFERENCES leaderships(id), coordinator_id INTEGER REFERENCES users(id), registered_by_id INTEGER REFERENCES users(id), first_contact_date DATE, last_contact_date DATE, contact_method TEXT, status TEXT NOT NULL DEFAULT 'ativo', notes TEXT, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE TABLE IF NOT EXISTS demand_categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL, parent_id INTEGER, icon TEXT, color TEXT, active BOOLEAN NOT NULL DEFAULT true, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE TABLE IF NOT EXISTS demands (id SERIAL PRIMARY KEY, protocol TEXT NOT NULL, category_id INTEGER REFERENCES demand_categories(id), subcategory_id INTEGER REFERENCES demand_categories(id), description TEXT NOT NULL, priority demand_priority NOT NULL DEFAULT 'media', status demand_status NOT NULL DEFAULT 'aberta', voter_id INTEGER REFERENCES voters(id), leadership_id INTEGER REFERENCES leaderships(id), coordinator_id INTEGER REFERENCES users(id), assigned_to_id INTEGER REFERENCES users(id), region_id INTEGER REFERENCES regions(id), neighborhood_id INTEGER REFERENCES neighborhoods(id), deadline DATE, closed_at TIMESTAMPTZ, result TEXT, notes TEXT, created_by_id INTEGER REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS demands_protocol_unique ON demands (protocol);`);
    await client.query(`CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, assigned_to_id INTEGER REFERENCES users(id), created_by_id INTEGER REFERENCES users(id), demand_id INTEGER REFERENCES demands(id), voter_id INTEGER REFERENCES voters(id), priority demand_priority NOT NULL DEFAULT 'media', status task_status NOT NULL DEFAULT 'pendente', region_id INTEGER REFERENCES regions(id), deadline DATE, completed_at TIMESTAMPTZ, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE TABLE IF NOT EXISTS events (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, type TEXT NOT NULL DEFAULT 'reuniao', event_date TIMESTAMPTZ, location TEXT, responsible_id INTEGER REFERENCES users(id), region_id INTEGER REFERENCES regions(id), created_by_id INTEGER REFERENCES users(id), notes TEXT, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE TABLE IF NOT EXISTS audit_logs (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), actor_id INTEGER REFERENCES users(id), action TEXT NOT NULL, entity TEXT, entity_id INTEGER, old_value TEXT, new_value TEXT, ip TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());`);

    // Seed Super Admin
    const { rows } = await client.query("SELECT id FROM users WHERE email = $1", [ADMIN_EMAIL]);
    if (rows.length === 0) {
      const hash = bcrypt.hashSync(ADMIN_PASSWORD, 12);
      await client.query(`INSERT INTO users (name, email, password_hash, role, active) VALUES ($1, $2, $3, 'super_admin', true)`, [ADMIN_NAME, ADMIN_EMAIL, hash]);
    }

    // Seed categorias de demanda padrão
    const cats = await client.query("SELECT id FROM demand_categories LIMIT 1");
    if (cats.rows.length === 0) {
      const defaultCats = ["Saúde","Social","Educação","Infraestrutura","Emprego e Renda","Habitação","Segurança","Agricultura","Esporte","Cultura","Meio Ambiente","Pessoa com Deficiência","Idoso","Mulher","Juventude","Criança e Adolescente","Documentação","Transporte","Outros"];
      for (let i = 0; i < defaultCats.length; i++) {
        await client.query("INSERT INTO demand_categories (name, sort_order) VALUES ($1, $2)", [defaultCats[i], i]);
      }
    }

    setupDone = true;
  } catch (err) {
    console.error("[SETUP]", err);
    throw err;
  } finally {
    client.release();
  }
}
