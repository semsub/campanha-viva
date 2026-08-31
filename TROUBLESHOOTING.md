# Guia definitivo de solução — Júnior Araújo Coordenação

Este documento reúne todos os erros que já aconteceram durante o desenvolvimento
e a implantação do sistema, com a solução exata para cada um. Se um erro voltar
a acontecer, procure aqui antes de qualquer coisa.

**Diagnóstico rápido:**
```bash
bash scripts/doctor.sh
```

---

## Ambiente esperado

- **Kali/Debian/Ubuntu** com Node.js 22 LTS
- **PostgreSQL** — local em desenvolvimento ou Neon em produção
- **Git** conectado ao repositório `campanha-viva` no GitHub
- **Render** hospedando o build

---

## ERRO 1 — `Property 'userId' does not exist on type 'PgTableWithColumns...'` (rota /api/voters)

**Sintoma no build (Render/local):**
```
Type error: Property 'userId' does not exist on type 'PgTableWithColumns...'.
File: src/app/api/voters/route.ts
```

**Causa:** A rota estava lendo uma coluna que não existe na tabela `voters`
do arquivo `src/db/schema.ts`. Isso acontece quando o **schema** é atualizado
(por exemplo, `userId` foi renomeado para `createdBy`) e algum arquivo antigo
continua referenciando o nome antigo.

**Solução:**
1. Abra `src/db/schema.ts` e liste as colunas reais de `voters`. Hoje elas são:
   `name, phone, voterTitle, zone, section, street, number, neighborhood, city,
   birthDate, notes, leaderId, coordinatorId, createdBy, createdAt, updatedAt`.
2. Em qualquer arquivo em `src/app/api/**/*` que apareça `voters.userId`, troque
   pelo campo correto (normalmente `voters.createdBy` ou `voters.leaderId`).
3. Se a intenção é filtrar por dono, use os helpers:
   ```ts
   import { votersVisibilityFilter } from "@/lib/scope";
   const where = votersVisibilityFilter(session);
   ```
4. Rode `npx next typegen && npm exec tsc -- --noEmit` até passar.

---

## ERRO 2 — `Types '"super_admin"' and '"lideranca"' have no overlap`

**Sintoma:**
```
Type error: This comparison appears to be unintentional because the types
'"super_admin"' and '"lideranca"' have no overlap.
```

**Causa:** O `pgEnum` em `src/db/schema.ts` define os cargos como:
```ts
userRoleEnum = pgEnum("user_role", ["super_admin", "coordinator", "leader"])
```
Alguém escreveu no código `"lideranca"` (nome antigo, em português) mas o
tipo TypeScript só aceita os literais em inglês do enum.

**Solução:**
1. Padrão OFICIAL de nomes de perfil neste projeto (não mude):
   - `super_admin`
   - `coordinator`
   - `leader`
2. Nomes em português são só para exibição, e vêm de `src/lib/permissions.ts`
   (`ROLE_LABELS`). Nunca compare strings em português com o `role` da sessão.
3. Faça uma busca por todos os lugares que estejam com o nome errado:
   ```bash
   grep -rn "lideranca\|liderança" src/ --include="*.ts" --include="*.tsx"
   ```
4. Troque cada ocorrência por `leader`.

---

## ERRO 3 — "Está dando conflito no sistema todo"

**Causa mais comum:** vários arquivos foram alterados manualmente ao mesmo
tempo e o TypeScript passou a acusar dezenas de erros em cascata.

**Solução (voltar ao último ponto estável):**
```bash
cd ~/coordenador

# 1. Ver o histórico dos últimos 10 commits
git log --oneline -10

# 2. Ver o que mudou desde o último commit
git status
git diff

# 3. Se quiser DESCARTAR TUDO que não foi commitado:
git restore .
git clean -fd            # apaga arquivos novos não commitados

# 4. Se quiser voltar para um commit específico (que funcionava):
git reset --hard <hash-do-commit>

# 5. Reinstalar dependências para garantir integridade:
rm -rf node_modules .next
npm install
npm run build
```

**Prevenção:** trabalhe em pequenos commits. A cada mudança que funciona:
```bash
git add -A && git commit -m "descrição curta"
```

---

## ERRO 4 — `Module not found: Can't resolve 'pg'`

**Sintoma:**
```
Module not found: Can't resolve 'pg'
Import trace: drizzle-orm/node-postgres/driver.js → src/db/index.ts
```

**Causa:** O driver `pg` (PostgreSQL) não está instalado no `node_modules`.

