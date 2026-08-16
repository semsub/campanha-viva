import React, { useState, useEffect } from 'react';
import { db, auth, logout, Logo } from '../services/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Trash2, Zap, LogOut, 
  Search, Shield, BarChart3, Settings, 
  ExternalLink, Mail, Calendar, Loader2
} from 'lucide-react';

export default function AdminDashboard({ user }: { user: any }) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', email: '', slug: '', ownerUid: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'candidates'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCandidates(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'candidates'), {
        ...newCandidate,
        createdAt: new Date().toISOString(),
        slug: newCandidate.slug.toLowerCase().replace(/\s+/g, '-'),
        stats: { supporters: 0, layouts: 0, shares: 0 }
      });
      setShowModal(false);
      setNewCandidate({ name: '', email: '', slug: '', ownerUid: '' });
    } catch (error) {
      console.error('Error creating candidate:', error);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este candidato? Esta ação é irreversível.')) {
      try {
        await deleteDoc(doc(db, 'candidates', id));
      } catch (error) {
        console.error('Error deleting candidate:', error);
      }
    }
  };

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-emerald-500"><Zap className="animate-pulse" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/5 flex flex-col p-8 sticky top-0 h-screen bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-12">
          <Logo className="w-10 h-10" />
          <span className="text-xl font-bold tracking-tight">Admin<span className="text-emerald-500">Viva</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { icon: Users, label: 'Candidatos', active: true },
            { icon: BarChart3, label: 'Métricas Globais' },
            { icon: Settings, label: 'Configurações' }
          ].map((item, i) => (
            <button 
              key={i}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-semibold ${item.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon size={22} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-white/5">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-semibold"
          >
            <LogOut size={22} />
            Sair do Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Painel Master</h1>
            <p className="text-slate-400">Gerencie todos os candidatos e monitore o crescimento da plataforma.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-8 py-4 bg-emerald-500 text-slate-950 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20"
          >
            <UserPlus size={20} /> Novo Candidato
          </button>
        </header>

        {/* Search & Filters */}
        <div className="mb-8 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nome ou email..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-4 focus:outline-none focus:border-emerald-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Candidates Table */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Candidato</th>
                <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Slug / Link</th>
                <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Data de Criação</th>
                <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{c.name}</p>
                        <p className="text-sm text-slate-500">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-sm font-mono">/{c.slug}</span>
                      <a href={`/c/${c.slug}`} target="_blank" className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-500 transition-all">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-slate-500 text-sm">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleDeleteCandidate(c.id)}
                      className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCandidates.length === 0 && (
            <div className="p-20 text-center text-slate-500">
              Nenhum candidato encontrado.
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] w-full max-w-xl shadow-2xl"
            >
              <h3 className="text-3xl font-bold mb-8">Novo Candidato</h3>
              <form onSubmit={handleCreateCandidate} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
                  <input 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-all"
                    value={newCandidate.name}
                    onChange={e => setNewCandidate({...newCandidate, name: e.target.value})}
                    placeholder="Ex: Paulo Henrique Gomes"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email de Acesso</label>
                    <input 
                      required
                      type="email"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-all"
                      value={newCandidate.email}
                      onChange={e => setNewCandidate({...newCandidate, email: e.target.value})}
                      placeholder="paulo@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">UID do Firebase</label>
                    <input 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-all"
                      value={newCandidate.ownerUid}
                      onChange={e => setNewCandidate({...newCandidate, ownerUid: e.target.value})}
                      placeholder="UID do usuário"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Slug da URL</label>
                  <input 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-all"
                    value={newCandidate.slug}
                    onChange={e => setNewCandidate({...newCandidate, slug: e.target.value})}
                    placeholder="paulo-henrique"
                  />
                </div>
                
                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all font-bold shadow-xl shadow-emerald-500/20"
                  >
                    Criar Candidato
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
