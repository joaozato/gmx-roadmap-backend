# GMX — Jornada de IA (backend)

Backend simples em Node.js + Express + SQLite para o roadmap interativo
"Jornada de IA — GMX Soluções em Transportes". Guarda os pilares, itens,
subitens e detalhamentos num banco de dados de verdade (não depende mais
do navegador de cada pessoa), com um pequeno log de quem alterou o quê.

Não tem autenticação real — cada pessoa só digita o nome ao entrar
(fica salvo no navegador dela). Qualquer pessoa com o link consegue
ver e editar. Se no futuro quiser login com senha, dá para adicionar
depois.

## Rodando localmente

Requer Node.js 18 ou mais recente.

```bash
cd gmx-roadmap-backend
npm install
npm start
```

Acesse http://localhost:3000

O banco de dados fica salvo em `data.db` (SQLite), criado automaticamente
na primeira execução com o conteúdo padrão dos 6 pilares.

## Estrutura

```
gmx-roadmap-backend/
  server.js          -> servidor Express + rotas da API
  default-data.json  -> conteúdo inicial (6 pilares, itens)
  public/index.html  -> frontend (interface que os usuários acessam)
  data.db             -> banco SQLite (criado automaticamente, não subir pro git)
```

## API

- `GET  /api/data` — devolve o estado atual (`{ payload, updated_at, updated_by }`)
- `PUT  /api/data` — substitui o estado (`{ pillars: [...] }`), grava quem alterou
- `GET  /api/default-data` — devolve o conteúdo original (usado no botão "Restaurar padrão")
- `GET  /api/activity` — últimas 30 alterações registradas
- `GET  /api/health` — checagem simples de que o servidor está no ar

## Deploy simples (Railway)

1. Crie uma conta em https://railway.app (dá para entrar com GitHub)
2. Suba esta pasta para um repositório no GitHub (ou use `railway up` direto do terminal, sem precisar de GitHub)
3. No Railway: **New Project → Deploy from GitHub repo** (ou `railway init` + `railway up` no terminal, dentro desta pasta)
4. O Railway detecta o `package.json` e roda `npm install` + `npm start` automaticamente
5. Em **Settings → Networking**, gere um domínio público (algo como `gmx-roadmap.up.railway.app`)
6. Pronto — esse link é o que você compartilha com os gestores

Alternativas equivalentes: **Render.com** (Web Service, mesmas etapas) ou
**Fly.io**. Qualquer uma dessas hospeda o Node.js e mantém o `data.db`
persistente entre reinícios (no Railway/Render, ative um "volume" para
garantir que o banco não seja apagado a cada deploy).

## Deploy com Claude Code

Se preferir que o Claude Code cuide de tudo (instalar dependências,
testar localmente, criar o repositório, conectar com o Railway e gerar
o link final), basta abrir esta pasta no Claude Code e pedir:

> "Instale as dependências, teste o servidor localmente e me ajude a
> publicar no Railway."

Ele consegue rodar os comandos de terminal necessários e te guiar (ou
executar) cada etapa do deploy.