**Solução:**
```bash
cd ~/coordenador
npm install pg @types/pg
# se ainda quebrar, apague o cache:
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

Confirme que o `package.json` tem estas linhas em `dependencies`:
```json
"pg": "^8.20.0",
"@types/pg": "^8.18.0"
```

---

## ERRO 5 — `failed to push some refs` / conflito em `package.json`

**Sintoma:**
```
! [rejected]        main -> main (fetch first)
error: failed to push some refs to '...'
hint: Updates were rejected because the tip of your current branch is behind
```
Ou, depois de `git pull`, aparecem `<<<<<<< HEAD` no `package.json`.

**Causa:** O GitHub tem commits mais novos que os seus (você editou o repo pelo
site, ou está em outra máquina), e os arquivos `package.json` e
`package-lock.json` divergiram.

**Solução (mantendo suas mudanças locais):**
```bash
cd ~/coordenador

# 1. Sincroniza com o remoto trazendo mudanças
git pull --rebase origin main

# 2. Se aparecer conflito nos package.json/package-lock.json:
#    o mais seguro é REGENERAR ambos localmente:
rm -f package-lock.json
npm install                 # regera o lock a partir do package.json
git add package.json package-lock.json
git rebase --continue

# 3. Se ainda houver conflito em outros arquivos, o Git aponta cada um.
#    Abra, resolva as marcações <<<<<<<, >>>>>>>, salve, depois:
git add <arquivo-resolvido>
git rebase --continue

# 4. Finalmente:
git push
```

**Alternativa nuclear (se você tem CERTEZA de que seu local está correto):**
```bash
git push --force-with-lease
```
Use com cuidado — sobrescreve o remoto.

---

## ERRO 6 — `getaddrinfo ENOTFOUND base` no login

**Sintoma na tela de login:**
```
⚠️ Erro no banco de dados: getaddrinfo ENOTFOUND base.
Configure a variável DATABASE_URL no Render.
```

**Causa:** A variável `DATABASE_URL` no Render está **ausente**, **vazia** ou
com valor **inválido** (por exemplo, ficou só `base` sem o restante da string).

**Solução — Passo a passo no Render:**

1. Acesse [Render](https://dashboard.render.com) → seu serviço `campanha-viva`
2. Menu lateral → **Environment**
3. Verifique se existe a chave `DATABASE_URL`. Se não existir, adicione.
4. O valor deve ser a Connection String **completa** do Neon, no formato:
   ```
   postgresql://usuario:senha@ep-xxxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
   ```
5. **Confira** (sem espaços no início/fim, sem aspas em volta):
   - Começa com `postgresql://`
   - Termina com `?sslmode=require`
   - Contém `.neon.tech`
6. Clique em **Save, rebuild and deploy**.
7. Aguarde ~3 min.
8. Diagnóstico rápido:
   ```bash
   curl -s https://campanha-viva.onrender.com/api/bootstrap | python3 -m json.tool
   ```
   Deve retornar `"hasDatabaseUrl": true` e o `databaseHost` deve ser algo
   como `ep-xxx.sa-east-1.aws.neon.tech`.

**Onde pegar a Connection String no Neon:**
1. [Neon dashboard](https://console.neon.tech) → seu projeto
2. Bloco **Connection Details** ou **Connection string**
3. Selecione **Pooled connection** (recomendado para serverless)
4. Copie a string (ela já vem com `?sslmode=require` incluído)

---

## Checklist de deploy limpo (do zero)

Se algum dia precisar recomeçar tudo:

```bash
# 1. LOCAL (Kali)
cd ~/coordenador
git pull
rm -rf node_modules .next package-lock.json
npm install
npm run build     # deve terminar sem erros
git add -A
git commit -m "deploy limpo"
git push

# 2. RENDER
# Painel → Environment → confirme:
#   NODE_VERSION=22
#   DATABASE_URL=postgresql://...neon.tech/...?sslmode=require
#   SESSION_SECRET=(qualquer frase longa)
# Manual Deploy → Clear build cache & deploy

# 3. Bootstrap do banco (uma vez por banco novo)
curl -X POST https://campanha-viva.onrender.com/api/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campanhaviva.com.br","password":"Admin@2026","name":"Junior Araujo"}'

# 4. Testar
curl -s https://campanha-viva.onrender.com/api/bootstrap | python3 -m json.tool
# hasDatabaseUrl: true, hasAdmin: true → tudo OK

# 5. Abrir /login no navegador e entrar
```
