import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: Request) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await pool.query(`
      ALTER TABLE IF EXISTS "AuditLog" ADD COLUMN IF NOT EXISTS "protocol" TEXT;
      ALTER TABLE IF EXISTS "audit_logs" ADD COLUMN IF NOT EXISTS "protocol" TEXT;
    `);

    await pool.end();
    return NextResponse.json({ success: true, message: "Banco atualizado com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
