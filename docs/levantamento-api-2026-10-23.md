# Levantamento: frontend vs. DomiOS.Api (2026-10-23)

Só leitura. Fontes: este repositório (`master` em `9b34554`) e o repositório
`DomiOS` (`master` em `5c40bb7`): `DomiOS_API_MVP.md`, `DomiOS_API_Fase1.md` a
`DomiOS_API_Fase8.md` com as adendas, `DomiOS_Estado.md` (secções 1, 3, 5 e 6),
e os DTOs e endpoints em `src/`.

## 1. O que o frontend tem hoje

**Stack.** React 19 + React Router 7 (`BrowserRouter`), Vite 8, TypeScript 6
(`erasableSyntaxOnly`), oxlint. CSS à mão (`src/index.css`, tema claro/escuro).
Cliente HTTP: `fetch` direto num wrapper de uma função (`get<T>` em
`src/api/client.ts`), só `GET`, sem cabeçalhos, sem tratamento de Problem
Details. DTOs escritos à mão em `src/api/types.ts`, enums como números (a Api
não usa `JsonStringEnumConverter`, confirmado). **Sem testes** (nem Vitest nem
outro runner). Build: `tsc -b && vite build`. Deploy: Vercel
(`https://domios-frontend.vercel.app`, origem já em `Cors__AllowedOrigins__0` e
`Frontend__BaseUrl` no `docker-compose.prod.yml` da Api); o `Dockerfile` +
`nginx.conf` também existem. `VITE_API_BASE_URL` gravada em build-time;
`.env.example` aponta para a Api de **produção**.

**Rotas e chamadas à Api.**

| Rota | Página | Endpoints |
|---|---|---|
| `/` | `OverviewPage` | `GET /products`, `GET /promotions?activeNow=true`, `GET /recipes` (totais e destaques) |
| `/produtos` | `ProductsPage` | `GET /products?search=&categoryId=&page=&pageSize=`, `GET /categories?hasProducts=true` |
| `/produtos/:id` | `ProductDetailPage` | `GET /products/{id}`, `GET /products/{id}/store-offers`, `GET /events?aggregateType=Product&aggregateId=`, `GET /promotions/{id}` (badge) |
| `/promocoes` | `PromotionsPage` | `GET /promotions?activeNow=true&page=&pageSize=` |
| `/receitas` | `RecipesPage` | `GET /recipes?search=&page=&pageSize=` |
| `/receitas/:id` | `RecipeDetailPage` | `GET /recipes/{id}` |

Sem login, sem nenhuma rota `/households/...`, sem escrita.

## 2. Cobertura por módulo

Legenda: ✅ coberto · 🟡 parcial · ⬜ em falta · — fora do âmbito do frontend.

| Módulo (Api) | Estado | Notas |
|---|---|---|
| **Identity & Auth** (`/auth/*`, Fase 3 + adenda 2026-10-22) | ⬜ | Nada. Faltam `login`, `register`, `refresh`, `logout`, `logout-all`, `password/forgot`, `password/reset`, `email/verify`, `email/verification-requests`. A Api está em produção com `Jwt__ExpiryMinutes=60` à espera deste trabalho; os links dos emails (`/reset-password#token=`, `/verify-email#token=`) apontam para páginas que não existem. |
| **Household** (casa, membros, papéis) | ⬜ | Nada. Ver lacuna A em baixo: depois do login, o frontend não tem como saber a que casa pertence o utilizador. Papéis (adenda 2026-10-22): só `Admin` muda a casa e gere membros, senão 403 `forbidden-household-role`. |
| **Products / Categories** | ✅ | Listagem, pesquisa, filtro por categoria, detalhe. Contrato mudou em 2026-10-21 (b): `GET /products` deixa de devolver `Discontinued` por omissão (`includeDiscontinued=true` para os incluir). Sem impacto: a página não filtra nem mostra estado na lista; o detalhe por id continua a devolver descontinuados (falta mostrar o estado no detalhe, pequeno). |
| **Stores & Pricing: preços por produto** (`GET /products/{id}/store-offers`) | 🟡 | Mostra loja, disponibilidade e último preço. Ignora campos novos: `unitPrice` (€/kg, €/L, 2026-10-13), `cardPrice` (2026-10-13), `priceInsight` (etiqueta contra 90 dias, verificação Omnibus, 2026-10-15) e `priceInsight.promotionFrequency` (2026-10-22). Desde 2026-10-21 a rota deixa de ler lojas/cadeias `Closed` (sem impacto). |
| **Stores & Pricing: lojas, cadeias, histórico** (`/chains`, `/stores`, `/stores/{id}/offers`, `.../price-history`) | ⬜ | Não usa. `GET /stores/{id}/offers` passou a envelope paginado `{ items, total, page, pageSize }` em 2026-10-16: **o frontend não a chama**, nada partido. Histórico de preços de uma oferta (gráfico) seria o uso natural. |
| **Promotions** | 🟡 | Lista de ativas e detalhe para o badge. Ignora `discountPercent` (2026-10-13). |
| **Recipes (canónicas)** | 🟡 | Pesquisa e detalhe. Faltam os filtros `dishType`/`mainProtein` (2026-10-19; as 5987 receitas publicadas estão classificadas) e os campos `sourceUrl`, `dishType`, `mainProtein`. Ingredientes mostram `ingredientName`. |
| **Ingredients** (`/ingredients`) | ⬜ | Não usa; só interessa como apoio a outros ecrãs. |
| **History** (`GET /events`) | ✅ | Timeline de eventos no detalhe do produto. |
| **Timeline da casa** (`GET /households/{id}/timeline`) | ⬜ | Precisa de login + casa. |
| **Pantry** (despensa, FIFO, abrir/consumir/descartar) | ⬜ | Precisa de login + casa. |
| **Shopping** (listas, itens, `from-recipe` com `onlyMissing`, reabrir) | ⬜ | Precisa de login + casa. |
| **"Consigo cozinhar?"** (`.../recipes/{id}/availability`) | ⬜ | Precisa de login + casa. |
| **Meals + Nutrition** (Fase 4) | ⬜ | Precisa de login + casa. |
| **Comparação de lojas** (`.../shopping-lists/{id}/store-comparison`, Fase 5) | ⬜ | Precisa de login + casa + lista. |
| **Planning** (plano semanal, sugestões, lista do plano, Fase 6) | ⬜ | Precisa de login + casa. |
| **Ementas prontas** (`/meal-plan-templates`, Fase 7) | ⬜ | O catálogo canónico (`GET /meal-plan-templates`, 10 publicadas) é anónimo e podia já ser mostrado; aplicar ao plano precisa de casa. |
| **Opportunities** (`.../opportunities`, `/summary`, Fase 8) | ⬜ | Precisa de login + casa. |
| Escrita nos catálogos (`X-Api-Key`) | — | Só o `domios-scraper`. |

