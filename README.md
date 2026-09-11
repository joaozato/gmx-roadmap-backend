# GMX — Jornada de IA (backend)

Backend simples em Node.js + Express + PostgreSQL para o roadmap interativo
"Jornada de IA — GMX Soluções em Transportes". Guarda os pilares, itens,
subitens e detalhamentos num banco de dados de verdade (não depende mais
do navegador de cada pessoa), com um pequeno log de quem alterou o quê.

Não tem autenticação real — cada pessoa só digita o nome ao entrar
(fica salvo no navegador dela). Qualquer pessoa com o link consegue
ver e editar. Se no futuro quiser login com senha, dá para adicionar
depois.

## Rodando localmente

Requer Node.js 18 ou mais recente e um banco Postgres (local ou o mesmo
do Supabase usado em produção).

```bash
cd gmx-roadmap-backend
npm install
export DATABASE_URL="postgresql://usuario:senha@host:porta/postgres"
npm start
```

Acesse http://localhost:3000

O schema (tabelas `state` e `audit_log`) é criado automaticamente na
primeira execução, com o conteúdo padrão dos 6 pilares.

## Estrutura

```
gmx-roadmap-backend/
  server.js          -> servidor Express + rotas da API
  default-data.json  -> conteúdo inicial (6 pilares, itens)
  public/index.html  -> frontend (interface que os usuários acessam)
```

## API

- `GET  /api/data` — devolve o estado atual (`{ payload, updated_at, updated_by }`)
- `PUT  /api/data` — substitui o estado (`{ pillars: [...] }`), grava quem alterou
- `GET  /api/default-data` — devolve o conteúdo original (usado no botão "Restaurar padrão")
- `GET  /api/activity` — últimas 30 alterações registradas
- `GET  /api/health` — checagem simples de que o servidor está no ar

## Deploy 100% gratuito (Supabase + Render)

Banco de dados no **Supabase** (Postgres gratuito, persistente) e a
aplicação no **Render.com** (Web Service gratuito).

### 1. Banco (Supabase)

1. Crie uma conta em https://supabase.com e um novo projeto
2. Em **Project → Connect**, copie a connection string da aba
   **Transaction pooler** (porta 6543) — o endpoint direto (porta 5432)
   exige IPv6 e costuma falhar em hosts free tier
3. Substitua `[YOUR-PASSWORD]` pela senha do banco definida na criação
   do projeto. Se a senha tiver caracteres especiais (`@`, `#`, etc.),
   codifique-os em URL (ex: `@` vira `%40`)

### 2. Aplicação (Render)

1. Suba esta pasta para um repositório no GitHub
2. Em https://render.com: **New → Web Service**, conecte o repositório
3. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Em **Environment**, adicione a variável `DATABASE_URL` com a connection
   string do Supabase (passo anterior)
5. Deploy. O Render gera um domínio público (algo como
   `gmx-roadmap.onrender.com`) — esse link é o que você compartilha

Detalhe do plano gratuito do Render: o serviço "dorme" após ~15 minutos
sem acesso e demora cerca de 30s para acordar na próxima visita. Os dados
continuam seguros porque ficam no Supabase, não na instância do Render.
