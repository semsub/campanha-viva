"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, PageHeader, Badge, EmptyState, Select, Input } from "@/components/UI";
import { formatDateTime } from "@/lib/format";

type Log = {
  id: number; action: string; entity: string | null; entityId: number | null;
  detail: string | null; ip: string | null; createdAt: string;
  actorName: string | null; actorEmail: string | null;
  actorRole: string | null; actorCoordinatorId: number | null;
};

type Coord = { id: number; name: string };

export default function AuditoriaPage() {
  const [rows, setRows] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [coordinators, setCoordinators] = useState<Coord[]>([]);
  const [coordFilter, setCoordFilter] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/reports/by-coordinator")
      .then((r) => r.json())
      .then((d) => setCoordinators((d.coordinators ?? []).map((c: Coord) => ({ id: c.id, name: c.name }))));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (coordFilter) p.set("coordinatorId", coordFilter);
    if (q) p.set("q", q);
    const d = await fetch(`/api/audit?${p}`).then((r) => r.json());
    setRows(d.logs ?? []); setLoading(false);
  }, [coordFilter, q]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader title="Auditoria" subtitle="Trilha completa de ações (filtrável por coordenador)" />

      <Card className="p-4 mb-4">
        <div className="grid md:grid-cols-2 gap-3">
          <Select value={coordFilter} onChange={(e) => setCoordFilter(e.target.value)}>
            <option value="">🌎 Todos os coordenadores</option>
            {coordinators.map((c) => <option key={c.id} value={c.id}>Escopo de {c.name}</option>)}
          </Select>
          <Input placeholder="Buscar por ação, entidade, usuário, IP…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="text-xs text-slate-500 mt-2">
          {coordFilter
            ? "Exibindo ações do coordenador selecionado e das lideranças vinculadas a ele."
            : "Exibindo todas as ações do sistema."}
        </div>
      </Card>

      {loading ? (
        <Card className="p-8 text-center text-slate-400">Carregando…</Card>
      ) : rows.length === 0 ? (
        <Card><EmptyState title="Sem registros" /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Data/Hora</th>
                  <th className="text-left px-4 py-3">Usuário</th>
                  <th className="text-left px-4 py-3">Perfil</th>
                  <th className="text-left px-4 py-3">Ação</th>
                  <th className="text-left px-4 py-3">Entidade</th>
                  <th className="text-left px-4 py-3">Detalhe</th>
                  <th className="text-left px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div>{l.actorName ?? "-"}</div>
                      <div className="text-xs text-slate-400">{l.actorEmail}</div>
                    </td>
                    <td className="px-4 py-3"><Badge color="slate">{l.actorRole ?? "-"}</Badge></td>
                    <td className="px-4 py-3"><Badge color="blue">{l.action}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{l.entity ?? "-"} {l.entityId ? `#${l.entityId}` : ""}</td>
                    <td className="px-4 py-3 max-w-md truncate text-slate-500" title={l.detail ?? ""}>{l.detail ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-500">{l.ip ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
