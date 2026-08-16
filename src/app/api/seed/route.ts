import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, campaigns, municipalities, regions, neighborhoods, demandCategories, electoralZones } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Check if already seeded
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      return NextResponse.json({ message: "Already seeded" });
    }

    // Create campaign
    const [campaign] = await db.insert(campaigns).values({
      name: "Campanha Principal 2024",
      description: "Campanha de gestão territorial",
      state: "SP",
    }).returning();

    // Create super admin
    const adminHash = await hashPassword("admin123");
    const [superAdmin] = await db.insert(users).values({
      name: "Administrador Geral",
      email: "admin@sistema.com",
      passwordHash: adminHash,
      role: "super_admin",
      campaignId: campaign.id,
    }).returning();

    // Create municipalities
    const [mun1] = await db.insert(municipalities).values({
      name: "São Paulo",
      state: "SP",
      campaignId: campaign.id,
    }).returning();

    // Create regions
    const [reg1] = await db.insert(regions).values({ name: "Zona Leste", municipalityId: mun1.id, campaignId: campaign.id }).returning();
    const [reg2] = await db.insert(regions).values({ name: "Zona Sul", municipalityId: mun1.id, campaignId: campaign.id }).returning();
    const [reg3] = await db.insert(regions).values({ name: "Zona Norte", municipalityId: mun1.id, campaignId: campaign.id }).returning();

    // Create neighborhoods
    await db.insert(neighborhoods).values([
      { name: "Itaquera", regionId: reg1.id, municipalityId: mun1.id, campaignId: campaign.id },
      { name: "São Mateus", regionId: reg1.id, municipalityId: mun1.id, campaignId: campaign.id },
      { name: "Guaianases", regionId: reg1.id, municipalityId: mun1.id, campaignId: campaign.id },
      { name: "Grajaú", regionId: reg2.id, municipalityId: mun1.id, campaignId: campaign.id },
      { name: "Capão Redondo", regionId: reg2.id, municipalityId: mun1.id, campaignId: campaign.id },
      { name: "Santana", regionId: reg3.id, municipalityId: mun1.id, campaignId: campaign.id },
      { name: "Tucuruvi", regionId: reg3.id, municipalityId: mun1.id, campaignId: campaign.id },
    ]);

    // Create electoral zones
    await db.insert(electoralZones).values([
      { number: "001", municipalityId: mun1.id, campaignId: campaign.id },
      { number: "002", municipalityId: mun1.id, campaignId: campaign.id },
      { number: "003", municipalityId: mun1.id, campaignId: campaign.id },
    ]);

    // Create demand categories (configurable tree)
    const createCategory = async (name: string, parentId: number | null, icon: string, color: string, order: number) => {
      const [cat] = await db.insert(demandCategories).values({
        name, parentId, icon, color, campaignId: campaign.id, sortOrder: order, active: true,
      }).returning();
      return cat;
    };

    // Main categories
    const saude = await createCategory("Saúde", null, "🏥", "#ef4444", 1);
    const social = await createCategory("Social", null, "🤝", "#8b5cf6", 2);
    const educacao = await createCategory("Educação", null, "📚", "#3b82f6", 3);
    const infra = await createCategory("Infraestrutura", null, "🏗️", "#f59e0b", 4);
    const emprego = await createCategory("Emprego e Renda", null, "💼", "#10b981", 5);
    const habitacao = await createCategory("Habitação", null, "🏠", "#6366f1", 6);
    const agricultura = await createCategory("Agricultura", null, "🌾", "#84cc16", 7);
    const esporte = await createCategory("Esporte", null, "⚽", "#06b6d4", 8);
    const cultura = await createCategory("Cultura", null, "🎭", "#ec4899", 9);
    const seguranca = await createCategory("Segurança", null, "🔒", "#64748b", 10);
    const meioAmbiente = await createCategory("Meio Ambiente", null, "🌿", "#22c55e", 11);
    const pcd = await createCategory("Pessoa com Deficiência", null, "♿", "#a855f7", 12);
    const idoso = await createCategory("Idoso", null, "👴", "#78716c", 13);
    const mulher = await createCategory("Mulher", null, "👩", "#f43f5e", 14);
    const juventude = await createCategory("Juventude", null, "🧑", "#0ea5e9", 15);
    const crianca = await createCategory("Criança e Adolescente", null, "👶", "#fbbf24", 16);
    const documentacao = await createCategory("Documentação", null, "📄", "#94a3b8", 17);

    // Sub-categories for Saúde
    await createCategory("Atendimento Médico", saude.id, "", "#ef4444", 1);
    await createCategory("Exames", saude.id, "", "#ef4444", 2);
    await createCategory("Medicamentos", saude.id, "", "#ef4444", 3);
    await createCategory("Odontologia", saude.id, "", "#ef4444", 4);
    await createCategory("Fisioterapia", saude.id, "", "#ef4444", 5);
    await createCategory("Marcação de Consulta", saude.id, "", "#ef4444", 6);
    await createCategory("Cirurgia", saude.id, "", "#ef4444", 7);
    await createCategory("Internação", saude.id, "", "#ef4444", 8);

    // Sub-categories for Social
    await createCategory("CRAS", social.id, "", "#8b5cf6", 1);
    await createCategory("CREAS", social.id, "", "#8b5cf6", 2);
    await createCategory("Benefícios", social.id, "", "#8b5cf6", 3);
    await createCategory("Cesta Básica", social.id, "", "#8b5cf6", 4);
    await createCategory("Aluguel Social", social.id, "", "#8b5cf6", 5);

    // Sub-categories for Infraestrutura
    await createCategory("Pavimentação", infra.id, "", "#f59e0b", 1);
    await createCategory("Iluminação Pública", infra.id, "", "#f59e0b", 2);
    await createCategory("Esgoto", infra.id, "", "#f59e0b", 3);
    await createCategory("Água", infra.id, "", "#f59e0b", 4);
    await createCategory("Limpeza Urbana", infra.id, "", "#f59e0b", 5);
    await createCategory("Transporte Público", infra.id, "", "#f59e0b", 6);

    // Create coordinator
    const coordHash = await hashPassword("coord123");
    const [coord] = await db.insert(users).values({
      name: "João Coordenador",
      email: "coord@sistema.com",
      passwordHash: coordHash,
      role: "coordenador_regional",
      campaignId: campaign.id,
      parentUserId: superAdmin.id,
    }).returning();

    // Create leadership
    const liderHash = await hashPassword("lider123");
    const [lider] = await db.insert(users).values({
      name: "Maria Liderança",
      email: "lider@sistema.com",
      passwordHash: liderHash,
      role: "lideranca",
      campaignId: campaign.id,
      parentUserId: coord.id,
    }).returning();

    return NextResponse.json({
      message: "Seed completed",
      users: {
        admin: "admin@sistema.com / admin123",
        coordinator: "coord@sistema.com / coord123",
        leadership: "lider@sistema.com / lider123",
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed", details: String(error) }, { status: 500 });
  }
}
