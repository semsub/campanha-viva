import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { audit, ipOf, uaOf } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 200 });
  await audit({
    actorId: s.id, actorRole: s.role,
    action: "screenshot_attempt", entity: "session",
    detail: `Usuário ${s.email} tentou capturar/imprimir a tela`,
    ip: ipOf(req), userAgent: uaOf(req), success: false,
  });
  return NextResponse.json({ ok: true });
}
