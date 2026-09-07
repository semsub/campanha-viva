import { requireRole } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function UsuariosLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["super_admin", "admin", "coordinator"]);
  return <>{children}</>;
}
