#!/usr/bin/env bash
# scripts/limpar-arquivos-antigos.sh
# Remove SÓ os arquivos antigos que estão quebrando o build
# (mantém node_modules, .env, .git e tudo mais intacto)

set -uo pipefail
GREEN="\033[0;32m"; YELLOW="\033[0;33m"; RESET="\033[0m"

echo -e "${YELLOW}Removendo arquivos ANTIGOS que estão quebrando o build…${RESET}"
echo ""

# Arquivos/pastas do projeto antigo que não existem mais no schema novo
REMOVE=(
  "src/lib/api-auth.ts"
  "src/lib/setup.ts"
  "src/lib/db-utils.ts"
  "src/app/api/categories"
  "src/app/api/seed"
  "src/app/api/territorial"
  "src/app/api/campaigns"      # antigo, foi substituído
  "src/app/api/debug"          # antigo, foi substituído por /api/bootstrap
  "src/app/api/setup"          # antigo, foi substituído por /api/bootstrap
)

for f in "${REMOVE[@]}"; do
  if [ -e "$f" ]; then
    rm -rf "$f"
    echo -e "  ${GREEN}✓${RESET} removido: $f"
  fi
done

echo ""
echo -e "${YELLOW}Reinstalando dependências (limpando .next e node_modules)…${RESET}"
rm -rf .next
npm install 2>&1 | tail -3

echo ""
echo -e "${YELLOW}Testando build…${RESET}"
if npm run build 2>&1 | tail -20 | grep -q "error"; then
  echo -e "\033[0;31m✗ Build ainda com erros. Rode:${RESET}"
  echo "   npm run build 2>&1 | tail -40"
  exit 1
fi

echo ""
echo -e "${GREEN}✓ Build passou!${RESET}"
echo ""
echo "Agora rode:"
echo "  npm run start   # http://localhost:3000/login"
