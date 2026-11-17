# DomiOS Frontend

Frontend do DomiOS: catálogo global (produtos/preços das cadeias reais,
promoções ativas, receitas) e conta de utilizador. Fala com a DomiOS.Api só
por HTTP, nunca acede à base de dados.

Nada é visível sem sessão: todas as páginas, catálogos incluídos, ficam
atrás do login (`RequireAuth` em `src/App.tsx`); sem sessão, só as páginas
de conta. A Api continua a servir os catálogos sem autenticação — o bloqueio
é só neste frontend. A conta (login, registo, recuperação de
password, confirmação de email) segue a adenda 2026-10-22 de
`DomiOS_API_Fase3.md`; as rotas da casa (`/households/{id}/...`) servem a
despensa, o plano, as listas, a cozinha, os gastos e a nutrição.
Retrato da cobertura da Api a 2026-10-23 (já ultrapassado em boa parte):
`docs/levantamento-api-2026-10-23.md`.

## Páginas

- **`/`** (Hoje) — próximos 7 dias do plano, o que usar primeiro da despensa,
  listas abertas e promoções a terminar; sem casa, só o catálogo.
- **`/produtos`** — pesquisa, etiquetas com o preço mais baixo, €/kg, preço com
  cartão e veredicto do histórico (`priceInsight`); detalhe com uma etiqueta por
  loja (`GET /products/{id}/store-offers`: régua mínimo/média/máximo, verificação
  Omnibus, frequência de promoção, produto substituto) e histórico de eventos
  do produto (`GET /events?aggregateType=Product&aggregateId=`). Ao abrir uma
  loja, um gráfico em escada mostra o preço dos últimos 90 dias
  (`GET /stores/{id}/offers/{offerId}/price-history`, anónima, só pedida ao
  abrir), com as promoções marcadas e uma tabela para leitores de ecrã.
- **`/promocoes`** — promoções ativas (`GET /promotions?activeNow=true`), com o
  desconto anunciado (`discountPercent`) e o prazo.
- **`/receitas`** — pesquisa, filtros por tipo de prato e proteína
  (`dishType`, `mainProtein`), detalhe com ingredientes, passos e link para a
  receita original (`sourceUrl`). As que a casa atual já fez levam um ✓ no
  canto do cartão; ao passar o rato (ou com o foco) diz quantas vezes e a
  última (`GET .../recipes/cooked`, só informativo: sem casa ou com erro, a
  lista mostra-se igual).
- **`/cozinhar`** — o que dá para fazer com a despensa: as receitas guardadas e
  planeadas, e outras que a despensa cobre (`.../recipes/cookable`).
- **`/cozinhar/feitas`** — receitas que a casa já fez, quantas vezes e a última
  (`.../recipes/cooked`), com "Guardar para fazer outra vez".
