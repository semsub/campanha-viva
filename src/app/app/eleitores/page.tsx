"use client";

import { useEffect, useState, useCallback } from "react";
import { Btn, Card, Modal, PageHeader, Field, Input, Select, Textarea, EmptyState, Badge } from "@/components/UI";
import { formatDate } from "@/lib/format";
import { maskPhone, maskVoterTitle, maskDate, maskDigits } from "@/lib/masks";
import { DEMAND_CATEGORIES, getCategory } from "@/lib/categories";

type Voter = {
  id: number; name: string; phone: string | null; voterTitle: string | null;
  zone: string | null; section: string | null;
  street: string | null; number: string | null;
  neighborhood: string | null; city: string | null;
  birthDate: string | null; notes: string | null;
  leaderName: string | null; leaderId: number | null; createdAt: string;
};
type UserOpt = { id: number; name: string; email: string; role: string };
type Demand = { id: number; title: string; category: string; status: string; priority: string; createdAt: string };
type Me = { id: number; role: "super_admin" | "coordinator" | "leader" };

const emptyForm = {
  name: "", phone: "", voterTitle: "",
  zone: "", section: "",
  street: "", number: "", neighborhood: "", city: "",
  birthDate: "", notes: "", leaderId: "",
};

export default function EleitoresPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Voter | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaders, setLeaders] = useState<UserOpt[]>([]);

  const [viewingVoter, setViewingVoter] = useState<Voter | null>(null);
  const [voterDemands, setVoterDemands] = useState<Demand[]>([]);
  const [newDemand, setNewDemand] = useState({ title: "", category: "saude", priority: "media", description: "" });
  const [savingDemand, setSavingDemand] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user));
    fetch("/api/users").then((r) => r.json()).then((d) => {
      setLeaders((d.users ?? []).filter((u: UserOpt) => u.role === "leader"));
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/voters?q=${encodeURIComponent(q)}`);
    const d = await r.json();
    setRows(d.voters ?? []);
    setLoading(false);
  }, [q]);
  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null); setForm(emptyForm); setError(null); setOpenModal(true);
  }
  function openEdit(v: Voter) {
    setEditing(v);
    setForm({
      name: v.name,
      phone: v.phone ?? "",
      voterTitle: v.voterTitle ?? "",
      zone: v.zone ?? "",
      section: v.section ?? "",
      street: v.street ?? "",
      number: v.number ?? "",
      neighborhood: v.neighborhood ?? "",
      city: v.city ?? "",
      birthDate: v.birthDate ?? "",
      notes: v.notes ?? "",
      leaderId: v.leaderId ? String(v.leaderId) : "",
    });
    setError(null); setOpenModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const method = editing ? "PATCH" : "POST";
      const url = editing ? `/api/voters/${editing.id}` : "/api/voters";
      const body: Record<string, unknown> = { ...form };
      if (form.leaderId) body.leaderId = Number(form.leaderId);
      else delete body.leaderId;
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "falha ao salvar");
      setOpenModal(false); await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro");
    } finally { setSaving(false); }
  }

  async function del(v: Voter) {
    if (!confirm(`Excluir "${v.name}"?`)) return;
    const res = await fetch(`/api/voters/${v.id}`, { method: "DELETE" });
    if (res.ok) load();
    else { const d = await res.json(); alert(d.error ?? "erro"); }
  }

  async function openHistory(v: Voter) {
    setViewingVoter(v); setVoterDemands([]);
    const d = await fetch(`/api/demands?voterId=${v.id}`).then((r) => r.json());
    setVoterDemands(d.demands ?? []);
  }

  async function addDemandForVoter(e: React.FormEvent) {
    e.preventDefault();
    if (!viewingVoter) return;
    setSavingDemand(true);
    const res = await fetch("/api/demands", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newDemand, voterId: viewingVoter.id }),
    });
    setSavingDemand(false);
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    setNewDemand({ title: "", category: "saude", priority: "media", description: "" });
    const d = await fetch(`/api/demands?voterId=${viewingVoter.id}`).then((r) => r.json());
    setVoterDemands(d.demands ?? []);
  }

  const canManage = me?.role !== "leader";

  return (
    <div>
      <PageHeader
        title="Eleitores"
        subtitle={
          me?.role === "super_admin" ? `${rows.length} eleitor(es) — visão total`
          : me?.role === "coordinator" ? `${rows.length} eleitor(es) — seu escopo`
          : `${rows.length} eleitor(es) — seus cadastros`
        }
        actions={<Btn onClick={openNew}>+ Novo eleitor</Btn>}
      />

      <Card className="p-4 mb-4">
        <Input placeholder="Buscar por nome, telefone, título, bairro ou cidade…" value={q} onChange={(e) => setQ(e.target.value)} />
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando…</div>
        ) : rows.length === 0 ? (
          <EmptyState title="Nenhum eleitor cadastrado" hint="Clique em '+ Novo eleitor' para começar." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Nome</th>
                  <th className="text-left px-4 py-3">Contato</th>
                  <th className="text-left px-4 py-3">Título</th>
                  <th className="text-left px-4 py-3">Zona/Seção</th>
                  <th className="text-left px-4 py-3">Bairro/Cidade</th>
                  <th className="text-left px-4 py-3">Liderança</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-[#003B6F]">{v.name}</td>
                    <td className="px-4 py-3">{v.phone ?? "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{v.voterTitle ?? "-"}</td>
                    <td className="px-4 py-3 text-xs">
                      {v.zone ? `Z${v.zone}` : "-"} {v.section ? `/ S${v.section}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {v.neighborhood ?? "-"}{v.city ? ` • ${v.city}` : ""}
                    </td>
                    <td className="px-4 py-3">{v.leaderName ?? <Badge color="slate">-</Badge>}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button className="text-orange-600 font-semibold mr-3" onClick={() => openHistory(v)}>Histórico</button>
                      {canManage && (
                        <>
                          <button className="text-[#003B6F] font-semibold mr-3" onClick={() => openEdit(v)}>Editar</button>
                          <button className="text-red-600 font-semibold" onClick={() => del(v)}>Excluir</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={openModal} onClose={() => setOpenModal(false)} title={editing ? "Editar eleitor" : "Novo eleitor"}>
        <form onSubmit={save} className="space-y-3">
          <Field label="Nome *">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Contato">
              <Input
                inputMode="numeric"
                placeholder="(00) 00000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
              />
            </Field>
            <Field label="Título eleitoral">
              <Input
                inputMode="numeric"
                placeholder="0000 0000 0000"
                value={form.voterTitle}
                onChange={(e) => setForm({ ...form, voterTitle: maskVoterTitle(e.target.value) })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Zona">
              <Input inputMode="numeric" placeholder="Ex: 032"
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: maskDigits(e.target.value, 4) })}
              />
            </Field>
            <Field label="Seção">
              <Input inputMode="numeric" placeholder="Ex: 0451"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: maskDigits(e.target.value, 5) })}
              />
            </Field>
            <Field label="Nascimento">
              <Input inputMode="numeric" placeholder="DD/MM/AAAA"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: maskDate(e.target.value) })}
              />
            </Field>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-[#003B6F] mb-2 uppercase tracking-wider">Endereço</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="Rua">
                  <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
                </Field>
              </div>
              <Field label="Nº">
                <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Bairro">
                <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
              </Field>
              <Field label="Município">
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
            </div>
          </div>

          {(me?.role === "coordinator" || me?.role === "super_admin") && !editing && (
            <Field label="Vincular à liderança (opcional)">
              <Select value={form.leaderId} onChange={(e) => setForm({ ...form, leaderId: e.target.value })}>
                <option value="">— nenhuma —</option>
                {leaders.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
          )}

          <Field label="Observações">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </Field>

          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setOpenModal(false)}>Cancelar</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Btn>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!viewingVoter}
        onClose={() => setViewingVoter(null)}
        title={viewingVoter ? `Histórico — ${viewingVoter.name}` : ""}
      >
        <div className="space-y-4">
          {viewingVoter && (
            <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
              <div><b>Contato:</b> {viewingVoter.phone ?? "-"}</div>
              <div><b>Título:</b> <span className="font-mono">{viewingVoter.voterTitle ?? "-"}</span></div>
              <div>
                <b>Zona/Seção:</b> {viewingVoter.zone ? `Z${viewingVoter.zone}` : "-"} {viewingVoter.section ? `/ S${viewingVoter.section}` : ""}
              </div>
              <div>
                <b>Endereço:</b> {viewingVoter.street ?? "-"}{viewingVoter.number ? `, ${viewingVoter.number}` : ""}
                {viewingVoter.neighborhood ? ` — ${viewingVoter.neighborhood}` : ""}
                {viewingVoter.city ? ` (${viewingVoter.city})` : ""}
              </div>
              <div><b>Nascimento:</b> {viewingVoter.birthDate ?? "-"}</div>
            </div>
          )}

          <div className="text-xs text-slate-500">{voterDemands.length} demanda(s) para este eleitor.</div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {voterDemands.length === 0 && <div className="text-sm text-slate-400 text-center py-6">Sem demandas ainda.</div>}
            {voterDemands.map((d) => {
              const cat = getCategory(d.category);
              return (
                <div key={d.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-[#003B6F]">{cat.icon} {d.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{cat.label} • {d.status.replace("_", " ")}</div>
                    </div>
                    <div className="text-xs text-slate-400">{formatDate(d.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="text-sm font-semibold text-[#003B6F] mb-2">➕ Adicionar demanda</div>
            <form onSubmit={addDemandForVoter} className="space-y-2">
              <Input required placeholder="Título da demanda" value={newDemand.title}
                onChange={(e) => setNewDemand({ ...newDemand, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={newDemand.category} onChange={(e) => setNewDemand({ ...newDemand, category: e.target.value })}>
                  {DEMAND_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                </Select>
                <Select value={newDemand.priority} onChange={(e) => setNewDemand({ ...newDemand, priority: e.target.value })}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </Select>
              </div>
              <Textarea placeholder="Descrição (opcional)" rows={2}
                value={newDemand.description} onChange={(e) => setNewDemand({ ...newDemand, description: e.target.value })} />
              <div className="flex justify-end gap-2">
                <Btn variant="ghost" onClick={() => setViewingVoter(null)}>Fechar</Btn>
                <Btn type="submit" disabled={savingDemand}>{savingDemand ? "…" : "Adicionar demanda"}</Btn>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}
