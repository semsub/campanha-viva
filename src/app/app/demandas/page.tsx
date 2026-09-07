"use client";
import { useEffect, useState, useCallback } from "react";
import { Btn, Card, Modal, PageHeader, Field, Input, Select, Textarea, Badge, EmptyState } from "@/components/UI";
import { DEMAND_CATEGORIES, getCategory } from "@/lib/categories";
import { formatDate } from "@/lib/format";

type Demand = { id: number; title: string; description: string | null; category: string; status: string; priority: string; voterId: number | null; voterName: string | null; createdAt: string };
type Voter = { id: number; name: string };
const statusColor: Record<string, string> = { pendente: "yellow", em_andamento: "blue", concluido: "green", cancelado: "red" };
const statusLabel: Record<string, string> = { pendente: "Pendente", em_andamento: "Em Andamento", concluido: "Concluído", cancelado: "Cancelado" };
const empty = { title: "", description: "", category: "saude", priority: "media" as "baixa"|"media"|"alta"|"urgente", voterId: "" };

export default function DemandasPage() {
  const [rows, setRows] = useState<Demand[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/demands", { credentials: "include" });
    if (r.status === 401) { window.location.href = "/login"; return; }
    const d = await r.json().catch(() => ({ demands: [] }));
    setRows(d.demands ?? []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch("/api/voters", { credentials: "include" }).then((r) => r.json()).then((d) => setVoters(d.voters ?? [])); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErr(null);
    try {
      if (!form.voterId) throw new Error("Selecione um eleitor");
      const body = { ...form, voterId: Number(form.voterId) };
      const r = await fetch("/api/demands", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "falha");
      setOpenModal(false); setForm(empty); load();
    } catch (e) { setErr(e instanceof Error ? e.message : "erro"); }
    finally { setSaving(false); }
  }
  async function setStatus(d: Demand, status: string) {
    await fetch(`/api/demands/${d.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }
  async function del(d: Demand) {
    if (!confirm(`Excluir "${d.title}"?`)) return;
    const r = await fetch(`/api/demands/${d.id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) load(); else alert("erro");
  }

  return (
    <div>
      <PageHeader title="Demandas" subtitle={`${rows.length} demanda(s)`} actions={<Btn onClick={() => { setForm(empty); setErr(null); setOpenModal(true); }}>+ Nova demanda</Btn>} />
      {loading ? <Card className="p-8 text-center text-slate-400">Carregando…</Card>
      : rows.length === 0 ? <Card><EmptyState title="Nenhuma demanda" /></Card>
      : (
        <div className="grid gap-3">
          {rows.map((d) => {
            const cat = getCategory(d.category);
            return (
              <Card key={d.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: cat.color + "20", color: cat.color }}>{cat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[#003B6F]">{d.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge color="slate">{cat.label}</Badge>
                          <Badge color={statusColor[d.status] ?? "slate"}>{statusLabel[d.status] ?? d.status}</Badge>
                          <Badge color="orange">{d.priority}</Badge>
                          {d.voterName && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-semibold">👤 {d.voterName}</span>}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 whitespace-nowrap">{formatDate(d.createdAt)}</div>
                    </div>
                    {d.description && <p className="text-sm text-slate-600 mt-2">{d.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {d.status !== "em_andamento" && <button onClick={() => setStatus(d, "em_andamento")} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">▶ Iniciar</button>}
                      {d.status !== "concluido" && <button onClick={() => setStatus(d, "concluido")} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">✓ Concluir</button>}
                      {d.status !== "cancelado" && <button onClick={() => setStatus(d, "cancelado")} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">✗ Cancelar</button>}
                      <button onClick={() => del(d)} className="text-xs text-red-600 font-semibold ml-auto">Excluir</button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Nova demanda">
        <form onSubmit={save} className="space-y-3">
          <Field label="Eleitor * (obrigatório)">
            <Select required value={form.voterId} onChange={(e) => setForm({ ...form, voterId: e.target.value })}>
              <option value="">— selecione —</option>
              {voters.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          </Field>
          <Field label="Título *"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria *">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {DEMAND_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
              </Select>
            </Field>
            <Field label="Prioridade">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as "baixa"|"media"|"alta"|"urgente" })}>
                <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
              </Select>
            </Field>
          </div>
          <Field label="Descrição"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          {err && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{err}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setOpenModal(false)}>Cancelar</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
