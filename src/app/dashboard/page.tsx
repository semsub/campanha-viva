"use client";
import { useEffect, useState } from "react";

type Stats = { voters: number; demands: number; tasks: number; events: number; leaderships: number; regions: number; neighborhoods: number; demandsByStatus: { status: string; c: number }[] };

export default function DashboardPage() {
  const [s, setS] = useState<Stats | null>(null);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user));
    fetch("/api/dashboard").then(r => r.json()).then(setS);
  }, []);

  const roleLabel: Record<string, string> = { super_admin: "Super Admin", coordinator: "Coordenador", leader: "Liderança" };
  const statusLabel: Record<string, string> = { aberta: "Abertas", em_analise: "Em Análise", em_atendimento: "Em Atendimento", resolvida: "Resolvidas", encaminhada: "Encaminhadas", cancelada: "Canceladas", encerrada: "Encerradas", aguardando_info: "Aguard. Info", aguardando_terceiro: "Aguard. Terceiro" };
  const statusColor: Record<string, string> = { aberta: "#F07A1A", em_analise: "#0B5FAA", em_atendimento: "#2563eb", resolvida: "#16a34a", encaminhada: "#7c3aed", cancelada: "#dc2626", encerrada: "#6b7280", aguardando_info: "#d97706", aguardando_terceiro: "#9333ea" };

  return (
    <div>
      {/* Welcome */}
      <div className="rounded-2xl bg-gradient-to-r from-[#003B6F] to-[#00264D] p-6 sm:p-8 text-white relative overflow-hidden mb-8">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 90% 30%, rgba(240,122,26,0.3), transparent 50%)" }} />
        <div className="relative z-10">
          <p className="text-xs text-[#F59E5B] uppercase tracking-[0.2em] font-bold">Painel de Controle</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold">Bem-vindo{user ? `, ${user.name.split(" ")[0]}` : ""}!</h1>
          <p className="mt-1 text-white/60 text-sm">{user ? roleLabel[user.role] || user.role : ""} — Gestão Territorial de Campanha</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Eleitores", value: s?.voters ?? 0, icon: "👥", color: "#003B6F" },
          { label: "Demandas", value: s?.demands ?? 0, icon: "📋", color: "#F07A1A" },
          { label: "Tarefas", value: s?.tasks ?? 0, icon: "✅", color: "#16a34a" },
          { label: "Eventos", value: s?.events ?? 0, icon: "📅", color: "#7c3aed" },
          { label: "Lideranças", value: s?.leaderships ?? 0, icon: "🤝", color: "#0B5FAA" },
          { label: "Regiões", value: s?.regions ?? 0, icon: "🗺️", color: "#d97706" },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border border-[#E2EAF3] bg-white p-4 shadow-sm hover:shadow-lg transition-shadow">
            <span className="text-2xl">{c.icon}</span>
            <p className="mt-2 text-2xl font-extrabold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs text-[#6b7a8f] font-semibold uppercase tracking-wider">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Demands by status */}
      {s?.demandsByStatus && s.demandsByStatus.length > 0 && (
        <div className="rounded-2xl border border-[#E2EAF3] bg-white p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-[#003B6F] mb-4">📊 Demandas por Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {s.demandsByStatus.map(d => (
              <div key={d.status} className="rounded-xl p-3 text-center" style={{ background: `${statusColor[d.status] ?? "#6b7280"}15` }}>
                <p className="text-2xl font-extrabold" style={{ color: statusColor[d.status] ?? "#6b7280" }}>{d.c}</p>
                <p className="text-xs font-semibold" style={{ color: statusColor[d.status] ?? "#6b7280" }}>{statusLabel[d.status] ?? d.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="rounded-2xl border border-[#E2EAF3] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#003B6F] mb-4">⚡ Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: "/dashboard/eleitores", icon: "👤", label: "Novo Eleitor", bg: "from-[#003B6F] to-[#0B5FAA]" },
            { href: "/dashboard/demandas", icon: "📋", label: "Nova Demanda", bg: "from-[#F07A1A] to-[#FF9A3A]" },
            { href: "/dashboard/tarefas", icon: "✅", label: "Nova Tarefa", bg: "from-[#16a34a] to-[#22c55e]" },
            { href: "/dashboard/eventos", icon: "📅", label: "Novo Evento", bg: "from-[#7c3aed] to-[#a855f7]" },
          ].map(a => (
            <a key={a.label} href={a.href} className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${a.bg} p-4 text-white font-semibold shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all`}>
              <span className="text-2xl">{a.icon}</span> {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
