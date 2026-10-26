# DomiOS Frontend

Frontend do DomiOS: catálogo global (produtos/preços das cadeias reais,
promoções ativas, receitas) e conta de utilizador. Fala com a DomiOS.Api só
por HTTP, nunca acede à base de dados.

Nada é visível sem sessão: todas as páginas, catálogos incluídos, ficam
atrás do login (`RequireAuth` em `src/App.tsx`); sem sessão, só as páginas
de conta. A Api continua a servir os catálogos sem autenticação — o bloqueio
é só neste frontend. A conta (login, registo, recuperação de
password, confirmação de email) segue a adenda 2026-10-22 de
`DomiOS_API_Fase3.md`; as rotas `/households/{id}/...` ainda não são usadas.
Estado da cobertura da Api: `docs/levantamento-api-2026-10-23.md`.

## Páginas

- **`/produtos`** — pesquisa, lista paginada, detalhe com preço por
  cadeia/loja (`GET /products/{id}/store-offers`) e histórico de eventos
  do produto (`GET /events?aggregateType=Product&aggregateId=`).
- **`/promocoes`** — promoções ativas (`GET /promotions?activeNow=true`).
- **`/receitas`** — pesquisa, lista paginada, detalhe com ingredientes e
  passos.
- **`/entrar`**, **`/registar`**, **`/esqueci-password`** — conta.
- **`/reset-password`**, **`/verify-email`** — destino dos links dos emails
  (caminhos fixados pela Api, token no fragmento `#token=`).
- **`/plano`** (`?semana=` segunda-feira) — plano da semana da casa atual
  (`GET .../planned-meals`), saltar/repor/remover, o que falta na despensa
  (`.../planned-meals/availability`) e sugestões (`.../planned-meals/suggestions`,
  vazias sem despensa) com "Adicionar ao plano". As receitas também se
  adicionam a partir do detalhe.
- **`/ementas`**, **`/ementas/:id`** — ementas prontas (`GET /meal-plan-templates`)
  e aplicar ao plano a partir de um dia (`.../planned-meals/from-template`),
  com a política para refeições já planeadas.
- **`/despensa`** — itens da casa atual: por omissão o que há pela ordem em
  que deve ser usado (`sort=fifo`: abertos primeiro, depois validade), ou
  por estado e local; abrir, usar parte ou tudo, deitar fora com motivo,
  mudar de local. Os itens só trazem `productId`: os nomes vêm de
  `GET /products/{id}`, com cache.
- **`/despensa/adicionar`** (`?produto=`) — pesquisa no catálogo, quantidade
  (uma embalagem por omissão), local, validade e preço opcionais. Também a
  partir do detalhe do produto.
- **`/listas`**, **`/listas/:id`** — listas de compras por estado; itens
  (acrescentar, marcar comprado, remover), mudar nome, concluir, cancelar e
  reabrir; "Comparar lojas" (`.../store-comparison`: total por loja, com
  cartão, e divisão da compra agrupada por loja; só preços dos últimos 3 dias,
  e só se mostram lojas com algum item). Por loja, "O que comprar no …" mostra
  cada linha com a quantidade pedida, o produto e as embalagens a comprar; itens
  iguais de várias receitas vêm juntos numa linha (adenda 2026-10-26 de
  `DomiOS_API_Fase5.md`). O que falta no plano da semana e os ingredientes de
  uma receita (todos ou só o que falta na despensa) vão para uma lista aberta
  ou para uma nova.
- **`/casa`**, **`/casa/nova`** — casas do utilizador (`GET /households`,
  adenda 2026-10-23 da Api), escolha da casa atual (guardada neste browser,
  por utilizador), membros; criar casa (Europe/Lisbon, EUR).
- **`/conta`** — email, estado da confirmação, sair, sair em
  todos os dispositivos.

## Sessão

Access token e refresh token em `localStorage` (`domios.session`),
partilhados entre separadores. O access token é renovado quando falta menos
de um minuto para expirar, ou depois de um `401`. A Api roda o refresh token
em cada uso e termina a sessão se um token já usado voltar: por isso o
refresh é um só pedido em voo por separador, serializado entre separadores
com um Web Lock, e dentro do lock relê-se o storage antes de gastar o token
(`src/auth/session.ts`).

## Preparar o ambiente

```bash
npm install
cp .env.example .env.local   # Api local em http://localhost:5028/api/v1
npm run dev
npm test                     # Vitest
```

`VITE_API_BASE_URL` é gravada no bundle em **build-time** (Vite, não
runtime). `.env.example` aponta para a Api local (`dotnet run --project
src/DomiOS.Api` no repositório `DomiOS`, Postgres de desenvolvimento em
`localhost:5436`): **nunca usar a Api de produção em desenvolvimento**, o
login cria contas e sessões reais. Em desenvolvimento a Api não envia
emails: escreve-os no log, com os links de reset e de confirmação.
A URL de produção (`https://lavi-system-product-name.taild88dae.ts.net/domiosapi/api/v1`)
fica só nas variáveis do projeto no Vercel e no build arg do `Dockerfile`.

## CORS

A `DomiOS.Api` só aceita pedidos cross-origin de origens explicitamente
configuradas em `Cors:AllowedOrigins` (nunca `AllowAnyOrigin`) — ver
`Program.cs` no repositório `DomiOS`. Em desenvolvimento local, a origem
do Vite (`http://localhost:5173`) já está autorizada em
`appsettings.Development.json`. Em produção, a origem do Vercel
(`https://domios-frontend.vercel.app`) está em `Cors__AllowedOrigins__0` no
`docker-compose.prod.yml` do repositório `DomiOS`; outra origem de deploy
tem de ser acrescentada lá, senão os pedidos falham com erro de CORS.

## Build e deploy

```bash
npm run build                 # tsc -b && vite build -> dist/
docker build -t domios-frontend --build-arg VITE_API_BASE_URL=<url-da-api> .
docker run --rm -p 8080:8080 domios-frontend
```

Em produção o frontend está no Vercel (`https://domios-frontend.vercel.app`,
origem já autorizada no CORS da Api e usada como `Frontend:BaseUrl` nos
links dos emails). `vercel.json` reescreve qualquer caminho para
`index.html`, para os links `/reset-password` e `/verify-email` abrirem
diretamente.

`Dockerfile` é multi-stage: `node:20-alpine` faz o build, `nginx:alpine`
serve `dist/` com fallback de SPA (`nginx.conf`) para o React Router
funcionar em qualquer rota, incluindo depois de recarregar a página.

## Arquitetura

```
src/api/types.ts      DTOs TypeScript, à mão, a espelhar os DTOs reais da DomiOS.Api
src/api/http.ts        fetch + erros Problem Details (ApiError com type e Retry-After)
src/api/client.ts      catálogos, uma função por endpoint usado
src/api/auth.ts        rotas /auth anónimas; account.ts as que levam Bearer
src/auth/              sessão (session.ts, testada), hooks, RequireAuth, mensagens de erro
src/pages/             uma página por rota
src/components/        Pagination, PromotionBadge (busca a Promotion só quando existe badge), EventTimeline
src/App.tsx             rotas (React Router) + navegação
```

Sem framework de UI/CSS — CSS simples à mão (`src/index.css`), com
suporte a tema claro/escuro via `prefers-color-scheme`. Sem geração
automática de cliente Api a partir do OpenAPI — 3 páginas não
justificam essa máquina.
