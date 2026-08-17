# 🚀 Deploy no Render - Júnior Araújo Coordenação

## ⚠️ IMPORTANTE: Limpando Cache do Render

Se você está vendo erros de arquivos antigos (Firebase, framer-motion, etc.), siga estes passos:

### Opção 1: Limpar Cache pelo Dashboard (Recomendado)

1. Acesse https://dashboard.render.com
2. Vá em seu projeto **campanhaviva-coordenacao**
3. Clique em **"Manual Deploy"**
4. Marque a opção **"Clear cache"** ou **"Clear build cache"**
5. Clique em **"Deploy"**

### Opção 2: Forçar Rebuild via Git

```bash
# No seu terminal
git commit --allow-empty -m "Force rebuild - clear cache"
git push origin main
```

### Opção 3: Deletar e Recriar o Serviço

1. No dashboard do Render, delete o serviço antigo
2. Crie um novo serviço do zero
3. Conecte com seu repositório GitHub

---

##  Configuração Passo a Passo

### 1. Preparar Repositório

```bash
# Certifique-se de ter os arquivos corretos
git status

# Deve mostrar apenas:
# - src/app/ (App Router)
# - src/components/
# - src/db/
# - src/lib/
# - scripts/
# - package.json
# - render.yaml

# Se tiver arquivos antigos, remova:
git clean -fdx
git add .
git commit -m "Clean project - remove old Firebase files"
git push origin main
```

### 2. Criar Serviço no Render

1. Acesse: https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte com seu repositório GitHub: `campanhaviva`
4. Preencha:

| Campo | Valor |
|-------|-------|
| **Name** | `campanhaviva-coordenacao` |
| **Region** | `Oregon (USA)` ou mais próximo |
| **Branch** | `main` |
| **Root Directory** | `(leave blank)` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

### 3. Configurar Variáveis de Ambiente

No Render, em **"Environment"**, adicione:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://usuario:senha@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | `uma-chave-secreta-forte-aleatoria-2024` |

**Importante:**
- Use a **mesma DATABASE_URL do Neon** que você usou localmente
- O `?sslmode=require` é obrigatório para o Neon

### 4. Deploy

1. Clique em **"Create Web Service"** ou **"Save Changes"**
2. O Render vai iniciar o build automaticamente
3. Aguarde 3-5 minutos
4. Quando aparecer ✅ verde, o deploy está completo

### 5. Inicializar Banco de Dados

Após o deploy, rode o seed:

**Opção A: Via terminal local (recomendado)**
```bash
DATABASE_URL="sua_url_do_neon" npx tsx scripts/seed.ts
```

**Opção B: Via Render Shell**
1. No dashboard do Render, vá em **"Shell"**
2. Execute:
```bash
npm install -g tsx
DATABASE_URL="sua_url" npx tsx scripts/seed.ts
```

---

## 🔍 Verificando Deploy

### 1. Acessar URL

```
https://campanhaviva-coordenacao.onrender.com
```

Ou seu domínio personalizado:
```
https://campanhaviva.com.br
```

### 2. Testar Login

- E-mail: `admin@sistema.com`
- Senha: `admin123`

### 3. Verificar Logs

No dashboard do Render:
1. Clique em **"Logs"**
2. Verifique se há erros
3. Logs devem mostrar:
   ```
   ✓ Compiled successfully
   ✓ Running TypeScript
   ✓ Generating static pages
   ```

---

## ️ Troubleshooting

### Erro: "Module not found: framer-motion"

**Causa:** Cache do Render com arquivos antigos

**Solução:**
```bash
# 1. Limpe o cache no dashboard do Render
# 2. Ou force rebuild:
git commit --allow-empty -m "Rebuild"
git push
```

### Erro: "DATABASE_URL is required"

**Causa:** Variável de ambiente não configurada

**Solução:**
1. Render Dashboard → Environment
2. Adicione `DATABASE_URL` com valor correto
3. Redeploy

### Erro: "SSL connection error"

**Causa:** URL do Neon sem SSL

**Solução:**
Certifique-se que DATABASE_URL termina com `?sslmode=require`

### Build demorando muito

**Causa:** Plano free do Render entra em sleep

**Solução:**
- Aguarde (pode levar 5-10 min no primeiro deploy)
- Ou upgrade para plano pago ($7/mês)

### Erro: "Cannot find module '@/...'"

**Causa:** tsconfig.json incorreto

**Solução:**
Verifique se tsconfig.json tem:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 📊 Comandos Úteis

### Local

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Start produção local
npm start

# Type check
npm run typecheck

# Seed
DATABASE_URL="sua_url" npx tsx scripts/seed.ts

# Push schema
DATABASE_URL="sua_url" npx drizzle-kit push
```

### Render

```bash
# Ver logs (via dashboard)
Dashboard → Logs

# Acessar shell (via dashboard)
Dashboard → Shell

# Redeploy manual
Dashboard → Manual Deploy → Deploy
```

---

##  Domínio Personalizado

### 1. Adicionar no Render

1. Render Dashboard → **Settings**
2. **Custom Domains** → **Add Custom Domain**
3. Digite: `campanhaviva.com.br`
4. Clique em **Add**

### 2. Configurar DNS no Registro.br

```
Host: @
Tipo: CNAME
Valor: campanhaviva-coordenacao.onrender.com
TTL: 3600
```

Ou use A record se Render fornecer IP:
```
Host: @
Tipo: A
Valor: [IP do Render]
TTL: 3600
```

### 3. Aguardar SSL

- Render gera SSL automaticamente
- Tempo: 5-30 minutos
- Status: **Settings → Custom Domains**

---

## ✅ Checklist Final

- [ ] Cache do Render limpo
- [ ] Serviço criado no Render
- [ ] Variáveis de ambiente configuradas
- [ ] DATABASE_URL com ?sslmode=require
- [ ] Build completou com sucesso
- [ ] Seed rodado no banco
- [ ] Login testado
- [ ] Senhas alteradas
- [ ] Domínio configurado (opcional)
- [ ] SSL ativo

---

## 🆘 Suporte

**Júnior Araújo Sistemas**
- 📱 (91) 98212-2175
- 📧 junior.araujo21@yahoo.com.br

---

## 📝 Notas Importantes

1. **Plano Free do Render:**
   - Sleep após 15 min de inatividade
   - Primeiro acesso após sleep demora 30-60s
   - Limite: 750 horas/mês (suficiente para 1 serviço)

2. **Neon (Banco de Dados):**
   - Gratuito: 512MB storage
   - Conexões ilimitadas
   - SSL obrigatório

3. **Segurança:**
   - Nunca commit .env no Git
   - Use variáveis de ambiente do Render
   - Altere senhas padrão imediatamente

---

**© 2024 Júnior Araújo Sistemas**
