"use client";
import { useEffect, useState } from "react";

type Evt = { id: number; title: string; description: string | null; type: string; eventDate: string | null; location: string | null; notes: string | null; createdAt: string };
const typeLabel: Record<string, string> = { reuniao: "Reunião", encontro: "Encontro", esportivo: "Esportivo", cultural: "Cultural", capacitacao: "Capacitação", atendimento: "Atendimento", mobilizacao: "Mobilização", institucional: "Institucional" };
const typeIcon: Record<string, string> = { reuniao: "🤝", encontro: "🏘️", esportivo: "⚽", cultural: "🎭", capacitacao: "🎓", atendimento: "🏥", mobilizacao: "📢", institucional: "🏛️" };

export default function EventosPage() {
  const [events, setEvents] = useState<Evt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "reuniao", eventDate: "", location: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/events");
    const d = await res.json();
    setEvents(d.events ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true); setMsg("");
    const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setMsg("✅ Evento criado!"); setForm({ title: "", description: "", type: "reuniao", eventDate: "", location: "", notes: "" }); setShowForm(false); load(); }
    else { const d = await res.json(); setMsg(`❌ ${d.error}`); }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-extrabold text-[#003B6F]">📅 Eventos</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-gradient-to-r from-[#F07A1A] to-[#FF9A3A] px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition">
          {showForm ? "✕ Cancelar" : "＋ Novo Evento"}
        </button>
      </div>

      {msg && <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${msg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-[#E2EAF3] bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Título *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition" /></div>
            <div><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Tipo</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] transition">{Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Data/Hora</label><input type="datetime-local" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] transition" /></div>
            <div><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Local</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition" /></div>
            <div><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Descrição</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition" /></div>
          </div>
          <button type="submit" disabled={saving} className="mt-4 rounded-xl bg-gradient-to-r from-[#003B6F] to-[#0B5FAA] px-8 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50 transition">{saving ? "..." : "💾 Criar Evento"}</button>
        </form>
      )}

      {/* Events grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-full text-center py-12 text-[#6b7a8f]">Carregando...</div> :
        events.length === 0 ? <div className="col-span-full text-center py-12 text-[#6b7a8f]">Nenhum evento. Clique em &quot;＋ Novo Evento&quot;.</div> :
        events.map(ev => (
          <div key={ev.id} className="rounded-2xl border border-[#E2EAF3] bg-white p-5 shadow-sm hover:shadow-lg hover:border-[#F07A1A]/40 transition-all">
            <div className="flex items-start justify-between">
              <span className="text-3xl">{typeIcon[ev.type] ?? "📅"}</span>
              <span className="rounded-full bg-[#003B6F]/10 px-2 py-0.5 text-[10px] font-bold text-[#003B6F] uppercase tracking-wider">{typeLabel[ev.type] ?? ev.type}</span>
            </div>
            <h3 className="mt-3 font-bold text-[#003B6F]">{ev.title}</h3>
            {ev.description && <p className="mt-1 text-sm text-[#5B6E85] line-clamp-2">{ev.description}</p>}
            <div className="mt-3 space-y-1 text-xs text-[#6b7a8f]">
              {ev.eventDate && <p>📆 {new Date(ev.eventDate).toLocaleString("pt-BR")}</p>}
              {ev.location && <p>📍 {ev.location}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
