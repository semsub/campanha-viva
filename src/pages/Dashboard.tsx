import React, { useState, useEffect } from 'react';
import { db, auth, logout, Logo } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, getDocs, limit, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Users, BarChart3, Settings, Plus, LogOut, 
  ExternalLink, Copy, Check, Trash2, Edit3, Sparkles, 
  ChevronRight, Globe, Zap, Shield, TrendingUp, UserPlus,
  Image as ImageIcon, Share2, Download, MousePointer2, Loader2
} from 'lucide-react';
import { generateCampaignSlogan } from '../services/openrouter';

export default function Dashboard({ user, role }: { user: any, role: string | null }) {
  const [candidate, setCandidate] = useState<any>(null);
  const [layouts, setLayouts] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingSlogan, setIsGeneratingSlogan] = useState(false);
  const [slogans, setSlogans] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch candidate profile where ownerUid matches
    const q = query(collection(db, 'candidates'), where('ownerUid', '==', user.uid), limit(1));
    const unsubscribeCandidate = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const candData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setCandidate(candData);
        
        // Fetch layouts for this candidate
        const layoutsQuery = query(
          collection(db, `candidates/${candData.id}/layouts`),
          orderBy('createdAt', 'desc')
        );
        onSnapshot(layoutsQuery, (lSnap) => {
          setLayouts(lSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Fetch affiliates
        const affiliatesQuery = query(collection(db, `candidates/${candData.id}/affiliates`));
        onSnapshot(affiliatesQuery, (aSnap) => {
          setAffiliates(aSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      } else {
        setCandidate(null);
      }
      setLoading(false);
    });

    return () => unsubscribeCandidate();
  }, [user]);

  const handleGenerateSlogans = async () => {
    if (!candidate) return;
    setIsGeneratingSlogan(true);
    try {
      const res = await generateCampaignSlogan(candidate.name, candidate.bio || 'Campanha política');
      setSlogans(res);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setIsGeneratingSlogan(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-emerald-500"><Zap className="animate-pulse" size={48} /></div>;

  if (!candidate) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[3rem] text-center"
        >
          <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Shield className="text-red-500" size={48} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Acesso Restrito</h2>
          <p className="text-slate-400 mb-10 leading-relaxed">
            Sua conta ainda não está vinculada a nenhum candidato. Entre em contato com o administrador para ativar seu perfil.
          </p>
          <button 
            onClick={logout}
            className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold text-lg transition-all border border-white/10"
          >
            Sair do Sistema
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/5 flex flex-col p-8 sticky top-0 h-screen bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-12">
          <Logo className="w-10 h-10" />
          <span className="text-xl font-bold tracking-tight">Campanha<span className="text-emerald-500">Viva</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { icon: BarChart3, label: 'Visão Geral', active: true },
            { icon: Layout, label: 'Layouts' },
            { icon: Users, label: 'Afiliados' },
            { icon: Globe, label: 'Domínio' },
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
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-500">
              {candidate.name[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold truncate">{candidate.name}</p>
              <p className="text-xs text-slate-500 truncate">Candidato Oficial</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-semibold"
          >
            <LogOut size={22} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-black mb-2 tracking-tight">Olá, {candidate.name.split(' ')[0]}!</h1>
            <p className="text-slate-400 text-lg">Gerencie sua campanha digital e acompanhe seu crescimento em tempo real.</p>
          </div>
          <div className="flex gap-4">
            <a 
              href={`/c/${candidate.slug}`}
              target="_blank"
              className="px-8 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all font-bold flex items-center gap-2"
            >
              Ver Página Pública <ExternalLink size={20} />
            </a>
            <button 
              onClick={() => window.location.href = `/editor?candidateId=${candidate.id}`}
              className="px-8 py-4 rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all font-bold flex items-center gap-2 shadow-xl shadow-emerald-500/20"
            >
              <Plus size={24} /> Criar Novo Layout
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          {[
            { icon: Users, label: 'Apoiadores', value: candidate.stats?.supporters || 0, trend: '+12%', color: 'emerald' },
            { icon: Layout, label: 'Layouts Ativos', value: layouts.length, trend: '0%', color: 'blue' },
            { icon: UserPlus, label: 'Afiliados', value: affiliates.length, trend: '+5%', color: 'purple' },
            { icon: TrendingUp, label: 'Engajamento', value: '85%', trend: '+2%', color: 'orange' }
          ].map((stat, i) => (
            <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-${stat.color}-500/10 transition-all`} />
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-500`}>
                  <stat.icon size={24} />
                </div>
                <span className="text-emerald-500 text-sm font-bold">{stat.trend}</span>
              </div>
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Layouts Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Layout className="text-emerald-500" /> Seus Layouts Oficiais
            </h2>
            <button className="text-emerald-500 font-bold hover:underline">Ver todos os layouts</button>
          </div>
          
          {layouts.length === 0 ? (
            <div className="p-20 border-2 border-dashed border-white/10 rounded-[3rem] text-center bg-white/2">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <ImageIcon className="text-slate-500" size={40} />
              </div>
              <p className="text-slate-400 text-lg mb-8 max-w-sm mx-auto">Você ainda não criou nenhum layout para sua campanha. Comece agora!</p>
              <button 
                onClick={() => window.location.href = `/editor?candidateId=${candidate.id}`}
                className="px-10 py-4 rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all font-bold shadow-xl shadow-emerald-500/20"
              >
                Criar meu primeiro layout
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-8">
              {layouts.map((layout, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden group">
                  <div className="aspect-square bg-slate-900 relative overflow-hidden">
                    <img src={layout.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4 backdrop-blur-sm">
                      <button className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-950 hover:scale-110 transition-all shadow-xl"><Edit3 size={24} /></button>
                      <button className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white hover:scale-110 transition-all shadow-xl"><Trash2 size={24} /></button>
                    </div>
                  </div>
                  <div className="p-8">
                    <h4 className="font-bold text-xl mb-1">{layout.name}</h4>
                    <p className="text-slate-500 text-sm">Criado em {new Date(layout.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* AI Suggestions */}
        <section className="p-12 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-[3rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12">
            <Sparkles className="text-emerald-500 animate-pulse" size={48} />
          </div>
          <div className="max-w-2xl relative z-10">
            <h2 className="text-3xl font-bold mb-4">Sugestões da IA para sua Campanha</h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              Baseado no seu perfil e nas tendências atuais, nossa IA sugere os seguintes slogans para aumentar seu engajamento nas redes sociais:
            </p>
            
            {slogans.length > 0 ? (
              <div className="space-y-4">
                {slogans.map((s, i) => (
                  <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-emerald-500/50 transition-all">
                    <p className="font-bold italic text-lg">"{s}"</p>
                    <button className="p-3 opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500/20 rounded-xl text-emerald-500">
                      <Copy size={20} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button 
                onClick={handleGenerateSlogans}
                disabled={isGeneratingSlogan}
                className="px-10 py-5 rounded-2xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center gap-3 text-lg shadow-xl shadow-emerald-500/20"
              >
                {isGeneratingSlogan ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                Gerar Slogans com IA
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
