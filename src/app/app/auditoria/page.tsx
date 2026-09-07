"use client";
import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, EmptyState } from "@/components/UI";
import { formatDateTime } from "@/lib/format";

type Log = { id: number; action: string; entity: string | null; entityId: number | null; detail: string | null; ip: string | null; success: boolean; createdAt: string; actorName: string | null; actorEmail: string | null; actorRole: string | null };

export default function AuditoriaPage() {
  const [rows, setRows] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit", { credentials: "include" })
      .then(async (r) => {
        if (r.status === 401) { window.location.href = "/login"; return { logs: [] }; }
        return r.json();
      })
      .then((d) => { setRows(d.logs ?? []); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader title="Auditoria" subtitle="Últimas 500 ações" />
      {loading ? <Card className="p-8 text-center text-slate-400">Carregando…</Card>
      : rows.length === 0 ? <Card><EmptyState title="Sem registros" /></Card>
      : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Usuário</th>
                  <th className="text-left px-4 py-3">Ação</th>
                  <th className="text-left px-4 py-3">Entidade</th>
                  <th className="text-left px-4 py-3">IP</th>
                  <th className="text-left px-4 py-3">Detalhe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((l) => (
                  <tr key={l.id} className={l.success ? "" : "bg-red-50"}>
                    <td className="px-4 py-2 whitespace-nowrap text-xs">{formatDateTime(l.createdAt)}</td>
                    <td className="px-4 py-2"><div>{l.actorName ?? "-"}</div><div className="text-xs text-slate-500">{l.actorEmail ?? ""}</div></td>
                    <td className="px-4 py-2"><Badge color={l.success ? "blue" : "red"}>{l.action}</Badge></td>
                    <td className="px-4 py-2 text-slate-600">{l.entity ?? "-"}{l.entityId ? ` #${l.entityId}` : ""}</td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{l.ip ?? "-"}</td>
                    <td className="px-4 py-2 max-w-md truncate text-slate-500 text-xs" title={l.detail ?? ""}>{l.detail ?? "-"}</td>
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
