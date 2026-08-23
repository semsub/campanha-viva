"use client";
import { useEffect, useState, useCallback } from "react";

type Cat = { id: number; name: string };
type Voter = { id: number; name: string; phone: string | null };
type Demand = { id: number; protocol: string; description: string; priority: string; status: string; categoryId: number | null; voterId: number | null; createdAt: string };

const STATUS_OPTS = ["aberta","em_analise","aguardando_info","encaminhada","em_atendimento","aguardando_terceiro","resolvida","cancelada","encerrada"];
const statusLabel: Record<string,string> = { aberta:"Aberta", em_analise:"Em Análise", aguardando_info:"Aguard. Info", encaminhada:"Encaminhada", em_atendimento:"Em Atendimento", aguardando_terceiro:"Aguard. Terceiro", resolvida:"Resolvida", cancelada:"Cancelada", encerrada:"Encerrada" };
const statusColor: Record<string,string> = { aberta:"bg-orange-50 text-orange-700", em_analise:"bg-blue-50 text-blue-700", resolvida:"bg-green-50 text-green-700", cancelada:"bg-red-50 text-red-700", encerrada:"bg-gray-100 text-gray-700", em_atendimento:"bg-indigo-50 text-indigo-700", encaminhada:"bg-purple-50 text-purple-700", aguardando_info:"bg-yellow-50 text-yellow-700", aguardando_terceiro:"bg-violet-50 text-violet-700" };
const prioColor: Record<string,string> = { baixa:"bg-gray-100 text-gray-600", media:"bg-blue-50 text-blue-700", alta:"bg-orange-50 text-orange-700", urgente:"bg-red-100 text-red-700" };

export default function DemandasPage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [myVoters, setMyVoters] = useState<Voter[]>([]);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterVoter, setFilterVoter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", categoryId: "", priority: "media", voterId: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "20" });
    if (filterStatus) p.set("status", filterStatus);
    if (filterVoter) p.set("voterId", filterVoter);
    const res = await fetch(`/api/demands?${p}`);
    const data = await res.json();
    setDemands(data.demands ?? []); setTotal(data.total ?? 0); setLoading(false);
  }, [filterStatus, filterVoter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/categories").then(r=>r.json()).then(d=>setCategories(d.categories??[]));
    fetch("/api/voters?limit=1000").then(r=>r.json()).then(d=>setMyVoters(d.voters??[]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || !form.voterId) { setMsg("❌ Selecione o eleitor e descreva a demanda."); return; }
    setSaving(true); setMsg("");
    const res = await fetch("/api/demands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) { setMsg("✅ Demanda criada: " + data.demand.protocol); setForm({ description: "", categoryId: "", priority: "media", voterId: "", notes: "" }); setShowForm(false); load(); }
    else setMsg(`❌ ${data.error}`);
    setSaving(false);
  }

  async function updateStatus(id: number, newStatus: string) {
    await fetch(`/api/demands/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    setEditId(null); load();
  }

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
  const voterMap = Object.fromEntries(myVoters.map(v => [v.id, v.name]));
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-extrabold text-[#003B6F]">📋 Demandas</h1><p className="text-sm text-[#6b7a8f]">{total} registradas</p></div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-gradient-to-r from-[#F07A1A] to-[#FF9A3A] px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition">
          {showForm ? "✕ Cancelar" : "＋ Nova Demanda"}
        </button>
      </div>

      {msg && <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${msg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-[#E2EAF3] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#003B6F] mb-4">Nova Demanda</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SELETOR DE ELEITOR — obrigatório */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">👤 Eleitor (obrigatório) *</label>
              <select value={form.voterId} onChange={e => setForm({ ...form, voterId: e.target.value })} required
                className="w-full rounded-xl border-2 border-[#F07A1A] bg-[#FFF8F3] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:shadow-[0_0_0_4px_rgba(240,122,26,0.15)] transition font-semibold">
                <option value="">— Selecione o eleitor —</option>
                {myVoters.map(v => <option key={v.id} value={v.id}>{v.name}{v.phone ? ` (${v.phone})` : ""}</option>)}
              </select>
              {myVoters.length === 0 && <p className="text-xs text-red-500 mt-1">Nenhum eleitor cadastrado. Cadastre primeiro em Eleitores.</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Descrição *</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Descreva a demanda..." required className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Categoria</label>
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] transition">
                <option value="">Selecione...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Prioridade</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] transition">
                <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Observações</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="mt-4 rounded-xl bg-gradient-to-r from-[#003B6F] to-[#0B5FAA] px-8 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50 transition">{saving ? "Salvando..." : "💾 Registrar Demanda"}</button>
        </form>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="block text-[10px] font-bold uppercase text-[#6b7a8f] mb-1">Filtrar por eleitor</label>
          <select value={filterVoter} onChange={e => { setFilterVoter(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-1.5 text-xs">
            <option value="">Todos</option>
            {myVoters.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => { setFilterStatus(""); setPage(1); }} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${!filterStatus ? "bg-[#003B6F] text-white" : "bg-white border text-[#5B6E85]"}`}>Todas</button>
          {STATUS_OPTS.map(st => (
            <button key={st} onClick={() => { setFilterStatus(st); setPage(1); }} className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition ${filterStatus === st ? "bg-[#003B6F] text-white" : "bg-white border text-[#5B6E85]"}`}>{statusLabel[st]}</button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border border-[#E2EAF3] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#E2EAF3] bg-[#F5F8FB]">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Protocolo</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Eleitor</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F] hidden md:table-cell">Descrição</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F] hidden md:table-cell">Categoria</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Prioridade</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Status</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-[#6b7a8f]">Carregando...</td></tr> :
              demands.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-[#6b7a8f]">Nenhuma demanda.</td></tr> :
              demands.map(d => (
                <tr key={d.id} className="border-b border-[#F5F8FB] hover:bg-[#F5F8FB] transition">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-[#003B6F]">{d.protocol}</td>
                  <td className="px-4 py-3 font-semibold text-[#F07A1A]">{d.voterId ? voterMap[d.voterId] ?? `#${d.voterId}` : "—"}</td>
                  <td className="px-4 py-3 text-[#5B6E85] max-w-xs truncate hidden md:table-cell">{d.description}</td>
                  <td className="px-4 py-3 text-[#5B6E85] hidden md:table-cell">{d.categoryId ? catMap[d.categoryId] ?? "—" : "—"}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${prioColor[d.priority]??""}`}>{d.priority}</span></td>
                  <td className="px-4 py-3">
                    {editId === d.id ? (
                      <select value={editStatus} onChange={e => { setEditStatus(e.target.value); updateStatus(d.id, e.target.value); }} className="rounded-lg border px-2 py-1 text-xs">
                        {STATUS_OPTS.map(st => <option key={st} value={st}>{statusLabel[st]}</option>)}
                      </select>
                    ) : (
                      <button onClick={() => { setEditId(d.id); setEditStatus(d.status); }} className={`rounded-full px-2 py-1 text-xs font-bold cursor-pointer hover:opacity-80 ${statusColor[d.status]??""}`}>{statusLabel[d.status]??d.status}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#E2EAF3] px-4 py-3">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1} className="rounded-lg border px-3 py-1 text-xs font-semibold disabled:opacity-30">← Anterior</button>
            <span className="text-xs text-[#6b7a8f]">Página {page} de {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page>=totalPages} className="rounded-lg border px-3 py-1 text-xs font-semibold disabled:opacity-30">Próxima →</button>
          </div>
        )}
      </div>
    </div>
  );
}
