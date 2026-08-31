# 🚀 Deploy passo a passo — Kali → GitHub → Render → Neon

Este guia assume que:
- ✅ O banco **Neon já está criado e tem o Super Admin** `admin@campanhaviva.com.br` / `Admin@2026`
- ✅ Você quer **manter** esse banco intacto
- ✅ Você já tem um repositório no GitHub (ex.: `github.com/semsub/campanha-viva`)

---

## PARTE 1 — No Kali (uma vez só)

### 1.1. Extrair o projeto baixado do Arena

```bash
cd ~
# Se veio como zip:
unzip campanha-viva.zip -d coordenador
# Ou renomeie a pasta baixada:
mv projeto-arena coordenador
cd coordenador
```

### 1.2. Criar o arquivo `.env` com suas credenciais reais

⚠️ **O `.env` NÃO vem no download** (está no .gitignore). Você precisa criar:

```bash
cat > .env <<'EOF'
DATABASE_URL="postgresql://neondb_owner:npg_jZUwSthG41HR@ep-morning-snow-acfwca44-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
SESSION_SECRET="junior-araujo-coordenacao-campanhaviva-2026-frase-longa-secreta"
EOF
```

### 1.3. Instalar dependências

```bash
npm install
```

### 1.4. Testar local apontando para o Neon (opcional mas recomendado)

```bash
# Confirma que a conexão com o Neon funciona:
source .env
psql "$DATABASE_URL" -c "SELECT email, role FROM users;"
# Deve mostrar: admin@campanhaviva.com.br | super_admin

# Roda a aplicação local
npm run build
npm run start
# Acessa http://localhost:3000/login
# Entra com: admin@campanhaviva.com.br / Admin@2026
# Ctrl+C para parar
```

---

## PARTE 2 — Subir para o GitHub (via terminal)

### 2.1. Se o repositório JÁ existe no GitHub

```bash
cd ~/coordenador

# Se ainda não é um repo git local:
git init
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/campanha-viva.git

# Configura seu nome/email uma vez
git config user.name "Junior Araujo"
git config user.email "junior.araujo21@yahoo.com.br"

# CONFERE que .env está ignorado (importante para não vazar senha do Neon)
git status | grep .env && echo "PERIGO: .env vai ser commitado" || echo "OK: .env ignorado"

# Adiciona tudo, commita e envia
git add -A
git commit -m "sistema completo: hierarquia 4 niveis + neon + PWA"
git push -u origin main --force
```

> O `--force` sobrescreve o histórico antigo do GitHub. Faça isso só na primeira vez.
> Se pedir usuário/senha: o "usuário" é seu login do GitHub e a "senha" é um **Personal Access Token**
> (github.com → Settings → Developer settings → Personal access tokens → Tokens (classic) →
> Generate new token → escopo `repo` → copie o token).

### 2.2. Se o repositório NÃO existe ainda no GitHub

1. Vá em https://github.com/new
2. Nome: `campanha-viva`
3. **Marque:** Private (privado — importante porque contém a lógica do sistema)
4. **Não marque nada** de README/gitignore/license (vamos subir do zero)
5. Create repository
6. Copie a URL (ex.: `https://github.com/SEU_USUARIO/campanha-viva.git`) e execute os comandos da seção 2.1

---

## PARTE 3 — Configurar Render (só as env vars)

⚠️ **NÃO precisa deletar nada no Render nem no Neon.** Só cole as variáveis.

1. Acesse https://dashboard.render.com → serviço **`campanha-viva`**
2. Menu lateral → **Environment**
3. Adicione/edite estas 3 variáveis:

| Chave | Valor |
|---|---|
| `NODE_VERSION` | `22` |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_jZUwSthG41HR@ep-morning-snow-acfwca44-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `SESSION_SECRET` | `junior-araujo-coordenacao-campanhaviva-2026-frase-longa-secreta` |

4. Clique **Save, rebuild, and deploy** (canto superior direito)
5. Aguarde ~3 minutos

---

## PARTE 4 — Confirmar que o deploy funcionou

No Kali, rode este bloco:

```bash
BASE="https://campanha-viva.onrender.com"

echo "== 1. Banco conectado? =="
curl -s $BASE/api/bootstrap | python3 -m json.tool
# Esperado: hasDatabaseUrl:true, hasUsersTable:true, hasAdmin:true

echo ""
echo "== 2. Login funciona? =="
curl -si -c /tmp/c.txt -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campanhaviva.com.br","password":"Admin@2026"}' | grep -E "HTTP|ok"
# Esperado: HTTP/2 200 + {"ok":true,"role":"super_admin"}

echo ""
echo "== 3. Sessão persiste? =="
curl -s -b /tmp/c.txt $BASE/api/auth/me
# Esperado: {"user":{"id":1,"name":"Junior Araujo",...}}
```

Se tudo responder OK, abra no navegador:
**https://campanha-viva.onrender.com/login**
Ctrl+Shift+R (forçar recarregar cache) e entre com `admin@campanhaviva.com.br` / `Admin@2026`.

---

## PARTE 5 — Depois disso, rotina de atualizações

Sempre que fizer alguma mudança no código:

```bash
cd ~/coordenador
# ...edita os arquivos...
git add -A
git commit -m "descrição da mudança"
git push
# Render redeploya em ~3 min automaticamente
```

Os dados do Neon **NUNCA** são apagados por deploys. Só migrações compatíveis
são aplicadas automaticamente pelo `/api/bootstrap`.

---

## ⚠️ Se algo der errado

```bash
# Diagnóstico automático (local + remoto):
bash scripts/doctor.sh https://campanha-viva.onrender.com

# Se o problema for de código:
bash scripts/fix.sh

# Guia completo de erros conhecidos:
cat TROUBLESHOOTING.md
```

---

## 🔐 Manter o banco Neon seguro

- **NUNCA commit o `.env`** — ele contém a senha do Neon
- Se um dia a senha do Neon vazar (você compartilhou por engano), gere uma nova:
  - Neon Console → seu projeto → **Roles** → `neondb_owner` → **Reset password**
  - Atualize a `DATABASE_URL` no Render e no seu `.env` local

---

## 📋 Credenciais atuais do sistema em produção

| | |
|---|---|
| URL do sistema | https://campanha-viva.onrender.com |
| E-mail Super Admin | admin@campanhaviva.com.br |
| Senha Super Admin | Admin@2026 |
| Banco | Neon (`ep-morning-snow-acfwca44-pooler.sa-east-1.aws.neon.tech`) |

**Troque a senha padrão** após o primeiro login em **Usuários → 🔑 Senha**.
