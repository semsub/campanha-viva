import { NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME, type SessionUser } from "./auth";

/** Extract session from request cookies — use in API routes */
export function getSessionFromRequest(req: NextRequest): SessionUser | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
