"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

type User = { name: string; email: string; role: string };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) { setUser(d.user); setLoading(false); }
        else router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F8FB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-[#003B6F] border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-sm text-[#6b7a8f]">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F8FB]">
      <div className="h-1 w-full bg-gradient-to-r from-[#003B6F] via-[#0B4F8A] to-[#F07A1A]" />

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 rounded-lg bg-[#003B6F] p-2.5 text-white shadow-lg lg:hidden"
      >
        ☰
      </button>

      {/* Sidebar mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-20 bg-black/40 lg:hidden" />
      )}
      <div className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-200 z-30 fixed`}>
        <Sidebar user={user} />
      </div>

      {/* Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
