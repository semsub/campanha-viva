# Júnior Araújo Coordenação — Deploy Completo

## 🔑 LOGIN

| E-mail | `admin@campanhaviva.com.br` |
|--------|------------------------------|
| Senha  | `Admin@2026`                 |
| Perfil | Super Admin                  |

---

## 📤 SUBIR PARA O GITHUB (Kali Linux)

### ⚠️ IMPORTANTE: substitua TODO o código antigo

O projeto antigo no seu `~/coordenador` tem arquivos que causam erro.
Faça o seguinte:

```bash
# 1. FAÇA BACKUP do projeto antigo (por segurança)
cp -r ~/coordenador ~/coordenador-backup-$(date +%Y%m%d)

# 2. APAGUE todo o código-fonte antigo (mantém .git)
cd ~/coordenador
ls | grep -v '.git' | xargs rm -rf

# 3. COPIE os novos arquivos para cá
#    (baixe o ZIP do Arena ou clone do repositório atualizado)

# 4. SUBA para o GitHub
git add .
git commit -m "v2.0 — sistema completo com todas as tabelas e rotas"
git push --force
```

### Após cada mudança futura:
```bash
cd ~/coordenador
git add .
git commit -m "descreva o que mudou"
git push
```

---

## ⚙️ VARIÁVEIS NO RENDER

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | Connection string do Neon |
| `SESSION_SECRET` | Frase longa aleatória |
| `NODE_VERSION` | `22` |

Build: `npm install && npm run build`
Start: `npm run start`

---

## 🔍 DIAGNÓSTICO

Acesse: `https://SEU-APP.onrender.com/api/diag`

Mostra: DATABASE_URL configurada? Banco conecta? Tabelas existem? Super Admin criado?

---

## 📋 ROTAS DA API

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/auth/login` | POST | Login (e-mail + senha) |
| `/api/auth/logout` | POST | Sair |
| `/api/auth/me` | GET | Sessão atual |
| `/api/dashboard` | GET | Indicadores gerais |
| `/api/voters` | GET/POST | Eleitores |
| `/api/demands` | GET/POST | Demandas |
| `/api/demands/[id]` | GET/PATCH | Detalhe/atualizar demanda |
| `/api/categories` | GET/POST | Categorias de demandas |
| `/api/users` | GET/POST | Usuários do sistema |
| `/api/users/[id]` | PATCH/DELETE | Editar/desativar usuário |
| `/api/tasks` | GET/POST | Tarefas |
| `/api/events` | GET/POST | Eventos |
| `/api/territorial` | GET/POST | Municípios, regiões, bairros |
| `/api/audit` | GET | Logs de auditoria |
| `/api/seed` | POST | Seed de dados iniciais |
| `/api/diag` | GET | Diagnóstico do sistema |
| `/api/health` | GET | Health check |

*Desenvolvido por Júnior Araújo Sistemas — (91) 98212-2175*
