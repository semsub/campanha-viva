# Júnior Araújo Coordenação

Plataforma de gestão territorial de campanha — [campanhaviva.com.br](https://campanhaviva.com.br)

Sistema hierárquico piramidal:
**Super Admin → Coordenadores → Lideranças → Eleitores**

## Início rápido (5 comandos)

```bash
# 1. Instalar
npm install

# 2. Configurar
cp .env.example .env   # se existir, ou crie o .env com DATABASE_URL
# edite .env com sua Connection String do Neon

# 3. Rodar
npm run build && npm run start

# 4. Inicializar banco (uma vez)
curl -X POST http://localhost:3000/api/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campanhaviva.com.br","password":"Admin@2026"}'

# 5. Acessar
# http://localhost:3000/login
# admin@campanhaviva.com.br / Admin@2026
```

## Se algo der errado

**Passo 1 — Diagnóstico automático:**
```bash
bash scripts/doctor.sh                                    # verifica local
bash scripts/doctor.sh https://campanha-viva.onrender.com # verifica remoto
```

**Passo 2 — Correção automática dos erros mais comuns:**
```bash
bash scripts/fix.sh
```

**Passo 3 — Guia detalhado dos 6 erros clássicos:**
Veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — cada erro tem sintoma, causa e solução exata.

## Deploy

**Render** (grátis):
- Environment: `NODE_VERSION=22`, `DATABASE_URL=<neon>?sslmode=require`, `SESSION_SECRET=<frase-longa>`
- Build: `npm ci && npm run build`
- Start: `npm run start`
- **É automático:** todo `git push` na `main` gera novo deploy.

**Neon** (banco grátis):
- Crie projeto em [neon.tech](https://neon.tech) região São Paulo
- Copie a **Pooled connection string** e cole em `DATABASE_URL`
- O sistema cria as tabelas sozinho na primeira chamada de `/api/bootstrap`

**Domínio campanhaviva.com.br** (Registro.br):
- No Render adicione o domínio → copie o CNAME
- No painel do Registro.br → DNS → adicione:
  - `A     @    76.76.21.21`
  - `CNAME www  cname.vercel-dns.com` *(ou o que o Render indicar)*
- SSL é automático.

## Estrutura de arquivos

```
src/
├── app/
│   ├── api/          # endpoints REST (auth, users, voters, demands, tasks, events, audit, reports, bootstrap)
│   ├── app/          # painel autenticado (dashboard, eleitores, demandas, tarefas, eventos, usuarios, coordenadores, auditoria)
│   ├── login/        # tela de login
│   └── layout.tsx    # PWA config (manifest, icons)
├── components/
│   ├── Shell.tsx           # sidebar + topbar
│   ├── UI.tsx              # componentes reutilizáveis
│   ├── AntiScreenshot.tsx  # proteção contra print + marca d'água
│   └── ...
├── db/
│   ├── schema.ts     # Drizzle schema (users, voters, demands, tasks, events, audit_logs)
│   └── index.ts      # conexão pool (pg + SSL Neon automático)
└── lib/
    ├── auth.ts          # sessão HMAC assinada em cookie
    ├── scope.ts         # regras piramidais (isolamento por coordenador)
    ├── permissions.ts   # papéis
    ├── categories.ts    # 18 categorias de demanda
    ├── masks.ts         # máscaras (telefone, título eleitoral, data)
    └── format.ts        # helpers de formatação

scripts/
├── doctor.sh              # diagnóstico automático
├── fix.sh                 # correção automática dos erros comuns
├── seed-super-admin.mjs   # cria/atualiza Super Admin no banco
└── generate-icons.mjs     # regera todos os ícones do PWA

public/
├── images/logo.png    # logomarca oficial
├── icons/             # 17 tamanhos de ícone (PWA + iOS + maskable)
├── manifest.json      # PWA manifest
└── sw.js              # Service Worker
```

## Contato

Desenvolvido por **Júnior Araújo Sistemas**
📞 (91) 98212-2175 · ✉️ junior.araujo21@yahoo.com.br
