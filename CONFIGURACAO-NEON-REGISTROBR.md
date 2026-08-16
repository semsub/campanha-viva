# 📖 Configuração Completa - Neon + Registro.br + Vercel

## 🗄️ 1. NEON - Banco de Dados PostgreSQL (Gratuito)

### 1.1 Criar Conta

1. Acesse: https://neon.tech
2. Clique em **"Sign Up"** ou **"Continue with GitHub"**
3. Complete o cadastro com e-mail ou GitHub

### 1.2 Criar Projeto

1. No dashboard, clique em **"New Project"**
2. Preencha:
   - **Project name:** `campanhaviva`
   - **Region:** `AWS - us-east-1 (N. Virginia)` ou `us-east-2 (Ohio)`
   - **Compute size:** `Free (0.25 vCPU, 0.5 GB RAM)`
3. Clique em **"Create Project"**

### 1.3 Obter Connection String

1. No dashboard do projeto, clique em **"Connection Details"** (botão verde)
2. Em **"Connection String"**, clique em **"Copy"**
3. A URL será assim:
   ```
   postgresql://campanhaviva_owner:abc123xyz@ep-cool-branch-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Guarde esta URL** - você vai usar em vários lugares

### 1.4 Configurar .env Local

```bash
nano .env
```

Conteúdo:
```env
DATABASE_URL=postgresql://campanhaviva_owner:abc123xyz@ep-cool-branch-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=uma-chave-secreta-forte-aleatoria-2024
```

**Importante:**
- Substitua pela SUA connection string
- Não compartilhe este arquivo
- O `?sslmode=require` é obrigatório para o Neon

### 1.5 Aplicar Schema

```bash
# Método 1: Usando variável do .env
source .env
npx drizzle-kit push

# Método 2: Inline
DATABASE_URL="sua_url_completa_aqui" npx drizzle-kit push
```

Saída esperada:
```
[✓] Pulling schema from database...
[✓] Changes applied
```

### 1.6 Inicializar Dados (Seed)

```bash
# Método 1: Usando variável do .env
source .env
npx tsx scripts/seed.ts

# Método 2: Inline
DATABASE_URL="sua_url_completa_aqui" npx tsx scripts/seed.ts
```

Saída esperada:
```
✅ Seed concluído com sucesso!

═══════════════════════════════════════════════════
CREDENCIAIS DE ACESSO
═══════════════════════════════════════════════════
Super Admin:  admin@sistema.com  /  admin123
Coordenador:  coord@sistema.com  /  coord123
Liderança:    lider@sistema.com  /  lider123
═══════════════════════════════════════════════════
```

### 1.7 Backup no Neon

1. Acesse https://neon.tech
2. Clique no seu projeto
3. Vá em **"Branches"**
4. Clique em **"Create Branch"** para criar um backup
5. Ou exporte: **"Settings" → "Export"** → Download SQL dump

---

## 🌐 2. REGISTRO.BR - Configuração de DNS

### 2.1 Acessar Painel

1. Acesse: https://registro.br
2. Clique em **"Login"**
3. Digite seu CPF/CNPJ e senha

### 2.2 Selecionar Domínio

1. Clique em **"Meus Domínios"** no menu
2. Encontre **campanhaviva.com.br**
3. Clique no nome do domínio

### 2.3 Alterar DNS

1. Role a página até a seção **"DNS"**
2. Clique em **"Alterar Servidores DNS"**

### 2.4 Configurar Registros

**Primeiro, adicione o domínio na Vercel:**
1. Vercel → Settings → Domains
2. Add: `campanhaviva.com.br`
3. Add: `www.campanhaviva.com.br`

**Agora no Registro.br:**

#### Registro 1 - A (raiz do domínio)

| Campo | Valor |
|-------|-------|
| Host | `@` |
| Tipo | `A` |
| Valor | `76.76.21.21` |
| TTL | `3600` |

**Passo a passo:**
1. Clique em **"Adicionar Registro"**
2. Preencha os campos acima
3. Clique em **"Salvar"**

#### Registro 2 - CNAME (www)

| Campo | Valor |
|-------|-------|
| Host | `www` |
| Tipo | `CNAME` |
| Valor | `cname.vercel-dns.com` |
| TTL | `3600` |

**Passo a passo:**
1. Clique em **"Adicionar Registro"**
2. Preencha os campos acima
3. Clique em **"Salvar"**

### 2.5 Verificar Propagação

1. Acesse: https://www.whatsmydns.net
2. Digite: `campanhaviva.com.br`
3. Selecione: `A` record
4. Clique em **"Search"**

**Tempo de propagação:**
- Mínimo: 30 minutos
- Médio: 2-4 horas
- Máximo: 24 horas

### 2.6 Verificar SSL na Vercel

1. Vercel → Settings → Domains
2. Verifique se aparece ✅ verde em ambos os domínios
3. Se estiver "Configuring", aguarde alguns minutos

---

## ▲ 3. VERCEL - Deploy e Configuração

### 3.1 Criar Conta

1. Acesse: https://vercel.com
2. Clique em **"Sign Up"**
3. Use GitHub, GitLab, ou e-mail

### 3.2 Subir Código para GitHub

```bash
# No terminal do projeto
git init
git add .
git commit -m "Júnior Araújo Coordenação - Initial commit"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/campanhaviva.git
git push -u origin main
```

### 3.3 Criar Projeto na Vercel

1. Vercel Dashboard → **"Add New Project"**
2. Importe do GitHub: selecione `campanhaviva`
3. Clique em **"Import"**

### 3.4 Configurar Variáveis de Ambiente

Na tela de deploy, clique em **"Environment Variables"**:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://usuario:senha@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | `uma-chave-secreta-forte-aleatoria-2024` |

Clique em **"Add"** para cada uma.

### 3.5 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-5 minutos)
3. Quando aparecer ✅, clique em **"Visit"**

### 3.6 Configurar Domínio

1. No projeto, vá em **"Settings"** → **"Domains"**
2. Clique em **"Add"**
3. Digite: `campanhaviva.com.br`
4. Clique em **"Add"**
5. Repita para: `www.campanhaviva.com.br`

### 3.7 Aguardar SSL

- Status inicial: **"Configuring"** (amarelo)
- Status final: **"Ready"** (verde com ✅)
- Tempo: 5-10 minutos

---

## 🧪 4. Testes e Validação

### 4.1 Testar Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000/login

### 4.2 Testar em Produção

Acesse: https://campanhaviva.com.br/login

### 4.3 Testar Login

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | admin@sistema.com | admin123 |
| Coordenador | coord@sistema.com | coord123 |
| Liderança | lider@sistema.com | lider123 |

### 4.4 Verificar DNS

```bash
# No terminal
ping campanhaviva.com.br
# Deve retornar: 76.76.21.21

