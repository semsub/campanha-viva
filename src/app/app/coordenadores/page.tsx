"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, Btn, Modal, EmptyState } from "@/components/UI";
import { formatDate } from "@/lib/format";
import { getCategory } from "@/lib/categories";

type CoordReport = {
  id: number; name: string; email: string; active: boolean; territory: string | null;
  leaders: number; voters: number; demands: number;
  openDemands: number; resolvedDemands: number;
};
type FullReport = {
  coordinators: CoordReport[];
  orphanVoters: number;
  orphanDemands: number;
};

type Detail = {
  coordinator: { id: number; name: string; email: string; phone: string | null; active: boolean; territory: string | null };
  leaders: { id: number; name: string; email: string; phone: string | null; active: boolean; createdAt: string }[];
  voters: {
    id: number; name: string; phone: string | null; voterTitle: string | null;
    zone: string | null; section: string | null;
    neighborhood: string | null; city: string | null;
    leaderName: string | null; createdAt: string;
  }[];
  demands: {
    id: number; title: string; category: string; status: string; priority: string;
    voterName: string | null; createdAt: string;
  }[];
};

export default function CoordenadoresPage() {
  const [rep, setRep] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState<"leaders" | "voters" | "demands">("voters");

  useEffect(() => {
    fetch("/api/reports/by-coordinator").then((r) => r.json()).then((d) => { setRep(d); setLoading(false); });
  }, []);

  async function openDetail(cid: number) {
    setDetailLoading(true); setDetail(null); setTab("voters");
    const d = await fetch(`/api/reports/coordinator/${cid}`).then((r) => r.json());
    setDetail(d);
    setDetailLoading(false);
  }

  return (
    <div>
      <PageHeader
        title="Coordenadores"
        subtitle="Visão consolidada por coordenador — exclusivo do Super Admin"
      />

      {loading ? (
        <Card className="p-8 text-center text-slate-400">Carregando…</Card>
      ) : !rep?.coordinators.length ? (
        <Card><EmptyState title="Nenhum coordenador cadastrado" hint="Vá em Usuários → + Novo usuário → Coordenador." /></Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rep.coordinators.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-[#003B6F]">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.email}</div>
                    {c.territory && <div className="text-xs text-slate-500 mt-0.5">📍 {c.territory}</div>}
                  </div>
                  <Badge color={c.active ? "green" : "red"}>{c.active ? "Ativo" : "Inativo"}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <StatBox label="Lideranças" value={c.leaders} />
                  <StatBox label="Eleitores" value={c.voters} />
                  <StatBox label="Demandas" value={c.demands} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <StatBox label="Abertas" value={c.openDemands} color="orange" />
                  <StatBox label="Resolvidas" value={c.resolvedDemands} color="green" />
                </div>
                <Btn className="mt-4 w-full" onClick={() => openDetail(c.id)}>🔎 Ver detalhes deste coordenador</Btn>
              </Card>
            ))}
          </div>

          {(rep.orphanVoters > 0 || rep.orphanDemands > 0) && (
            <Card className="p-4 mt-4 border-orange-200 bg-orange-50">
              <div className="text-sm text-orange-900">
                <b>Registros sem coordenador:</b> {rep.orphanVoters} eleitor(es) e {rep.orphanDemands} demanda(s).
                Esses foram criados diretamente pelo Super Admin sem vínculo a um coordenador.
              </div>
            </Card>
          )}
        </>
      )}

      {/* Modal com detalhamento */}
      <Modal open={!!detail || detailLoading} onClose={() => { setDetail(null); setDetailLoading(false); }} title={detail ? `Espelho de ${detail.coordinator.name}` : "Carregando…"}>
        {detailLoading && <div className="text-center text-slate-400 py-6">Carregando…</div>}
        {detail && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-3 text-xs">
              <div><b>Email:</b> {detail.coordinator.email}</div>
              <div><b>Território:</b> {detail.coordinator.territory ?? "-"}</div>
              <div><b>Status:</b> {detail.coordinator.active ? "Ativo" : "Inativo"}</div>
            </div>

            <div className="flex gap-2 border-b border-slate-200">
              <TabBtn active={tab === "voters"}   onClick={() => setTab("voters")}>Eleitores ({detail.voters.length})</TabBtn>
              <TabBtn active={tab === "leaders"}  onClick={() => setTab("leaders")}>Lideranças ({detail.leaders.length})</TabBtn>
              <TabBtn active={tab === "demands"}  onClick={() => setTab("demands")}>Demandas ({detail.demands.length})</TabBtn>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {tab === "leaders" && (
                <div className="divide-y divide-slate-100">
                  {detail.leaders.length === 0 && <div className="text-center text-slate-400 py-4 text-sm">Sem lideranças</div>}
                  {detail.leaders.map((l) => (
                    <div key={l.id} className="py-2 text-sm">
                      <div className="font-semibold text-[#003B6F]">{l.name}</div>
                      <div className="text-xs text-slate-500">{l.email} • {l.phone ?? "sem telefone"}</div>
                    </div>
                  ))}
                </div>
              )}
              {tab === "voters" && (
                <div className="divide-y divide-slate-100">
                  {detail.voters.length === 0 && <div className="text-center text-slate-400 py-4 text-sm">Sem eleitores</div>}
                  {detail.voters.map((v) => (
                    <div key={v.id} className="py-2 text-sm">
                      <div className="font-semibold text-[#003B6F]">{v.name}</div>
                      <div className="text-xs text-slate-500">
                        {v.phone ?? "-"} • Título {v.voterTitle ?? "-"} • Z{v.zone ?? "-"}/S{v.section ?? "-"} • {v.neighborhood ?? "-"} {v.city ? `(${v.city})` : ""} • Líder: {v.leaderName ?? "-"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab === "demands" && (
                <div className="divide-y divide-slate-100">
                  {detail.demands.length === 0 && <div className="text-center text-slate-400 py-4 text-sm">Sem demandas</div>}
                  {detail.demands.map((d) => {
                    const cat = getCategory(d.category);
                    return (
                      <div key={d.id} className="py-2 text-sm">
                        <div className="font-semibold text-[#003B6F]">{cat.icon} {d.title}</div>
                        <div className="text-xs text-slate-500">
                          {cat.label} • {d.status.replace("_", " ")} • {d.priority} • Eleitor: {d.voterName ?? "-"} • {formatDate(d.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatBox({ label, value, color = "blue" }: { label: string; value: number; color?: string }) {
  const map: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={`rounded-lg p-2 text-center ${map[color] ?? map.blue}`}>
      <div className="text-xl font-extrabold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider">{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px ${
        active ? "border-[#F07A1A] text-[#003B6F]" : "border-transparent text-slate-400 hover:text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}
