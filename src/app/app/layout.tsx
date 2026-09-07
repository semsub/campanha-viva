import { requireSession } from "@/lib/guard";
import Shell from "@/components/Shell";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return <Shell user={session}>{children}</Shell>;
}
