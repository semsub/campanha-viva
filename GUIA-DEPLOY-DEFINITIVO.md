# 🚀 GUIA DEFINITIVO — Júnior Araújo Coordenação

## 🔑 Login: `admin@campanhaviva.com.br` / `Admin@2026`

---

## 📤 PASSO 1 — SUBSTITUIR TODO O CÓDIGO NO KALI

⚠️ **IMPORTANTE**: Este comando apaga o código antigo e substitui pelo novo.
O histórico do git é mantido.

```bash
# 1. Entre na pasta do projeto
cd ~/coordenador

# 2. Backup de segurança
cp -r . ../coordenador-backup-$(date +%Y%m%d-%H%M)

# 3. Apague TUDO exceto .git (manter histórico)
find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +

# 4. Agora copie TODOS os arquivos do Arena para esta pasta
#    → No Arena, clique nos 3 pontinhos (⋮) → "Download project"
#    → Extraia o ZIP
#    → Copie TUDO para ~/coordenador/

# 5. Verificação rápida (todos devem retornar o arquivo):
ls src/db/schema.ts
ls src/middleware.ts
ls src/lib/logo-data.ts
ls public/manifest.json
ls public/icons/icon-512.png
```

---

## 📤 PASSO 2 — SUBIR PARA O GITHUB

```bash
cd ~/coordenador

# Adicionar tudo
git add .

# Commit
git commit -m "Sistema completo — Júnior Araújo Coordenação v7"

# Push forçado (sobrescreve o histórico problemático)
git push --force
```

### Se pedir autenticação:
```bash
# No GitHub: Settings → Developer settings → Personal access tokens → Tokens (classic)
# → Generate new token → escopo "repo" → copie o token
# No terminal, quando pedir senha, cole o TOKEN (não a senha do GitHub)
```

---

## ⚙️ PASSO 3 — CONFIGURAR O RENDER

### 3.1 Variáveis de Ambiente

No Render → seu serviço → **Environment**:

| Variável | Valor | Obrigatório |
|----------|-------|:-----------:|
| `DATABASE_URL` | `postgresql://USER:PASS@HOST/DB?sslmode=require` | ✅ |
| `SESSION_SECRET` | qualquer frase longa aleatória | ✅ |
| `NODE_VERSION` | `22` | ✅ |

⚠️ A DATABASE_URL **DEVE terminar com `?sslmode=require`** (Neon exige isso).

### 3.2 Comandos de Build/Start

| Campo | Valor |
|-------|-------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |

### 3.3 Obter a DATABASE_URL do Neon

1. Acesse **neon.tech** → seu projeto
2. Dashboard → "Connection Details"
3. Selecione **"Pooled connection"**
4. Copie a string completa (já vem com `?sslmode=require`)
5. Cole no Render como `DATABASE_URL`

---

## 🔍 PASSO 4 — VERIFICAR APÓS O DEPLOY

Acesse no navegador:

```
https://campanha-viva.onrender.com/api/diag
```

**Resultado esperado:**
```json
{
  "1_DATABASE_URL": "✅ Configurada (postgresql://...)",
  "3_CONEXAO_BANCO": "✅ Conectado — banco: neondb",
  "5_SUPER_ADMIN": "✅ Existe: admin@campanhaviva.com.br"
}
```

**Se aparecer ❌**, o problema está na DATABASE_URL. Verifique:
- Não tem espaço antes ou depois da URL
- Termina com `?sslmode=require`
- O user/password estão corretos no Neon

---

## 📋 REFERÊNCIA: OS 6 ERROS RESOLVIDOS

| # | Erro | Causa | Solução nesta versão |
|---|------|-------|---------------------|
| 1 | `Property 'userId' does not exist` | Schema usava `coordinatorId` mas código usava `userId` | ✅ Schema e código 100% sincronizados |
| 2 | `types "super_admin" and "lideranca" have no overlap` | Enum de roles inconsistente | ✅ Enum unificado: `super_admin`, `coordinator`, `leader` |
| 3 | Conflito geral no sistema | Arquivos antigos misturados | ✅ Projeto limpo, zero arquivos fantasmas |
| 4 | `Module not found: Can't resolve 'pg'` | Dependência `pg` não instalada | ✅ `pg` e `@types/pg` no package.json |
| 5 | `failed to push... branch is behind` | Histórico git divergente | ✅ Resolvido com `git push --force` |
| 6 | `getaddrinfo ENOTFOUND base` | DATABASE_URL ausente/errada no Render | ✅ Auto-diagnóstico via `/api/diag` |

---

## 📊 O QUE ESTÁ FUNCIONANDO

| Módulo | Funcionalidade |
|--------|---------------|
| **Login** | Cookie HTTP seguro, redirect automático |
| **Dashboard** | Stats em tempo real, ações rápidas |
| **Eleitores** | Cadastro com máscaras: (00) 00000-0000 / 0000 0000 0000 / DD/MM/AAAA |
| **Demandas** | Seletor de eleitor obrigatório, 19 categorias, 9 status |
| **Usuários** | Super Admin cria coordenadores; Coordenador cria lideranças; troca de senha |
| **Território** | Municípios, regiões, bairros |
| **Tarefas** | CRUD com prioridade e prazo |
| **Eventos** | 8 tipos (reunião, encontro, esportivo, etc.) |
| **Auditoria** | Por coordenador (líderes, eleitores, demandas) + logs de atividade |
| **Proteção** | Anti-print, anti-screenshot, anti-DevTools, marca d'água |
| **PWA/APK** | 7 tamanhos de ícone, manifest completo, instalável no Android |
| **Isolamento** | Cada coordenador vê SÓ seus dados |

---

*Desenvolvido por Júnior Araújo Sistemas — (91) 98212-2175 — junior.araujo21@yahoo.com.br*
