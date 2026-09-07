"use client";
import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, Btn, Modal, EmptyState } from "@/components/UI";
import { getCategory } from "@/lib/categories";
import { formatDate } from "@/lib/format";

type Coord = { id: number; name: string; email: string; active: boolean; leaders: number; voters: number; demands: number; pendingDemands: number; doneDemands: number };
type Report = { coordinators: Coord[]; orphanVoters: number; orphanDemands: number };
type Detail = {
  coordinator: { id: number; name: string; email: string; phone: string | null; active: boolean };
  leaders: { id: number; name: string; email: string; phone: string | null }[];
  voters: { id: number; name: string; phone: string | null; voterTitle: string | null; zone: string | null; section: string | null; neighborhood: string | null; city: string | null; leaderName: string | null; createdAt: string }[];
  demands: { id: number; title: string; category: string; status: string; voterName: string | null; createdAt: string }[];
};

export default function CoordenadoresPage() {
  const [rep, setRep] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [tab, setTab] = useState<"voters"|"leaders"|"demands">("voters");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/reports/by-coordinator", { credentials: "include" });
        if (r.status === 401) { window.location.href = "/login"; return; }
        if (r.status === 403) { setErr("Sem permissão."); setLoading(false); return; }
        const d = await r.json();
        if (!d || !Array.isArray(d.coordinators)) { setErr(d?.error ?? "resposta inválida"); setLoading(false); return; }
        setRep({ coordinators: d.coordinators, orphanVoters: d.orphanVoters ?? 0, orphanDemands: d.orphanDemands ?? 0 });
      } catch (e) { setErr(String(e)); }
      finally { setLoading(false); }
    })();
  }, []);

  async function openDetail(cid: number) {
    const r = await fetch(`/api/reports/coordinator/${cid}`, { credentials: "include" });
    if (!r.ok) { alert("Falha ao abrir detalhes"); return; }
    setDetail(await r.json()); setTab("voters");
  }

  return (
    <div>
      <PageHeader title="Coordenadores" subtitle="Visão consolidada por coordenador" />
      {err ? <Card className="p-6 text-center border-red-200 bg-red-50 text-red-800">{err}</Card>
      : loading ? <Card className="p-8 text-center text-slate-400">Carregando…</Card>
      : !rep || rep.coordinators.length === 0 ? <Card><EmptyState title="Nenhum coordenador" hint="Vá em Usuários → + Novo usuário → Coordenador." /></Card>
      : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rep.coordinators.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-[#003B6F]">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.email}</div>
                  </div>
                  <Badge color={c.active ? "green" : "red"}>{c.active ? "Ativo" : "Inativo"}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><div className="text-xl font-extrabold">{c.leaders}</div><div className="text-[10px] uppercase">Líderes</div></div>
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><div className="text-xl font-extrabold">{c.voters}</div><div className="text-[10px] uppercase">Eleitores</div></div>
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><div className="text-xl font-extrabold">{c.demands}</div><div className="text-[10px] uppercase">Demandas</div></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-center">
                  <div className="rounded-lg bg-orange-50 p-2 text-orange-700"><div className="text-xl font-extrabold">{c.pendingDemands}</div><div className="text-[10px] uppercase">Pendentes</div></div>
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><div className="text-xl font-extrabold">{c.doneDemands}</div><div className="text-[10px] uppercase">Concluídas</div></div>
                </div>
                <Btn className="mt-4 w-full" onClick={() => openDetail(c.id)}>🔎 Ver detalhes</Btn>
              </Card>
            ))}
          </div>
          {(rep.orphanVoters > 0 || rep.orphanDemands > 0) && (
            <Card className="p-4 mt-4 border-orange-200 bg-orange-50">
              <div className="text-sm text-orange-900"><b>Sem coordenador:</b> {rep.orphanVoters} eleitor(es), {rep.orphanDemands} demanda(s).</div>
            </Card>
          )}
        </>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `${detail.coordinator.name}` : ""}>
        {detail && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded p-3 text-xs">
              <div><b>Email:</b> {detail.coordinator.email}</div>
              <div><b>Status:</b> {detail.coordinator.active ? "Ativo" : "Inativo"}</div>
            </div>
            <div className="flex gap-2 border-b border-slate-200">
              {(["voters","leaders","demands"] as const).map(k => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px ${tab === k ? "border-[#F07A1A] text-[#003B6F]" : "border-transparent text-slate-400"}`}>
                  {k === "voters" ? `Eleitores (${detail.voters.length})` : k === "leaders" ? `Lideranças (${detail.leaders.length})` : `Demandas (${detail.demands.length})`}
                </button>
              ))}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {tab === "voters" && detail.voters.map(v => (
                <div key={v.id} className="py-2 text-sm">
                  <div className="font-semibold text-[#003B6F]">{v.name}</div>
                  <div className="text-xs text-slate-500">{v.phone ?? "-"} • Título {v.voterTitle ?? "-"} • Z{v.zone ?? "-"}/S{v.section ?? "-"} • {v.neighborhood ?? "-"} • Líder: {v.leaderName ?? "-"}</div>
                </div>
              ))}
              {tab === "leaders" && detail.leaders.map(l => (
                <div key={l.id} className="py-2 text-sm">
                  <div className="font-semibold text-[#003B6F]">{l.name}</div>
                  <div className="text-xs text-slate-500">{l.email} • {l.phone ?? "-"}</div>
                </div>
              ))}
              {tab === "demands" && detail.demands.map(d => {
                const cat = getCategory(d.category);
                return (
                  <div key={d.id} className="py-2 text-sm">
                    <div className="font-semibold text-[#003B6F]">{cat.icon} {d.title}</div>
                    <div className="text-xs text-slate-500">{cat.label} • {d.status} • {d.voterName ?? "-"} • {formatDate(d.createdAt)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
