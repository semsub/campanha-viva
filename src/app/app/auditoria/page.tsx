"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, EmptyState } from "@/components/UI";
import { formatDateTime } from "@/lib/format";

type Log = {
  id: number; action: string; entity: string | null; entityId: number | null;
  detail: string | null; ip: string | null; createdAt: string;
  actorName: string | null; actorEmail: string | null;
};

export default function AuditoriaPage() {
  const [rows, setRows] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/audit").then(async (r) => {
      if (!r.ok) { setError((await r.json()).error ?? "sem permissão"); setLoading(false); return; }
      const d = await r.json();
      setRows(d.logs ?? []); setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader title="Auditoria" subtitle="Trilha completa de ações do sistema" />
      {error ? (
        <Card className="p-8 text-center text-red-600">{error}</Card>
      ) : loading ? (
        <Card className="p-8 text-center text-slate-400">Carregando…</Card>
      ) : rows.length === 0 ? (
        <Card><EmptyState title="Sem registros ainda" /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Data/Hora</th>
                  <th className="text-left px-4 py-3">Usuário</th>
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
                    <td className="px-4 py-3">{l.actorName ?? "-"}<div className="text-xs text-slate-400">{l.actorEmail}</div></td>
                    <td className="px-4 py-3"><Badge color="blue">{l.action}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{l.entity ?? "-"} {l.entityId ? `#${l.entityId}` : ""}</td>
                    <td className="px-4 py-3 max-w-md truncate text-slate-500">{l.detail ?? "-"}</td>
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
