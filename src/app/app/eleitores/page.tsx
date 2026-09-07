"use client";
import { useEffect, useState, useCallback } from "react";
import { Btn, Card, Modal, PageHeader, Field, Input, Textarea, EmptyState } from "@/components/UI";
import { maskPhone, maskVoterTitle, maskDate, maskZone, maskSection } from "@/lib/masks";
import { formatDate } from "@/lib/format";

type Voter = {
  id: number; name: string; phone: string | null;
  voterTitle: string | null; zone: string | null; section: string | null;
  street: string | null; number: string | null;
  neighborhood: string | null; city: string | null;
  birthDate: string | null; notes: string | null;
  leaderName: string | null;
  createdByName: string | null; // quem cadastrou (só aparece para coord/admin/super)
  createdAt: string;
};
type Me = { id: number; role: "super_admin"|"admin"|"coordinator"|"leader" };
const emptyForm = { name: "", phone: "", voterTitle: "", zone: "", section: "", street: "", number: "", neighborhood: "", city: "", birthDate: "", notes: "" };

export default function EleitoresPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Voter | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user)); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/voters?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (r.status === 401) { window.location.href = "/login"; return; }
      const d = await r.json().catch(() => ({ voters: [] }));
      setRows(d.voters ?? []);
    } finally { setLoading(false); }
  }, [q]);
  useEffect(() => { load(); }, [load]);

  const isLeader = me?.role === "leader";
  // canSee = pode VISUALIZAR dados completos na LISTA (leader não pode)
  const canSee = !isLeader;

  function openNew() { setEditing(null); setForm(emptyForm); setErr(null); setOpenModal(true); }
  function openEdit(v: Voter) {
    setEditing(v);
    setForm({
      name: v.name, phone: v.phone ?? "",
      voterTitle: v.voterTitle ?? "", zone: v.zone ?? "", section: v.section ?? "",
      street: v.street ?? "", number: v.number ?? "",
      neighborhood: v.neighborhood ?? "", city: v.city ?? "",
      birthDate: v.birthDate ?? "", notes: v.notes ?? "",
    });
    setErr(null); setOpenModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErr(null);
    try {
      const url = editing ? `/api/voters/${editing.id}` : "/api/voters";
      const method = editing ? "PATCH" : "POST";
      // Envia TODOS os campos — inclusive para leader (leader cadastra tudo, mas depois só vê nome/telefone)
      const r = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      setOpenModal(false); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "erro"); }
    finally { setSaving(false); }
  }

  async function del(v: Voter) {
    if (!confirm(`Excluir eleitor ${v.name}?`)) return;
    const r = await fetch(`/api/voters/${v.id}`, { method: "DELETE", credentials: "include" });
    if (r.status === 401) { window.location.href = "/login"; return; }
    const d = await r.json().catch(() => ({}));
    if (r.ok) load(); else alert(d.error ?? "erro");
  }

  return (
    <div>
      <PageHeader title="Eleitores" subtitle={`${rows.length} cadastrado(s)`} actions={<Btn onClick={openNew}>+ Novo eleitor</Btn>} />
      {isLeader && (
        <Card className="p-3 mb-4 bg-orange-50 border-orange-200 text-orange-800 text-xs">
          🔒 Como Liderança, você <b>cadastra</b> todos os dados, mas depois de salvo só visualiza <b>Nome</b> e <b>Contato</b> dos seus eleitores. Os dados completos ficam disponíveis para o Coordenador e Super Admin.
        </Card>
      )}
      <Card className="p-4 mb-4">
        <Input placeholder={isLeader ? "Buscar por nome ou telefone…" : "Buscar por nome, telefone, bairro…"} value={q} onChange={(e) => setQ(e.target.value)} />
      </Card>
      <Card className="overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400">Carregando…</div>
        : rows.length === 0 ? <EmptyState title="Nenhum eleitor" hint="Clique em '+ Novo eleitor'" />
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Nome</th>
                  <th className="text-left px-4 py-3">Contato</th>
                  {canSee && <th className="text-left px-4 py-3">Título</th>}
                  {canSee && <th className="text-left px-4 py-3">Z/S</th>}
                  {canSee && <th className="text-left px-4 py-3">Bairro/Cidade</th>}
                  {canSee && <th className="text-left px-4 py-3">Cadastrado por</th>}
                  {canSee && <th className="text-left px-4 py-3">Data</th>}
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-[#003B6F]">{v.name}</td>
                    <td className="px-4 py-3">{v.phone ?? "-"}</td>
                    {canSee && <td className="px-4 py-3 font-mono text-xs">{v.voterTitle ?? "-"}</td>}
                    {canSee && <td className="px-4 py-3 text-xs">{v.zone ? `Z${v.zone}` : "-"}{v.section ? `/S${v.section}` : ""}</td>}
                    {canSee && <td className="px-4 py-3">{v.neighborhood ?? "-"}{v.city ? ` • ${v.city}` : ""}</td>}
                    {canSee && (
                      <td className="px-4 py-3 text-xs">
                        {v.createdByName
                          ? <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">👤 {v.createdByName}</span>
                          : <span className="text-slate-400">-</span>}
                      </td>
                    )}
                    {canSee && <td className="px-4 py-3 text-xs text-slate-500">{formatDate(v.createdAt)}</td>}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(v)} className="text-[#003B6F] font-semibold mr-3">Editar</button>
                      <button onClick={() => del(v)} className="text-red-600 font-semibold">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Formulário: SEMPRE mostra todos os campos, inclusive para leader */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title={editing ? "Editar eleitor" : "Novo eleitor"}>
        <form onSubmit={save} className="space-y-3">
          <Field label="Nome completo *"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contato">
              <Input inputMode="numeric" placeholder="(00) 00000-0000" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} />
            </Field>
            <Field label="Título eleitoral">
              <Input inputMode="numeric" placeholder="0000 0000 0000" value={form.voterTitle}
                onChange={(e) => setForm({ ...form, voterTitle: maskVoterTitle(e.target.value) })} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Zona"><Input inputMode="numeric" placeholder="0000" value={form.zone} onChange={(e) => setForm({ ...form, zone: maskZone(e.target.value) })} /></Field>
            <Field label="Seção"><Input inputMode="numeric" placeholder="0000" value={form.section} onChange={(e) => setForm({ ...form, section: maskSection(e.target.value) })} /></Field>
            <Field label="Nascimento"><Input inputMode="numeric" placeholder="DD/MM/AAAA" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: maskDate(e.target.value) })} /></Field>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-[#003B6F] mb-2 uppercase">Endereço</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Field label="Rua"><Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></Field></div>
              <Field label="Nº"><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Bairro"><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></Field>
              <Field label="Município"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            </div>
          </div>
          <Field label="Observações"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          {isLeader && (
            <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded p-2">
              ℹ️ Após salvar, você continuará vendo apenas o <b>Nome</b> e <b>Contato</b> dos seus eleitores. Os dados completos serão visíveis apenas ao Coordenador e Super Admin.
            </div>
          )}
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