## 3. Lacunas e riscos encontrados

**A. A Api não diz a que casa pertence o utilizador.** Não existe `GET /auth/me`
nem `GET /households` (lista das casas do chamador): `HouseholdEndpoints` só tem
`POST /households` e rotas `/{householdId}/...`; o `login` devolve `userId`, não
casas. Depois do login, o frontend só chega a uma casa se a criar nessa altura
(e guardar o id) ou se o utilizador colar o id. Bloqueia todos os ecrãs de casa
(despensa, listas, plano, oportunidades). Pela regra do projeto, precisa de
adenda de contrato aprovada no repositório `DomiOS` antes de código. **Não
bloqueia a fatia de login.**

**B. `.env.example` aponta para a produção.** Quem seguir o README corre o
frontend local contra a Api de produção. Com login, isto passa a criar contas e
sessões em produção. Proposta: `.env.example` para a Api local
(`http://localhost:5028/api/v1`) e a URL de produção só no Vercel.

**C. Links dos emails em SPA.** A Api gera `{Frontend:BaseUrl}/reset-password#token=`
e `/verify-email#token=`. No Vercel, abrir esses caminhos diretamente precisa de
fallback de SPA (`vercel.json` com rewrite para `/index.html`), a confirmar na
configuração do projeto Vercel; o `nginx.conf` já o faz.

**D. Erros.** O cliente atual só lança `"<status> ao pedir <rota>"`. O fluxo de
auth precisa de ler o `type` do Problem Details (`invalid-credentials`,
`weak-password`, `invalid-token`, `duplicate-email`, `too-many-requests` com
`Retry-After`).

**E. Sem testes.** A lógica de sessão (refresh único entre separadores,
repetição depois de 401, limpeza no logout) é a parte onde um erro termina a
sessão do utilizador (reutilização de refresh token = sessão terminada, P4).
Vale um runner de testes só para isso.

## 4. Requisitos da Api para o login (de `DomiOS_API_Fase3.md`, adenda 2026-10-22)

- `login`/`refresh` → `{ userId, token, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, emailVerified }`.
- Refresh token em `localStorage` (P1). Refresh antes de expirar ou ao receber
  401; **um só refresh em voo, partilhado entre separadores** (P4: sem
  tolerância; dois refreshes com o mesmo token terminam a sessão).
- `refresh` com 401 `invalid-refresh-token` → voltar ao login, sem distinguir casos.
- `logout` chama a Api (204 sempre) e descarta o access token.
- `register` não faz login: chamar `login` a seguir. 409 `duplicate-email`,
  400 `weak-password` (8 a 128 caracteres).
- `password/forgot` responde 202 sempre. `password/reset` termina todas as
  sessões e não faz login. `email/verify` é anónima. Tokens lidos do fragmento.
- Aviso de email por verificar (`emailVerified`) com reenvio
  (`email/verification-requests`, Bearer).
- Depois de tudo isto em produção: `Jwt__ExpiryMinutes` de 60 para 15 (Api).
- Em desenvolvimento, a Api escreve os emails no log (`LoggingEmailSender`),
  links incluídos: dá para testar reset e verificação de ponta a ponta sem
  enviar emails. Api local em `http://localhost:5028`, Postgres de
  desenvolvimento em `localhost:5436`; CORS e `Frontend:BaseUrl` de
  desenvolvimento já apontam para `http://localhost:5173`.