- **`/entrar`**, **`/registar`**, **`/esqueci-password`** — conta. O registo só abre com `#convite=...` (link do email de acesso aprovado); sem convite, a página manda para o site (`VITE_SITE_URL`, por omissão https://domios.pt) para pedir acesso.
- **`/reset-password`**, **`/verify-email`** — destino dos links dos emails
  (caminhos fixados pela Api, token no fragmento `#token=`).
- **`/plano`** (`?semana=` segunda-feira) — plano da semana da casa atual
  (`GET .../planned-meals`), saltar/repor/remover, o que falta na despensa
  (`.../planned-meals/availability`) e sugestões (`.../planned-meals/suggestions`,
  vazias sem despensa) com "Adicionar ao plano". As receitas também se
  adicionam a partir do detalhe.
- **`/ementas`**, **`/ementas/:id`** — ementas prontas (`GET /meal-plan-templates`)
  e aplicar ao plano a partir de um dia, hoje por omissão
  (`.../planned-meals/from-template`), com a política para refeições já planeadas.
- **`/despensa`** — itens da casa atual: por omissão o que há pela ordem em
  que deve ser usado (`sort=fifo`: abertos primeiro, depois validade), ou
  por estado e local; abrir, usar parte ou tudo, deitar fora com motivo,
  mudar de local. Os itens só trazem `productId`: os nomes vêm de
  `GET /products/{id}`, com cache.
- **`/despensa/desperdicio`** — o que foi para o lixo, quanto valia e porquê
  (`.../pantry/waste`, até 366 dias).
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
- **`/gastos`** — o que a casa gastou por mês e por cadeia (`.../spending`, até
  24 meses): o preço escrito por um membro e o estimado pela prateleira.
- **`/nutricao`** — score nutricional da semana e médias por dia, com os
  objetivos de cada membro.
- **`/lojas`** — lojas físicas das cadeias com preços, a partir da posição do
  dispositivo (`.../nearby-stores`).
- **`/casa`**, **`/casa/nova`** — casas do utilizador (`GET /households`,
  adenda 2026-10-23 da Api), escolha da casa atual (guardada neste browser,
  por utilizador), membros; criar casa (Europe/Lisbon, EUR). Ao criar ou sair
  de uma casa, `householdsChanged()` esquece a lista guardada e avisa todos os
  `useHouseholds` abertos (barra, menu), que a pedem de novo. `/casa/nova` aceita o nome do membro em
  `location.state.memberName` (o tour da demo usa-o).
- **`/casa/historico`** — eventos da casa por dia (`.../timeline`).
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
src/components/        ShelfLabel (etiqueta de preço, faixa do veredicto, régua do histórico), PromotionLabel,
                       SearchField, Pagination, PromotionBadge (busca a Promotion só quando existe badge), EventTimeline
src/catalog/offers.ts  ofertas por produto (cache por sessão de página), formatação de preços e €/kg
src/App.tsx             rotas (React Router) + navegação
```

Sem framework de UI/CSS — CSS simples à mão (`src/index.css`), com
suporte a tema claro/escuro via `prefers-color-scheme`. O sistema visual
(etiqueta de prateleira, Schibsted Grotesk servida pelo bundle via
`@fontsource-variable`) está em `DESIGN.md`; as cores são os tokens de
`:root` e não mudam. Na lista de produtos, `GET /products` não traz preços:
cada etiqueta lê `GET /products/{id}/store-offers` (20 pedidos por página). Sem geração
automática de cliente Api a partir do OpenAPI — 3 páginas não
justificam essa máquina.

## Site público (`site/`)

Segundo deploy do mesmo repo, em `domios.pt`: site multi-página em pt-PT e en (menus, guia de
utilização, pedir acesso). Entrada própria, sem código da app; partilha os tokens (`src/shared/tokens.css`).

- `npm run dev:site` (porta 5174), `npm run build:site` (saída `dist-site`).
- Vercel: projeto à parte, mesmo repo. Build Command `npm run build:site`, Output Directory `dist-site` (definidos no painel; o `vercel.json` da raiz só traz o rewrite SPA e serve os três projetos).
- Variáveis: `VITE_API_BASE_URL` (o formulário faz `POST /access-requests`) e `VITE_APP_URL` (links "Entrar").
- Capturas dos menus: `npm run shots` (ver `site/scripts/capture-shots.mjs`) contra uma casa de demonstração.

## Admin (`admin/`)

Terceiro deploy do mesmo repo, em `admin.domios.pt`: pedidos de acesso (aprovar, rejeitar, reenviar convite),
utilizadores (procurar, terminar sessões, desativar, reativar) e auditoria. Entrada própria, sessão própria
(só entram contas com `isPlatformAdmin`).

- `npm run dev:admin` (porta 5175), `npm run build:admin` (saída `dist-admin`), Vercel: projeto à parte, Build Command `npm run build:admin`, Output Directory `dist-admin` (no painel).
- Um administrador faz-se só por SQL: `UPDATE identity.users SET is_platform_admin = true WHERE email = '...'`.
- Variável: `VITE_API_BASE_URL`. A Api tem de permitir a origem do admin em `Cors__AllowedOrigins`.

## Demo (`src/demo/`)

A mesma app, sem Api: um backend falso corre no browser e responde a todas as
rotas com dados de exemplo (casa "Casa Lopes", despensa, listas, plano,
receitas, ementas, promoções, gastos, nutrição). Os nomes do catálogo existem em
português e inglês e seguem a língua da app.

```bash
npm run dev:demo      # http://localhost:5175
npm run build:demo    # gera dist-demo/
```

- Liga-se com `--mode demo` (`.env.demo`: `VITE_DEMO=true`). Os outros builds não
  levam nenhum código da demo.
- A primeira visita já entra com sessão; depois de sair, qualquer email e
  palavra-passe servem.
- O que se muda fica em `localStorage` (`domios.demo.state`) até carregar em
  "Repor demo", na faixa do topo.

### Tour guiado

A primeira visita (e cada "Repor demo") abre um diálogo de boas-vindas que
pergunta o nome (um `<dialog>` modal: o foco fica lá dentro e Esc é o mesmo que
"Saltar"). Daí:

- **"Começar configuração"** troca os dados de exemplo por uma conta vazia
  (sem casa, plano, listas nem despensa; o catálogo fica) e abre `/casa/nova`
  com o nome já preenchido.
- **"Saltar e ver o demo preenchido"** fica com os dados de exemplo.

O tour tem 8 passos, num cartão no canto inferior direito: criar a casa,
juntar membros (opcional), planear (ementa ou receita), pôr o que falta na
lista, comparar lojas, marcar comprados, pôr na despensa e cozinhar. Um
cartão final aponta para "Receitas feitas" e para a marca ✓ na lista de
receitas. Cada passo termina sozinho quando o backend falso responde ao
pedido certo: `install.ts` emite `domios-demo:api` com método, caminho,
corpo e resposta, e `tour.ts` compara com as regras de cada passo. Por isso
a ordem não importa e não há botão "Seguinte". Cada passo dá para saltar, e o
tour para sair ou minimizar.

- Estado em `localStorage` (`domios.demo.tour`): `welcome`, `active` ou `off`,
  os passos feitos, o nome, a lista feita a partir do plano (os passos de
  compras abrem-na) e o primeiro dia planeado (o plano abre nessa semana).
- Depois de terminar ou sair, o botão "Tour guiado" na faixa do topo volta a
  mostrar as boas-vindas.
- Código: `src/demo/tour.ts` (estado e regras), `src/demo/DemoTour.tsx`
  (diálogo e cartão, PT e EN), estilos em `src/demo/demo.css`.
- Deploy: projeto Vercel à parte com o comando `npm run build:demo` e a pasta
  `dist-demo` (o `vercel.json` já reescreve as rotas para o `index.html`).
