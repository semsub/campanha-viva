"use client";
import { useEffect, useState, useCallback } from "react";
import { Btn, Card, Modal, PageHeader, Field, Input, Select, Textarea, EmptyState, Badge } from "@/components/UI";
import { maskDate } from "@/lib/masks";

type Task = { id: number; title: string; description: string | null; status: "pendente"|"em_andamento"|"concluido"|"cancelado"; priority: string; startDate: string | null; dueDate: string | null };
const statusColor: Record<string, string> = { pendente: "yellow", em_andamento: "blue", concluido: "green", cancelado: "red" };
const statusLabel: Record<string, string> = { pendente: "Pendente", em_andamento: "Em Andamento", concluido: "Concluído", cancelado: "Cancelado" };
const empty = { title: "", description: "", startDate: "", dueDate: "", priority: "media" as "baixa"|"media"|"alta"|"urgente" };

export default function TarefasPage() {
  const [rows, setRows] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/tasks", { credentials: "include" });
    if (r.status === 401) { window.location.href = "/login"; return; }
    const d = await r.json().catch(() => ({ tasks: [] }));
    setRows(d.tasks ?? []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch("/api/tasks", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setOpenModal(false); setForm(empty); load();
  }
  async function setStatus(t: Task, status: Task["status"]) {
    await fetch(`/api/tasks/${t.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }
  async function del(t: Task) {
    if (!confirm(`Excluir "${t.title}"?`)) return;
    await fetch(`/api/tasks/${t.id}`, { method: "DELETE", credentials: "include" }); load();
  }

  return (
    <div>
      <PageHeader title="Tarefas" subtitle={`${rows.length} tarefa(s)`} actions={<Btn onClick={() => { setForm(empty); setOpenModal(true); }}>+ Nova tarefa</Btn>} />
      {loading ? <Card className="p-8 text-center text-slate-400">Carregando…</Card>
      : rows.length === 0 ? <Card><EmptyState title="Nenhuma tarefa" /></Card>
      : (
        <div className="grid gap-2">
          {rows.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-[#003B6F]">{t.title}</div>
                  {t.description && <div className="text-sm text-slate-500 mt-1">{t.description}</div>}
                  <div className="flex gap-2 mt-2 flex-wrap text-xs text-slate-500">
                    <Badge color={statusColor[t.status]}>{statusLabel[t.status]}</Badge>
                    <Badge color="orange">{t.priority}</Badge>
                    {t.startDate && <span>Início: {t.startDate}</span>}
                    {t.dueDate && <span>Fim: {t.dueDate}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {(["pendente","em_andamento","concluido","cancelado"] as const).filter(s => s !== t.status).map(s => (
                    <button key={s} onClick={() => setStatus(t, s)} className="text-xs text-[#003B6F] hover:underline">{statusLabel[s]}</button>
                  ))}
                  <button onClick={() => del(t)} className="text-xs text-red-600 hover:underline">Excluir</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Nova tarefa">
        <form onSubmit={save} className="space-y-3">
          <Field label="Título *"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Descrição"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início (DD/MM/AAAA)"><Input inputMode="numeric" placeholder="DD/MM/AAAA" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: maskDate(e.target.value) })} /></Field>
            <Field label="Fim (DD/MM/AAAA)"><Input inputMode="numeric" placeholder="DD/MM/AAAA" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: maskDate(e.target.value) })} /></Field>
          </div>
          <Field label="Prioridade">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as "baixa"|"media"|"alta"|"urgente" })}>
              <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setOpenModal(false)}>Cancelar</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "…" : "Criar"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
