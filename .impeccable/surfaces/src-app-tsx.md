---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/index.css"]
---

## Scope

Whole DomiOS web app (shell plus every route in `src/App.tsx`). Mode: Operate. Redesign started 2026-11-09: household first, warm kitchen tone, palette free. First pass: new world, navigation and Hoje (finish review run 2026-11-09: two rounds, disposition fix with open items listed below). Second pass (2026-11-09): shared legacy components restyled into the world, then Semana, Despensa and Compras (index and list) migrated. Third pass (2026-11-09): Receitas (catalog and recipe page) and Cozinhar (cookable and cooked) migrated to recipe rows and the recipe sheet; finish review run, disposition fix, fixes applied. Fourth pass (2026-11-09): Ementas (index and template page) migrated; finish review run, disposition fix, fixes applied. Fifth pass (2026-11-09): everything left migrated. Preços and Promoções became price rows with the verdict scale, the product page an article sheet; the Compras store comparison, Nutrição, Casa, Criar casa, the household history, Conta, Adicionar à despensa and the pages without a session (on today's sheet) followed. Finish review run (captures in .impeccable/review, taken with .impeccable/scripts/shoot-mock.mjs against the mock Api), disposition fix, fixes applied. No app route is left in the old world; site/ and admin/ are separate surfaces.

Open from the Hoje finish review: FORM seed reference could not be corroborated on this machine; saint of the day and moon phase not in the day column; the same pantry item can appear in both Usar primeiro and Sugestões.

## Task and content

Hoje answers "what do we eat tonight": the planned meal with its photo and readiness against the pantry, the next days, what to use first, the open list. Price truth (90-day verdict, cheapest store) stays, as a lens inside lists, pantry and the product page, not the centre. Phone use in the aisle is first-class: bottom navigation under 900px, list first.

## Direction contract

THESIS: The household lives by days. Each day is a tear-off calendar sheet: a huge day number and what is eaten on it. Refuses the dashboard of equal panels and the price-catalog centre.

OWN-WORLD: Portuguese tear-off calendar and Borda d'Água almanac. Almanac yellow owns the shell (side rail on desktop, bottom bar on phone); white newsprint ground; black ink; calendar red for today, Sundays and what is running out; one green for "tens tudo". Archivo at condensed widths for numerals and dish names, normal width for UI. Thick black rules head sections; no card chrome, no shadows.

STORY: The family member opens the app, sees today's sheet, knows tonight's dish and whether the ingredients are home, then cooks or sends what is missing to the list.

FIRST VIEWPORT: Rail left (Hoje, Semana, Despensa, Compras; then Receitas, Preços; then Casa). Main: today's sheet, day number ~200px red condensed on the left column with weekday, month and season line; right of a black rule the slot label, dish name ~56px condensed, photo, readiness line, Cozinhar primary and "Pôr o que falta na lista". Below, the next three days as a strip of sheet edges. Right column: Usar primeiro with urgency dots sized by days left, then the open list with count and cheapest store.

FORM: Folha do Dia (calendário de folhas e almanaque), candidate 5 of 7 on the grounded list. Raises: split-flap (days are rows ranked by time; the number column never moves), star atlas (urgency is dot size on a fixed ramp), Metro (the dish name is the interface, no card frame). seed:2bf3a171adf69c21

SIGNATURE: Today's sheet. Motion: on day change the sheet tears up and the next sheet slides into place, once; reduced motion swaps instantly.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
