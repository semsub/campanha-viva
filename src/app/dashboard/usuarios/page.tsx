"use client";
import { useEffect, useState, useCallback } from "react";

type User = { id: number; name: string; email: string; phone: string|null; role: string; active: boolean; territory: string|null; createdAt: string };
const roleLabel: Record<string,string> = { super_admin:"Super Admin", admin:"Administrador", coordinator:"Coordenador", leader:"Liderança" };
const roleColor: Record<string,string> = { super_admin:"bg-red-50 text-red-700", admin:"bg-purple-50 text-purple-700", coordinator:"bg-blue-50 text-blue-700", leader:"bg-green-50 text-green-700" };

export default function UsuariosPage() {
  const [list, setList] = useState<User[]>([]);
  const [me, setMe] = useState<{ role: string }|null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", role:"leader", territory:"" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [pwdId, setPwdId] = useState<number|null>(null);
  const [newPwd, setNewPwd] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/users?search=${encodeURIComponent(search)}`);
    const d = await res.json(); setList(d.users??[]); setLoading(false);
  }, [search]);

  useEffect(() => { load(); fetch("/api/auth/me").then(r=>r.json()).then(d=>setMe(d.user)); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg("");
    const res = await fetch("/api/users", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) });
    const d = await res.json();
    if (res.ok) { setMsg("✅ Usuário criado!"); setForm({ name:"",email:"",phone:"",password:"",role:"leader",territory:"" }); setShowForm(false); load(); }
    else setMsg(`❌ ${d.error}`); setSaving(false);
  }

  async function toggleActive(u: User) {
    await fetch(`/api/users/${u.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ active: !u.active }) }); load();
  }

  async function removeUser(u: User) {
    if (!confirm(`Remover ${u.name}?`)) return;
    await fetch(`/api/users/${u.id}`, { method:"DELETE" }); setMsg(`✅ ${u.name} removido.`); load();
  }

  async function resetPwd(uid: number) {
    if (!newPwd || newPwd.length < 6) { setMsg("❌ Mínimo 6 caracteres."); return; }
    const res = await fetch(`/api/users/${uid}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ password: newPwd }) });
    if (res.ok) { setMsg("✅ Senha alterada!"); setPwdId(null); setNewPwd(""); } else { const d = await res.json(); setMsg(`❌ ${d.error}`); }
  }

  // Roles que este usuário pode criar
  const isSA = me?.role === "super_admin";
  const isAdm = me?.role === "admin" || isSA;
  const roleOptions: { v: string; l: string }[] = [];
  if (isSA) roleOptions.push({ v:"admin", l:"Administrador" });
  if (isAdm) roleOptions.push({ v:"coordinator", l:"Coordenador" });
  roleOptions.push({ v:"leader", l:"Liderança" });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#003B6F]">🛡️ Gestão de Usuários</h1>
          <p className="text-sm text-[#6b7a8f]">
            {isSA ? "Crie Admin, Coordenadores e Lideranças" : isAdm ? "Crie Coordenadores e Lideranças" : "Crie Lideranças"}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-gradient-to-r from-[#F07A1A] to-[#FF9A3A] px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition">
          {showForm ? "✕ Cancelar" : "＋ Novo Usuário"}
        </button>
      </div>

      <div className="mb-4 rounded-xl bg-[#003B6F]/5 border border-[#003B6F]/10 p-4 text-xs text-[#003B6F] space-y-1">
        <p>🔺 <b>Hierarquia:</b> Super Admin → Administrador → Coordenador → Liderança → Eleitores</p>
        <p>• Cada nível só gerencia quem está abaixo e que foi criado por ele.</p>
        <p>• Coordenadores são isolados entre si — não veem dados de outros coordenadores.</p>
      </div>

      {msg && <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${msg.startsWith("✅")?"bg-green-50 text-green-700 border border-green-200":"bg-red-50 text-red-700 border border-red-200"}`}>{msg}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-[#E2EAF3] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#003B6F] mb-4">Criar Usuário</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Nome *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition" /></div>
            <div><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">E-mail *</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition" /></div>
            <div><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Telefone</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition" /></div>
            <div><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Senha *</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={6} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition" /></div>
            <div><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Perfil</label>
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] transition">
                {roleOptions.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-bold uppercase tracking-wider text-[#003B6F] mb-1">Território</label><input value={form.territory} onChange={e=>setForm({...form,territory:e.target.value})} placeholder="Região/Bairro" className="w-full rounded-xl border-2 border-[#E2EAF3] bg-[#F5F8FB] px-4 py-3 text-sm outline-none focus:border-[#F07A1A] focus:bg-white transition" /></div>
          </div>
          <button type="submit" disabled={saving} className="mt-4 rounded-xl bg-gradient-to-r from-[#003B6F] to-[#0B5FAA] px-8 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50 transition">{saving?"Salvando...":"💾 Criar Usuário"}</button>
        </form>
      )}

      <div className="mb-4"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Pesquisar..." className="w-full max-w-md rounded-xl border-2 border-[#E2EAF3] bg-white px-4 py-3 text-sm outline-none focus:border-[#F07A1A] transition" /></div>

      <div className="rounded-2xl border border-[#E2EAF3] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b bg-[#F5F8FB]">
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Nome</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F] hidden md:table-cell">E-mail</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Perfil</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Status</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#003B6F]">Ações</th>
          </tr></thead><tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-[#6b7a8f]">Carregando...</td></tr> :
            list.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-[#6b7a8f]">Nenhum usuário.</td></tr> :
            list.map(u => (
              <tr key={u.id} className="border-b border-[#F5F8FB] hover:bg-[#F5F8FB] transition">
                <td className="px-4 py-3 font-semibold text-[#003B6F]">{u.name}</td>
                <td className="px-4 py-3 text-[#5B6E85] hidden md:table-cell">{u.email}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${roleColor[u.role]??""}`}>{roleLabel[u.role]}</span></td>
                <td className="px-4 py-3"><button onClick={()=>toggleActive(u)} className={`rounded-full px-2 py-1 text-xs font-bold cursor-pointer ${u.active?"bg-green-50 text-green-700":"bg-red-50 text-red-700"}`}>{u.active?"Ativo":"Inativo"}</button></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    {pwdId===u.id ? (<>
                      <input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Nova senha" className="w-24 rounded-lg border px-2 py-1 text-xs" />
                      <button onClick={()=>resetPwd(u.id)} className="rounded-lg bg-[#F07A1A] px-2 py-1 text-xs text-white font-bold">OK</button>
                      <button onClick={()=>setPwdId(null)} className="text-xs text-gray-500">✕</button>
                    </>) : (<>
                      <button onClick={()=>{setPwdId(u.id);setNewPwd("")}} className="rounded-lg border border-[#E2EAF3] px-2 py-1 text-xs font-semibold text-[#003B6F] hover:bg-[#F5F8FB]">🔑</button>
                      <button onClick={()=>removeUser(u)} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">🗑️</button>
                    </>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </div>
    </div>
  );
}
