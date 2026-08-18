import { NextRequest, NextResponse } from "next/server";
// Ajuste baseado em: src/app/api/users/route.ts -> volta 3 pastas para chegar em src
import { db } from "../../../lib/db"; 
import { users } from "../../../lib/db/schema";
import { like, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "../../../lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const url = new URL(req.url);
    const search = url.searchParams.get("q");

    let query = db.select().from(users);
    if (search) {
      query = query.where(or(like(users.name, `%${search}%`), like(users.email, `%${search}%`))) as any;
    }

    const allUsers = await query;
    return NextResponse.json({ users: allUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao buscar usuários" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { name, email, password, role, phone, territory } = body;

    if (!name || !email || !password) return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
      name, email, password: hashedPassword, role: role || "leader", phone, territory, active: true, createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao criar" }, { status: 500 });
  }
}
