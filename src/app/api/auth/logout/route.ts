import { clearSession, getSession } from "@/lib/auth";
import { audit, ipOf } from "@/lib/audit";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const s = await getSession();
  await clearSession();
  if (s) await audit({ actorId: s.id, actorRole: s.role, action: "logout", ip: ipOf(req) });
  return Response.json({ ok: true });
}
