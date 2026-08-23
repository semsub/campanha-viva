import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const email = (process.env.SUPER_ADMIN_EMAIL ?? "admin@campanhaviva.com.br").toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD ?? "Admin@2026";
const name = process.env.SUPER_ADMIN_NAME ?? "Júnior Araújo";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("🔧 Criando estrutura do banco...");

    // Enums
    await client.query(`DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin','admin','coordinator','leader'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await client.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin' BEFORE 'coordinator';`).catch(() => {});
    await client.query(`DO $$ BEGIN CREATE TYPE demand_status AS ENUM ('aberta','em_analise','aguardando_info','encaminhada','em_atendimento','aguardando_terceiro','resolvida','cancelada','encerrada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await client.query(`DO $$ BEGIN CREATE TYPE demand_priority AS ENUM ('baixa','media','alta','urgente'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await client.query(`DO $$ BEGIN CREATE TYPE task_status AS ENUM ('pendente','em_andamento','concluida','cancelada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    console.log("   ✅ Enums OK");

    // Drop and recreate tables to ensure clean state
    await client.query(`DROP TABLE IF EXISTS audit_logs CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS tasks CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS events CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS demands CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS demand_categories CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS voters CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS leaderships CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS users CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS neighborhoods CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS regions CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS municipalities CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS campaigns CASCADE;`);
    console.log("   ✅ Tabelas antigas removidas");

    // Campaigns
    await client.query(`CREATE TABLE campaigns (id SERIAL PRIMARY KEY, name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), active BOOLEAN DEFAULT true);`);

    // Territory
    await client.query(`CREATE TABLE municipalities (id SERIAL PRIMARY KEY, name TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'PA', active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE TABLE regions (id SERIAL PRIMARY KEY, name TEXT NOT NULL, municipality_id INTEGER REFERENCES municipalities(id), active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE TABLE neighborhoods (id SERIAL PRIMARY KEY, name TEXT NOT NULL, region_id INTEGER REFERENCES regions(id), municipality_id INTEGER REFERENCES municipalities(id), active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());`);

    // Users
    await client.query(`CREATE TABLE users (id SERIAL PRIMARY KEY, campaign_id INTEGER REFERENCES campaigns(id), name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, password_hash TEXT NOT NULL, role user_role NOT NULL DEFAULT 'leader', manager_id INTEGER, territory TEXT, region_id INTEGER REFERENCES regions(id), neighborhood_id INTEGER REFERENCES neighborhoods(id), municipality_id INTEGER REFERENCES municipalities(id), active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE UNIQUE INDEX users_email_unique ON users (email);`);

    // Leaderships
    await client.query(`CREATE TABLE leaderships (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) NOT NULL, coordinator_id INTEGER REFERENCES users(id), region_id INTEGER REFERENCES regions(id), neighborhood_id INTEGER REFERENCES neighborhoods(id), municipality_id INTEGER REFERENCES municipalities(id), community TEXT, active BOOLEAN NOT NULL DEFAULT true, entry_date DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());`);

    // Voters
    await client.query(`CREATE TABLE voters (id SERIAL PRIMARY KEY, name TEXT NOT NULL, social_name TEXT, birth_date DATE, cpf TEXT, phone TEXT, email TEXT, address TEXT, address_number TEXT, complement TEXT, neighborhood_id INTEGER REFERENCES neighborhoods(id), municipality_id INTEGER REFERENCES municipalities(id), region_id INTEGER REFERENCES regions(id), cep TEXT, reference_point TEXT, electoral_zone TEXT, electoral_section TEXT, voting_location TEXT, leadership_id INTEGER REFERENCES leaderships(id), coordinator_id INTEGER REFERENCES users(id), registered_by_id INTEGER REFERENCES users(id), first_contact_date DATE, last_contact_date DATE, contact_method TEXT, status TEXT NOT NULL DEFAULT 'ativo', notes TEXT, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`);

    // Demand Categories
    await client.query(`CREATE TABLE demand_categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL, parent_id INTEGER, icon TEXT, color TEXT, active BOOLEAN NOT NULL DEFAULT true, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now());`);

    // Demands
    await client.query(`CREATE TABLE demands (id SERIAL PRIMARY KEY, protocol TEXT NOT NULL, category_id INTEGER REFERENCES demand_categories(id), subcategory_id INTEGER REFERENCES demand_categories(id), description TEXT NOT NULL, priority demand_priority NOT NULL DEFAULT 'media', status demand_status NOT NULL DEFAULT 'aberta', voter_id INTEGER REFERENCES voters(id), leadership_id INTEGER REFERENCES leaderships(id), coordinator_id INTEGER REFERENCES users(id), assigned_to_id INTEGER REFERENCES users(id), region_id INTEGER REFERENCES regions(id), neighborhood_id INTEGER REFERENCES neighborhoods(id), deadline DATE, closed_at TIMESTAMPTZ, result TEXT, notes TEXT, created_by_id INTEGER REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`);
    await client.query(`CREATE UNIQUE INDEX demands_protocol_unique ON demands (protocol);`);

    // Tasks
    await client.query(`CREATE TABLE tasks (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, assigned_to_id INTEGER REFERENCES users(id), created_by_id INTEGER REFERENCES users(id), demand_id INTEGER REFERENCES demands(id), voter_id INTEGER REFERENCES voters(id), priority demand_priority NOT NULL DEFAULT 'media', status task_status NOT NULL DEFAULT 'pendente', region_id INTEGER REFERENCES regions(id), deadline DATE, completed_at TIMESTAMPTZ, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`);

    // Events
    await client.query(`CREATE TABLE events (id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT, type TEXT NOT NULL DEFAULT 'reuniao', event_date TIMESTAMPTZ, location TEXT, responsible_id INTEGER REFERENCES users(id), region_id INTEGER REFERENCES regions(id), created_by_id INTEGER REFERENCES users(id), notes TEXT, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`);

    // Audit Logs
    await client.query(`CREATE TABLE audit_logs (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), actor_id INTEGER REFERENCES users(id), action TEXT NOT NULL, entity TEXT, entity_id INTEGER, old_value TEXT, new_value TEXT, ip TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());`);

    console.log("   ✅ Todas as tabelas criadas");

    // Seed Super Admin
    const hash = bcrypt.hashSync(password, 12);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, active) VALUES ($1, $2, $3, 'super_admin', true)`,
      [name, email, hash]
    );
    console.log("   ✅ Super Admin criado");

    // Seed Categorias
    const cats = ["Saúde","Social","Educação","Infraestrutura","Emprego e Renda","Habitação","Segurança","Agricultura","Esporte","Cultura","Meio Ambiente","Pessoa com Deficiência","Idoso","Mulher","Juventude","Criança e Adolescente","Documentação","Transporte","Outros"];
    for (let i = 0; i < cats.length; i++) {
      await client.query("INSERT INTO demand_categories (name, sort_order) VALUES ($1, $2)", [cats[i], i]);
    }
    console.log("   ✅ 19 categorias de demanda criadas");

    console.log("");
    console.log("🎉 BANCO CONFIGURADO COM SUCESSO!");
    console.log("   📧 E-mail: " + email);
    console.log("   🔑 Senha:  " + password);

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(async (e) => { console.error("❌ ERRO:", e.message); await pool.end(); process.exit(1); });
