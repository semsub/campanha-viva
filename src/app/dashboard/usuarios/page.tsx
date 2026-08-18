"use client";

import { useEffect, useState, useCallback } from "react";
import { roleLabels, formatDate } from "@/lib/utils";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  territory: string | null;
  active: boolean | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "leader", phone: "", territory: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    
    const sessionRes = await fetch("/api/auth/session");
    if (sessionRes.ok) {
      const sessionData = await sessionRes.json();
      if (sessionData?.user) {
        setCurrentUserRole(sessionData.user.role);
      }
    }

    const res = await fetch(`/api/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowForm(false);
      setFormData({ name: "", email: "", password: "", role: "leader", phone: "", territory: "" });
      loadData();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao criar usuário");
    }
  };

  const toggleActive = async (user: User) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erro ao atualizar status");
    }
    loadData();
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Tem certeza que deseja remover permanentemente o usuário ${user.name}?`)) return;
    const res = await fetch(`/api/users/${user.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadData();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao remover usuário");
    }
  };

  const handleChangePassword = async () => {
    if (!editingUser || !newPassword) return;
    if (newPassword.length < 6) {
      setPasswordMsg("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    const res = await fetch(`/api/users/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    if (res.ok) {
      setPasswordMsg("✅ Senha alterada com sucesso!");
      setNewPassword("");
      setTimeout(() => { setEditingUser(null); setPasswordMsg(""); }, 2000);
      loadData();
    } else {
      const data = await res.json();
      setPasswordMsg(`❌ ${data.error || "Erro ao alterar senha"}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue" style={{ fontFamily: "'Playfair Display', serif" }}>Usuários</h1>
          <p className="text-sm text-gray-400">{users.length} registrados na sua rede</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "✕ Fechar" : "+ Novo Usuário"}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-base font-bold text-brand-blue mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-brand-orange inline-block" />
            Novo Usuário / Subordinado
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Nome *</label>
                <input className="input-field" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">E-mail *</label>
                <input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Senha *</label>
                <input type="password" className="input-field" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Telefone</label>
                <input className="input-field" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Território</label>
                <input className="input-field" value={formData.territory} onChange={(e) => setFormData({ ...formData, territory: e.target.value })} placeholder="Ex: Zona Norte / Bairro" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Perfil *</label>
                <select className="input-field" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  {currentUserRole === "super_admin" && <option value="super_admin">Super Administrador</option>}
                  <option value="coordinator">Coordenador</option>
                  <option value="coordenador_regional">Coordenador Regional</option>
                  <option value="leader">Liderança / Líder</option>
                  <option value="lideranca">Liderança</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {editingUser && (
        <div className="card border-2 border-brand-orange/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-brand-blue flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-brand-orange inline-block" />
              Alterar Senha — {editingUser.name}
            </h3>
            <button onClick={() => { setEditingUser(null); setNewPassword(""); setPasswordMsg(""); }} className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg">✕</button>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-brand-blue/60 uppercase tracking-wider mb-1.5">Nova Senha</label>
              <input
                type="password"
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
            <button onClick={handleChangePassword} className="btn-primary whitespace-nowrap">
              🔑 Alterar Senha
            </button>
          </div>
          {passwordMsg && (
            <p className={`mt-3 text-sm font-medium ${passwordMsg.includes("✅") ? "text-emerald-600" : "text-red-500"}`}>
              {passwordMsg}
            </p>
          )}
        </div>
      )}

      <div className="card">
        <input className="input-field" placeholder="🔍 Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-gray">
              <tr>
                <th className="table-header">Nome</th>
                <th className="table-header">E-mail</th>
                <th className="table-header">Perfil</th>
                <th className="table-header">Telefone</th>
                <th className="table-header">Território</th>
                <th className="table-header">Status</th>
                <th className="table-header">Último Acesso</th>
                <th className="table-header">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="table-cell text-center text-gray-300">Carregando...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="table-cell text-center text-gray-300">Nenhum usuário encontrado</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-brand-cream/50 transition-colors">
                    <td className="table-cell font-semibold text-brand-blue">{u.name}</td>
                    <td className="table-cell text-gray-500">{u.email}</td>
                    <td className="table-cell">
                      <span className="badge bg-brand-blue/10 text-brand-blue">{roleLabels[u.role] || u.role}</span>
                    </td>
                    <td className="table-cell text-gray-500">{u.phone || "-"}</td>
                    <td className="table-cell text-gray-500">{u.territory || "-"}</td>
                    <td className="table-cell">
                      <span className={`badge ${u.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        {u.active ? "● Ativo" : "● Inativo"}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-400">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "Nunca"}</td>
                    <td className="table-cell">
                      <div className="flex gap-3 items-center">
                        <button onClick={() => toggleActive(u)} className={`text-xs font-semibold cursor-pointer ${u.active ? "text-red-500 hover:text-red-700" : "text-emerald-600 hover:text-emerald-800"}`}>
                          {u.active ? "Desativar" : "Ativar"}
                        </button>
                        <button onClick={() => { setEditingUser(u); setNewPassword(""); setPasswordMsg(""); }} className="text-xs font-semibold text-brand-orange hover:text-brand-orange-light cursor-pointer">
                          🔑 Senha
                        </button>
                        {currentUserRole === "super_admin" && (
                          <button onClick={() => handleDelete(u)} className="text-xs font-semibold text-red-700 hover:text-red-900 cursor-pointer">
                            🗑️ Remover
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center pt-2">
        <p className="text-[10px] text-gray-300">
          Desenvolvido por <span className="font-semibold text-gray-400">Júnior Araújo Sistemas</span>
        </p>
      </div>
    </div>
  );
}
