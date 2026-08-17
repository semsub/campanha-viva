import { campaigns } from "@/db/schema";
import { db } from "@/db";

export async function GET() {
  const all = await db.select().from(campaigns);
  return Response.json({ campaigns: all });
}
