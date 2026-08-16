# Júnior Araújo Coordenação

Plataforma de gestão territorial de campanha com controle hierárquico, demandas, atendimentos e inteligência territorial.

**Desenvolvido por:** Júnior Araújo Sistemas  
**Contato:** (91) 98212-2175 | junior.araujo21@yahoo.com.br  
**Domínio:** campanhaviva.com.br

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Neon (Banco de Dados)](#configuração-do-neon-banco-de-dados)
3. [Configuração no Terminal Kali Linux](#configuração-no-terminal-kali-linux)
4. [Configuração do Domínio no Registro.br](#configuração-do-domínio-no-registrobr)
5. [Deploy na Vercel](#deploy-na-vercel)
6. [Inicialização do Banco](#inicialização-do-banco)
7. [Acesso ao Sistema](#acesso-ao-sistema)

---

## 🛠️ Pré-requisitos

- Node.js 18+ instalado
- Git instalado
- Conta no [Neon](https://neon.tech) (banco de dados PostgreSQL gratuito)
- Conta no [Vercel](https://vercel.com) (hospedagem gratuita)
- Domínio registrado no [Registro.br](https://registro.br)

---

## 🗄️ Configuração do Neon (Banco de Dados)

### Passo 1: Criar conta no Neon

1. Acesse https://neon.tech
2. Clique em **"Sign Up"** ou **"Continue with GitHub"**
3. Complete o cadastro

### Passo 2: Criar projeto

1. No dashboard, clique em **"New Project"**
2. Dê um nome: `campanhaviva`
3. Escolha a região mais próxima: **AWS - us-east-1** ou **us-east-2**
4. Clique em **"Create Project"**

### Passo 3: Obter Connection String

1. No dashboard do projeto, clique em **"Connection Details"**
2. Copie a **Connection String** (formato):
   ```
   postgresql://usuario:senha@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. **Guarde esta string** - você vai usar no terminal e na Vercel

### Passo 4: Plano Free

- **512MB** de armazenamento
- **0.25 vCPU**
- **10 branches** (ambientes)
- **Gratuito para sempre**

---

## 💻 Configuração no Terminal Kali Linux

### Passo 1: Instalar Node.js (se não tiver)

```bash
# Verificar se já tem Node instalado
node --version

# Se não tiver, instalar via NVM (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# Verificar instalação
node --version  # Deve mostrar v20.x.x
npm --version   # Deve mostrar 10.x.x
```

### Passo 2: Instalar Git (se não tiver)

```bash
# Verificar se já tem Git
git --version

# Se não tiver, instalar
sudo apt update
sudo apt install git -y

# Configurar Git
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### Passo 3: Clonar ou criar repositório

```bash
# Criar diretório do projeto
mkdir campanhaviva
cd campanhaviva

# Inicializar repositório Git
git init

# Se já tem código no GitHub, clone:
# git clone https://github.com/seu-usuario/campanhaviva.git
# cd campanhaviva
```

### Passo 4: Instalar dependências

```bash
# Instalar todas as dependências
npm install
```

### Passo 5: Configurar variáveis de ambiente

```bash
# Criar arquivo .env
nano .env
```

Cole o seguinte conteúdo:

```env
DATABASE_URL=postgresql://usuario:senha@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=uma-chave-secreta-forte-aleatoria-2024
```

**Importante:** Substitua `DATABASE_URL` pela sua connection string do Neon.

Para sair do nano: `Ctrl+X`, depois `Y`, depois `Enter`.

### Passo 6: Instalar tsx (para rodar scripts TypeScript)

```bash
npm install -D tsx
```

### Passo 7: Configurar Drizzle

```bash
# Verificar drizzle.config.json
cat drizzle.config.json
```

Deve estar assim:

```json
{
  "dialect": "postgresql",
  "schema": "./src/db/schema.ts",
  "dbCredentials": {
    "url": "postgresql://postgres:postgres@127.0.0.1:5432/app_db"
  }
}
```

### Passo 8: Push do schema para o Neon

```bash
# Rodar o push do schema
DATABASE_URL="sua_connection_string_aqui" npx drizzle-kit push
```

**Exemplo real:**
```bash
DATABASE_URL="postgresql://john:abc123@ep-cool-branch-123456.us-east-2.aws.neon.tech/neondb?sslmode=require" npx drizzle-kit push
```

Se der certo, vai aparecer:
```
[✓] Changes applied
```

### Passo 9: Rodar script de seed (inicializar dados)

```bash
# Rodar o seed
DATABASE_URL="sua_connection_string_aqui" npx tsx scripts/seed.ts
```

**Exemplo real:**
```bash
DATABASE_URL="postgresql://john:abc123@ep-cool-branch-123456.us-east-2.aws.neon.tech/neondb?sslmode=require" npx tsx scripts/seed.ts
```

Se der certo, vai aparecer:
```
✅ Seed concluído com sucesso!

═══════════════════════════════════════════════════
CREDENCIAIS DE ACESSO
═══════════════════════════════════════════════════
Super Admin:  admin@sistema.com  /  admin123
Coordenador:  coord@sistema.com  /  coord123
Liderança:    lider@sistema.com  /  lider123
═══════════════════════════════════════════════════

⚠️  ALTERE AS SENHAS APÓS O PRIMEIRO ACESSO!
```

### Passo 10: Testar localmente (opcional)

```bash
# Rodar em modo desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

Para parar: `Ctrl+C`

---

## 🌐 Configuração do Domínio no Registro.br

### Passo 1: Acessar painel do Registro.br

1. Acesse https://registro.br
2. Faça login com seu CPF/CNPJ e senha

### Passo 2: Selecionar domínio

1. Clique em **"Meus Domínios"**
2. Clique em **campanhaviva.com.br**

### Passo 3: Alterar DNS

1. Role até a seção **"DNS"**
2. Clique em **"Alterar Servidores DNS"**

### Passo 4: Configurar DNS da Vercel

**Antes de configurar aqui, você precisa do domínio na Vercel:**

1. Na Vercel, vá em **Settings → Domains**
2. Adicione: `campanhaviva.com.br`
3. A Vercel vai mostrar os valores DNS necessários

**Configuração no Registro.br:**

| Host | Tipo | Valor | Prioridade | TTL |
|------|------|-------|------------|-----|
| @ | A | 76.76.21.21 | - | 3600 |
| www | CNAME | cname.vercel-dns.com | - | 3600 |

**No Registro.br, adicione:**

1. Clique em **"Adicionar Registro"**
2. **Host:** `@`
3. **Tipo:** `A`
4. **Valor:** `76.76.21.21`
5. **TTL:** `3600`
6. Clique em **"Salvar"**

Repita para o www:

1. Clique em **"Adicionar Registro"**
2. **Host:** `www`
3. **Tipo:** `CNAME`
4. **Valor:** `cname.vercel-dns.com`
5. **TTL:** `3600`
6. Clique em **"Salvar"**

### Passo 5: Aguardar propagação

- A propagação do DNS pode levar **até 24 horas**
- Normalmente fica pronto em **1-2 horas**
- Para verificar: https://www.whatsmydns.net

---

## ▲ Deploy na Vercel

### Passo 1: Subir código para GitHub

```bash
# No terminal do projeto
git add .
git commit -m "Initial commit - Júnior Araújo Coordenação"
git branch -M main
git remote add origin https://github.com/seu-usuario/campanhaviva.git
git push -u origin main
```

### Passo 2: Criar projeto na Vercel

1. Acesse https://vercel.com
2. Clique em **"Add New Project"**
3. Importe o repositório do GitHub: `campanhaviva`
4. Clique em **"Import"**

### Passo 3: Configurar Variáveis de Ambiente

Na tela de deploy, clique em **"Environment Variables"** e adicione:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://usuario:senha@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | `uma-chave-secreta-forte-aleatoria-2024` |

Clique em **"Add"** em cada uma.

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. Quando terminar, clique em **"Visit"**

### Passo 5: Configurar domínio na Vercel

1. No projeto da Vercel, vá em **"Settings" → "Domains"**
2. Clique em **"Add"**
3. Digite: `campanhaviva.com.br`
4. Clique em **"Add"**
5. Repita para: `www.campanhaviva.com.br`

### Passo 6: Aguardar SSL

- A Vercel gera certificado SSL automaticamente
- Pode levar **5-10 minutos**
- Quando estiver pronto, aparece um ✅ verde

---

## 🚀 Inicialização do Banco (Produção)

Após o deploy na Vercel, você precisa rodar o seed:

### Opção 1: Via terminal local (recomendado)

```bash
# Usando a mesma DATABASE_URL da Vercel
DATABASE_URL="postgresql://usuario:senha@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require" npx tsx scripts/seed.ts
```

### Opção 2: Via Vercel CLI (avançado)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Rodar comando remoto
vercel env pull
DATABASE_URL=$(cat .env | grep DATABASE_URL | cut -d '=' -f2) npx tsx scripts/seed.ts
```

---

## 🔐 Acesso ao Sistema

### Credenciais padrão

| Perfil | E-mail | Senha |
|--------|--------|-------|
| **Super Admin** | admin@sistema.com | admin123 |
| **Coordenador** | coord@sistema.com | coord123 |
| **Liderança** | lider@sistema.com | lider123 |

### Primeiro acesso

1. Acesse: https://campanhaviva.com.br/login
2. Use as credenciais acima
3. **IMPORTANTE:** Altere as senhas imediatamente!

### Alterar senha de usuário

1. Vá em **Usuários** (Super Admin) ou **Coordenadores** / **Lideranças**
2. Clique em **"🔑 Senha"** ao lado do usuário
3. Digite a nova senha
4. Clique em **"Alterar"**

---

## 📊 Comandos Úteis

```bash
# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção local
npm start

# Type check
npm run typecheck

# Push schema (sempre que alterar o schema)
DATABASE_URL="sua_url" npx drizzle-kit push

# Rodar seed (inicializar dados)
DATABASE_URL="sua_url" npx tsx scripts/seed.ts

# Ver logs da Vercel
vercel logs
```

---

## 🔒 Segurança

### Boas práticas

1. **Altere todas as senhas** após o primeiro acesso
2. **Nunca compartilhe** a DATABASE_URL
3. **Use senhas fortes** (mínimo 8 caracteres, letras + números + símbolos)
4. **Revise os logs de auditoria** regularmente
5. **Faça backup** do banco periodicamente

### Backup no Neon

1. Acesse https://neon.tech
2. Vá em seu projeto
3. Clique em **"Branches"**
4. Clique em **"Create Branch"** para criar um backup
5. Ou use **"Export"** para baixar um dump SQL

---

## 🆘 Suporte

**Desenvolvido por:** Júnior Araújo Sistemas  
**Telefone/WhatsApp:** (91) 98212-2175  
**E-mail:** junior.araujo21@yahoo.com.br

---

## 📝 Checklist de Implantação

- [ ] Criar conta no Neon
- [ ] Criar projeto no Neon
- [ ] Copiar Connection String
- [ ] Instalar Node.js no Kali
- [ ] Instalar Git no Kali
- [ ] Clonar/criar repositório
- [ ] Instalar dependências (npm install)
- [ ] Configurar .env com DATABASE_URL e JWT_SECRET
- [ ] Rodar drizzle-kit push
- [ ] Rodar scripts/seed.ts
- [ ] Testar localmente (npm run dev)
- [ ] Subir código para GitHub
- [ ] Criar projeto na Vercel
- [ ] Configurar variáveis na Vercel
- [ ] Fazer deploy na Vercel
- [ ] Configurar DNS no Registro.br
- [ ] Aguardar propagação do DNS
- [ ] Acessar https://campanhaviva.com.br
- [ ] Alterar senhas padrão
- [ ] Cadastrar usuários reais

---

**© 2024 Júnior Araújo Sistemas - Todos os direitos reservados**
