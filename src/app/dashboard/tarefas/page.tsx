"use client";

import { useEffect, useState, useCallback } from "react";
import { priorityLabels, priorityColors, formatDate } from "@/lib/utils";

interface Task { id: number; title: string; description: string | null; deadline: string | null; priority: string; status: string; createdAt: string; }
const tsLabels: Record<string, string> = { pendente: "Pendente", em_andamento: "Em Andamento", concluida: "Concluída", cancelada: "Cancelada" };
const tsColors: Record<string, string> = { pendente: "bg-amber-50 text-amber-700 border-amber-200", em_andamento: "bg-blue-50 text-blue-700 border-blue-200", concluida: "bg-emerald-50 text-emerald-700 border-emerald-200", cancelada: "bg-red-50 text-red-600 border-red-200" };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [formData, setFormData] = useState({ title: "", description: "", deadline: "", priority: "media" });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/tasks?${params}`);
    setTasks((await res.json()).tasks); setLoading(false);
  }, [statusFilter]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    if (res.ok) { setShowForm(false); setFormData({ title: "", description: "", deadline: "", priority: "media" }); loadTasks(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-brand-blue" style={{ fontFamily: "'Playfair Display', serif" }}>Tarefas</h1><p className="text-sm text-gray-400">{tasks.length} registradas</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? "✕ Fechar" : "+ Nova Tarefa"}</button>
      </div>
      {showForm && (
        <div className="card">
          <h3 className="text-base font-bold text-brand-blue mb-4 flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-brand-orange inline-block" /> Nova Tarefa</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Título *</label><input className="input-field" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></div>
              <div><label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Prazo</label><input type="date" className="input-field" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} /></div>
              <div><label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Prioridade</label><select className="input-field" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></div>
            </div>
            <div><label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Descrição</label><textarea className="input-field" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="flex gap-2"><button type="submit" className="btn-primary">Criar</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button></div>
          </form>
        </div>
      )}
      <div className="card"><select className="input-field w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">Todos os status</option>{Object.entries(tsLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-full text-center text-gray-300 py-12">Carregando...</div>
        : tasks.length === 0 ? <div className="col-span-full text-center text-gray-300 py-12">Nenhuma tarefa</div>
        : tasks.map(task => (
          <div key={task.id} className="card-hover">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-bold text-brand-blue text-sm">{task.title}</h4>
              <span className={`badge text-[10px] border ${tsColors[task.status] || ""}`}>{tsLabels[task.status]}</span>
            </div>
            {task.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{task.description}</p>}
            <div className="flex items-center justify-between text-xs">
              <span className={`badge ${priorityColors[task.priority] || ""}`}>{priorityLabels[task.priority]}</span>
              {task.deadline && <span className="text-gray-400">📅 {formatDate(task.deadline)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
