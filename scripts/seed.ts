#!/usr/bin/env tsx
/**
 * Script de inicialização do banco de dados
 * Executar: npx tsx scripts/seed.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Importar schema
import {
  campaigns, users, municipalities, regions, neighborhoods,
  electoralZones, demandCategories,
} from "../src/db/schema";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("❌ Erro: DATABASE_URL não configurada");
    console.error("Execute: export DATABASE_URL='postgresql://neondb_owner:npg_jZUwSthG41HR@ep-morning-snow-acfwca44-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'");
    process.exit(1);
  }

  console.log("🔗 Conectando ao banco de dados...");
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
  });

  const db = drizzle(pool);

  try {
    // Verificar se já existe dados
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("⚠️  Banco de dados já inicializado!");
      console.log("Se deseja reiniciar, execute: TRUNCATE TABLE users, campaigns, municipalities, regions, neighborhoods, electoral_zones, demand_categories CASCADE;");
      process.exit(0);
    }

    console.log("🚀 Iniciando seed do banco de dados...\n");

    // 1. Criar campanha
    console.log(" Criando campanha...");
    const [campaign] = await db.insert(campaigns).values({
      name: "Campanha Principal 2024",
      description: "Campanha de gestão territorial",
      state: "PA",
    }).returning();
    console.log("   ✓ Campanha criada (ID:", campaign.id, ")");

    // 2. Criar Super Admin
    console.log("\n Criando Super Admin...");
    const adminHash = await bcrypt.hash("230808Deus#", 12);
    const [superAdmin] = await db.insert(users).values({
      name: "Administrador Geral",
      email: "admin@campanhaviva.com.br",
      passwordHash: adminHash,
      role: "super_admin",
      campaignId: campaign.id,
    }).returning();
    console.log("   ✓ Super Admin criado");
    console.log("   📧 Email: admin@campanhaviva.com.br");
    console.log("   🔑 Senha: 230808Deus#");

    // 3. Criar municípios
    console.log("\n️  Criando municípios...");
    const [mun1] = await db.insert(municipalities).values({
      name: "Salinópolis",
      state: "PA",
      campaignId: campaign.id,
    }).returning();
    console.log("   ✓ Salinópolis/PA criado");

    // 4. Criar regiões
    console.log("\n📍 Criando regiões...");
    const [reg1] = await db.insert(regions).values({ name: "Zona Leste", municipalityId: mun1.id, campaignId: campaign.id }).returning();
    const [reg2] = await db.insert(regions).values({ name: "Zona Sul", municipalityId: mun1.id, campaignId: campaign.id }).returning();
    const [reg3] = await db.insert(regions).values({ name: "Zona Norte", municipalityId: mun1.id, campaignId: campaign.id }).returning();
    console.log("   ✓ 3 regiões criadas");

    // 5. Criar bairros
    console.log("\n🏘️  Criando bairros...");
    await db.insert(neighborhoods).values([
      { name: "Itaquera", regionId: reg1.id, municipalityId: mun1.id, campaignId: campaign.id },
      { name: "São Mateus", regionId: reg1.id, municipalityId: mun1.id, campaignId: campaign.id },
      { name: "Guaianases", regionId: reg1.id, municipalityId: mun1.id, campaignId: campaign.id },
      { name: "Grajaú", regionId: reg2.id, municipalityId: mun1.id, campaignId: campaign.id },
      { name: "Capão Redondo", regionId: reg2.id, municipalityId: mun1.id, campaignId: campaign.id },
      { name: "Santana", regionId: reg3.id, municipalityId: mun1.id, campaignId: campaign.id },
      { name: "Tucuruvi", regionId: reg3.id, municipalityId: mun1.id, campaignId: campaign.id },
    ]);
    console.log("   ✓ 7 bairros criados");

    // 6. Criar zonas eleitorais
    console.log("\n️  Criando zonas eleitorais...");
    await db.insert(electoralZones).values([
      { number: "001", municipalityId: mun1.id, campaignId: campaign.id },
      { number: "002", municipalityId: mun1.id, campaignId: campaign.id },
      { number: "003", municipalityId: mun1.id, campaignId: campaign.id },
    ]);
    console.log("   ✓ 3 zonas eleitorais criadas");

    // 7. Criar categorias de demandas
    console.log("\n️  Criando categorias de demandas...");
    
    const createCategory = async (name: string, parentId: number | null, icon: string, color: string, order: number) => {
      const [cat] = await db.insert(demandCategories).values({
        name, parentId, icon, color, campaignId: campaign.id, sortOrder: order, active: true,
      }).returning();
      return cat;
    };

    // Categorias principais
    const saude = await createCategory("Saúde", null, "🏥", "#ef4444", 1);
    const social = await createCategory("Social", null, "🤝", "#8b5cf6", 2);
    const educacao = await createCategory("Educação", null, "📚", "#3b82f6", 3);
    const infra = await createCategory("Infraestrutura", null, "🏗️", "#f59e0b", 4);
    const emprego = await createCategory("Emprego e Renda", null, "💼", "#10b981", 5);
    const habitacao = await createCategory("Habitação", null, "🏠", "#6366f1", 6);
    const agricultura = await createCategory("Agricultura", null, "", "#84cc16", 7);
    const esporte = await createCategory("Esporte", null, "⚽", "#06b6d4", 8);
    const cultura = await createCategory("Cultura", null, "🎭", "#ec4899", 9);
    const seguranca = await createCategory("Segurança", null, "", "#64748b", 10);
    const meioAmbiente = await createCategory("Meio Ambiente", null, "🌿", "#22c55e", 11);
    const pcd = await createCategory("Pessoa com Deficiência", null, "♿", "#a855f7", 12);
    const idoso = await createCategory("Idoso", null, "👴", "#78716c", 13);
    const mulher = await createCategory("Mulher", null, "👩", "#f43f5e", 14);
    const juventude = await createCategory("Juventude", null, "🧑", "#0ea5e9", 15);
    const crianca = await createCategory("Criança e Adolescente", null, "👶", "#fbbf24", 16);
    const documentacao = await createCategory("Documentação", null, "📄", "#94a3b8", 17);

    // Subcategorias Saúde
    await createCategory("Atendimento Médico", saude.id, "", "#ef4444", 1);
    await createCategory("Exames", saude.id, "", "#ef4444", 2);
    await createCategory("Medicamentos", saude.id, "", "#ef4444", 3);
    await createCategory("Odontologia", saude.id, "", "#ef4444", 4);
    await createCategory("Fisioterapia", saude.id, "", "#ef4444", 5);
    await createCategory("Marcação de Consulta", saude.id, "", "#ef4444", 6);
    await createCategory("Cirurgia", saude.id, "", "#ef4444", 7);
    await createCategory("Internação", saude.id, "", "#ef4444", 8);

    // Subcategorias Social
    await createCategory("CRAS", social.id, "", "#8b5cf6", 1);
    await createCategory("CREAS", social.id, "", "#8b5cf6", 2);
    await createCategory("Benefícios", social.id, "", "#8b5cf6", 3);
    await createCategory("Cesta Básica", social.id, "", "#8b5cf6", 4);
    await createCategory("Aluguel Social", social.id, "", "#8b5cf6", 5);

    // Subcategorias Infraestrutura
    await createCategory("Pavimentação", infra.id, "", "#f59e0b", 1);
    await createCategory("Iluminação Pública", infra.id, "", "#f59e0b", 2);
    await createCategory("Esgoto", infra.id, "", "#f59e0b", 3);
    await createCategory("Água", infra.id, "", "#f59e0b", 4);
    await createCategory("Limpeza Urbana", infra.id, "", "#f59e0b", 5);
    await createCategory("Transporte Público", infra.id, "", "#f59e0b", 6);

    console.log("   ✓ 17 categorias principais criadas");
    console.log("   ✓ 19 subcategorias criadas");

    // 8. Criar Coordenador
    console.log("\n👔 Criando Coordenador...");
    const coordHash = await bcrypt.hash("coord123", 12);
    await db.insert(users).values({
      name: "João Coordenador",
      email: "coord@sistema.com",
      passwordHash: coordHash,
      role: "coordenador_regional",
      campaignId: campaign.id,
      parentUserId: superAdmin.id,
    });
    console.log("   ✓ Coordenador criado");
    console.log("   📧 Email: coord@sistema.com");
    console.log("   🔑 Senha: coord123");

    // 9. Criar Liderança
    console.log("\n🤝 Criando Liderança...");
    const liderHash = await bcrypt.hash("lider123", 12);
    await db.insert(users).values({
      name: "Maria Liderança",
      email: "lider@sistema.com",
      passwordHash: liderHash,
      role: "lideranca",
      campaignId: campaign.id,
      parentUserId: superAdmin.id,
    });
    console.log("   ✓ Liderança criada");
    console.log("   📧 Email: lider@sistema.com");
    console.log("   🔑 Senha: lider123");

    console.log("\n✅ Seed concluído com sucesso!\n");
    console.log("═══════════════════════════════════════════════════");
    console.log(" CREDENCIAIS DE ACESSO");
    console.log("═══════════════════════════════════════════════════");
    console.log("Super Admin:  admin@campanhaviva.com.br  /  230808Deus#");
    console.log("Coordenador:  coord@sistema.com  /  coord123");
    console.log("Liderança:    lider@sistema.com  /  lider123");
    console.log("═══════════════════════════════════════════════════");
    console.log("\n️  ALTERE AS SENHAS APÓS O PRIMEIRO ACESSO!\n");

  } catch (error) {
    console.error(" Erro durante o seed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
