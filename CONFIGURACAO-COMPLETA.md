# Configuração Completa — Júnior Araújo Coordenação

Guia passo a passo: Kali Linux (terminal) → Neon (banco) → Vercel (hospedagem) → Registro.br (DNS).

---

## PARTE 1 — KALI LINUX (Terminal)

### 1.1 Atualizar o sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Instalar dependências base
```bash
sudo apt install -y git curl wget build-essential postgresql-client
```

### 1.3 Instalar Node.js 22 LTS (via NodeSource)
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # deve mostrar v22.x
npm -v    # deve mostrar 10.x+
```

### 1.4 Clonar o projeto
```bash
cd ~
git clone https://github.com/SEU_USUARIO/junior-araujo-coordenacao.git
cd junior-araujo-coordenacao
```
> Se o código vier por outro meio (zip, pendrive), basta entrar na pasta do projeto.

### 1.5 Instalar as dependências do projeto
```bash
npm install
```

### 1.6 Criar o arquivo .env (apontando para o Neon)
```bash
cat > .env << 'EOF'
DATABASE_URL="COLE_AQUI_A_CONNECTION_STRING_DO_NEON"
SESSION_SECRET="gere-uma-frase-longa-aleatoria-aqui-2026"
EOF
```
Exemplo real:
```
DATABASE_URL="postgresql://usuario:senha@ep-nome-123456.sa-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 1.7 Aplicar as tabelas no Neon
```bash
npx drizzle-kit push
```
Deve aparecer `[✓] Changes applied`.

### 1.8 Criar o Super Admin no banco
```bash
set -a; source .env; set +a
node scripts/seed-super-admin.mjs
```
Saída esperada: `Super Admin pronto: admin@campanhaviva.com.br`

Credenciais padrão: `admin@campanhaviva.com.br` / `Admin@2026`
(troque a senha logo no primeiro acesso)

Para customizar o seed:
```bash
SUPER_ADMIN_EMAIL="voce@campanhaviva.com.br" \
SUPER_ADMIN_PASSWORD="SuaSenhaForte@2026" \
SUPER_ADMIN_NAME="Júnior Araújo" \
node scripts/seed-super-admin.mjs
```

### 1.9 Subir o sistema localmente para testar
```bash
npm run build && npm run start
```
Servidor em `http://localhost:3000`

### 1.10 Testar TUDO pelo terminal (curl)

**Login (salva cookie de sessão em arquivo):**
```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campanhaviva.com.br","password":"Admin@2026"}'
```
Sucesso = HTTP 200 + `Set-Cookie: jac_session=...` + JSON `{"ok":true,"role":"super_admin"}`

**Login com senha errada (deve dar 401):**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campanhaviva.com.br","password":"errada"}'
```

**Super Admin trocando a senha de um usuário (id=2):**
```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/admin/users/2/password \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"NovaSenha@123"}'
```
Sem o cookie (ou com role diferente de super_admin) retorna **403** — isso é o RBAC em ação.

**Logout:**
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout
```

**Health check:**
```bash
curl http://localhost:3000/api/health
```

### 1.11 Consultar o banco direto pelo terminal
```bash
psql "COLE_AQUI_A_CONNECTION_STRING_DO_NEON"
```
```sql
-- Listar usuários e perfis
SELECT id, name, email, role, active FROM users;

-- Ver trilha de auditoria (logins, trocas de senha)
SELECT created_at, action, actor_id, user_id, ip FROM audit_logs ORDER BY id DESC LIMIT 20;

-- Ver tabelas
\dt
```

---

## PARTE 2 — NEON (Banco de Dados Gratuito)

### 2.1 Criar conta
1. Acesse **https://neon.tech**
2. Clique em **Sign Up** → entre com Google ou GitHub (grátis)

### 2.2 Criar o projeto
1. Clique em **New Project**
2. Nome: `junior-araujo-coordenacao`
3. PostgreSQL versão: **17** (ou a mais recente)
4. Região: **AWS / São Paulo (sa-east-1)** ← mais próxima do Brasil
5. Clique em **Create Project**

