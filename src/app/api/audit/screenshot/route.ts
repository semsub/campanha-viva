import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 200 });
  try {
    await db.insert(auditLogs).values({
      actorId: s.id, userId: s.id,
      action: "screenshot_attempt",
      entity: "session",
      detail: `Usuário ${s.email} tentou capturar/imprimir a tela`,
      ip: req.headers.get("x-forwarded-for"),
    });
  } catch { /* silencia */ }
  return NextResponse.json({ ok: true });
}
