"use client";

import { useEffect, useState, useCallback } from "react";
import { Btn, Card, Modal, PageHeader, Field, Input, Select, Textarea, Badge, EmptyState } from "@/components/UI";
import { DEMAND_CATEGORIES, getCategory } from "@/lib/categories";
import { formatDate } from "@/lib/format";

type Demand = {
  id: number; title: string; description: string | null;
  category: string; status: string; priority: string;
  voterId: number | null; voterName: string | null;
  createdAt: string;
};

type Voter = { id: number; name: string };

const statusColor: Record<string, string> = {
  aberta: "yellow", em_andamento: "blue", resolvida: "green", cancelada: "red",
};
const priorityColor: Record<string, string> = {
  baixa: "slate", media: "blue", alta: "orange", urgente: "red",
};

const emptyForm = {
  title: "", description: "", category: "saude",
  priority: "media" as "baixa"|"media"|"alta"|"urgente",
  voterId: "",
};

export default function DemandasPage() {
  const [rows, setRows] = useState<Demand[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Demand | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (fCat) params.set("category", fCat);
    if (fStatus) params.set("status", fStatus);
    const r = await fetch(`/api/demands?${params}`);
    const d = await r.json();
    setRows(d.demands ?? []);
    setLoading(false);
  }, [q, fCat, fStatus]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/voters").then((r) => r.json()).then((d) => setVoters(d.voters ?? []));
  }, []);

  function openNew() {
    setEditing(null); setForm(emptyForm); setError(null); setOpenModal(true);
  }
  function openEdit(d: Demand) {
    setEditing(d);
    setForm({
      title: d.title, description: d.description ?? "",
      category: d.category, priority: d.priority as "baixa"|"media"|"alta"|"urgente",
      voterId: d.voterId ? String(d.voterId) : "",
    });
    setError(null); setOpenModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      const method = editing ? "PATCH" : "POST";
      const url = editing ? `/api/demands/${editing.id}` : "/api/demands";
      const body: Record<string, unknown> = { ...form };
      if (!editing) {
        if (!form.voterId) { setError("Selecione um eleitor"); setSaving(false); return; }
        body.voterId = Number(form.voterId);
      } else {
        delete body.voterId; // não permite trocar eleitor de uma demanda existente
      }
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "falha");
      setOpenModal(false); await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro");
    } finally { setSaving(false); }
  }

  async function setStatus(d: Demand, status: string) {
    await fetch(`/api/demands/${d.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function del(d: Demand) {
    if (!confirm(`Excluir demanda "${d.title}"?`)) return;
    const r = await fetch(`/api/demands/${d.id}`, { method: "DELETE" });
    if (r.ok) load(); else { const j = await r.json(); alert(j.error); }
  }

  return (
    <div>
      <PageHeader title="Demandas" subtitle={`${rows.length} demanda(s)`}
        actions={<Btn onClick={openNew}>+ Nova demanda</Btn>} />

      <Card className="p-4 mb-4">
        <div className="grid md:grid-cols-3 gap-3">
          <Input placeholder="Buscar por título…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={fCat} onChange={(e) => setFCat(e.target.value)}>
            <option value="">Todas as categorias</option>
            {DEMAND_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
          </Select>
          <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="aberta">Aberta</option>
            <option value="em_andamento">Em andamento</option>
            <option value="resolvida">Resolvida</option>
            <option value="cancelada">Cancelada</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <Card className="p-8 text-center text-slate-400">Carregando…</Card>
      ) : rows.length === 0 ? (
        <Card><EmptyState title="Nenhuma demanda" hint="Clique em '+ Nova demanda'." /></Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((d) => {
            const cat = getCategory(d.category);
            return (
              <Card key={d.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: cat.color + "20", color: cat.color }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[#003B6F]">{d.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge color="slate">{cat.label}</Badge>
                          <Badge color={statusColor[d.status]}>{d.status.replace("_", " ")}</Badge>
                          <Badge color={priorityColor[d.priority]}>{d.priority}</Badge>
                          {d.voterName && (
                            <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-semibold">
                              👤 {d.voterName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 whitespace-nowrap">{formatDate(d.createdAt)}</div>
                    </div>
                    {d.description && <p className="text-sm text-slate-600 mt-2">{d.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {d.status !== "em_andamento" && <button onClick={() => setStatus(d, "em_andamento")} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">▶ Iniciar</button>}
                      {d.status !== "resolvida" && <button onClick={() => setStatus(d, "resolvida")} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">✓ Resolver</button>}
                      {d.status !== "cancelada" && <button onClick={() => setStatus(d, "cancelada")} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">✗ Cancelar</button>}
                      <button onClick={() => openEdit(d)} className="text-xs text-[#003B6F] font-semibold ml-auto">Editar</button>
                      <button onClick={() => del(d)} className="text-xs text-red-600 font-semibold">Excluir</button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={openModal} onClose={() => setOpenModal(false)} title={editing ? "Editar demanda" : "Nova demanda"}>
        <form onSubmit={save} className="space-y-3">
          {!editing && (
            <Field label="Eleitor * (obrigatório)">
              <Select required value={form.voterId} onChange={(e) => setForm({ ...form, voterId: e.target.value })}>
                <option value="">— selecione o eleitor —</option>
                {voters.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </Select>
              {voters.length === 0 && (
                <div className="text-xs text-orange-600 mt-1">
                  ⚠️ Nenhum eleitor cadastrado. Cadastre um em &quot;Eleitores&quot; primeiro.
                </div>
              )}
            </Field>
          )}
          <Field label="Título *">
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria *">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {DEMAND_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
              </Select>
            </Field>
            <Field label="Prioridade">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as "baixa"|"media"|"alta"|"urgente" })}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </Select>
            </Field>
          </div>
          <Field label="Descrição">
            <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setOpenModal(false)}>Cancelar</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
