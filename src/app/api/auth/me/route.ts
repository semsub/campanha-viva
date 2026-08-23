import { NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return Response.json({ user: null }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return Response.json({ user: null }, { status: 401 });
  return Response.json({ user });
}
