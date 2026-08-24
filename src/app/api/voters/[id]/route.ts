import { NextResponse } from "next/server";
import { db } from "@/db";
import { voters, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const vid = parseInt(id);
    if (isNaN(vid)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const [voter] = await db.select().from(voters).where(eq(voters.id, vid)).limit(1);
    if (!voter) {
      return NextResponse.json({ error: "Eleitor não encontrado" }, { status: 404 });
    }

    // Validação de permissão baseada no coordenador
    if (session.role === "coordinator" && voter.coordinatorId !== session.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    return NextResponse.json({ voter });
  } catch (error) {
    console.error("Erro ao buscar eleitor:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const vid = parseInt(id);
    if (isNaN(vid)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const [voter] = await db.select().from(voters).where(eq(voters.id, vid)).limit(1);
    if (!voter) {
      return NextResponse.json({ error: "Eleitor não encontrado" }, { status: 404 });
    }

    if (session.role === "coordinator" && voter.coordinatorId !== session.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const patch: any = {};
    
    const allowedFields = [
      "name", "socialName", "birthDate", "cpf", "phone", "email",
      "address", "addressNumber", "addressComplement", "neighborhoodId",
      "regionId", "municipalityId", "electoralZone", "electoralSection",
      "voterRegistration", "status", "notes", "coordinatorId"
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        patch[field] = body[field] === "" ? null : body[field];
      }
    }
    patch.updatedAt = new Date();

    await db.update(voters).set(patch).where(eq(voters.id, vid));

    await db.insert(auditLogs).values({
      userId: session.id,
      action: "voter_update",
      entity: "voters",
      entityId: vid,
      newValue: JSON.stringify(patch),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar eleitor:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
