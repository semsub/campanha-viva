"use client";

import { useEffect, useState } from "react";
import { statusLabels, priorityLabels, statusColors, priorityColors } from "@/lib/utils";
import Link from "next/link";

interface DashboardData {
  stats: {
    coordinators: number;
    leaderships: number;
    voters: number;
    totalDemands: number;
    openDemands: number;
    resolvedDemands: number;
    pendingTasks: number;
    upcomingEvents: number;
  };
  demandsByStatus: Array<{ status: string; total: number }>;
  demandsByCategory: Array<{ categoryId: number; categoryName: string; icon: string; color: string; total: number }>;
  demandsByPriority: Array<{ priority: string; total: number }>;
  demandsByRegion: Array<{ regionName: string | null; total: number }>;
  recentDemands: Array<{
    id: number; protocol: string; description: string;
    status: string; priority: string; createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
          Carregando dashboard...
        </div>
      </div>
    );
  }

  if (!data) return <div>Erro ao carregar dados</div>;

  const { stats } = data;

  const statCards = [
    { label: "Coordenadores", value: stats.coordinators, icon: "👔", gradient: "from-blue-500 to-blue-600" },
    { label: "Lideranças", value: stats.leaderships, icon: "🤝", gradient: "from-indigo-500 to-indigo-600" },
    { label: "Eleitores", value: stats.voters, icon: "👥", gradient: "from-brand-orange to-brand-orange-light" },
    { label: "Total Demandas", value: stats.totalDemands, icon: "📋", gradient: "from-purple-500 to-purple-600" },
    { label: "Demandas Abertas", value: stats.openDemands, icon: "🔓", gradient: "from-amber-500 to-amber-600" },
    { label: "Resolvidas", value: stats.resolvedDemands, icon: "✅", gradient: "from-emerald-500 to-emerald-600" },
    { label: "Tarefas Pendentes", value: stats.pendingTasks, icon: "📝", gradient: "from-rose-500 to-rose-600" },
    { label: "Próximos Eventos", value: stats.upcomingEvents, icon: "📅", gradient: "from-cyan-500 to-cyan-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue" style={{ fontFamily: "'Playfair Display', serif" }}>
            Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Visão geral da plataforma</p>
        </div>
        <div className="text-xs text-gray-400 bg-white rounded-xl px-4 py-2 border border-gray-100">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card group">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${card.gradient} opacity-5 -translate-y-4 translate-x-4 group-hover:opacity-10 transition-opacity duration-500`} />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                <p className="text-3xl font-extrabold text-brand-blue mt-1.5">{card.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-lg shadow-lg`}>
                <span>{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demands by Category */}
        <div className="card-hover">
          <h3 className="text-base font-bold text-brand-blue mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-brand-orange inline-block" />
            Demandas por Categoria
          </h3>
          {data.demandsByCategory.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">Nenhuma demanda registrada</p>
          ) : (
            <div className="space-y-3">
              {data.demandsByCategory.slice(0, 8).map((cat) => {
                const maxTotal = Math.max(...data.demandsByCategory.map((c) => c.total));
                const percentage = maxTotal > 0 ? (cat.total / maxTotal) * 100 : 0;
                return (
                  <div key={cat.categoryId} className="flex items-center gap-3 group">
                    <span className="text-lg w-8 text-center">{cat.icon || "📁"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-600 font-medium truncate">{cat.categoryName || "Sem categoria"}</span>
                        <span className="font-bold text-brand-blue">{cat.total}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 group-hover:opacity-90"
                          style={{ width: `${percentage}%`, backgroundColor: cat.color || "#E8751A" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Demands by Status */}
        <div className="card-hover">
          <h3 className="text-base font-bold text-brand-blue mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-brand-blue-accent inline-block" />
            Demandas por Status
          </h3>
          {data.demandsByStatus.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">Nenhuma demanda registrada</p>
          ) : (
            <div className="space-y-2">
              {data.demandsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-brand-gray/50 transition-colors">
                  <span className={`badge ${statusColors[item.status] || "bg-gray-100 text-gray-800"}`}>
                    {statusLabels[item.status] || item.status}
                  </span>
                  <span className="text-sm font-bold text-brand-blue">{item.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demands by Region */}
        <div className="card-hover">
          <h3 className="text-base font-bold text-brand-blue mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-emerald-500 inline-block" />
            Inteligência Territorial
          </h3>
          {data.demandsByRegion.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">Nenhuma demanda por região</p>
          ) : (
            <div className="space-y-2">
              {data.demandsByRegion.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-brand-gray/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📍</span>
                    <span className="text-sm text-gray-600">{item.regionName || "Não definida"}</span>
                  </div>
                  <span className="text-sm font-bold text-brand-blue">{item.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Demands */}
        <div className="card-hover">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-brand-blue flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-brand-orange-light inline-block" />
              Últimas Demandas
            </h3>
            <Link href="/dashboard/demandas" className="text-xs text-brand-orange font-semibold hover:text-brand-orange-light transition-colors">
              Ver todas →
            </Link>
          </div>
          {data.recentDemands.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">Nenhuma demanda recente</p>
          ) : (
            <div className="space-y-3">
              {data.recentDemands.slice(0, 5).map((demand) => (
                <div key={demand.id} className="py-2.5 px-3 rounded-xl hover:bg-brand-gray/50 transition-colors">
                  <p className="text-[10px] font-mono text-brand-orange font-bold tracking-wider">{demand.protocol}</p>
                  <p className="text-sm text-gray-600 truncate mt-0.5">{demand.description}</p>
                  <div className="flex gap-2 mt-1.5">
                    <span className={`badge text-[10px] ${statusColors[demand.status] || ""}`}>
                      {statusLabels[demand.status] || demand.status}
                    </span>
                    <span className={`badge text-[10px] ${priorityColors[demand.priority] || ""}`}>
                      {priorityLabels[demand.priority] || demand.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 pb-2">
        <p className="text-[10px] text-gray-300">
          Desenvolvido por <span className="font-semibold text-gray-400">Júnior Araújo Sistemas</span> • (91) 98212-2175 • junior.araujo21@yahoo.com.br
        </p>
      </div>
    </div>
  );
}
