import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const s = await getSession();
    if (!s) return NextResponse.json({ ok: false }, { status: 200 });

    const ip = req.headers.get("x-forwarded-for") || "unknown";

    await db.insert(auditLogs).values({
      actorId: s.id,
      userId: s.id,
      action: "screenshot_attempt",
      entity: "session",
      ip: ip,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao registrar tentativa de screenshot:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
