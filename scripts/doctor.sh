#!/usr/bin/env bash
# Diagnóstico rápido do projeto Júnior Araújo Coordenação
# Uso:  bash scripts/doctor.sh
#       bash scripts/doctor.sh https://campanha-viva.onrender.com

set -uo pipefail

REMOTE="${1:-}"
OK="\033[0;32m✓\033[0m"
BAD="\033[0;31m✗\033[0m"
WARN="\033[0;33m!\033[0m"
BOLD="\033[1m"; RESET="\033[0m"

section() { echo -e "\n${BOLD}== $1 ==${RESET}"; }

section "1. Node.js / npm"
if command -v node >/dev/null; then
  V=$(node -v)
  MAJOR=${V#v}; MAJOR=${MAJOR%%.*}
  if [ "$MAJOR" -ge 22 ]; then echo -e "$OK node $V"
  else echo -e "$WARN node $V — recomendado 22 LTS"; fi
else echo -e "$BAD node não instalado"; fi
command -v npm >/dev/null && echo -e "$OK npm $(npm -v)" || echo -e "$BAD npm não instalado"

section "2. Dependências instaladas"
if [ -d node_modules ]; then
  for pkg in pg drizzle-orm next react bcryptjs; do
    if [ -d "node_modules/$pkg" ]; then echo -e "$OK $pkg"
    else echo -e "$BAD $pkg — rode: npm install"; fi
  done
else
  echo -e "$BAD node_modules ausente — rode: npm install"
fi

section "3. Arquivos essenciais"
for f in \
  package.json \
  src/db/schema.ts \
  src/db/index.ts \
  src/lib/auth.ts \
  src/lib/scope.ts \
  src/lib/masks.ts \
  src/app/login/page.tsx \
  src/app/app/layout.tsx \
  src/app/api/bootstrap/route.ts \
  src/app/api/auth/login/route.ts \
  public/manifest.json \
  public/images/logo.png \
  public/icons/icon-512.png
do
  if [ -f "$f" ]; then echo -e "$OK $f"
  else echo -e "$BAD $f (faltando)"; fi
done

section "4. Uso incorreto de nomes de perfil em código (esperado: leader/coordinator/super_admin)"
# Só busca em comparações e literais reais, não em comentários ou textos de UI
BAD_NAMES=$(grep -rnE "role\s*(===|==|!==|!=)\s*[\"'](lideranca|liderança|coordenador|adm[_ ]?super|adm)[\"']" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -z "$BAD_NAMES" ]; then echo -e "$OK nenhum uso incorreto encontrado"
else echo -e "$WARN comparação errada de role:\n$BAD_NAMES"; fi

section "5. .env local"
if [ -f .env ]; then
  if grep -q "^DATABASE_URL=" .env; then
    URL=$(grep "^DATABASE_URL=" .env | head -1 | cut -d= -f2- | tr -d '"')
    HOST=$(echo "$URL" | sed -E 's|^postgres(ql)?://[^@]+@||' | cut -d/ -f1)
    echo -e "$OK DATABASE_URL apontando para $HOST"
    if echo "$URL" | grep -q "neon.tech" && ! echo "$URL" | grep -q "sslmode=require"; then
      echo -e "$WARN é Neon mas faltou ?sslmode=require"
    fi
  else
    echo -e "$BAD DATABASE_URL ausente no .env"
  fi
else
  echo -e "$WARN .env não existe (ok se você usa apenas o Render)"
fi

section "6. Git"
if [ -d .git ]; then
  BR=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  echo -e "$OK branch: $BR"
  BEHIND=$(git status -sb 2>/dev/null | head -1 | grep -oE "behind [0-9]+" | awk '{print $2}')
  AHEAD=$(git status -sb 2>/dev/null | head -1 | grep -oE "ahead [0-9]+" | awk '{print $2}')
  [ -n "$BEHIND" ] && echo -e "$WARN local está $BEHIND commits ATRÁS do remoto — rode: git pull --rebase"
  [ -n "$AHEAD" ] && echo -e "$WARN local está $AHEAD commits À FRENTE do remoto — rode: git push"
  CHANGED=$(git status --porcelain | wc -l)
  [ "$CHANGED" -gt 0 ] && echo -e "$WARN $CHANGED arquivo(s) modificado(s) não commitados"
else
  echo -e "$WARN não é um repo git"
fi

if [ -n "$REMOTE" ]; then
  section "7. Verificação remota ($REMOTE)"
  HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$REMOTE/api/health" || echo "000")
  if [ "$HEALTH" = "200" ]; then echo -e "$OK /api/health responde 200"
  else echo -e "$BAD /api/health retornou $HEALTH"; fi

  BOOT=$(curl -s "$REMOTE/api/bootstrap" || echo "{}")
  echo "$BOOT" | python3 -m json.tool 2>/dev/null || echo "$BOOT"

  if echo "$BOOT" | grep -q '"hasDatabaseUrl": *true'; then
    echo -e "$OK DATABASE_URL configurada no servidor"
  else
    echo -e "$BAD DATABASE_URL ausente no Render (veja TROUBLESHOOTING.md, Erro 6)"
  fi
  if echo "$BOOT" | grep -q '"hasAdmin": *true'; then
    echo -e "$OK Super Admin existe"
  else
    echo -e "$WARN Super Admin não criado. Inicialize com:"
    echo "     curl -X POST $REMOTE/api/bootstrap -H 'Content-Type: application/json' \\"
    echo "       -d '{\"email\":\"admin@campanhaviva.com.br\",\"password\":\"Admin@2026\"}'"
  fi
fi

echo -e "\n${BOLD}Diagnóstico concluído.${RESET}"
echo "Se algum item falhou, consulte TROUBLESHOOTING.md no mesmo diretório."
