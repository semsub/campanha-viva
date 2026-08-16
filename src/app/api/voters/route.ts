import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { voters, leaderships, neighborhoods, municipalities } from "@/db/schema";
import { eq, and, ilike, or, sql, desc, count } from "drizzle-orm";
import { getSession, canManageVoters, isAdmin, isCoordinator } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const neighborhoodId = searchParams.get("neighborhoodId");
  const leadershipId = searchParams.get("leadershipId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  const conditions = [];
  if (session.campaignId) {
    conditions.push(eq(voters.campaignId, session.campaignId));
  }
  if (search) {
    conditions.push(or(ilike(voters.fullName, `%${search}%`), ilike(voters.phone || "", `%${search}%`)));
  }
  if (neighborhoodId) {
    conditions.push(eq(voters.neighborhoodId, parseInt(neighborhoodId)));
  }
  if (leadershipId) {
    conditions.push(eq(voters.leadershipId, parseInt(leadershipId)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select()
    .from(voters)
    .where(whereClause)
    .orderBy(desc(voters.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ total: count() })
    .from(voters)
    .where(whereClause);

  return NextResponse.json({
    voters: result,
    total: totalResult.total,
    page,
    totalPages: Math.ceil(totalResult.total / limit),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!canManageVoters(session.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const { fullName, socialName, birthDate, cpf, phone, email, address, addressNumber, complement, cep, referencePoint, municipalityId, neighborhoodId, regionId, community, electoralZoneId, electoralSectionId, leadershipId, firstContactDate, contactForm, consentGiven } = body;

  if (!fullName) {
    return NextResponse.json({ error: "Nome completo obrigatório" }, { status: 400 });
  }

  // Check for potential duplicates
  if (phone || cpf) {
    const dupConditions = [];
    if (phone) dupConditions.push(eq(voters.phone, phone));
    if (cpf) dupConditions.push(eq(voters.cpf, cpf));
    const duplicates = await db.select({ id: voters.id, fullName: voters.fullName }).from(voters).where(or(...dupConditions)).limit(5);
    if (duplicates.length > 0) {
      // Return warning but still allow creation
      // In production, this should be a separate check endpoint
    }
  }

  const [newVoter] = await db.insert(voters).values({
    fullName,
    socialName: socialName || null,
    birthDate: birthDate || null,
    cpf: cpf || null,
    phone: phone || null,
    email: email || null,
    address: address || null,
    addressNumber: addressNumber || null,
    complement: complement || null,
    cep: cep || null,
    referencePoint: referencePoint || null,
    municipalityId: municipalityId ? parseInt(municipalityId) : null,
    neighborhoodId: neighborhoodId ? parseInt(neighborhoodId) : null,
    regionId: regionId ? parseInt(regionId) : null,
    community: community || null,
    electoralZoneId: electoralZoneId ? parseInt(electoralZoneId) : null,
    electoralSectionId: electoralSectionId ? parseInt(electoralSectionId) : null,
    leadershipId: leadershipId ? parseInt(leadershipId) : null,
    coordinatorId: isCoordinator(session.role) ? session.id : null,
    campaignId: session.campaignId,
    firstContactDate: firstContactDate || new Date().toISOString().split("T")[0],
    lastContactDate: new Date().toISOString().split("T")[0],
    contactForm: contactForm || null,
    consentGiven: consentGiven || false,
    consentDate: consentGiven ? new Date() : null,
    createdBy: session.id,
    registrationStatus: "ativo",
  }).returning();

  await logAudit({
    userId: session.id,
    action: "create",
    entity: "voters",
    entityId: newVoter.id,
    newValue: { fullName },
  });

  return NextResponse.json({ voter: newVoter }, { status: 201 });
}
