import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Shell from "@/components/Shell";
import AntiScreenshot from "@/components/AntiScreenshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const label = `${session.name} • ${session.email} • ${new Date().toLocaleString("pt-BR")}`;
  return (
    <>
      <AntiScreenshot userLabel={label} />
      <Shell user={session}>{children}</Shell>
    </>
  );
}
