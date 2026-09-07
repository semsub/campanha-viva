import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const s = await getSession();
  redirect(s ? "/app" : "/login");
}
