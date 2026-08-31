#!/usr/bin/env bash
# scripts/fix.sh — Corretor automático para os 6 erros mais comuns
# Uso: bash scripts/fix.sh

set -uo pipefail
BOLD="\033[1m"; GREEN="\033[0;32m"; YELLOW="\033[0;33m"; RED="\033[0;31m"; RESET="\033[0m"

echo -e "${BOLD}=== Corretor automático — Júnior Araújo Coordenação ===${RESET}\n"

# --- 1. Node.js 22 ---
echo -e "${BOLD}[1/6] Verificando Node.js…${RESET}"
if ! command -v node >/dev/null; then
  echo -e "${RED}Node.js não instalado.${RESET} Rode:"
  echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs"
  exit 1
fi
MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$MAJOR" -lt 22 ]; then
  echo -e "${YELLOW}Node $MAJOR detectado, mas o projeto usa 22 LTS.${RESET}"
else
  echo -e "${GREEN}✓ Node $(node -v)${RESET}"
fi

# --- 2. Corrige nomes de perfil errados (Erro 2: 'lideranca' vs 'leader') ---
echo -e "\n${BOLD}[2/6] Procurando comparações erradas de role no código…${RESET}"
BAD=$(grep -rlE "role\s*(===|==|!==|!=)\s*[\"'](lideranca|liderança|coordenador|adm[_ ]?super|adm)[\"']" src/ 2>/dev/null || true)
if [ -z "$BAD" ]; then
  echo -e "${GREEN}✓ nenhum nome de perfil errado${RESET}"
else
  echo -e "${YELLOW}Arquivos com nomes errados (você precisa editar manualmente):${RESET}"
  echo "$BAD"
  echo "Faça as substituições:"
  echo "  'lideranca'/'liderança' → 'leader'"
  echo "  'coordenador' → 'coordinator'"
  echo "  'adm_super'/'adm' → 'super_admin'"
fi

# --- 3. Reinstala dependências (Erros 3 e 4) ---
echo -e "\n${BOLD}[3/6] Reinstalando dependências…${RESET}"
if [ -f package.json ]; then
  rm -rf node_modules .next
  npm install 2>&1 | tail -5
  # Garante que pg está presente (Erro 4)
  if [ ! -d node_modules/pg ]; then
    echo -e "${YELLOW}Instalando pg + @types/pg…${RESET}"
    npm install pg @types/pg
  fi
  echo -e "${GREEN}✓ dependências ok${RESET}"
else
  echo -e "${RED}package.json não encontrado — você está na pasta errada?${RESET}"
  exit 1
fi

# --- 4. Verifica .env (Erro 6 em desenvolvimento local) ---
echo -e "\n${BOLD}[4/6] Verificando .env…${RESET}"
if [ ! -f .env ]; then
  echo -e "${YELLOW}Não existe .env. Criando template…${RESET}"
  cat > .env <<'EOF'
# Substitua pela sua Connection String real do Neon:
DATABASE_URL="postgresql://usuario:senha@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
SESSION_SECRET="frase-longa-aleatoria-mude-em-producao-2026"
EOF
  echo -e "${YELLOW}Edite .env com a Connection String correta.${RESET}"
else
  URL=$(grep "^DATABASE_URL=" .env | head -1 | cut -d= -f2- | tr -d '"')
  if [ -z "$URL" ] || echo "$URL" | grep -q "usuario:senha"; then
    echo -e "${RED}✗ DATABASE_URL não está configurada em .env${RESET}"
  else
    echo -e "${GREEN}✓ DATABASE_URL configurada${RESET}"
  fi
fi

# --- 5. Verifica Git (Erro 5) ---
echo -e "\n${BOLD}[5/6] Verificando estado do Git…${RESET}"
if [ -d .git ]; then
  git fetch --quiet 2>/dev/null || true
  BEHIND=$(git status -sb 2>/dev/null | head -1 | grep -oE "behind [0-9]+" | awk '{print $2}')
  AHEAD=$(git status -sb 2>/dev/null | head -1 | grep -oE "ahead [0-9]+" | awk '{print $2}')
  if [ -n "$BEHIND" ]; then
    echo -e "${YELLOW}⚠ local está $BEHIND commit(s) atrás do GitHub${RESET}"
    echo "  Para sincronizar sem perder mudanças locais:"
    echo "    git pull --rebase origin main"
    echo "  Se aparecer conflito em package.json/package-lock.json:"
    echo "    rm -f package-lock.json && npm install && git add package.json package-lock.json && git rebase --continue"
  fi
  if [ -n "$AHEAD" ]; then
    echo -e "${YELLOW}⚠ local está $AHEAD commit(s) à frente — faça:  git push${RESET}"
  fi
  if [ -z "$BEHIND" ] && [ -z "$AHEAD" ]; then
    echo -e "${GREEN}✓ git sincronizado${RESET}"
  fi
else
  echo -e "${YELLOW}Não é um repo git${RESET}"
fi

# --- 6. Testa build (valida Erros 1 e 2 juntos) ---
echo -e "\n${BOLD}[6/6] Testando build…${RESET}"
if npm run build 2>&1 | tee /tmp/build.log | tail -3 | grep -q "error"; then
  echo -e "${RED}✗ Build falhou. Últimos erros:${RESET}"
  grep -E "error|Error" /tmp/build.log | tail -10
  echo -e "\nConsulte TROUBLESHOOTING.md."
  exit 1
else
  echo -e "${GREEN}✓ build passou${RESET}"
fi

echo -e "\n${GREEN}${BOLD}Tudo pronto! Agora:${RESET}"
echo "  1. git add -A && git commit -m 'fix' && git push"
echo "  2. Confira o Render: DATABASE_URL, SESSION_SECRET, NODE_VERSION=22"
echo "  3. bash scripts/doctor.sh https://campanha-viva.onrender.com"
