# setup.sh - Script de instalação para Termux
#!/bin/bash

echo "🚀 Instalando CampanhaViva no Termux..."

# Atualizar pacotes
pkg update -y
pkg upgrade -y

# Instalar dependências
pkg install -y python python-pip postgresql clang

# Instalar PostgreSQL
pkg install -y postgresql

# Inicializar banco de dados
initdb ~/../usr/var/lib/postgresql

# Criar diretório para logs
mkdir -p ~/../usr/var/log

# Iniciar PostgreSQL
pg_ctl -D ~/../usr/var/lib/postgresql start

# Criar banco de dados
createdb campanhadb

# Instalar Python packages
pip install -r requirements.txt

# Criar arquivo .env
cat > .env << EOF
DATABASE_URL=postgresql://localhost/campanhadb
SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
EOF

echo "✅ Instalação concluída!"
echo ""
echo "Para iniciar o servidor:"
echo "1. Inicie o PostgreSQL: pg_ctl -D ~/../usr/var/lib/postgresql start"
echo "2. Execute: python app.py"
echo ""
echo "Para acessar no navegador: http://localhost:5000"
