import { requireRole } from "@/lib/guard";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function L({ children }: { children: React.ReactNode }) {
  await requireRole(["super_admin", "admin"]);
  return <>{children}</>;
}
