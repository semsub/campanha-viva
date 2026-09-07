"use client";
import { useEffect, useState } from "react";
import { Card, PageHeader } from "@/components/UI";
import { getCategory } from "@/lib/categories";

type Stats = { users: number; voters: number; demands: number; pendingDemands: number; doneDemands: number; tasks: number; openTasks: number; events: number };
type Dash = { stats: Stats; byCategory: { category: string; n: number }[]; byStatus: { status: string; n: number }[] };

export default function Dashboard() {
  const [d, setD] = useState<Dash | null>(null);
  useEffect(() => { fetch("/api/dashboard").then((r) => r.json()).then(setD).catch(() => {}); }, []);

  const cards = [
    { label: "Eleitores", value: d?.stats.voters ?? 0, icon: "🧑‍🤝‍🧑", color: "from-emerald-500 to-emerald-600" },
    { label: "Demandas", value: d?.stats.demands ?? 0, icon: "📋", color: "from-blue-500 to-blue-600" },
    { label: "Pendentes", value: d?.stats.pendingDemands ?? 0, icon: "⏳", color: "from-orange-500 to-orange-600" },
    { label: "Concluídas", value: d?.stats.doneDemands ?? 0, icon: "✅", color: "from-green-600 to-green-700" },
    { label: "Tarefas Abertas", value: d?.stats.openTasks ?? 0, icon: "📝", color: "from-purple-500 to-purple-600" },
    { label: "Eventos", value: d?.stats.events ?? 0, icon: "📅", color: "from-pink-500 to-pink-600" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral do sistema" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center mb-3`}>{c.icon}</div>
            <div className="text-3xl font-extrabold text-[#003B6F] leading-none">{c.value}</div>
            <div className="text-xs text-slate-500 mt-1">{c.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-bold text-[#003B6F] mb-4">Demandas por categoria</h3>
          {(!d?.byCategory || d.byCategory.length === 0) && <div className="text-sm text-slate-400">Sem dados.</div>}
          <div className="space-y-2">
            {d?.byCategory.slice(0, 10).map((c) => {
              const cat = getCategory(c.category);
              return (
                <div key={c.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><span>{cat.icon}</span><span>{cat.label}</span></div>
                  <span className="font-bold text-[#003B6F]">{c.n}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-[#003B6F] mb-4">Status das demandas</h3>
          {(!d?.byStatus || d.byStatus.length === 0) && <div className="text-sm text-slate-400">Sem dados.</div>}
          <div className="grid grid-cols-2 gap-3">
            {d?.byStatus.map((s) => (
              <div key={s.status} className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-500 uppercase">{s.status.replace("_", " ")}</div>
                <div className="text-2xl font-bold text-[#003B6F]">{s.n}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
