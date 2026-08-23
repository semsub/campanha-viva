"use client";
import { useEffect, useState, useCallback } from "react";
import { MaskedInput } from "@/components/MaskedInput";

type Voter = { id: number; name: string; phone: string|null; electoralZone: string|null; electoralSection: string|null; address: string|null; addressNumber: string|null; birthDate: string|null; votingLocation: string|null; status: string; createdAt: string; notes: string|null };

const inputCls = "w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition";

export default function EleitoresPage() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", tituloEleitoral: "", electoralZone: "", electoralSection: "",
    rua: "", numero: "", bairro: "", municipio: "", birthDate: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/voters?search=${encodeURIComponent(search)}&page=${page}&limit=20`);
    const data = await res.json();
    setVoters(data.voters ?? []); setTotal(data.total ?? 0); setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true); setMsg("");

    // Monta endereço: Rua, Nº, Bairro, Município
    const addressParts = [form.rua, form.numero ? `Nº ${form.numero}` : "", form.bairro, form.municipio].filter(Boolean);
    const address = addressParts.join(", ");

    // Converte data DD/MM/AAAA para AAAA-MM-DD (ISO)
    let birthDateISO: string | undefined;
    if (form.birthDate && form.birthDate.length === 10) {
      const [dd, mm, aaaa] = form.birthDate.split("/");
      birthDateISO = `${aaaa}-${mm}-${dd}`;
    }

    const res = await fetch("/api/voters", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, phone: form.phone,
        votingLocation: form.tituloEleitoral,
        electoralZone: form.electoralZone, electoralSection: form.electoralSection,
        address, addressNumber: form.numero,
        birthDate: birthDateISO, notes: form.notes,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("✅ Eleitor cadastrado com sucesso!");
      setForm({ name: "", phone: "", tituloEleitoral: "", electoralZone: "", electoralSection: "", rua: "", numero: "", bairro: "", municipio: "", birthDate: "", notes: "" });
      setShowForm(false); load();
    } else setMsg(`❌ ${data.error}`);
    setSaving(false);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#003B6F]">👥 Eleitores</h1>
          <p className="text-sm text-[#6b7a8f]">{total} cadastrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-gradient-to-r from-[#F07A1A] to-[#FF9A3A] px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition">
          {showForm ? "✕ Cancelar" : "＋ Novo Eleitor"}
        </button>
      </div>

      {msg && <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${msg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg}</div>}

      {/* FORMULÁRIO DE CADASTRO PADRÃO */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-[#E2EAF3] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#003B6F] mb-4">📝 Cadastrar Eleitor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* NOME */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Nome Completo *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome completo do eleitor" required className={inputCls} />
            </div>

            {/* CONTATO (00) 00000-0000 */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">📱 Contato *</label>
              <MaskedInput value={form.phone} onChange={v => setForm({ ...form, phone: v })} mask="phone" placeholder="(00) 00000-0000" required className={inputCls} />
            </div>

            {/* TÍTULO ELEITORAL 0000 0000 0000 */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">🗳️ Título Eleitoral</label>
              <MaskedInput value={form.tituloEleitoral} onChange={v => setForm({ ...form, tituloEleitoral: v })} mask="titulo" placeholder="0000 0000 0000" className={inputCls} />
            </div>

            {/* DATA DE NASCIMENTO DD/MM/AAAA */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">🎂 Data de Nascimento</label>
              <MaskedInput value={form.birthDate} onChange={v => setForm({ ...form, birthDate: v })} mask="date" placeholder="DD/MM/AAAA" className={inputCls} />
            </div>

            {/* ZONA */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">📍 Zona Eleitoral</label>
              <input value={form.electoralZone} onChange={e => setForm({ ...form, electoralZone: e.target.value })} placeholder="000" className={inputCls} />
            </div>

            {/* SEÇÃO */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">📍 Seção Eleitoral</label>
              <input value={form.electoralSection} onChange={e => setForm({ ...form, electoralSection: e.target.value })} placeholder="0000" className={inputCls} />
            </div>

            {/* ENDEREÇO */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">🏠 Rua / Avenida</label>
              <input value={form.rua} onChange={e => setForm({ ...form, rua: e.target.value })} placeholder="Rua, Avenida, Travessa..." className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Nº</label>
              <input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="123" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">🏘️ Bairro</label>
              <input value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} placeholder="Bairro" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">🏙️ Município</label>
              <input value={form.municipio} onChange={e => setForm({ ...form, municipio: e.target.value })} placeholder="Município" className={inputCls} />
            </div>

          </div>
          <button type="submit" disabled={saving} className="mt-5 rounded-xl bg-gradient-to-r from-[#003B6F] to-[#0B5FAA] px-8 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition">
            {saving ? "Salvando..." : "💾 Cadastrar Eleitor"}
          </button>
        </form>
      )}

      {/* Busca */}
      <div className="mb-4">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Pesquisar por nome ou telefone..." className="w-full max-w-md rounded-xl border-2 border-[#E2EAF3] bg-white px-4 py-3 text-sm outline-none focus:border-[#F07A1A] transition" />
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border border-[#E2EAF3] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#E2EAF3] bg-[#F5F8FB]">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Contato</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F] hidden md:table-cell">Título Eleitoral</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F] hidden md:table-cell">Zona/Seção</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F] hidden lg:table-cell">Endereço</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F] hidden lg:table-cell">Nascimento</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-[#6b7a8f]">Carregando...</td></tr> :
              voters.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-[#6b7a8f]">Nenhum eleitor. Clique em &quot;＋ Novo Eleitor&quot;.</td></tr> :
              voters.map(v => (
                <tr key={v.id} className="border-b border-[#F5F8FB] hover:bg-[#F5F8FB] transition">
                  <td className="px-4 py-3 font-semibold text-[#003B6F]">{v.name}</td>
                  <td className="px-4 py-3 text-[#5B6E85]">{v.phone || "—"}</td>
                  <td className="px-4 py-3 text-[#5B6E85] hidden md:table-cell font-mono">{v.votingLocation || "—"}</td>
                  <td className="px-4 py-3 text-[#5B6E85] hidden md:table-cell">{v.electoralZone && v.electoralSection ? `${v.electoralZone} / ${v.electoralSection}` : "—"}</td>
                  <td className="px-4 py-3 text-[#5B6E85] hidden lg:table-cell max-w-xs truncate">{v.address || "—"}</td>
                  <td className="px-4 py-3 text-[#5B6E85] hidden lg:table-cell">{v.birthDate ? new Date(v.birthDate + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#E2EAF3] px-4 py-3">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1} className="rounded-lg border px-3 py-1 text-xs font-semibold disabled:opacity-30">← Anterior</button>
            <span className="text-xs text-[#6b7a8f]">Página {page} de {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page>=totalPages} className="rounded-lg border px-3 py-1 text-xs font-semibold disabled:opacity-30">Próxima →</button>
          </div>
        )}
      </div>
    </div>
  );
}
