"use client";
import { useEffect, useState } from "react";

type CoordSummary = { id: number; name: string; email: string; phone: string|null; territory: string|null; active: boolean; leaders: number; leadersNames: string[]; voters: number; demands: number };
type Log = { id: number; action: string; entity: string|null; entityId: number|null; actorId: number|null; ip: string|null; createdAt: string };
type Leader = { id: number; name: string; email: string; phone: string|null; active: boolean };
type Voter = { id: number; name: string; phone: string|null; address: string|null; votingLocation: string|null; electoralZone: string|null; electoralSection: string|null; birthDate: string|null };
type Demand = { id: number; protocol: string; description: string; status: string; priority: string; voterId: number|null; createdAt: string };

const statusLabel: Record<string,string> = { aberta:"Aberta", em_analise:"Em Análise", resolvida:"Resolvida", cancelada:"Cancelada", encerrada:"Encerrada", em_atendimento:"Em Atendimento", encaminhada:"Encaminhada", aguardando_info:"Aguard. Info", aguardando_terceiro:"Aguard. Terceiro" };
const actionColor: Record<string,string> = { login_success:"bg-green-50 text-green-700", login_failed:"bg-red-50 text-red-700", user_created:"bg-blue-50 text-blue-700", voter_created:"bg-emerald-50 text-emerald-700", demand_created:"bg-orange-50 text-orange-700", demand_updated:"bg-amber-50 text-amber-700", password_reset:"bg-yellow-50 text-yellow-700", user_deactivated:"bg-red-50 text-red-700", user_updated:"bg-indigo-50 text-indigo-700", task_created:"bg-teal-50 text-teal-700", event_created:"bg-purple-50 text-purple-700" };

