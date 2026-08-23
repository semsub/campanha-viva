"use client";
import { useEffect, useState, useCallback } from "react";

type Task = { id: number; title: string; description: string | null; priority: string; status: string; deadline: string | null; createdAt: string; notes: string | null };
const statusLabel: Record<string, string> = { pendente: "Pendente", em_andamento: "Em Andamento", concluida: "Concluída", cancelada: "Cancelada" };
const statusColor: Record<string, string> = { pendente: "bg-yellow-50 text-yellow-700", em_andamento: "bg-blue-50 text-blue-700", concluida: "bg-green-50 text-green-700", cancelada: "bg-red-50 text-red-700" };

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "media", deadline: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/tasks${params}`);
    const d = await res.json();
    setTasks(d.tasks ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true); setMsg("");
    const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setMsg("✅ Tarefa criada!"); setForm({ title: "", description: "", priority: "media", deadline: "", notes: "" }); setShowForm(false); load(); }
    else { const d = await res.json(); setMsg(`❌ ${d.error}`); }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-extrabold text-[#003B6F]">✅ Tarefas</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-gradient-to-r from-[#F07A1A] to-[#FF9A3A] px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition">
          {showForm ? "✕ Cancelar" : "＋ Nova Tarefa"}
        </button>
      </div>

      {msg && <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${msg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-[#E2EAF3] bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Título *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition" /></div>
            <div className="sm:col-span-2"><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Descrição</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition" /></div>
            <div><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Prioridade</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] transition"><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></div>
            <div><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Prazo</label><input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] transition" /></div>
          </div>
          <button type="submit" disabled={saving} className="mt-4 rounded-xl bg-gradient-to-r from-[#003B6F] to-[#0B5FAA] px-8 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50 transition">{saving ? "..." : "💾 Criar Tarefa"}</button>
        </form>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {[{ v: "", l: "Todas" }, { v: "pendente", l: "Pendentes" }, { v: "em_andamento", l: "Em Andamento" }, { v: "concluida", l: "Concluídas" }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${filter === f.v ? "bg-[#003B6F] text-white" : "bg-white border text-[#5B6E85]"}`}>{f.l}</button>
        ))}
      </div>

      <div className="rounded-2xl border border-[#E2EAF3] bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-[#E2EAF3] bg-[#F5F8FB]">
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Título</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F] hidden md:table-cell">Descrição</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Prioridade</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Status</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F] hidden md:table-cell">Prazo</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-[#6b7a8f]">Carregando...</td></tr> :
            tasks.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-[#6b7a8f]">Nenhuma tarefa.</td></tr> :
            tasks.map(t => (
              <tr key={t.id} className="border-b border-[#F5F8FB] hover:bg-[#F5F8FB] transition">
                <td className="px-4 py-3 font-semibold text-[#003B6F]">{t.title}</td>
                <td className="px-4 py-3 text-[#5B6E85] max-w-xs truncate hidden md:table-cell">{t.description || "—"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${t.priority === "urgente" ? "bg-red-100 text-red-700" : t.priority === "alta" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}>{t.priority}</span></td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${statusColor[t.status] ?? ""}`}>{statusLabel[t.status] ?? t.status}</span></td>
                <td className="px-4 py-3 text-[#5B6E85] hidden md:table-cell">{t.deadline || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
