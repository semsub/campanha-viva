"use client";

import { useEffect, useState, useCallback } from "react";
import { Btn, Card, Modal, PageHeader, Field, Input, Select, Textarea, Badge, EmptyState } from "@/components/UI";
import { formatDate } from "@/lib/format";
import { maskDate } from "@/lib/masks";

type Task = {
  id: number; title: string; description: string | null;
  status: "pendente"|"em_andamento"|"concluido"|"cancelado";
  priority: "baixa"|"media"|"alta"|"urgente";
  startDate: string | null; dueDate: string | null;
  assignedTo: number | null; assignedName: string | null;
  createdAt: string;
};

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
    const d = await fetch("/api/tasks").then((r) => r.json());
    setRows(d.tasks ?? []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const r = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (r.ok) { setOpenModal(false); setForm(empty); load(); }
    else alert("Erro ao salvar");
  }
  async function setStatus(t: Task, status: Task["status"]) {
    await fetch(`/api/tasks/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }
  async function del(t: Task) {
    if (!confirm(`Excluir "${t.title}"?`)) return;
    await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
    load();
  }

  const cols: Task["status"][] = ["pendente","em_andamento","concluido","cancelado"];
  const grouped = Object.fromEntries(cols.map(c => [c, rows.filter(r => r.status === c)])) as Record<Task["status"], Task[]>;

  return (
    <div>
      <PageHeader title="Tarefas" subtitle={`${rows.length} tarefa(s)`}
        actions={<Btn onClick={() => { setForm(empty); setOpenModal(true); }}>+ Nova tarefa</Btn>} />

      {loading ? (<Card className="p-8 text-center text-slate-400">Carregando…</Card>)
      : rows.length === 0 ? (<Card><EmptyState title="Nenhuma tarefa" /></Card>)
      : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cols.map((col) => (
            <div key={col}>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-bold text-[#003B6F]">{statusLabel[col]}</h3>
                <Badge color={statusColor[col]}>{grouped[col].length}</Badge>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {grouped[col].map((t) => (
                  <Card key={t.id} className="p-3">
                    <div className="font-semibold text-[#003B6F] text-sm">{t.title}</div>
                    {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
                    <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                      {t.startDate && <div>▶ Início: {t.startDate}</div>}
                      {t.dueDate && <div>⏱ Prazo: {t.dueDate}</div>}
                      {t.assignedName && <div>👤 {t.assignedName}</div>}
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {cols.filter(c => c !== col).map(c => (
                        <button key={c} onClick={() => setStatus(t, c)} className={`text-xs bg-${statusColor[c]}-100 text-${statusColor[c]}-700 px-2 py-0.5 rounded font-semibold`}>
                          {statusLabel[c]}
                        </button>
                      ))}
                      <button onClick={() => del(t)} className="text-xs text-red-600 font-semibold ml-auto">×</button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Nova tarefa">
        <form onSubmit={save} className="space-y-3">
          <Field label="Título *"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Descrição"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início (DD/MM/AAAA)">
              <Input inputMode="numeric" placeholder="DD/MM/AAAA" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: maskDate(e.target.value) })} />
            </Field>
            <Field label="Término (DD/MM/AAAA)">
              <Input inputMode="numeric" placeholder="DD/MM/AAAA" value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: maskDate(e.target.value) })} />
            </Field>
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