export default function AuditoriaPage() {
  const [tab, setTab] = useState<"coordinators"|"logs">("coordinators");
  const [coords, setCoords] = useState<CoordSummary[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Detail view
  const [detailCoord, setDetailCoord] = useState<CoordSummary|null>(null);
  const [detailLeaders, setDetailLeaders] = useState<Leader[]>([]);
  const [detailVoters, setDetailVoters] = useState<Voter[]>([]);
  const [detailDemands, setDetailDemands] = useState<Demand[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (tab === "coordinators") {
      fetch("/api/audit?view=coordinators").then(r => r.json()).then(d => { setCoords(d.coordinators ?? []); setLoading(false); });
    } else {
      fetch(`/api/audit?view=logs&page=${logPage}&limit=30`).then(r => r.json()).then(d => { setLogs(d.logs ?? []); setTotalLogs(d.total ?? 0); setLoading(false); });
    }
  }, [tab, logPage]);

  async function openDetail(c: CoordSummary) {
    setDetailCoord(c); setDetailLoading(true);
    const res = await fetch(`/api/audit?view=coordinator-detail&coordId=${c.id}`);
    const d = await res.json();
    setDetailLeaders(d.leaders ?? []); setDetailVoters(d.voters ?? []); setDetailDemands(d.demands ?? []);
    setDetailLoading(false);
  }

  const logTotalPages = Math.ceil(totalLogs / 30);

  // Detail view
  if (detailCoord) {
    return (
      <div>
        <button onClick={() => setDetailCoord(null)} className="mb-4 rounded-lg border px-4 py-2 text-sm font-semibold text-[#003B6F] hover:bg-[#F5F8FB]">← Voltar</button>
        <div className="rounded-2xl bg-gradient-to-r from-[#003B6F] to-[#00264D] p-6 text-white mb-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 90% 30%, rgba(240,122,26,0.3), transparent 50%)" }} />
          <div className="relative z-10">
            <p className="text-xs text-[#F59E5B] uppercase tracking-widest font-bold">Auditoria do Coordenador</p>
            <h1 className="mt-1 text-2xl font-extrabold">{detailCoord.name}</h1>
            <p className="text-white/60 text-sm">{detailCoord.email} · {detailCoord.phone || "sem telefone"} · {detailCoord.territory || "sem território"}</p>
            <div className="flex gap-4 mt-3">
              <span className="rounded-xl bg-white/10 px-3 py-1 text-sm font-bold">👥 {detailCoord.leaders} Líderes</span>
              <span className="rounded-xl bg-white/10 px-3 py-1 text-sm font-bold">🗳️ {detailCoord.voters} Eleitores</span>
              <span className="rounded-xl bg-white/10 px-3 py-1 text-sm font-bold">📋 {detailCoord.demands} Demandas</span>
            </div>
          </div>
        </div>

        {detailLoading ? <p className="text-center py-8 text-[#6b7a8f]">Carregando...</p> : (
          <div className="space-y-6">
            {/* Líderes */}
            <div className="rounded-2xl border border-[#E2EAF3] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#003B6F] mb-3">🤝 Lideranças ({detailLeaders.length})</h2>
              {detailLeaders.length === 0 ? <p className="text-sm text-[#6b7a8f]">Nenhuma liderança.</p> :
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {detailLeaders.map(l => (
                  <div key={l.id} className="rounded-xl border p-3 flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${l.active ? "bg-green-500" : "bg-red-500"}`} />
                    <div><p className="text-sm font-bold text-[#003B6F]">{l.name}</p><p className="text-xs text-[#6b7a8f]">{l.email}</p></div>
                  </div>
                ))}
              </div>}
            </div>

            {/* Eleitores */}
            <div className="rounded-2xl border border-[#E2EAF3] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#003B6F] mb-3">🗳️ Eleitores ({detailVoters.length})</h2>
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-[#F5F8FB]">
                <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[#003B6F]">Nome</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[#003B6F]">Contato</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[#003B6F] hidden md:table-cell">Título</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[#003B6F] hidden md:table-cell">Zona/Seção</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[#003B6F] hidden lg:table-cell">Endereço</th>
              </tr></thead><tbody>
                {detailVoters.map(v => (
                  <tr key={v.id} className="border-b border-[#F5F8FB] hover:bg-[#F5F8FB]">
                    <td className="px-3 py-2 font-semibold text-[#003B6F]">{v.name}</td>
                    <td className="px-3 py-2 text-[#5B6E85]">{v.phone||"—"}</td>
                    <td className="px-3 py-2 text-[#5B6E85] font-mono hidden md:table-cell">{v.votingLocation||"—"}</td>
                    <td className="px-3 py-2 text-[#5B6E85] hidden md:table-cell">{v.electoralZone ? `${v.electoralZone}/${v.electoralSection}` : "—"}</td>
                    <td className="px-3 py-2 text-[#5B6E85] hidden lg:table-cell max-w-xs truncate">{v.address||"—"}</td>
                  </tr>
                ))}
              </tbody></table></div>
            </div>

            {/* Demandas */}
            <div className="rounded-2xl border border-[#E2EAF3] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#003B6F] mb-3">📋 Demandas ({detailDemands.length})</h2>
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-[#F5F8FB]">
                <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[#003B6F]">Protocolo</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[#003B6F]">Descrição</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[#003B6F]">Status</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[#003B6F]">Prioridade</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[#003B6F] hidden md:table-cell">Data</th>
              </tr></thead><tbody>
                {detailDemands.map(d => (
                  <tr key={d.id} className="border-b border-[#F5F8FB] hover:bg-[#F5F8FB]">
                    <td className="px-3 py-2 font-mono text-xs font-bold text-[#003B6F]">{d.protocol}</td>
                    <td className="px-3 py-2 text-[#5B6E85] max-w-xs truncate">{d.description}</td>
                    <td className="px-3 py-2"><span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{statusLabel[d.status]||d.status}</span></td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${d.priority==="urgente"?"bg-red-100 text-red-700":d.priority==="alta"?"bg-orange-50 text-orange-700":"bg-blue-50 text-blue-700"}`}>{d.priority}</span></td>
                    <td className="px-3 py-2 text-[#5B6E85] text-xs hidden md:table-cell">{new Date(d.createdAt).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody></table></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#003B6F] mb-2">🔍 Auditoria Completa</h1>
      <p className="text-sm text-[#6b7a8f] mb-6">Visão total de todos os coordenadores, líderes, eleitores e demandas.</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("coordinators")} className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${tab==="coordinators"?"bg-[#003B6F] text-white shadow-md":"bg-white border border-[#E2EAF3] text-[#5B6E85]"}`}>
          🎯 Por Coordenador
        </button>
        <button onClick={() => setTab("logs")} className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${tab==="logs"?"bg-[#003B6F] text-white shadow-md":"bg-white border border-[#E2EAF3] text-[#5B6E85]"}`}>
          📜 Logs de Atividade
        </button>
      </div>

      {tab === "coordinators" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? <div className="col-span-full py-12 text-center text-[#6b7a8f]">Carregando...</div> :
          coords.length === 0 ? <div className="col-span-full py-12 text-center text-[#6b7a8f]">Nenhum coordenador criado.</div> :
          coords.map(c => (
            <div key={c.id} onClick={() => openDetail(c)} className="cursor-pointer rounded-2xl border border-[#E2EAF3] bg-white p-5 shadow-sm hover:shadow-xl hover:border-[#F07A1A]/50 hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🎯</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.active?"bg-green-50 text-green-700":"bg-red-50 text-red-700"}`}>{c.active?"Ativo":"Inativo"}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-[#003B6F]">{c.name}</h3>
              <p className="text-xs text-[#6b7a8f]">{c.email}</p>
              {c.territory && <p className="text-xs text-[#F07A1A] mt-1">📍 {c.territory}</p>}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-[#F5F8FB] p-2">
                  <p className="text-lg font-extrabold text-[#003B6F]">{c.leaders}</p>
                  <p className="text-[10px] text-[#6b7a8f] font-semibold">Líderes</p>
                </div>
                <div className="rounded-xl bg-[#F5F8FB] p-2">
                  <p className="text-lg font-extrabold text-[#F07A1A]">{c.voters}</p>
                  <p className="text-[10px] text-[#6b7a8f] font-semibold">Eleitores</p>
                </div>
                <div className="rounded-xl bg-[#F5F8FB] p-2">
                  <p className="text-lg font-extrabold text-[#0B5FAA]">{c.demands}</p>
                  <p className="text-[10px] text-[#6b7a8f] font-semibold">Demandas</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-[#6b7a8f]">Líderes: {c.leadersNames.join(", ") || "nenhum"}</p>
              <p className="mt-2 text-xs text-[#F07A1A] font-semibold text-center">Clique para ver detalhes →</p>
            </div>
          ))}
        </div>
      )}

      {tab === "logs" && (
        <div className="rounded-2xl border border-[#E2EAF3] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-[#F5F8FB]">
            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#003B6F]">Data/Hora</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#003B6F]">Ação</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#003B6F] hidden md:table-cell">Entidade</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#003B6F] hidden md:table-cell">Ator</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-[#003B6F] hidden lg:table-cell">IP</th>
          </tr></thead><tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-[#6b7a8f]">Carregando...</td></tr> :
            logs.map(l => (
              <tr key={l.id} className="border-b border-[#F5F8FB] hover:bg-[#F5F8FB]">
                <td className="px-4 py-3 text-xs text-[#5B6E85] whitespace-nowrap">{new Date(l.createdAt).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${actionColor[l.action]??"bg-gray-100 text-gray-700"}`}>{l.action}</span></td>
                <td className="px-4 py-3 text-[#5B6E85] hidden md:table-cell">{l.entity ? `${l.entity}#${l.entityId}` : "—"}</td>
                <td className="px-4 py-3 text-[#5B6E85] hidden md:table-cell">ID:{l.actorId??"—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-[#5B6E85] hidden lg:table-cell">{l.ip??"—"}</td>
              </tr>
            ))}
          </tbody></table></div>
          {logTotalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <button onClick={() => setLogPage(p => Math.max(1,p-1))} disabled={logPage<=1} className="rounded-lg border px-3 py-1 text-xs font-semibold disabled:opacity-30">← Anterior</button>
              <span className="text-xs text-[#6b7a8f]">Página {logPage}/{logTotalPages}</span>
              <button onClick={() => setLogPage(p => Math.min(logTotalPages,p+1))} disabled={logPage>=logTotalPages} className="rounded-lg border px-3 py-1 text-xs font-semibold disabled:opacity-30">Próxima →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
