import Image from "next/image";
import {
  ShieldCheck,
  MapPin,
  Users,
  Handshake,
  ClipboardList,
  BarChart3,
  CalendarDays,
  BellRing,
  Scale,
} from "lucide-react";

const modules = [
  { icon: ShieldCheck, title: "Super Admin", desc: "Controle total: coordenadores, permissões, categorias, território, auditoria e LGPD." },
  { icon: MapPin, title: "Coordenadores", desc: "Gestão regional: lideranças, demandas distribuídas, mapas e produtividade." },
  { icon: Users, title: "Lideranças", desc: "Operação de campo: cadastro de eleitores, demandas, visitas e atendimentos." },
  { icon: ClipboardList, title: "Demandas", desc: "Protocolos por categoria — saúde, social, educação, infraestrutura e mais." },
  { icon: CalendarDays, title: "Agenda & Eventos", desc: "Reuniões, atendimentos, mobilizações e compromissos por usuário e região." },
  { icon: BarChart3, title: "Indicadores", desc: "Dashboards por perfil, mapa de calor e inteligência territorial." },
  { icon: BellRing, title: "Notificações", desc: "Avisos internos, prazos e comunicados hierárquicos com leitura confirmada." },
  { icon: Scale, title: "LGPD & Auditoria", desc: "Consentimento, retenção, anonimização e trilha completa de acesso." },
  { icon: Handshake, title: "Eleitores", desc: "Ficha operacional única com histórico, território e relacionamento." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#00264D]">
      {/* faixa superior da marca */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#003B6F] via-[#0B4F8A] to-[#F07A1A]" />

      {/* HERO */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#003B6F] via-[#002B55] to-[#001A33] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(circle at 75% 15%, rgba(240,122,26,.35), transparent 55%)" }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 py-16 md:flex-row md:gap-16">
          <div className="shrink-0 rounded-3xl bg-white p-4 shadow-[0_40px_90px_rgba(0,0,0,0.5)]">
            <Image src="/images/logo.png" alt="Júnior Araújo Coordenação" width={300} height={300} priority />
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#F59E5B]">
              Plataforma Oficial
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">
              Júnior Araújo{" "}
              <span className="text-[#F07A1A]">Coordenação</span>
            </h1>
            <p className="mt-4 max-w-xl text-white/75">
              Gestão territorial hierárquica de campanha: Super Admin, Coordenadores,
              Lideranças e Eleitores — com demandas, tarefas, eventos, mapas,
              indicadores e auditoria completa.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <a
                href="/login"
                className="rounded-xl bg-gradient-to-br from-[#F07A1A] to-[#FF9A3A] px-8 py-3.5 font-bold tracking-wide text-white shadow-[0_12px_30px_rgba(240,122,26,0.4)] transition hover:-translate-y-0.5"
              >
                ACESSAR O SISTEMA
              </a>
              <span className="rounded-xl border border-white/25 px-8 py-3.5 text-sm font-medium text-white/80">
                campanhaviva.com.br
              </span>
            </div>
          </div>
        </div>
        {/* configurações neon necessárias */}

      </header>

      {/* MÓDULOS */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#F07A1A]">Módulos</p>
            <h2 className="mt-2 text-3xl font-extrabold text-[#003B6F]">
              Estrutura operacional completa
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <div
              key={m.title}
              className="group rounded-2xl border border-[#E2EAF3] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#F07A1A]/50 hover:shadow-xl"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#003B6F] to-[#0B4F8A] text-white transition group-hover:from-[#F07A1A] group-hover:to-[#FF9A3A]">
                <m.icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#003B6F]">{m.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#5B6E85]">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HIERARQUIA */}
      <section className="bg-[#F5F8FB] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#F07A1A]">Hierarquia</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#003B6F]">Fluxo de comando</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              { n: "01", t: "Super Admin", d: "Cria campanhas e coordenadores, define permissões, senhas e auditoria." },
              { n: "02", t: "Coordenador", d: "Gerencia região, cria lideranças e distribui demandas." },
              { n: "03", t: "Liderança", d: "Cadastra eleitores e registra demandas em campo." },
              { n: "04", t: "Eleitor", d: "Recebe atendimento rastreado até a resolução." },
            ].map((s, i) => (
              <div key={s.n} className="relative rounded-2xl border border-[#E2EAF3] bg-white p-6">
                <span className="text-3xl font-extrabold text-[#F07A1A]/30">{s.n}</span>
                <h3 className="mt-2 font-bold text-[#003B6F]">{s.t}</h3>
                <p className="mt-1 text-sm text-[#5B6E85]">{s.d}</p>
                {i < 3 && (
                  <span className="absolute -right-4 top-1/2 hidden h-px w-8 bg-[#F07A1A]/60 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="bg-[#001A33] py-10 text-center text-white/70">
        <Image
          src="/images/logo.png"
          alt="Júnior Araújo Coordenação"
          width={120}
          height={120}
          className="mx-auto rounded-2xl bg-white p-2"
        />
        <p className="mt-5 text-sm">
          Desenvolvido por <b className="text-white">Júnior Araújo Sistemas</b>
        </p>
        <p className="mt-1 text-sm">
          <span className="text-[#F07A1A]">(91) 98212-2175</span> · junior.araujo21@yahoo.com.br
        </p>
      </footer>
    </main>
  );
}
