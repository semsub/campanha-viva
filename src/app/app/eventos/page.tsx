"use client";

import { useEffect, useState, useCallback } from "react";
import { Btn, Card, Modal, PageHeader, Field, Input, Textarea, EmptyState } from "@/components/UI";
import { formatDateTime } from "@/lib/format";

type Ev = {
  id: number; title: string; description: string | null;
  location: string | null; eventDate: string;
};

const empty = { title: "", description: "", location: "", eventDate: "" };

export default function EventosPage() {
  const [rows, setRows] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/events").then((r) => r.json());
    setRows(d.events ?? []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const r = await fetch("/api/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (r.ok) { setOpenModal(false); setForm(empty); load(); }
    else alert("Erro ao criar evento");
  }
  async function del(e: Ev) {
    if (!confirm(`Excluir "${e.title}"?`)) return;
    await fetch(`/api/events/${e.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title="Eventos" subtitle={`${rows.length} evento(s)`}
        actions={<Btn onClick={() => { setForm(empty); setOpenModal(true); }}>+ Novo evento</Btn>} />

      {loading ? (
        <Card className="p-8 text-center text-slate-400">Carregando…</Card>
      ) : rows.length === 0 ? (
        <Card><EmptyState title="Nenhum evento agendado" hint="Crie um evento para começar." /></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {rows.map((e) => (
            <Card key={e.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-[#003B6F]">{e.title}</h3>
                  <div className="text-xs text-slate-500 mt-1">📅 {formatDateTime(e.eventDate)}</div>
                  {e.location && <div className="text-xs text-slate-500">📍 {e.location}</div>}
                </div>
                <button onClick={() => del(e)} className="text-red-600 text-sm font-semibold">Excluir</button>
              </div>
              {e.description && <p className="text-sm text-slate-600 mt-2">{e.description}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Novo evento">
        <form onSubmit={save} className="space-y-3">
          <Field label="Título *">
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Data e hora *">
            <Input required type="datetime-local" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
          </Field>
          <Field label="Local">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label="Descrição">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setOpenModal(false)}>Cancelar</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Salvando…" : "Criar"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
