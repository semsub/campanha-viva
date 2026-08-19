"use client";

import { useEffect, useState, useCallback } from "react";
import { Btn, Card, Modal, PageHeader, Field, Input, Select, Badge, EmptyState } from "@/components/UI";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";

type U = {
  id: number; name: string; email: string; phone: string | null;
  role: "super_admin"|"coordinator"|"leader"; territory: string | null;
  active: boolean; createdAt: string;
  coordinatorId: number | null; managerId: number | null;
};

type Me = { id: number; role: "super_admin"|"coordinator"|"leader" };

const emptyForm = { name: "", email: "", phone: "", password: "", role: "leader" as U["role"], territory: "" };

export default function UsuariosPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [pwOpen, setPwOpen] = useState<U | null>(null);
  const [pw, setPw] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch(`/api/users?q=${encodeURIComponent(q)}`).then((r) => r.json());
    setRows(d.users ?? []); setLoading(false);
  }, [q]);
  useEffect(() => { load(); }, [load]);

  const isSuper = me?.role === "super_admin";
  const isCoord = me?.role === "coordinator";

  // Papéis que ESTE usuário pode criar
  const availableRoles: U["role"][] =
    isSuper ? ["coordinator", "leader"]
    : isCoord ? ["leader"]
    : [];

  function openNew() {
    setForm({ ...emptyForm, role: availableRoles[0] ?? "leader" });
    setError(null); setOpenModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    const r = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) { setError(d.error ?? "erro"); return; }
    setOpenModal(false); setForm(emptyForm); load();
  }

  async function toggle(u: U) {
    const r = await fetch(`/api/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    if (r.ok) load(); else { const d = await r.json(); alert(d.error); }
  }

  async function del(u: U) {
    if (!confirm(`Excluir usuário ${u.name}? Esta ação é irreversível.`)) return;
    const r = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (r.ok) load(); else { const d = await r.json(); alert(d.error); }
  }

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    if (!pwOpen) return;
    setPwMsg(null);
    const r = await fetch(`/api/admin/users/${pwOpen.id}/password`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: pw }),
    });
    const d = await r.json();
    if (!r.ok) { setPwMsg(d.error ?? "erro"); return; }
    setPwMsg("Senha alterada com sucesso.");
    setTimeout(() => { setPwOpen(null); setPw(""); setPwMsg(null); }, 1200);
  }

  // Filtro visual: coord vê seus leaders + ele mesmo
  const displayed = rows;

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle={
          isSuper ? `${displayed.length} usuário(s) — visão total`
          : isCoord ? `${displayed.length} usuário(s) — sua equipe`
          : "Sem permissão para gerenciar usuários"
        }
        actions={availableRoles.length > 0 ? <Btn onClick={openNew}>+ Novo usuário</Btn> : undefined}
      />

      <Card className="p-4 mb-4">
        <Input placeholder="Buscar por nome ou email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando…</div>
        ) : displayed.length === 0 ? (
          <EmptyState title="Sem usuários" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">Nome</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Perfil</th>
                  <th className="text-left px-4 py-3">Território</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((u) => {
                  const canManage =
                    (isSuper) ||
                    (isCoord && u.role === "leader" && u.coordinatorId === me?.id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-[#003B6F]">{u.name}</td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${ROLE_COLORS[u.role]}`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3">{u.territory ?? "-"}</td>
                      <td className="px-4 py-3">
                        {u.active ? <Badge color="green">Ativo</Badge> : <Badge color="red">Inativo</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {canManage ? (
                          <>
                            {isSuper && (
                              <button className="text-orange-600 font-semibold mr-3" onClick={() => { setPwOpen(u); setPw(""); setPwMsg(null); }}>Senha</button>
                            )}
                            <button className="text-[#003B6F] font-semibold mr-3" onClick={() => toggle(u)}>{u.active ? "Desativar" : "Ativar"}</button>
                            <button className="text-red-600 font-semibold" onClick={() => del(u)}>Excluir</button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">— sem permissão —</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Novo usuário">
        <form onSubmit={save} className="space-y-3">
          <Field label="Nome *"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="E-mail *"><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Senha inicial *"><Input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            <Field label="Telefone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Perfil *">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as U["role"] })}>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Território/região"><Input value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })} /></Field>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setOpenModal(false)}>Cancelar</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Salvando…" : "Criar usuário"}</Btn>
          </div>
        </form>
      </Modal>

      <Modal open={!!pwOpen} onClose={() => setPwOpen(null)} title={pwOpen ? `Redefinir senha — ${pwOpen.name}` : ""}>
        <form onSubmit={changePw} className="space-y-3">
          <Field label="Nova senha (mínimo 6 caracteres)">
            <Input type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          {pwMsg && <div className={`text-sm p-2 rounded ${pwMsg.includes("sucesso") ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}>{pwMsg}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setPwOpen(null)}>Cancelar</Btn>
            <Btn type="submit">Redefinir senha</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
