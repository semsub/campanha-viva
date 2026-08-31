#!/usr/bin/env bash
# scripts/limpar-projeto.sh
# Remove todos os arquivos/pastas do projeto ANTIGO (Capacitor/Firebase/APK)
# deixando apenas o sistema Next.js + Neon.
#
# Uso:  bash scripts/limpar-projeto.sh

set -uo pipefail
BOLD="\033[1m"; GREEN="\033[0;32m"; YELLOW="\033[0;33m"; RED="\033[0;31m"; RESET="\033[0m"

echo -e "${BOLD}=== Limpeza do projeto Júnior Araújo Coordenação ===${RESET}"
echo ""
echo "Isso vai APAGAR os seguintes itens (do projeto ANTIGO):"
echo "  - Pasta android/ (Capacitor)"
echo "  - Pasta assets/ (Capacitor)"
echo "  - Campanha Viva.apk"
echo "  - capacitor.config.json"
echo "  - app.log"
echo "  - Pasta drizzle/ (migrações antigas)"
echo "  - Arquivos .md duplicados"
echo "  - scripts obsoletos (inicializar.sh, seed.ts)"
echo "  - node_modules/ e package-lock.json (para reinstalar limpo)"
echo ""
echo "NÃO SERÁ APAGADO:"
echo "  - .env (suas credenciais)"
echo "  - .git (histórico)"
echo "  - src/ (código do sistema)"
echo "  - public/ (assets do PWA)"
echo "  - Arquivos essenciais do Next.js"
echo ""
read -p "Confirma? (digite 'sim' para continuar): " CONF
if [ "$CONF" != "sim" ]; then
  echo "Cancelado."
  exit 0
fi

echo ""
echo -e "${BOLD}[1/5] Removendo pastas do Capacitor/Android…${RESET}"
rm -rf android assets 2>/dev/null && echo -e "  ${GREEN}✓${RESET} android/, assets/" || true

echo -e "\n${BOLD}[2/5] Removendo arquivos soltos antigos…${RESET}"
for f in "Campanha Viva.apk" capacitor.config.json app.log; do
  [ -e "$f" ] && rm -f "$f" && echo -e "  ${GREEN}✓${RESET} $f"
done

echo -e "\n${BOLD}[3/5] Removendo pasta drizzle/ (migrações antigas)…${RESET}"
if [ -d drizzle ]; then
  rm -rf drizzle && echo -e "  ${GREEN}✓${RESET} drizzle/ removida"
fi

echo -e "\n${BOLD}[4/5] Removendo .md duplicados…${RESET}"
for f in \
  CONFIGURACAO-COMPLETA.md \
  CONFIGURACAO-NEON-REGISTROBR.md \
  DEPLOY-RENDER.md \
  GUIA-DEPLOY-DEFINITIVO.md \
  GUIA-RAPIDO.md
do
  [ -f "$f" ] && rm -f "$f" && echo -e "  ${GREEN}✓${RESET} $f"
done

echo -e "\n${BOLD}[4b] Removendo scripts obsoletos…${RESET}"
for f in scripts/inicializar.sh scripts/seed.ts; do
  [ -f "$f" ] && rm -f "$f" && echo -e "  ${GREEN}✓${RESET} $f"
done

echo -e "\n${BOLD}[5/5] Verificando package.json…${RESET}"
BAD_DEPS=$(grep -E '"(firebase|@firebase|@capacitor|framer-motion|react-konva|use-image|react-dropzone)":' package.json 2>/dev/null || true)
if [ -n "$BAD_DEPS" ]; then
  echo -e "  ${YELLOW}!${RESET} Encontrei dependências antigas no package.json:"
  echo "$BAD_DEPS" | sed 's/^/       /'
  echo -e "  ${YELLOW}!${RESET} Removendo elas do package.json…"
  # Remove qualquer linha que contenha firebase/capacitor/konva/framer/dropzone/use-image
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const bad = /firebase|@firebase|@capacitor|framer-motion|react-konva|use-image|react-dropzone/;
    for (const section of ['dependencies', 'devDependencies']) {
      if (!pkg[section]) continue;
      for (const k of Object.keys(pkg[section])) {
        if (bad.test(k)) { delete pkg[section][k]; console.log('  removido:', k); }
      }
    }
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  echo -e "  ${GREEN}✓${RESET} package.json limpo"
else
  echo -e "  ${GREEN}✓${RESET} package.json já está limpo"
fi

echo -e "\n${BOLD}Reinstalando dependências limpas…${RESET}"
rm -rf node_modules package-lock.json .next
npm install 2>&1 | tail -3

echo ""
echo -e "${BOLD}Testando build…${RESET}"
if npm run build 2>&1 | tail -5 | grep -q "error"; then
  echo -e "${RED}✗ Build falhou.${RESET} Consulte TROUBLESHOOTING.md"
  exit 1
fi
echo -e "${GREEN}✓ Build passou${RESET}"

echo ""
echo -e "${GREEN}${BOLD}✅ LIMPEZA COMPLETA!${RESET}"
echo ""
echo "Próximos passos:"
echo "  1) source .env && psql \"\$DATABASE_URL\" -c 'SELECT email, role FROM users;'"
echo "     (deve mostrar admin@campanhaviva.com.br | super_admin)"
echo ""
echo "  2) npm run start   # roda local em http://localhost:3000"
echo "     Login: admin@campanhaviva.com.br / Admin@2026"
echo ""
echo "  3) git add -A && git commit -m 'limpeza projeto' && git push"
echo ""
echo "  4) No Render: certifique-se que o serviço está ATIVO (não suspenso)"
echo "     https://dashboard.render.com → campanha-viva → Resume/Restart"
