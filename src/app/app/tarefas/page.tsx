"use client";

import { useEffect, useState, useCallback } from "react";
import { Btn, Card, Modal, PageHeader, Field, Input, Select, Textarea, Badge, EmptyState } from "@/components/UI";
import { formatDate } from "@/lib/format";

type Task = {
  id: number; title: string; description: string | null;
  status: "pendente"|"em_andamento"|"concluida";
  dueDate: string | null;
  assignedTo: number | null; assignedName: string | null;
  createdAt: string;
};

const statusColor: Record<string, string> = { pendente: "yellow", em_andamento: "blue", concluida: "green" };
const empty = { title: "", description: "", dueDate: "" };

export default function TarefasPage() {
  const [rows, setRows] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/tasks").then((r) => r.json());
    setRows(d.tasks ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setOpenModal(false); setForm(empty); load(); }
    else alert("Erro ao salvar tarefa");
  }

  async function setStatus(t: Task, status: Task["status"]) {
    await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function del(t: Task) {
    if (!confirm(`Excluir "${t.title}"?`)) return;
    await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
    load();
  }

  const grouped = {
    pendente: rows.filter((r) => r.status === "pendente"),
    em_andamento: rows.filter((r) => r.status === "em_andamento"),
    concluida: rows.filter((r) => r.status === "concluida"),
  };

  return (
    <div>
      <PageHeader title="Tarefas" subtitle={`${rows.length} tarefa(s)`}
        actions={<Btn onClick={() => { setForm(empty); setOpenModal(true); }}>+ Nova tarefa</Btn>} />

      {loading ? (
        <Card className="p-8 text-center text-slate-400">Carregando…</Card>
      ) : rows.length === 0 ? (
        <Card><EmptyState title="Nenhuma tarefa" hint="Crie sua primeira tarefa." /></Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {(["pendente", "em_andamento", "concluida"] as const).map((col) => (
            <div key={col}>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-bold text-[#003B6F] capitalize">{col.replace("_", " ")}</h3>
                <Badge color={statusColor[col]}>{grouped[col].length}</Badge>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {grouped[col].map((t) => (
                  <Card key={t.id} className="p-3">
                    <div className="font-semibold text-[#003B6F]">{t.title}</div>
                    {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
                    {t.dueDate && <div className="text-xs text-slate-400 mt-2">📅 {formatDate(t.dueDate)}</div>}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {col !== "pendente" && <button onClick={() => setStatus(t, "pendente")} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-semibold">Pendente</button>}
                      {col !== "em_andamento" && <button onClick={() => setStatus(t, "em_andamento")} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">Andamento</button>}
                      {col !== "concluida" && <button onClick={() => setStatus(t, "concluida")} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-semibold">Concluir</button>}
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
          <Field label="Título *">
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Descrição">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Data limite">
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
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
