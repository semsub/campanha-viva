"use client";

import { useEffect, useState, useCallback } from "react";

interface Category { id: number; name: string; icon: string | null; color: string | null; parentId: number | null; active: boolean | null; sortOrder: number | null; }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Record<number, Category[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedCat, setExpandedCat] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", icon: "", color: "#E8751A", parentId: "" });

  const loadCategories = useCallback(async () => { setLoading(true); const res = await fetch("/api/categories"); setCategories((await res.json()).categories); setLoading(false); }, []);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  const toggleExpand = async (catId: number) => {
    if (expandedCat === catId) { setExpandedCat(null); return; }
    setExpandedCat(catId);
    if (!subcategories[catId]) {
      const res = await fetch(`/api/categories?parentId=${catId}`);
      const data = await res.json();
      setSubcategories(prev => ({ ...prev, [catId]: res.ok ? data.categories : [] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    if (res.ok) { setShowForm(false); setFormData({ name: "", icon: "", color: "#E8751A", parentId: "" }); loadCategories(); if (formData.parentId) { const subRes = await fetch(`/api/categories?parentId=${formData.parentId}`); const subData = await subRes.json(); setSubcategories(prev => ({ ...prev, [parseInt(formData.parentId)]: subData.categories })); } }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-brand-blue" style={{ fontFamily: "'Playfair Display', serif" }}>Categorias de Demandas</h1><p className="text-sm text-gray-400">Configuráveis pelo administrador</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? "✕ Fechar" : "+ Nova Categoria"}</button>
      </div>
      {showForm && (
        <div className="card">
          <h3 className="text-base font-bold text-brand-blue mb-4 flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-brand-orange inline-block" /> Nova Categoria</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Nome *</label><input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div><label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Ícone (emoji)</label><input className="input-field" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} placeholder="🏥" /></div>
              <div><label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Cor</label><input type="color" className="input-field h-10" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} /></div>
              <div><label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Categoria Pai</label><select className="input-field" value={formData.parentId} onChange={e => setFormData({ ...formData, parentId: e.target.value })}><option value="">Nenhuma (raiz)</option>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
            </div>
            <div className="flex gap-2"><button type="submit" className="btn-primary">Salvar</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button></div>
          </form>
        </div>
      )}
      <div className="card">
        {loading ? <div className="text-center text-gray-300 py-8">Carregando...</div>
        : categories.length === 0 ? <div className="text-center text-gray-300 py-8">Nenhuma categoria. Inicialize o sistema primeiro.</div>
        : <div className="space-y-1">{categories.map(cat => (
          <div key={cat.id}>
            <button onClick={() => toggleExpand(cat.id)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-cream/60 transition-all text-left cursor-pointer group">
              <span className="text-2xl w-8">{cat.icon || "📁"}</span>
              <span className="flex-1 font-semibold text-brand-blue text-sm">{cat.name}</span>
              <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: cat.color || "#ccc", backgroundColor: expandedCat === cat.id ? cat.color || "#ccc" : "transparent" }} />
              <span className="text-gray-300 text-xs group-hover:text-gray-500 transition-colors">{expandedCat === cat.id ? "▼" : "▶"}</span>
            </button>
            {expandedCat === cat.id && (
              <div className="ml-12 mt-1 space-y-0.5 pb-2">{subcategories[cat.id]?.length === 0 ? <p className="text-xs text-gray-300 py-2 pl-4">Nenhuma subcategoria</p>
              : subcategories[cat.id]?.map(sub => (
                <div key={sub.id} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 rounded-lg hover:bg-brand-gray/50">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub.color || cat.color || "#ccc" }} />{sub.name}
                </div>
              ))}</div>
            )}
          </div>
        ))}</div>}
      </div>
    </div>
  );
}
