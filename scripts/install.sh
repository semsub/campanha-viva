#!/bin/bash
# install.sh - Instalação automática do CAMPANHAVIVA
echo "🚀 Iniciando instalação do CAMPANHAVIVA..."

# Configurações de ambiente
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Limpeza de conflitos
npm config delete prefix
npm config set prefix /usr/local

# Instalação de dependências
npm install

echo "✅ Instalação concluída com sucesso!"
