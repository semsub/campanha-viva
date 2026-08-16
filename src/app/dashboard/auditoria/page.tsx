"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDateTime } from "@/lib/utils";

interface AuditLog { id: number; userId: number | null; userName: string | null; action: string; entity: string | null; entityId: number | null; previousValue: unknown; newValue: unknown; ipAddress: string | null; createdAt: string; }
const actionLabels: Record<string, string> = { login: "Login", create: "Criação", update: "Atualização", delete: "Exclusão", export: "Exportação" };
const entityLabels: Record<string, string> = { users: "Usuário", voters: "Eleitor", demands: "Demanda", tasks: "Tarefa", events: "Evento" };
const actionColors: Record<string, string> = { login: "bg-blue-50 text-blue-700", create: "bg-emerald-50 text-emerald-700", update: "bg-amber-50 text-amber-700", delete: "bg-red-50 text-red-600", export: "bg-purple-50 text-purple-700" };

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (entityFilter) params.set("entity", entityFilter);
    if (actionFilter) params.set("action", actionFilter);
    setLogs((await (await fetch(`/api/audit?${params}`)).json()).logs); setLoading(false);
  }, [entityFilter, actionFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-brand-blue" style={{ fontFamily: "'Playfair Display', serif" }}>Auditoria</h1><p className="text-sm text-gray-400">Registro imutável de todas as ações</p></div>
      <div className="bg-brand-blue/5 border border-brand-blue/10 rounded-xl p-4 text-sm text-brand-blue/70 flex items-center gap-2">🔒 Os registros de auditoria são imutáveis e não podem ser excluídos. Todo acesso e ação no sistema é registrado.</div>
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select className="input-field" value={entityFilter} onChange={e => setEntityFilter(e.target.value)}><option value="">Todas as entidades</option>{Object.entries(entityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select className="input-field" value={actionFilter} onChange={e => setActionFilter(e.target.value)}><option value="">Todas as ações</option>{Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </div>
      </div>
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-gray"><tr>
              <th className="table-header">Data/Hora</th><th className="table-header">Usuário</th><th className="table-header">Ação</th><th className="table-header">Entidade</th><th className="table-header">ID</th><th className="table-header">IP</th><th className="table-header">Detalhes</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={7} className="table-cell text-center text-gray-300">Carregando...</td></tr>
              : logs.length === 0 ? <tr><td colSpan={7} className="table-cell text-center text-gray-300">Nenhum registro</td></tr>
              : logs.map(log => (
                <tr key={log.id} className="hover:bg-brand-cream/50 transition-colors">
                  <td className="table-cell text-xs font-mono text-gray-500">{formatDateTime(log.createdAt)}</td>
                  <td className="table-cell text-sm font-medium text-brand-blue">{log.userName || `ID:${log.userId}`}</td>
                  <td className="table-cell"><span className={`badge ${actionColors[log.action] || "bg-gray-100 text-gray-800"}`}>{actionLabels[log.action] || log.action}</span></td>
                  <td className="table-cell text-sm text-gray-500">{entityLabels[log.entity || ""] || log.entity || "-"}</td>
                  <td className="table-cell text-xs font-mono text-gray-400">{log.entityId || "-"}</td>
                  <td className="table-cell text-xs text-gray-400">{log.ipAddress || "-"}</td>
                  <td className="table-cell text-xs text-gray-400 max-w-xs truncate">{log.newValue ? JSON.stringify(log.newValue).substring(0, 50) + "..." : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
