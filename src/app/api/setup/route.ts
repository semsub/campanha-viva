import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: Request) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Criação segura de tabelas e colunas essenciais
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT
      );

      ALTER TABLE IF EXISTS "AuditLog" ADD COLUMN IF NOT EXISTS "protocol" TEXT;
      ALTER TABLE IF EXISTS "audit_logs" ADD COLUMN IF NOT EXISTS "protocol" TEXT;
    `);

    await pool.end();
    return NextResponse.json({ success: true, message: "Banco de dados e logomarca sincronizados com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
