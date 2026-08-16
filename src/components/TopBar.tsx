"use client";

import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { roleLabels } from "@/lib/utils";

export function TopBar({ user }: { user: SessionUser }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="hidden sm:block">
          <p className="text-sm text-gray-400">
            Bem-vindo(a), <span className="text-brand-blue font-bold">{user.name}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="badge bg-brand-blue/10 text-brand-blue border border-brand-blue/10">
          {roleLabels[user.role] || user.role}
        </span>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
        >
          Sair ⬅️
        </button>
      </div>
    </header>
  );
}
