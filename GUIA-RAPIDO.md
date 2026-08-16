# 🚀 Guia Rápido de Implantação

## ⚡ Resumo em 10 Passos

### 1. Neon (Banco de Dados) - 5 minutos
```
1. Acesse neon.tech
2. Sign Up com GitHub
3. New Project → "campanhaviva"
4. Copie Connection String
```

### 2. Terminal Kali - Configuração
```bash
# Instalar Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20

# Instalar dependências do projeto
cd /caminho/do/projeto
npm install
npm install -D tsx
```

### 3. Arquivo .env
```bash
nano .env
```
Cole:
```env
DATABASE_URL=postgresql://usuario:senha@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=chave-secreta-forte-aleatoria
```

### 4. Push do Schema
```bash
DATABASE_URL="sua_url_do_neon" npx drizzle-kit push
```

### 5. Seed (Inicializar Dados)
```bash
DATABASE_URL="sua_url_do_neon" npx tsx scripts/seed.ts
```

### 6. GitHub
```bash
git add .
git commit -m "Júnior Araújo Coordenação"
git remote add origin https://github.com/seu-user/campanhaviva.git
git push -u origin main
```

### 7. Vercel Deploy
```
1. vercel.com → Add New Project
2. Importe do GitHub
3. Environment Variables:
   - DATABASE_URL = sua_url
   - JWT_SECRET = sua_chave
4. Deploy
```

### 8. Registro.br (DNS)
```
1. registro.br → Meus Domínios
2. campanhaviva.com.br → DNS
3. Adicionar:
   Host: @ | Tipo: A | Valor: 76.76.21.21
   Host: www | Tipo: CNAME | Valor: cname.vercel-dns.com
```

### 9. Domínio na Vercel
```
1. Settings → Domains
2. Add: campanhaviva.com.br
3. Add: www.campanhaviva.com.br
4. Aguarde SSL (5-10 min)
```

### 10. Seed em Produção
```bash
DATABASE_URL="sua_url_do_neon" npx tsx scripts/seed.ts
```

---

## 🔐 Credenciais Padrão

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | admin@sistema.com | admin123 |
| Coordenador | coord@sistema.com | coord123 |
| Liderança | lider@sistema.com | lider123 |

**⚠️ ALTERE AS SENHAS IMEDIATAMENTE!**

---

##  Suporte

**Júnior Araújo Sistemas**  
📱 (91) 98212-2175  
📧 junior.araujo21@yahoo.com.br

---

## ✅ Checklist Rápido

- [ ] Neon criado + URL copiada
- [ ] Node.js instalado
- [ ] .env configurado
- [ ] drizzle-kit push rodou
- [ ] seed.ts rodou
- [ ] GitHub push feito
- [ ] Vercel deploy feito
- [ ] DNS Registro.br configurado
- [ ] Domínio na Vercel adicionado
- [ ] Senhas alteradas

**Tempo total estimado: 30-40 minutos**
