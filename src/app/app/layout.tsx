import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { AntiScreenshot } from "@/components/AntiScreenshot";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const label = `${session.name || session.email} (${session.role})`;

  return (
    <>
      <AntiScreenshot userLabel={label} />
      <Shell user={session as any}>{children}</Shell>
    </>
  );
}
