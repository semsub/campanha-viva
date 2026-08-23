import { pool } from "@/db";

export async function GET() {
  const checks: Record<string, string> = {};
  const dbUrl = process.env.DATABASE_URL ?? "";

  checks["1_DATABASE_URL"] = dbUrl
    ? `✅ Configurada (${dbUrl.substring(0, 30)}...)`
    : "❌ NÃO CONFIGURADA — vá em Render → Environment → adicione DATABASE_URL";

  checks["2_SESSION_SECRET"] = process.env.SESSION_SECRET
    ? "✅ Configurada"
    : "⚠️ Usando padrão (funciona para testes)";

  try {
    const client = await pool.connect();
    const { rows } = await client.query("SELECT current_database() AS db, now() AS ts");
    checks["3_CONEXAO_BANCO"] = `✅ Conectado — banco: ${rows[0].db}`;

    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    const tableNames = tables.rows.map((r: { tablename: string }) => r.tablename);
    checks["4_TABELAS"] = tableNames.length > 0 ? `✅ ${tableNames.length} tabelas: ${tableNames.join(", ")}` : "❌ Nenhuma tabela (o login vai criar automaticamente)";

    try {
      const admin = await client.query("SELECT id, email, role, active FROM users WHERE role='super_admin' LIMIT 1");
      checks["5_SUPER_ADMIN"] = admin.rows.length > 0
        ? `✅ Existe: ${admin.rows[0].email} (ativo: ${admin.rows[0].active})`
        : "❌ Não existe (o login vai criar: admin@campanhaviva.com.br / Admin@2026)";
    } catch {
      checks["5_SUPER_ADMIN"] = "⚠️ Tabela users não existe ainda (será criada no primeiro login)";
    }

    client.release();
  } catch (err: unknown) {
    checks["3_CONEXAO_BANCO"] = `❌ FALHOU: ${err instanceof Error ? err.message : String(err)}`;
  }

  checks["6_NODE"] = process.version;
  checks["7_ENV"] = process.env.NODE_ENV ?? "undefined";

  return Response.json(checks);
}
