"use client";

import { useEffect, useState, useCallback } from "react";
import { Btn, Card, Modal, PageHeader, Field, Input, Textarea, EmptyState, Badge } from "@/components/UI";
import { formatDate, formatPhone } from "@/lib/format";

type Voter = {
  id: number; name: string; phone: string | null; cpf: string | null;
  address: string | null; neighborhood: string | null; city: string | null;
  birthDate: string | null; notes: string | null;
  leaderName: string | null; createdAt: string;
};

const empty = { name: "", phone: "", cpf: "", address: "", neighborhood: "", city: "", birthDate: "", notes: "" };

export default function EleitoresPage() {
  const [rows, setRows] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Voter | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/voters?q=${encodeURIComponent(q)}`);
    const d = await r.json();
    setRows(d.voters ?? []);
    setLoading(false);
  }, [q]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null); setForm(empty); setError(null); setOpenModal(true);
  }
  function openEdit(v: Voter) {
    setEditing(v);
    setForm({
      name: v.name, phone: v.phone ?? "", cpf: v.cpf ?? "",
      address: v.address ?? "", neighborhood: v.neighborhood ?? "",
      city: v.city ?? "", birthDate: v.birthDate ?? "", notes: v.notes ?? "",
    });
    setError(null); setOpenModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const method = editing ? "PATCH" : "POST";
      const url = editing ? `/api/voters/${editing.id}` : "/api/voters";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    else alert("Sem permissão ou erro ao excluir.");
  }

  return (
    <div>
      <PageHeader title="Eleitores" subtitle={`${rows.length} cadastrado(s)`}
        actions={<Btn onClick={openNew}>+ Novo eleitor</Btn>} />

      <Card className="p-4 mb-4">
        <Input placeholder="Buscar por nome, telefone, CPF ou bairro…" value={q} onChange={(e) => setQ(e.target.value)} />
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
                  <th className="text-left px-4 py-3">Telefone</th>
                  <th className="text-left px-4 py-3">Bairro/Cidade</th>
                  <th className="text-left px-4 py-3">Liderança</th>
                  <th className="text-left px-4 py-3">Cadastro</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-[#003B6F]">{v.name}</td>
                    <td className="px-4 py-3">{formatPhone(v.phone)}</td>
                    <td className="px-4 py-3">
                      {v.neighborhood ?? "-"}{v.city ? ` • ${v.city}` : ""}
                    </td>
                    <td className="px-4 py-3">{v.leaderName ?? <Badge color="slate">-</Badge>}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(v.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-[#003B6F] font-semibold mr-3" onClick={() => openEdit(v)}>Editar</button>
                      <button className="text-red-600 font-semibold" onClick={() => del(v)}>Excluir</button>
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
          <Field label="Nome completo *">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(91) 90000-0000" />
            </Field>
            <Field label="CPF">
              <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            </Field>
          </div>
          <Field label="Endereço">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bairro">
              <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
            </Field>
            <Field label="Cidade">
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
          </div>
          <Field label="Data de nascimento">
            <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          </Field>
          <Field label="Observações">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
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
