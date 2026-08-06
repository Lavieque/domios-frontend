# DomiOS Frontend

Dashboard de dados, só de leitura, sobre o catálogo global do DomiOS
(produtos/preços das cadeias reais, promoções ativas, receitas). Fala com
a DomiOS.Api só por HTTP, nunca acede à base de dados.

Sem login — os dados mostrados (Products, Promotions, Recipes canónicas,
Stores, History) são todos catálogos globais, sem restrição de leitura
desde a Fase 3 da Api (só rotas `/households/{id}/...` exigem posse de
household, e este frontend não as usa).

## Páginas

- **`/produtos`** — pesquisa, lista paginada, detalhe com preço por
  cadeia/loja (`GET /products/{id}/store-offers`) e histórico de eventos
  do produto (`GET /events?aggregateType=Product&aggregateId=`).
- **`/promocoes`** — promoções ativas (`GET /promotions?activeNow=true`).
- **`/receitas`** — pesquisa, lista paginada, detalhe com ingredientes e
  passos.

## Preparar o ambiente

```bash
npm install
cp .env.example .env.local   # ajustar VITE_API_BASE_URL se necessário
npm run dev
```

`VITE_API_BASE_URL` é gravada no bundle em **build-time** (Vite, não
runtime) — omissão: a mesma Api de produção já usada pelo
`domios-scraper` (`https://lavi-system-product-name.taild88dae.ts.net/domiosapi/api/v1`).

## CORS

A `DomiOS.Api` só aceita pedidos cross-origin de origens explicitamente
configuradas em `Cors:AllowedOrigins` (nunca `AllowAnyOrigin`) — ver
`Program.cs` no repositório `DomiOS`. Em desenvolvimento local, a origem
do Vite (`http://localhost:5173`) já está autorizada em
`appsettings.Development.json`. **Em produção, a origem real de deploy
deste frontend ainda não está configurada na Api** — assim que o destino
de deploy estiver decidido, adicionar essa origem a
`Cors:AllowedOrigins` (via `appsettings.json`/variável de ambiente
`Cors__AllowedOrigins__0`) no repositório `DomiOS`, senão os pedidos em
produção falham com erro de CORS.

## Build e deploy

```bash
npm run build                 # tsc -b && vite build -> dist/
docker build -t domios-frontend --build-arg VITE_API_BASE_URL=<url-da-api> .
docker run --rm -p 8080:8080 domios-frontend
```

`Dockerfile` é multi-stage: `node:20-alpine` faz o build, `nginx:alpine`
serve `dist/` com fallback de SPA (`nginx.conf`) para o React Router
funcionar em qualquer rota, incluindo depois de recarregar a página.

## Arquitetura

```
src/api/types.ts      DTOs TypeScript, à mão, a espelhar os DTOs reais da DomiOS.Api
src/api/client.ts      fetch wrapper fino, uma função por endpoint usado
src/pages/             uma página por rota
src/components/        Pagination, PromotionBadge (busca a Promotion só quando existe badge), EventTimeline
src/App.tsx             rotas (React Router) + navegação
```

Sem framework de UI/CSS — CSS simples à mão (`src/index.css`), com
suporte a tema claro/escuro via `prefers-color-scheme`. Sem geração
automática de cliente Api a partir do OpenAPI — 3 páginas não
justificam essa máquina.
