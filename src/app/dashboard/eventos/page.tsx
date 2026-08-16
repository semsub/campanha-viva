"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDate } from "@/lib/utils";

interface Event { id: number; title: string; type: string | null; description: string | null; eventDate: string | null; endDate: string | null; location: string | null; observations: string | null; createdAt: string; }
const eventTypes = ["Reunião", "Encontro Comunitário", "Evento Esportivo", "Evento Cultural", "Capacitação", "Reunião de Liderança", "Atendimento", "Mobilização", "Evento Institucional"];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", type: "", description: "", eventDate: "", endDate: "", location: "", observations: "" });

  const loadEvents = useCallback(async () => { setLoading(true); const res = await fetch("/api/events"); setEvents((await res.json()).events); setLoading(false); }, []);
  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    if (res.ok) { setShowForm(false); setFormData({ title: "", type: "", description: "", eventDate: "", endDate: "", location: "", observations: "" }); loadEvents(); }
  };

  const LBL = "block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-brand-blue" style={{ fontFamily: "'Playfair Display', serif" }}>Eventos</h1><p className="text-sm text-gray-400">{events.length} registrados</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? "✕ Fechar" : "+ Novo Evento"}</button>
      </div>
      {showForm && (
        <div className="card">
          <h3 className="text-base font-bold text-brand-blue mb-4 flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-brand-orange inline-block" /> Novo Evento</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={LBL}>Título *</label><input className="input-field" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></div>
              <div><label className={LBL}>Tipo</label><select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}><option value="">Selecione</option>{eventTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className={LBL}>Data/Hora Início</label><input type="datetime-local" className="input-field" value={formData.eventDate} onChange={e => setFormData({ ...formData, eventDate: e.target.value })} /></div>
              <div><label className={LBL}>Data/Hora Fim</label><input type="datetime-local" className="input-field" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} /></div>
              <div><label className={LBL}>Local</label><input className="input-field" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} /></div>
            </div>
            <div><label className={LBL}>Descrição</label><textarea className="input-field" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="flex gap-2"><button type="submit" className="btn-primary">Criar</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button></div>
          </form>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <div className="col-span-full text-center text-gray-300 py-12">Carregando...</div>
        : events.length === 0 ? <div className="col-span-full text-center text-gray-300 py-12">Nenhum evento</div>
        : events.map(event => (
          <div key={event.id} className="card-hover">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-bold text-brand-blue">{event.title}</h4>
              {event.type && <span className="badge bg-brand-orange/10 text-brand-orange border border-brand-orange/20">{event.type}</span>}
            </div>
            {event.description && <p className="text-sm text-gray-400 mb-3">{event.description}</p>}
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              {event.eventDate && <span>📅 {formatDate(event.eventDate)}</span>}
              {event.location && <span>📍 {event.location}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
