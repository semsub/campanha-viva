"use client";
import { useEffect, useState } from "react";

type Item = { id: number; name: string; state?: string; municipalityId?: number; regionId?: number; active: boolean };

export default function TerritorioPage() {
  const [municipalities, setMunicipalities] = useState<Item[]>([]);
  const [regions, setRegions] = useState<Item[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"municipalities" | "regions" | "neighborhoods">("municipalities");
  const [form, setForm] = useState({ name: "", state: "PA", municipalityId: "", regionId: "" });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/territorial?type=all");
    const d = await res.json();
    setMunicipalities(d.municipalities ?? []);
    setRegions(d.regions ?? []);
    setNeighborhoods(d.neighborhoods ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true); setMsg("");
    const typeMap = { municipalities: "municipality", regions: "region", neighborhoods: "neighborhood" } as const;
    const body: Record<string, unknown> = { type: typeMap[tab], name: form.name };
    if (tab === "municipalities") body.state = form.state;
    if (tab === "regions") body.municipalityId = form.municipalityId ? Number(form.municipalityId) : null;
    if (tab === "neighborhoods") { body.regionId = form.regionId ? Number(form.regionId) : null; body.municipalityId = form.municipalityId ? Number(form.municipalityId) : null; }

    const res = await fetch("/api/territorial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setMsg("✅ Adicionado!"); setForm({ name: "", state: "PA", municipalityId: "", regionId: "" }); load(); }
    else { const d = await res.json(); setMsg(`❌ ${d.error}`); }
    setSaving(false);
  }

  const items = tab === "municipalities" ? municipalities : tab === "regions" ? regions : neighborhoods;
  const tabs = [
    { k: "municipalities" as const, l: "🏙️ Municípios", c: municipalities.length },
    { k: "regions" as const, l: "📍 Regiões", c: regions.length },
    { k: "neighborhoods" as const, l: "🏘️ Bairros", c: neighborhoods.length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#003B6F] mb-6">🗺️ Estrutura Territorial</h1>

      {msg && <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${msg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg}</div>}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${tab === t.k ? "bg-[#003B6F] text-white shadow-md" : "bg-white border border-[#E2EAF3] text-[#5B6E85] hover:bg-[#F5F8FB]"}`}>
            {t.l} <span className="ml-1 rounded-full bg-white/20 px-1.5 text-xs">{t.c}</span>
          </button>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="mb-6 rounded-2xl border border-[#E2EAF3] bg-white p-5 shadow-sm flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Nome</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={`Nome do ${tab === "municipalities" ? "município" : tab === "regions" ? "região" : "bairro"}`} required className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition" />
        </div>
        {tab === "municipalities" && (
          <div className="w-24">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">UF</label>
            <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={2} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] transition" />
          </div>
        )}
        {(tab === "regions" || tab === "neighborhoods") && (
          <div className="w-48">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Município</label>
            <select value={form.municipalityId} onChange={e => setForm({ ...form, municipalityId: e.target.value })} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] transition">
              <option value="">Selecione...</option>
              {municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}
        {tab === "neighborhoods" && (
          <div className="w-48">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Região</label>
            <select value={form.regionId} onChange={e => setForm({ ...form, regionId: e.target.value })} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] transition">
              <option value="">Selecione...</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        )}
        <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-[#003B6F] to-[#0B5FAA] px-6 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50 transition">
          {saving ? "..." : "＋ Adicionar"}
        </button>
      </form>

      {/* List */}
      <div className="rounded-2xl border border-[#E2EAF3] bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-[#E2EAF3] bg-[#F5F8FB]">
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">ID</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Nome</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Status</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={3} className="px-4 py-12 text-center text-[#6b7a8f]">Carregando...</td></tr> :
            items.length === 0 ? <tr><td colSpan={3} className="px-4 py-12 text-center text-[#6b7a8f]">Nenhum registro. Adicione acima.</td></tr> :
            items.map(i => (
              <tr key={i.id} className="border-b border-[#F5F8FB] hover:bg-[#F5F8FB] transition">
                <td className="px-4 py-3 text-[#6b7a8f]">#{i.id}</td>
                <td className="px-4 py-3 font-semibold text-[#003B6F]">{i.name}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700">Ativo</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