### 2.3 Copiar a Connection String
1. No dashboard do projeto, bloco **"Connect to your database"**
2. Selecione **Pooled connection** (recomendado para serverless)
3. Copie a string, ex.:
   ```
   postgresql://usuario:SENHA@ep-xxx-yyy-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 2.4 Colar no .env do Kali
```bash
sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://usuario:SENHA@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"|' .env
```
> O código já detecta `neon.tech` na URL e ativa SSL automaticamente.

### 2.5 Rodar migrações e seed (se ainda não rodou)
```bash
set -a; source .env; set +a
npx drizzle-kit push
node scripts/seed-super-admin.mjs
```

### 2.6 Verificar no painel do Neon
- Aba **Tables**: deve aparecer `users`, `campaigns`, `audit_logs`
- Aba **SQL Editor**: você pode rodar `SELECT * FROM users;` direto no navegador

### 2.7 Limites do plano gratuito
- 0,5 GB de armazenamento
- ~100–190 horas de computação/mês (banco "dorme" quando ocioso)
- 1 projeto, 10 branches
- **É suficiente para operação real do sistema**
- Cuidado: cold start de ~0,5s na primeira consulta após dormência (normal e imperceptível no uso)

---

## PARTE 3 — VERCEL (Hospedagem Gratuita)

### 3.1 Subir código para o GitHub (pelo terminal)
```bash
cd ~/junior-araujo-coordenacao
git init
git add .
git commit -m "Júnior Araújo Coordenação — sistema completo"
git remote add origin https://github.com/SEU_USUARIO/junior-araujo-coordenacao.git
git branch -M main
git push -u origin main
```
> O GitHub vai pedir autenticação: crie um **Personal Access Token** em
> github.com → Settings → Developer settings → Tokens (classic) → escopo `repo`
> e use o token como senha no push.

### 3.2 Deploy pela Vercel CLI (100% terminal)
```bash
sudo npm install -g vercel
vercel login        # abre link de confirmação no navegador
cd ~/junior-araujo-coordenacao
vercel              # primeiro deploy (preview)
```

### 3.3 Configurar variáveis de ambiente na Vercel
```bash
vercel env add DATABASE_URL production
# cole a connection string do Neon quando pedir

vercel env add SESSION_SECRET production
# cole uma frase longa aleatória
```

### 3.4 Deploy de produção
```bash
vercel --prod
```
Anote a URL gerada, ex.: `https://junior-araujo-coordenacao.vercel.app`
(O domínio campanhaviva.com.br vai substituí-la na Parte 4)

---

## PARTE 4 — REGISTRO.BR (Domínio campanhaviva.com.br)

### 4.1 Acessar o painel
1. Vá em **https://registro.br** → **Acessar conta**
2. Entre com seu CPF e senha
3. Na lista de domínios, clique em **campanhaviva.com.br**

### 4.2 Abrir a Zona de DNS
1. Na página do domínio, clique em **DNS** → **Alterar zona DNS**
2. Se aparecer opção de "Usar servidores DNS do Registro.br" → **mantenha selecionada**
   (é ela que permite criar registros A/CNAME dentro do próprio painel)

### 4.3 Na Vercel, adicionar o domínio
```bash
vercel domains add campanhaviva.com.br
vercel domains add www.campanhaviva.com.br
```
Ou pelo site: Projeto → **Settings** → **Domains** → digite `campanhaviva.com.br` → Add

A Vercel vai pedir exatamente estes registros:

### 4.4 Criar os registros DNS no Registro.br
Na Zona DNS, adicione:

**Registro raiz (domínio sem www):**
| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | (vazio ou @) | `76.76.21.21` | 3600 |

**Registro www:**
| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| CNAME | www | `cname.vercel-dns.com` | 3600 |

> ⚠️ Se já existir algum registro A antigo no @, **apague-o** antes (conflito).

Salve a zona DNS.

### 4.5 Verificar propagação pelo terminal Kali
```bash
dig campanhaviva.com.br A +short
# esperado: 76.76.21.21

dig www.campanhaviva.com.br CNAME +short
# esperado: cname.vercel-dns.com.

nslookup campanhaviva.com.br
```
Propagação: tipicamente 15 min–2h; oficialmente até 48h.

### 4.6 SSL (HTTPS) automático e grátis
Assim que o DNS resolver, a Vercel emite o certificado **Let's Encrypt** sozinha.
Verifique:
```bash
curl -I https://campanhaviva.com.br
# esperado: HTTP/2 200
```

### 4.7 Teste final de ponta a ponta
```bash
curl -X POST https://campanhaviva.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campanhaviva.com.br","password":"Admin@2026"}'
```

---

## PARTE 5 — PÓS-CONFIGURAÇÃO (Segurança)

```bash
# 1. Trocar a senha padrão do Super Admin
SUPER_ADMIN_PASSWORD="NovaSenhaForte@2026" node scripts/seed-super-admin.mjs

# 2. Conferir auditoria de acessos
psql "$DATABASE_URL" -c \
  "SELECT created_at, action, ip FROM audit_logs ORDER BY id DESC LIMIT 10;"
```

**Checklist final:**
- [ ] Node 22 instalado no Kali
- [ ] Projeto clonado + `npm install`
- [ ] `.env` com `DATABASE_URL` do Neon
- [ ] `drizzle-kit push` OK
- [ ] Seed do Super Admin OK
- [ ] Login 200 OK via curl
- [ ] Deploy `vercel --prod` OK
- [ ] DNS A + CNAME no Registro.br
- [ ] `curl -I https://campanhaviva.com.br` retorna 200
- [ ] Senha padrão trocada
