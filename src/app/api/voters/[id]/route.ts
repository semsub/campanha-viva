import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { voters, auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const vid = Number(id);
  const b = (await req.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["name","phone","cpf","address","neighborhood","city","birthDate","notes","leaderId"] as const) {
    if (b[k] !== undefined) patch[k] = b[k];
  }
  await db.update(voters).set(patch).where(eq(voters.id, vid));
  await db.insert(auditLogs).values({
    actorId: s.id, action: "voter_update", entity: "voters", entityId: vid,
    ip: req.headers.get("x-forwarded-for"),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  if (s.role === "leader") return NextResponse.json({ error: "sem permissão" }, { status: 403 });
  const { id } = await ctx.params;
  const vid = Number(id);
  await db.delete(voters).where(eq(voters.id, vid));
  await db.insert(auditLogs).values({
    actorId: s.id, action: "voter_delete", entity: "voters", entityId: vid,
    ip: req.headers.get("x-forwarded-for"),
  });
  return NextResponse.json({ ok: true });
}
