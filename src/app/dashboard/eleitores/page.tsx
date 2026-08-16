"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDate } from "@/lib/utils";

interface Voter { id: number; fullName: string; socialName: string | null; phone: string | null; email: string | null; address: string | null; neighborhoodId: number | null; registrationStatus: string | null; createdAt: string; consentGiven: boolean | null; }
interface TerritorialItem { id: number; name: string; }

export default function VotersPage() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [municipalities, setMunicipalities] = useState<TerritorialItem[]>([]);
  const [regions, setRegions] = useState<TerritorialItem[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<TerritorialItem[]>([]);
  const [formData, setFormData] = useState({ fullName: "", socialName: "", birthDate: "", cpf: "", phone: "", email: "", address: "", addressNumber: "", complement: "", cep: "", referencePoint: "", municipalityId: "", regionId: "", neighborhoodId: "", community: "", contactForm: "", consentGiven: false });

  const loadVoters = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/voters?${params}`);
    const data = await res.json();
    setVoters(data.voters); setTotal(data.total); setLoading(false);
  }, [page, search]);

  useEffect(() => { loadVoters(); }, [loadVoters]);
  useEffect(() => {
    fetch("/api/territorial?type=municipalities").then(r => r.json()).then(d => setMunicipalities(d.data));
    fetch("/api/territorial?type=regions").then(r => r.json()).then(d => setRegions(d.data));
    fetch("/api/territorial?type=neighborhoods").then(r => r.json()).then(d => setNeighborhoods(d.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/voters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    if (res.ok) { setShowForm(false); setFormData({ fullName: "", socialName: "", birthDate: "", cpf: "", phone: "", email: "", address: "", addressNumber: "", complement: "", cep: "", referencePoint: "", municipalityId: "", regionId: "", neighborhoodId: "", community: "", contactForm: "", consentGiven: false }); loadVoters(); }
    else { const data = await res.json(); alert(data.error || "Erro"); }
  };

  const LBL = "block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue" style={{ fontFamily: "'Playfair Display', serif" }}>Eleitores</h1>
          <p className="text-sm text-gray-400">{total} cadastrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? "✕ Fechar" : "+ Novo Eleitor"}</button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-base font-bold text-brand-blue mb-4 flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-brand-orange inline-block" /> Cadastrar Eleitor</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={LBL}>Nome Completo *</label><input className="input-field" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required /></div>
              <div><label className={LBL}>Nome Social</label><input className="input-field" value={formData.socialName} onChange={(e) => setFormData({ ...formData, socialName: e.target.value })} /></div>
              <div><label className={LBL}>Data de Nascimento</label><input type="date" className="input-field" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} /></div>
              <div><label className={LBL}>CPF</label><input className="input-field" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
              <div><label className={LBL}>Telefone</label><input className="input-field" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
              <div><label className={LBL}>E-mail</label><input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              <div><label className={LBL}>Endereço</label><input className="input-field" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
              <div><label className={LBL}>Número</label><input className="input-field" value={formData.addressNumber} onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })} /></div>
              <div><label className={LBL}>Complemento</label><input className="input-field" value={formData.complement} onChange={(e) => setFormData({ ...formData, complement: e.target.value })} /></div>
              <div><label className={LBL}>CEP</label><input className="input-field" value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: e.target.value })} /></div>
              <div><label className={LBL}>Município</label><select className="input-field" value={formData.municipalityId} onChange={(e) => setFormData({ ...formData, municipalityId: e.target.value })}><option value="">Selecione</option>{municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              <div><label className={LBL}>Região</label><select className="input-field" value={formData.regionId} onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}><option value="">Selecione</option>{regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
              <div><label className={LBL}>Bairro</label><select className="input-field" value={formData.neighborhoodId} onChange={(e) => setFormData({ ...formData, neighborhoodId: e.target.value })}><option value="">Selecione</option>{neighborhoods.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}</select></div>
              <div><label className={LBL}>Comunidade</label><input className="input-field" value={formData.community} onChange={(e) => setFormData({ ...formData, community: e.target.value })} /></div>
              <div><label className={LBL}>Ponto de Referência</label><input className="input-field" value={formData.referencePoint} onChange={(e) => setFormData({ ...formData, referencePoint: e.target.value })} /></div>
              <div><label className={LBL}>Forma de Contato</label>
                <select className="input-field" value={formData.contactForm} onChange={(e) => setFormData({ ...formData, contactForm: e.target.value })}>
                  <option value="">Selecione</option><option value="presencial">Presencial</option><option value="telefone">Telefone</option><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="redes_sociais">Redes Sociais</option><option value="evento">Evento</option>
                </select></div>
            </div>
            <div className="bg-brand-blue/5 border border-brand-blue/10 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 accent-brand-orange" checked={formData.consentGiven} onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })} />
                <span className="text-sm text-brand-blue/70 leading-relaxed">O eleitor concorda com o cadastro de seus dados pessoais para fins de gestão territorial, de acordo com a LGPD. Os dados serão tratados com finalidade específica e podem ser excluídos a qualquer momento.</span>
              </label>
            </div>
            <div className="flex gap-2"><button type="submit" className="btn-primary">Salvar Eleitor</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button></div>
          </form>
        </div>
      )}

      <div className="card"><input className="input-field" placeholder="🔍 Buscar por nome ou telefone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-gray"><tr>
              <th className="table-header">Nome</th><th className="table-header">Telefone</th><th className="table-header">E-mail</th><th className="table-header">Status</th><th className="table-header">LGPD</th><th className="table-header">Cadastro</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={6} className="table-cell text-center text-gray-300">Carregando...</td></tr>
              : voters.length === 0 ? <tr><td colSpan={6} className="table-cell text-center text-gray-300">Nenhum eleitor encontrado</td></tr>
              : voters.map((v) => (
                <tr key={v.id} className="hover:bg-brand-cream/50 transition-colors">
                  <td className="table-cell font-semibold text-brand-blue">{v.fullName}</td>
                  <td className="table-cell text-gray-500">{v.phone || "-"}</td>
                  <td className="table-cell text-gray-500">{v.email || "-"}</td>
                  <td className="table-cell"><span className={`badge ${v.registrationStatus === "ativo" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{v.registrationStatus || "ativo"}</span></td>
                  <td className="table-cell"><span className={`badge ${v.consentGiven ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{v.consentGiven ? "✓ Consentido" : "Pendente"}</span></td>
                  <td className="table-cell text-gray-400 text-xs">{formatDate(v.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <p className="text-sm text-gray-400">Página {page} • {total} registros</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs">Anterior</button>
              <button onClick={() => setPage(p => p + 1)} disabled={voters.length < 20} className="btn-secondary text-xs">Próxima</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
