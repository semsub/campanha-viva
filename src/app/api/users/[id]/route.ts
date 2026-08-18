import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (typeof body.active === "boolean") {
      updateData.active = body.active;
    }

    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json({ error: "A senha deve ter no mínimo 6 caracteres" }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Acesso negado. Apenas super_admin pode remover usuários." }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    await db.delete(users).where(eq(users.id, userId));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
