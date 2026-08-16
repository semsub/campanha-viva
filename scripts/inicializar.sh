#!/bin/bash

# Script de Inicialização - Júnior Araújo Coordenação
# Uso: ./scripts/inicializar.sh

echo "╔════════════════════════════════════════════════════════╗"
echo "║     JÚNIOR ARAÚJO COORDENAÇÃO - Inicialização         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ Erro: Arquivo .env não encontrado!"
    echo ""
    echo "Crie o arquivo .env com:"
    echo "DATABASE_URL=postgresql://usuario:senha@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
    echo "JWT_SECRET=sua-chave-secreta"
    exit 1
fi

# Carregar variáveis de ambiente
source .env

# Verificar DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erro: DATABASE_URL não configurada no .env"
    exit 1
fi

echo "✅ Arquivo .env encontrado"
echo ""

# Passo 1: Instalar dependências
echo "📦 Instalando dependências..."
npm install --silent
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi
echo "✅ Dependências instaladas"
echo ""

# Passo 2: Instalar tsx
echo "📦 Instalando tsx..."
npm install -D tsx --silent
echo "✅ tsx instalado"
echo ""

# Passo 3: Push do schema
echo "🗄️  Aplicando schema ao banco de dados..."
npx drizzle-kit push
if [ $? -ne 0 ]; then
    echo "❌ Erro ao aplicar schema"
    exit 1
fi
echo "✅ Schema aplicado com sucesso"
echo ""

# Passo 4: Rodar seed
echo "🌱 Inicializando dados..."
npx tsx scripts/seed.ts
if [ $? -ne 0 ]; then
    echo "❌ Erro ao inicializar dados"
    exit 1
fi
echo ""

echo "════════════════════════════════════════════════════════╗"
echo "║            INICIALIZAÇÃO CONCLUÍDA! ✅                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Próximos passos:"
echo "1. Teste local: npm run dev"
echo "2. Acesse: http://localhost:3000"
echo "3. Faça deploy na Vercel"
echo "4. Configure o domínio no Registro.br"
echo ""
echo "Suporte: (91) 98212-2175 | junior.araujo21@yahoo.com.br"
echo ""
