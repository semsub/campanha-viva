#!/usr/bin/env bash
# scripts/reset-kali.sh
# Faxina TOTAL: remove todo lixo antigo (Capacitor, Firebase, APK, .md duplicados,
# scripts obsoletos) e deixa o projeto no estado LIMPO.
#
# NÃO apaga: .env, .git, src/, public/, package.json, next.config, tsconfig.
#
# Uso: bash scripts/reset-kali.sh

set -uo pipefail
GREEN="\033[0;32m"; YELLOW="\033[0;33m"; RED="\033[0;31m"; BOLD="\033[1m"; RESET="\033[0m"

echo -e "${BOLD}=== Faxina total do projeto ===${RESET}\n"

# 1) Pastas do Capacitor/Android (não é do sistema Next.js)
for d in android assets drizzle; do
  [ -d "$d" ] && rm -rf "$d" && echo -e "  ${GREEN}✓${RESET} removido: $d/"
done

# 2) Arquivos soltos antigos
for f in \
  "Campanha Viva.apk" \
  capacitor.config.json \
  app.log
do
  [ -e "$f" ] && rm -f "$f" && echo -e "  ${GREEN}✓${RESET} removido: $f"
done

# 3) .md duplicados/obsoletos (mantém README, TROUBLESHOOTING, DEPLOY)
for f in \
  CONFIGURACAO-COMPLETA.md \
  CONFIGURACAO-NEON-REGISTROBR.md \
  DEPLOY-RENDER.md \
  GUIA-DEPLOY-DEFINITIVO.md \
  GUIA-RAPIDO.md \
  SOLUCAO-URGENTE.md
do
  [ -f "$f" ] && rm -f "$f" && echo -e "  ${GREEN}✓${RESET} removido: $f"
done

# 4) Scripts obsoletos
for f in \
  scripts/inicializar.sh \
  scripts/seed.ts \
  scripts/limpar-arquivos-antigos.sh \
  scripts/limpar-projeto.sh
do
  [ -f "$f" ] && rm -f "$f" && echo -e "  ${GREEN}✓${RESET} removido: $f"
done

# 5) API routes antigas (schemas obsoletos)
for d in \
  src/app/api/categories \
  src/app/api/seed \
  src/app/api/territorial \
  src/app/api/campaigns \
  src/app/api/debug \
  src/app/api/setup
do
  [ -d "$d" ] && rm -rf "$d" && echo -e "  ${GREEN}✓${RESET} removido: $d/"
done

# 6) Libs antigas
for f in \
  src/lib/api-auth.ts \
  src/lib/setup.ts \
  src/lib/db-utils.ts
do
  [ -f "$f" ] && rm -f "$f" && echo -e "  ${GREEN}✓${RESET} removido: $f"
done

# 7) Remove dependências antigas do package.json (Firebase, Capacitor, Konva, etc.)
echo ""
echo -e "${YELLOW}Verificando package.json…${RESET}"
BAD=$(grep -E '"(firebase|@firebase|@capacitor|framer-motion|react-konva|use-image|react-dropzone)":' package.json 2>/dev/null || true)
if [ -n "$BAD" ]; then
  echo "$BAD" | sed 's/^/    encontrado: /'
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const bad = /firebase|@firebase|@capacitor|framer-motion|react-konva|use-image|react-dropzone/;
    for (const section of ['dependencies', 'devDependencies']) {
      if (!pkg[section]) continue;
      for (const k of Object.keys(pkg[section])) {
        if (bad.test(k)) { delete pkg[section][k]; console.log('    removido do package.json: ' + k); }
      }
    }
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  echo -e "  ${GREEN}✓${RESET} package.json limpo"
else
  echo -e "  ${GREEN}✓${RESET} package.json já limpo"
fi

# 8) Cache e node_modules
echo ""
echo -e "${YELLOW}Removendo node_modules, package-lock.json e .next…${RESET}"
rm -rf node_modules package-lock.json .next

# 9) Reinstala tudo do zero
echo -e "${YELLOW}Reinstalando dependências (aguarde ~1min)…${RESET}"
npm install 2>&1 | tail -5

# 10) Testa build
echo ""
echo -e "${YELLOW}Testando build…${RESET}"
if npm run build 2>&1 | tee /tmp/build.log | tail -20 | grep -qE "(error|Error)"; then
  echo -e "${RED}✗ Build falhou.${RESET}"
  echo "Últimos erros:"
  grep -E "(error|Error)" /tmp/build.log | tail -5
  exit 1
fi

echo ""
echo -e "${GREEN}${BOLD}✅ TUDO LIMPO E FUNCIONANDO!${RESET}"
echo ""
echo "Próximos passos:"
echo ""
echo "  1) Rode local:"
echo "     npm run start"
echo "     → http://localhost:3000/login"
echo "     → admin@campanhaviva.com.br / 230808Deus#"
echo ""
echo "  2) Suba para o GitHub:"
echo "     git add -A"
echo "     git commit -m 'faxina total: apenas next.js + neon'"
echo "     git push"
echo ""
echo "  3) O Render vai fazer redeploy automático em ~3 min"
