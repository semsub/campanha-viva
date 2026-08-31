# 🚨 SOLUÇÃO URGENTE — 2 problemas encontrados

## Problema 1: Render suspendeu seu serviço

Toda vez que você acessa `https://campanha-viva.onrender.com/*`, a resposta é:

```html
HTTP/2 503
x-render-routing: suspend
Service Suspended
```

**Não é bug do código.** É o Render dizendo que o serviço está suspenso.
Por isso a tela de login mostra `SyntaxError: JSON.parse` — ela tenta chamar
`/api/bootstrap`, mas recebe HTML "Service Suspended" em vez do JSON esperado.

### Como reativar:

1. Acesse https://dashboard.render.com
2. Clique no serviço **`campanha-viva`**
3. Se aparecer botão **"Resume"** ou **"Restart"** no topo, clique nele.
4. Se estiver "Failed": vá em **Deploys** → último deploy → **"Redeploy"** →
   marque **"Clear build cache"** → **Deploy**.
5. Se aparecer aviso de "free tier limit exceeded":
   - você atingiu as 750h grátis do mês, ou
   - trocar para plano pago ($7/mês), ou
   - aguardar reset no dia 1 do próximo mês.
6. Se aparecer aviso de "suspended by user": clique em **Manage** → **Resume Service**.

Depois disso, aguarde ~3 min e teste:
```bash
curl -si https://campanha-viva.onrender.com/api/health
# Esperado: HTTP/2 200
```

---

## Problema 2: sua pasta ~/coordenador está poluída

Ela tem coisas antigas que NÃO fazem parte do sistema Next.js/Neon:

- ❌ `android/` — projeto Capacitor Android (usa outro sistema)
- ❌ `assets/icon.png` — asset do Capacitor
- ❌ `Campanha Viva.apk` — APK antigo
- ❌ `capacitor.config.json` — config do Capacitor
- ❌ `drizzle/0000_narrow_lorna_dane.sql` — migração de um schema ANTIGO
- ❌ `node_modules/firebase`, `@firebase` — pacote Firebase (antigo)
- ❌ `app.log` — log solto
- ❌ 5 arquivos .md duplicados: CONFIGURACAO-COMPLETA, CONFIGURACAO-NEON-REGISTROBR,
  DEPLOY, DEPLOY-RENDER, GUIA-DEPLOY-DEFINITIVO, GUIA-RAPIDO
- ❌ `scripts/inicializar.sh`, `scripts/seed.ts` — do projeto antigo

Isso está fazendo dois estragos:
1. Tamanho gigante do repo no GitHub
2. Confusão de qual código está rodando (Next.js? Capacitor? Firebase?)

### Como limpar tudo (mantém os arquivos NOVOS que você baixou):

Execute este bloco de comandos no Kali:

```bash
cd ~/coordenador

# 1) Apaga tudo que é de projeto antigo (Capacitor/Firebase/etc.)
rm -rf android assets
rm -f "Campanha Viva.apk" capacitor.config.json app.log
rm -rf drizzle
rm -f CONFIGURACAO-COMPLETA.md CONFIGURACAO-NEON-REGISTROBR.md \
      DEPLOY-RENDER.md GUIA-DEPLOY-DEFINITIVO.md GUIA-RAPIDO.md
rm -f scripts/inicializar.sh scripts/seed.ts

# 2) Apaga node_modules e reinstala (limpa Firebase e outras dependências antigas)
rm -rf node_modules package-lock.json .next
npm install

# 3) Verifica que o package.json NÃO tem firebase, capacitor, konva:
grep -E "firebase|capacitor|konva|framer" package.json && echo "PROBLEMA" || echo "OK: limpo"

# 4) Se aparecer PROBLEMA acima, edite package.json manualmente e remova essas linhas,
#    depois: rm -rf node_modules package-lock.json && npm install

# 5) Testa se o build passa
npm run build
# Deve terminar com "Ready" e listar as rotas /app, /login, /api/*
```

Depois:

```bash
# 6) Confirma que .env aponta para o Neon correto
cat .env
# Deve conter:
#   DATABASE_URL="postgresql://neondb_owner:npg_...@ep-morning-snow-...neon.tech/neondb?sslmode=require&channel_binding=require"

# 7) Testa conexão com o Neon
source .env
psql "$DATABASE_URL" -c "SELECT email, role FROM users;"
# Deve mostrar: admin@campanhaviva.com.br | super_admin

# 8) Roda local para conferir a tela de login funcionando
npm run start
# Abra http://localhost:3000/login
# Loga com: admin@campanhaviva.com.br / Admin@2026
# Ctrl+C para parar quando confirmar
```

Se o login local funcionou perfeito, agora sim envia para o GitHub:

```bash
# 9) Sobe para o GitHub
git status                    # ver o que mudou
git add -A
git commit -m "limpeza: remove capacitor/firebase, mantem apenas next.js"
git push
```

---

## Depois de tudo isso

1. Confirme o Render **ativo** (Problema 1)
2. Aguarde ~3 min o redeploy
3. Teste novamente:

```bash
curl -si https://campanha-viva.onrender.com/api/health
# Esperado: HTTP/2 200

curl -s https://campanha-viva.onrender.com/api/bootstrap | python3 -m json.tool
# Esperado: hasDatabaseUrl:true, hasUsersTable:true, hasAdmin:true

curl -X POST https://campanha-viva.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campanhaviva.com.br","password":"Admin@2026"}'
# Esperado: {"ok":true,"role":"super_admin",...}
```

Se os 3 comandos acima passarem, entre no navegador:
**https://campanha-viva.onrender.com/login** (Ctrl+Shift+R para forçar cache limpo)
Login: `admin@campanhaviva.com.br` / `Admin@2026`

---

## E o APK que você tinha em `Campanha Viva.apk`?

O sistema atual é um **PWA** (Progressive Web App). Não precisa de APK.
No celular Android, basta:
1. Abrir `https://campanha-viva.onrender.com` no Chrome
2. Menu (⋮) → **Instalar app** ou **Adicionar à tela inicial**
3. Ícone da estrela azul+laranja aparece na tela inicial exatamente como APK
4. Ao abrir, roda em tela cheia (sem barra do navegador)

Se você quiser MESMO um arquivo `.apk` para distribuir, use o **Bubblewrap**
(explicado em `TROUBLESHOOTING.md`, seção final).
