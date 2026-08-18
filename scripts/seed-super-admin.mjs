// Seed do Super Admin — rode com: node scripts/seed-super-admin.mjs
// Configurável via env: SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD / SUPER_ADMIN_NAME
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const email = (process.env.SUPER_ADMIN_EMAIL ?? "admin@campanhaviva.com.br").toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD ?? "230808Deus#";
const name = process.env.SUPER_ADMIN_NAME ?? "Júnior Araújo";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const hash = bcrypt.hashSync(password, 12);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, active)
     VALUES ($1, $2, $3, 'super_admin', true)
     ON CONFLICT (email)
     DO UPDATE SET password_hash = EXCLUDED.password_hash,
                   role = 'super_admin',
                   active = true,
                   updated_at = now()`,
    [name, email, hash],
  );
  console.log(`Super Admin pronto: ${email}`);
  await pool.end();
}

run().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
