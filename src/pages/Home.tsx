import React from 'react';
import { signInWithGoogle, Logo } from '../services/firebase';
import { motion } from 'framer-motion';
import { CheckCircle2, Layout, Users, Zap, Shield, Globe, ArrowRight, Sparkles, TrendingUp, UserPlus } from 'lucide-react';

export default function Home({ user, role }: { user: any, role: string | null }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="text-2xl font-bold tracking-tight">Campanha<span className="text-emerald-500">Viva</span></span>
          </div>
          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400 hidden md:inline">Logado como <span className="text-white font-bold">{user.email}</span></span>
                <a 
                  href={role === 'admin' ? '/admin' : '/dashboard'} 
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2"
                >
                  {role === 'admin' ? 'Painel Admin' : 'Meu Painel'} <ArrowRight size={18} />
                </a>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="bg-white hover:bg-slate-100 text-slate-950 px-6 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2"
              >
                Entrar com Google <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-semibold mb-6 border border-emerald-500/20">
                🚀 A plataforma SaaS definitiva para campanhas políticas
              </span>
              <h1 className="text-8xl font-black leading-[1] tracking-tight mb-8">
                Sua campanha <span className="text-emerald-500 italic">viva</span> em cada rede social.
              </h1>
              <p className="text-2xl text-slate-400 leading-relaxed mb-10 max-w-2xl">
                A tecnologia que o seu candidato precisa para viralizar. Multi-tenant, editor Canva-style, IA criativa e gestão completa de afiliados.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={signInWithGoogle}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-5 rounded-full text-xl font-bold transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
                >
                  Criar Campanha Agora <ArrowRight size={24} />
                </button>
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-10 py-5 rounded-full text-xl font-bold transition-all">
                  Ver Demonstração
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5 bg-white/2">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Candidatos Ativos', value: '500+' },
            { label: 'Apoiadores Engajados', value: '1.2M+' },
            { label: 'Imagens Geradas', value: '5.8M+' },
            { label: 'Taxa de Conversão', value: '94%' }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl font-black text-white mb-2">{stat.value}</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-bold mb-6">Tecnologia de <span className="text-emerald-500">Big Tech</span> para sua campanha</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">Tudo o que você precisa para gerenciar o engajamento digital em escala global.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Isolamento Multi-Tenant", desc: "Cada candidato possui seu próprio banco de dados, layouts e métricas totalmente isolados e seguros." },
              { icon: Sparkles, title: "IA de Engajamento", desc: "Nossa IA identifica os layouts que mais convertem e sugere melhorias automáticas para sua campanha." },
              { icon: UserPlus, title: "Sistema de Afiliados", desc: "Rastreie quem mais traz apoiadores e premie seus maiores mobilizadores digitais com links únicos." },
              { icon: Globe, title: "Domínios Personalizados", desc: "Use seu próprio domínio com SSL automático e roteamento dinâmico para cada candidato." },
              { icon: TrendingUp, title: "Tracking Avançado", desc: "Monitore cliques, uploads e conversões em tempo real com dashboards detalhados." },
              { icon: Layout, title: "Editor Estilo Canva", desc: "Editor drag & drop completo para criar molduras profissionais sem precisar de um designer." }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all group relative overflow-hidden"
              >
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                  <f.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed text-lg">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-emerald-500">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-6xl font-black text-slate-950 mb-8 leading-tight">Pronto para liderar a <br /> revolução digital?</h2>
          <button 
            onClick={signInWithGoogle}
            className="bg-slate-950 text-white px-12 py-6 rounded-full text-2xl font-bold hover:scale-105 transition-all shadow-2xl"
          >
            Começar Agora Gratuitamente
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <Logo className="w-10 h-10" />
                <span className="text-3xl font-bold">CampanhaViva</span>
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                A plataforma de engajamento político mais avançada do Brasil. Desenvolvida por Júnior Araújo Sistemas.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-slate-500">Produto</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-emerald-500 transition-all">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition-all">Preços</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition-all">Segurança</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-slate-500">Suporte</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-emerald-500 transition-all">Documentação</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition-all">Contato</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition-all">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-slate-500 text-sm">
            <p>© 2026 Júnior Araújo Sistemas. Todos os direitos reservados.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-all">Termos de Uso</a>
              <a href="#" className="hover:text-white transition-all">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
