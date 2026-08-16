"use client";

import { useEffect, useState, useCallback } from "react";
import { statusLabels, priorityLabels, statusColors, priorityColors, formatDate } from "@/lib/utils";

interface Category { id: number; name: string; icon: string | null; parentId: number | null; }
interface Demand { id: number; protocol: string; description: string; priority: string; status: string; categoryId: number | null; subcategoryId: number | null; openedAt: string; deadline: string | null; closedAt: string | null; observations: string | null; result: string | null; createdAt: string; }

export default function DemandsPage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [formData, setFormData] = useState({ categoryId: "", subcategoryId: "", description: "", priority: "media", deadline: "", observations: "", voterId: "" });

  const loadDemands = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    const res = await fetch(`/api/demands?${params}`);
    const data = await res.json();
    setDemands(data.demands); setTotal(data.total); setLoading(false);
  }, [page, search, statusFilter, categoryFilter, priorityFilter]);

  useEffect(() => { loadDemands(); }, [loadDemands]);
  useEffect(() => { fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories)); }, []);

  const loadSubcategories = async (parentId: string) => {
    if (!parentId) { setSubcategories([]); return; }
    const res = await fetch(`/api/categories?parentId=${parentId}`);
    setSubcategories((await res.json()).categories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/demands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    if (res.ok) { setShowForm(false); setFormData({ categoryId: "", subcategoryId: "", description: "", priority: "media", deadline: "", observations: "", voterId: "" }); loadDemands(); }
    else { const data = await res.json(); alert(data.error || "Erro"); }
  };

  const updateStatus = async (demandId: number, newStatus: string) => {
    await fetch(`/api/demands/${demandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    loadDemands(); setSelectedDemand(null);
  };

  const getCategoryName = (id: number | null) => { if (!id) return "-"; const cat = categories.find(c => c.id === id); return cat ? `${cat.icon || ""} ${cat.name}` : "-"; };
  const LBL = "block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue" style={{ fontFamily: "'Playfair Display', serif" }}>Demandas</h1>
          <p className="text-sm text-gray-400">{total} registradas</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? "✕ Fechar" : "+ Nova Demanda"}</button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-base font-bold text-brand-blue mb-4 flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-brand-orange inline-block" /> Nova Demanda</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={LBL}>Categoria *</label><select className="input-field" value={formData.categoryId} onChange={(e) => { setFormData({ ...formData, categoryId: e.target.value, subcategoryId: "" }); loadSubcategories(e.target.value); }} required><option value="">Selecione</option>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
              <div><label className={LBL}>Subcategoria</label><select className="input-field" value={formData.subcategoryId} onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}><option value="">Selecione</option>{subcategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className={LBL}>Prioridade</label><select className="input-field" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></div>
              <div><label className={LBL}>Prazo</label><input type="date" className="input-field" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} /></div>
            </div>
            <div><label className={LBL}>Descrição *</label><textarea className="input-field min-h-[100px]" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required placeholder="Descreva a demanda..." /></div>
            <div><label className={LBL}>Observações</label><textarea className="input-field" value={formData.observations} onChange={(e) => setFormData({ ...formData, observations: e.target.value })} /></div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">⚠️ Uma demanda registrada não substitui os canais oficiais de atendimento nem representa promessa de solução.</div>
            <div className="flex gap-2"><button type="submit" className="btn-primary">Criar Demanda</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button></div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input className="input-field" placeholder="🔍 Buscar protocolo ou descrição..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select className="input-field" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}><option value="">Todos os status</option>{Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select className="input-field" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}><option value="">Todas categorias</option>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
          <select className="input-field" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}><option value="">Todas prioridades</option>{Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </div>
      </div>

      {selectedDemand && (
        <div className="card border-2 border-brand-orange/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-brand-blue">Demanda {selectedDemand.protocol}</h3>
            <button onClick={() => setSelectedDemand(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Categoria</p><p className="font-medium text-brand-blue text-sm mt-0.5">{getCategoryName(selectedDemand.categoryId)}</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Prioridade</p><span className={`badge mt-0.5 ${priorityColors[selectedDemand.priority] || ""}`}>{priorityLabels[selectedDemand.priority]}</span></div>
            <div><p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Status</p><span className={`badge mt-0.5 ${statusColors[selectedDemand.status] || ""}`}>{statusLabels[selectedDemand.status]}</span></div>
            <div><p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Aberta em</p><p className="font-medium text-sm mt-0.5">{formatDate(selectedDemand.openedAt)}</p></div>
          </div>
          <div className="mb-4"><p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Descrição</p><p className="text-sm bg-brand-gray rounded-xl p-3">{selectedDemand.description}</p></div>
          <div className="flex flex-wrap gap-2 items-center"><p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mr-2">Alterar status:</p>
            {["em_analise", "encaminhada", "em_atendimento", "resolvida", "cancelada"].map(s => (
              <button key={s} onClick={() => updateStatus(selectedDemand.id, s)} className={`badge cursor-pointer hover:opacity-80 transition-opacity ${statusColors[s]}`}>{statusLabels[s]}</button>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-gray"><tr>
              <th className="table-header">Protocolo</th><th className="table-header">Categoria</th><th className="table-header">Descrição</th><th className="table-header">Prioridade</th><th className="table-header">Status</th><th className="table-header">Data</th><th className="table-header">Ações</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={7} className="table-cell text-center text-gray-300">Carregando...</td></tr>
              : demands.length === 0 ? <tr><td colSpan={7} className="table-cell text-center text-gray-300">Nenhuma demanda</td></tr>
              : demands.map(d => (
                <tr key={d.id} className="hover:bg-brand-cream/50 transition-colors cursor-pointer" onClick={() => setSelectedDemand(d)}>
                  <td className="table-cell font-mono text-xs font-bold text-brand-orange">{d.protocol}</td>
                  <td className="table-cell text-xs">{getCategoryName(d.categoryId)}</td>
                  <td className="table-cell max-w-xs truncate">{d.description}</td>
                  <td className="table-cell"><span className={`badge ${priorityColors[d.priority] || ""}`}>{priorityLabels[d.priority]}</span></td>
                  <td className="table-cell"><span className={`badge ${statusColors[d.status] || ""}`}>{statusLabels[d.status]}</span></td>
                  <td className="table-cell text-xs text-gray-400">{formatDate(d.createdAt)}</td>
                  <td className="table-cell"><button className="text-brand-orange hover:text-brand-orange-light text-xs font-semibold cursor-pointer" onClick={e => { e.stopPropagation(); setSelectedDemand(d); }}>Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <p className="text-sm text-gray-400">Página {page} • {total} registros</p>
            <div className="flex gap-2"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs">Anterior</button><button onClick={() => setPage(p => p + 1)} disabled={demands.length < 20} className="btn-secondary text-xs">Próxima</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