# Ou use:
nslookup campanhaviva.com.br
```

---

## 🔧 5. Comandos Úteis

### Terminal Kali

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Testar build local
npm start

# Type check
npm run typecheck

# Aplicar schema
DATABASE_URL="sua_url" npx drizzle-kit push

# Rodar seed
DATABASE_URL="sua_url" npx tsx scripts/seed.ts

# Script automático
./scripts/inicializar.sh
```

### Vercel CLI (Opcional)

```bash
# Instalar
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Ver logs
vercel logs

# Baixar vars de ambiente
vercel env pull
```

---

## 🆘 6. Solução de Problemas

### Erro: DATABASE_URL não configurada

```bash
# Verifique o .env
cat .env

# Exporte manualmente
export DATABASE_URL="sua_url"
```

### Erro: SSL certificate

```bash
# Adicione ?sslmode=require na URL
DATABASE_URL="postgresql://...?sslmode=require"
```

### Erro: Domain not configured

1. Verifique DNS no Registro.br
2. Aguarde propagação (até 24h)
3. Verifique em: https://www.whatsmydns.net

### Erro: Schema não aplicado

```bash
# Force o push
DATABASE_URL="sua_url" npx drizzle-kit push --force
```

### Erro: Seed falhou

```bash
# Verifique se o schema foi aplicado
DATABASE_URL="sua_url" npx drizzle-kit push

# Tente novamente
DATABASE_URL="sua_url" npx tsx scripts/seed.ts
```

---

## 📞 7. Suporte

**Júnior Araújo Sistemas**

- 📱 **Telefone/WhatsApp:** (91) 98212-2175
- 📧 **E-mail:** junior.araujo21@yahoo.com.br
-  **Domínio:** campanhaviva.com.br

**Horário de atendimento:** Segunda a Sexta, 8h às 18h

---

## ✅ Checklist Final

- [ ] Conta Neon criada
- [ ] Projeto Neon criado
- [ ] Connection String copiada
- [ ] Arquivo .env configurado
- [ ] Schema aplicado (drizzle-kit push)
- [ ] Seed rodado com sucesso
- [ ] Código no GitHub
- [ ] Projeto na Vercel
- [ ] Variáveis na Vercel
- [ ] Domínio na Vercel
- [ ] DNS no Registro.br
- [ ] SSL ativo na Vercel
- [ ] Login testado
- [ ] Senhas alteradas

**Tempo total estimado: 30-60 minutos**

---

**© 2024 Júnior Araújo Sistemas - Todos os direitos reservados**
