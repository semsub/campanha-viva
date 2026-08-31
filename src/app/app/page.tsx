"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, PageHeader, Badge } from "@/components/UI";
import { getCategory } from "@/lib/categories";
import { ROLE_LABELS } from "@/lib/permissions";

type Stats = {
  users: number; voters: number; demands: number;
  openDemands: number; resolvedDemands: number;
  tasks: number; openTasks: number; events: number;
};

type Dash = {
  stats: Stats;
  roleBreakdown: { role: string; n: number }[];
  byCategory: { category: string; n: number }[];
  byStatus: { status: string; n: number }[];
};

export default function DashboardPage() {
  const [d, setD] = useState<Dash | null>(null);
  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setD);
  }, []);

  const cards = [
    { label: "Eleitores", value: d?.stats.voters ?? 0, icon: "🧑‍🤝‍🧑", color: "from-emerald-500 to-emerald-600", href: "/app/eleitores" },
    { label: "Demandas", value: d?.stats.demands ?? 0, icon: "📋", color: "from-blue-500 to-blue-600", href: "/app/demandas" },
    { label: "Demandas Abertas", value: d?.stats.openDemands ?? 0, icon: "🔓", color: "from-orange-500 to-orange-600", href: "/app/demandas" },
    { label: "Tarefas Pendentes", value: d?.stats.openTasks ?? 0, icon: "✅", color: "from-purple-500 to-purple-600", href: "/app/tarefas" },
    { label: "Eventos", value: d?.stats.events ?? 0, icon: "📅", color: "from-pink-500 to-pink-600", href: "/app/eventos" },
    { label: "Usuários", value: d?.stats.users ?? 0, icon: "👥", color: "from-slate-600 to-slate-800", href: "/app/usuarios" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral da campanha" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="p-4 hover:shadow-lg transition cursor-pointer">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} text-white text-lg flex items-center justify-center mb-3`}>
                {c.icon}
              </div>
              <div className="text-3xl font-extrabold text-[#003B6F] leading-none">{c.value}</div>
              <div className="text-xs text-slate-500 mt-1">{c.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-bold text-[#003B6F] mb-4">Demandas por categoria</h3>
          {!d?.byCategory.length && <div className="text-sm text-slate-400">Sem dados ainda.</div>}
          <div className="space-y-2">
            {d?.byCategory.slice(0, 8).map((c) => {
              const cat = getCategory(c.category);
              return (
                <div key={c.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                  <Badge color="blue">{c.n}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-[#003B6F] mb-4">Status das demandas</h3>
          {!d?.byStatus.length && <div className="text-sm text-slate-400">Sem dados ainda.</div>}
          <div className="grid grid-cols-2 gap-3">
            {d?.byStatus.map((s) => (
              <div key={s.status} className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-500 uppercase">{s.status.replace("_", " ")}</div>
                <div className="text-2xl font-bold text-[#003B6F]">{s.n}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 md:col-span-2">
          <h3 className="font-bold text-[#003B6F] mb-4">Equipe por perfil</h3>
          <div className="flex flex-wrap gap-3">
            {d?.roleBreakdown.map((r) => (
              <div key={r.role} className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="text-xs text-slate-500">{ROLE_LABELS[r.role as keyof typeof ROLE_LABELS]}</div>
                <div className="text-xl font-bold text-[#003B6F]">{r.n}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
