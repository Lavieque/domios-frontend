---
name: DomiOS
description: A household runs by days. Each day is a tear-off calendar sheet with a big number and what gets eaten.
colors:
  paper: "#ffffff"
  paper-shade: "#f1f1ef"
  ink: "#141414"
  ink-dim: "#5a5a57"
  line: "rgb(20 20 20 / 0.15)"
  rule: "#141414"
  calendar-red: "#d4261c"
  calendar-red-soft: "#fbe6e4"
  danger: "#c8231a"
  danger-soft: "rgb(200 35 26 / 0.1)"
  have-it-green: "#23683a"
  have-it-green-soft: "#e2efe5"
  almanac-yellow: "#f2c230"
  almanac-ink: "#141414"
typography:
  display:
    fontFamily: "Archivo Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(120px, 15vw, 208px)"
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 62"
  headline:
    fontFamily: "Archivo Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(40px, 5.4vw, 72px)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 70"
  page-title:
    fontFamily: "Archivo Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(34px, 4.6vw, 52px)"
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 72"
  title:
    fontFamily: "Archivo Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 850
    lineHeight: 1.15
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 80"
  body:
    fontFamily: "Archivo Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Archivo Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 850
    lineHeight: 1.2
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 75"
rounded:
  tag: "3px"
  photo: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  sheet: "14px"
spacing:
  gutter: "clamp(16px, 3.2vw, 48px)"
  column-gap: "clamp(1.75rem, 3vw, 3rem)"
  block-gap: "2.25rem"
  row: "0.5rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1.15rem"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.calendar-red}"
    textColor: "{colors.paper}"
  button-primary-lg:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "0.6rem 1.4rem"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1.15rem"
    height: "44px"
  link-button:
    textColor: "{colors.ink}"
    padding: "0.25rem 0"
  button-secondary-lg:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0.6rem 1.4rem"
    height: "52px"
  rail:
    backgroundColor: "{colors.almanac-yellow}"
    textColor: "{colors.almanac-ink}"
    width: "15.5rem"
    padding: "1.5rem 1rem 1.25rem"
  rail-link:
    backgroundColor: "{colors.almanac-yellow}"
    textColor: "{colors.almanac-ink}"
    rounded: "{rounded.sm}"
    padding: "0.6rem 0.7rem"
    height: "42px"
  rail-link-active:
    backgroundColor: "{colors.almanac-ink}"
    textColor: "{colors.almanac-yellow}"
    rounded: "{rounded.sm}"
  tab:
    backgroundColor: "{colors.almanac-yellow}"
    textColor: "{colors.almanac-ink}"
    rounded: "{rounded.md}"
    height: "54px"
  tab-active:
    backgroundColor: "{colors.almanac-ink}"
    textColor: "{colors.almanac-yellow}"
    rounded: "{rounded.md}"
  more-sheet:
    backgroundColor: "{colors.almanac-yellow}"
    textColor: "{colors.almanac-ink}"
    rounded: "{rounded.sheet}"
    padding: "0.75rem 1rem 1.25rem"
  price-tag:
    backgroundColor: "{colors.almanac-yellow}"
    textColor: "{colors.almanac-ink}"
    rounded: "{rounded.tag}"
    padding: "0.05rem 0.4rem"
---

# Design System: DomiOS

## Overview

**Creative North Star: "A Folha do Dia"**

DomiOS is printed like a Portuguese tear-off wall calendar crossed with the Borda d'Água almanac. White newsprint ground, black ink, almanac yellow framing the app, calendar red for the day itself. A household lives by days, so the app is built around the day as a sheet: a huge condensed red number in a fixed column, a thick black rule across the top, and what gets eaten that day set large and unframed beside it. Below today's sheet you can see the edges of the next ones.

It is dense the way a printed almanac is dense: hierarchy comes from type width and weight and from black rules, never from boxes. There are no card frames, no panel shadows and no dashboard of equal tiles. Sections start under a 6px black rule and their rows are split by hairlines. Colour has a job or it isn't there: red means today, Sunday or "running out", the single green means "tens tudo", and yellow means the shell.

**Scope of this world (honest state, 2026-11-09, fourth pass).** The first pass rebuilt the world tokens, the app shell (desktop rail, phone tab bar, "Mais" sheet, guest header) and the Hoje page. The second pass rebuilt the other three everyday destinations, Semana, Despensa and Compras (the list and the lists index), and restyled the shared components every route uses: panels lost their frames and gained the 6px rule, pills and tags went to 3px, tables and the pantry list are headed by a 2px rule, notices became a paper-shade wash, and the page fade-in is gone. The third pass rebuilt Receitas (catalog and recipe page) and Cozinhar (what can be cooked, and recipes already cooked): recipe cards became recipe rows and the recipe page became a recipe sheet. A fourth pass rebuilt Ementas (the template index and a template's page) on the same rows and on Semana's day rows. Nutrição, Preços/Produtos, Promoções, Casa, Conta and the auth pages have only been touched by the shared restyle. Their own layouts (cards, verdict chips, shelf labels, aisle hues from `src/shared/tokens.css`) are **legacy, pending migration**, not examples of this world. The store comparison in Compras still uses the legacy shelf labels and verdict bands, and the shopping list's item-group headings still carry aisle-hue dots. The public site (`site/`) and the admin (`admin/`) still use the old shared tokens and Schibsted Grotesk and are not in this world yet.

**Key Characteristics:**
- Today's sheet is the signature: a red condensed day number in a fixed left column, a 6px black rule on top, and the dish name as the interface.
- Archivo Variable runs on its width axis: condensed and heavy for numerals, dish names and headings, normal width for UI text.
- Thick black rules head sections. Hairlines separate rows. No card chrome, no shadows.
- Urgency is shown by dot diameter on a fixed four-step scale, not by more colours.
- Almanac yellow owns the frame (rail, tab bar, Mais sheet) and the price tag. Content sits on white paper.
- One motion moment: the previous day's sheet tears upward once when the day changes.

## Colors

Newsprint white and black ink, with three calendar colours that each have exactly one job.

### Primary
- **Calendar Red** (`calendar-red`): today's day number, Sunday numbers in the next-days strip and in Semana (where today's number and its "· hoje" mark are red too), the "Falta N" readiness line, the readiness dot when something is missing, the "faltam …" quantities in Semana's "O que falta", and the two highest urgency dots with their "when" text in Usar primeiro and Despensa. It is also the hover fill of the primary button. In dark mode it lifts to `#ff6a5c`.
- **Calendar Red Soft** (`calendar-red-soft`): a tint for today-related washes. The migrated danger pill and warning notice currently borrow it as their ground. Use it sparingly.

### Secondary
- **Almanac Yellow** (`almanac-yellow`) with **Almanac Ink** (`almanac-ink`): the shell. This covers the desktop rail, the phone tab bar, the "Mais" bottom sheet, the guest header, text selection and the price tag. Active navigation inverts it to ink ground with yellow text. Yellow stays yellow in dark mode because the frame doesn't change.

### Tertiary
- **Tens-Tudo Green** (`have-it-green`): the one green, and it only means "you have everything". Use it for the ready readiness dot and its text, "Tens tudo" in the next-days strip and in Semana's "O que falta", the ready suggestion meta, the cookable-picks meta and the day note. It also carries the caret colour. Link buttons are no longer green. In dark mode it is `#7cc78e`.

### Neutral
- **Paper** (`paper`): page and surface ground. The app has no off-white surface layer.
- **Paper Shade** (`paper-shade`): photo and thumbnail placeholders, the hover wash on next-day cells and table rows, and the ground of notices.
- **Ink** (`ink`): text, the primary button, the 2px secondary-button border, underlined link buttons, checkboxes, the focus ring, and the active state inverted on yellow.
- **Ink Dim** (`ink-dim`): secondary lines such as the season, meta, empty sheets and the smallest urgency dot.
- **Rule** (`rule`): the 6px section heads, the 2px tops of the next-days strip, tables and the pantry list, and the 1px divider between the day column and the dish body.
- **Line** (`line`): hairlines between rows and cells.
- **Danger** (`danger`, `danger-soft`): destructive actions and errors only. It is never used for urgency, which belongs to calendar red.

The dark set inverts paper and ink (`#141414` ground, `#1b1b1a` / `#252523` surfaces, `#f2f1ed` ink and rule, `#a8a7a2` dim ink) and lifts red and green. The yellow shell is unchanged.

### Named Rules
**The Calendar Red Rule.** Red marks today, Sundays and what is running out. Use it for nothing else, and never as decoration or section colour.

**The One Green Rule.** There is exactly one green and it means "tens tudo". Prices, savings and "cheapest store" are not green. They go on the yellow price tag, including the cheapest price on each shopping-list line.

**The Yellow Frame Rule.** Almanac yellow belongs to the shell and the price tag. Don't use it as a content background or a status colour.

## Typography

**Display Font:** Archivo Variable with the width axis (`@fontsource-variable/archivo/wdth.css`), falling back to Segoe UI, Helvetica Neue, Arial.
**Body Font:** the same Archivo Variable at normal width.

**Character:** a single grotesque family that behaves like almanac typesetting. Squeezed to 62–80% width at 850–900 weight it gives you the numbers and headings. At 100% width it reads quietly as UI. Width does the work a second typeface would otherwise do.

### Hierarchy
- **Display** (900, 62% width, clamp(120px, 15vw, 208px), line-height 0.8): today's day number only. On phones it lies down to 104px beside the weekday and month. The same 62% condensed numeral style appears smaller elsewhere: the remaining count at the head of a shopping list (clamp(72px, 9vw, 112px), ink), Semana's day numbers (56px, 44px on phones), the list tally and lists-index counts (48px) and the next-days numbers (44px).
- **Headline** (900, 70% width, clamp(40px, 5.4vw, 72px), line-height 0.95, max 18ch): the dish name, which is the interface. It has no frame, and its link underlines at 3px on hover.
- **Dish in a row** (900, 72% width, 22px rising to 28px with the viewport, line-height 1.05–1.1): the dish name in a Semana meal row and the list name in the lists index. Suggestions in a side block use the same style smaller (20px, 75% width).
- **Page title** (900, 72% width, clamp(34px, 4.6vw, 52px), line-height 0.98): `h1` on other pages.
- **Title** (850, 80% width, 22px, uppercase in side blocks): section heads under the black rule, such as Usar primeiro and Compras.
- **Body** (400, 16px, line-height 1.55): running text. Readiness and lede lines are 17px, with ledes capped at 52–60ch.
- **Label** (850, 75% width, uppercase, 0.04em): the weekday and month in the day column. The weekday never wraps and scales clamp(14px, 1.4vw, 17px); the month follows at clamp(14px, 1.4vw, 20px) so it is never larger than the weekday. On phones they are 17px and 20px. Inline slot labels before a dish name ("ALMOÇO"), Semana weekdays, item-group heads and table heads share one small label style: 13px, 800 weight, uppercase, 0.06em, ink-dim.

Numerals use `lining-nums proportional-nums`. Large condensed headings (`h1`, the dish name on today's sheet, cookable picks, list names) open their word spacing to 0.08em, because at that size and 62–75% width the spaces otherwise close up. Dishes set in rows (Semana, suggestions) keep normal spacing so they fit their column.

### Named Rules
**The Width Axis Rule.** Hierarchy comes from width and weight on one family. Numerals and dish names are condensed (62–72%). Navigation and body copy stay at normal width, apart from the main rail destinations at 88%.

**The No Kicker Rule.** Don't put an eyebrow or kicker above a heading. Labels sit inline, like the meal slot before the dish, or beside the content, like the weekday in the day column.

## Layout

On desktop the shell is a two-column grid: a 15.5rem sticky yellow rail on the left and the page on the right (max 1500px, side gutter clamp(16px, 3.2vw, 48px)). Below 900px the rail disappears and a fixed five-slot yellow tab bar sits at the bottom (Hoje, Semana, Despensa, Compras, Mais), with a small brand line on top of the page and bottom padding that clears the bar and the safe area.

Hoje is a two-column grid: the main sheet, then a 17–22rem side column, separated by a clamp(1.75rem, 3vw, 3rem) gap. Below 1100px the side column moves underneath as two columns. Below 640px it becomes a single column. Today's sheet has a fixed day column (clamp(9rem, 15vw, 13rem)) and the dish body to its right of a 1px black divider. The number column never moves. Under 640px it rotates into a row: the number on the left, with weekday, month and season stacked beside it.

The next-days strip is three equal cells. When the main column is narrower than 680px, a container query turns it into rows that keep a fixed number column. Side blocks stack with a 2.25rem gap, and their rows are at least 56–64px tall.

The desktop rail's yellow runs the full height of the page, painted by a gradient on the shell grid (yellow for the first 15.5rem, paper after), so long pages never show white under the rail.

Pages other than Hoje open with a page head: the title and a dim sub-line on the left, the page's primary action on the right; under 720px the action wraps below and goes full width. Semana's head puts the week stepper (2px ink-bordered buttons) and the 80%-width date range on the right instead.

Semana and Compras share Hoje's two-column grammar: a main column and a minmax(17rem, 24rem) side column with the same gap, stacking below 1100px. Semana lists the seven days as rows, each with a fixed number column (clamp(5.5rem, 9vw, 7.5rem), 4.25rem on phones) and the meals to its right as slot label, dish and actions; past days dim their number and dishes. Its side column holds "O que falta" and suggestions. Compras puts the list first in the main column and the store comparison in a sticky side column, which drops under the list below 1100px. At 640px and under, a list row keeps the checkbox and name on the first line and drops the link action and price under the name. Despensa rows lead with the urgency dot in a fixed 22px slot, then name, expiry and row actions, collapsing to dot plus stacked text under 720px.

**The Fixed Column Rule.** Days are rows ordered by time. A day's number always sits in its own column at a fixed width, like a split-flap board.

## Elevation & Depth

The world is flat. Depth comes from rules and stacking, not shadows. A section is headed by a 6px black rule; tables and the pantry list are headed by a 2px rule. The next-days strip sits under a 2px rule with two thin 1px rules above it at 55% opacity, which read as the edges of the sheets underneath today's. The only overlay is the "Mais" sheet, set over a 45% black backdrop. The one tonal surface is the notice, a paper-shade wash with no border.

The `--shadow` token still exists in the stylesheet for legacy components. No surface in this world uses it.

**The Sheet Edge Rule.** To show that something is stacked or comes next, draw sheet edges (thin parallel rules). Don't use drop shadows.

## Shapes

Corners are small and practical. Pills, tags and the price tag are 3px. The dish photo and pantry thumbnails are 4px. Rail links, chips and notices are 6px, tabs 8px. Buttons, row actions and danger buttons are 10px; nothing in the app is pill-shaped any more. The only large radius is the Mais sheet, with 14px top corners. Sections, sheets and side blocks have square edges and no border: a rule on top, hairlines inside. Dots are true circles. Icons are inline SVG strokes, 2px, with round caps.

## Components

### Buttons
Ink slabs that flush calendar red when you press toward an action.
- **Shape:** gently rounded (10px). Minimum height 44px, or 52px for the large size used on Hoje.
- **Primary:** ink ground, paper text, weight 600 (750 in the large size). Hover fills calendar red with white text. Active nudges down 1px.
- **Secondary:** paper ground with a 2px ink border, ink text, on every page. Hover keeps the ink border.
- **Link button:** ink text, 14px/650, underlined at 1px with a 0.2em offset; hover thickens the underline to 2px. Inside Semana's meal rows it starts ink-dim and turns ink on hover.
- **Row action / danger:** small 10px-radius buttons with a hairline border on a transparent ground; an open row action inverts to ink. They never wrap.
- **Phone:** the day actions and the page-head action stack full width.
- **Focus:** 2px ink outline, 2px offset. Fields take an ink border plus a 1px ink ring.

### Sections, Tables and Notices
A section, including every legacy panel, has no frame: a 6px black rule on top, a 22px uppercase title under it, rows split by hairlines, and 2.25rem below. Tables and the pantry list sit under a 2px rule; their heads use the small label style and rows wash paper-shade on hover. Empty states are left-aligned body text under a hairline. Notices are a paper-shade wash with 6px corners (the warning variant uses the calendar-red tint). Checkboxes are 26px in ink.

### Navigation
- **Rail (desktop):** yellow column with the wordmark at 900 weight, 78% width, 27px. It has three groups split by 1px rules at 28% ink. The four everyday destinations are bigger (18px, 800, 88% width, 46px tall), the rest are 15.5px/650, and Casa and Conta sit at the foot. Hover is a 9% ink wash. Active inverts to ink ground with yellow text.
- **Tab bar (phone):** fixed yellow bar with a 2px ink top border. Each of the five slots has a 24px stroke icon over a 12.5px/750 label and is at least 54px tall. Active inverts the same way as the rail.
- **Mais sheet (phone):** a native dialog that rises from the bottom (`sheet-up`, 0.32s). It is yellow with a 2px ink top border and 14px top corners, a 900/78%/24px title, and a 2px-bordered close button. Each link is 52px tall and carries a dimmed one-line hint.
- **Guest header:** a 68px yellow bar holding the brand and bold ink links, which underline at 2px when active or hovered.

### Today's Sheet (signature)
The day sheet is opened by a 6px black rule. The left column holds the uppercase weekday, the red condensed day number, the uppercase month and, under a hairline, an almanac block: the season name in ink, then dim lines for the month's produce ("Da época: …") and the computed Lisbon sunrise and sunset ("Sol 07:12–17:24", never wrapped). To the right of the 1px black divider come the dish name as headline, then a meta line ("Jantar para 4 pessoas"), a 16:9 photo (max 22rem tall), the readiness line and the actions. The readiness line has a 12px dot: red when something is missing, green when you have everything. When the recipe's own readiness is unavailable it falls back to the plan's availability for the day; an unknown state reads ink-dim. Other meals of the day sit under a hairline as inline slot-label + dish pairs. When nothing is planned, "Jantar por decidir" stays in normal ink, as an invitation rather than a disabled control.

### Next Days Strip
This strip shows the edges of the sheets below today's. Each cell has a 44px condensed number (red if Sunday), the weekday, the dish, and a readiness line in red ("Falta N") or green ("Tens tudo"). An unplanned day is dimmed. Hover is a paper-shade wash.

### Urgency Dots (Usar primeiro, Despensa)
Rows lay out as dot, name with meta, and when. Each dot sits in a fixed 22px slot, and its diameter carries the urgency on a fixed scale: 6px ink-dim (no expiry, or more than a week away), 10px ink (4–7 days), then 15px (1–3 days) and 20px (today or expired) in calendar red. At the two red steps the "when" text turns red too. Hoje and Despensa compute the level from one shared function, so a product never shows two urgencies. In Despensa the dot replaces the old aisle-hue dot, and a used-up row hides it.

### List Tally and Price Tag
Each open list is one row with a 48px condensed count, the list name, and the cheapest store with its total on the yellow price tag. The tag is 3px radius, 800 weight, almanac ink on yellow. The lists index uses the same row: condensed count, then the list name as a dish in a row with a dim meta line, at least 76px tall, underlining at 2px on hover. A single list opens with a big condensed remaining-count in ink beside its title, and each line's cheapest price sits on the price tag.

### Motion
When the day changes, the previous day's sheet tears upward once (`sheet-tear`, 0.9s, cubic-bezier(0.55, 0, 0.75, 0.2), 0.35s delay). It is held by its top rule, rotates to -7°, and its bottom edge ragged-clips. The clip is the same nine-point polygon in every keyframe, so the rag interpolates instead of jumping: the edge tears early and the sheet fades only after it has left. With reduced motion it doesn't appear. This has not been visually verified yet. Nothing else animates on arrival; the `.page` fade-in is switched off app-wide. State changes use 0.15s colour transitions.

### Recipe Rows (Receitas, Cozinhar)
A recipe in a list is a row, never a card: the dish name in the "dish in a row" style (900, 72% width, 22–26px), dim meta lines under it, and the photo at the right as a 7.5rem 4:3 thumbnail with 4px corners (5.5rem on phones). The photo only appears when the recipe has one and it loads, so names always align in one column; most of the catalog has no photo. Rows sit under a 2px rule (a hairline when they are inside a section that already has the 6px rule), are at least 76px tall, are split by hairlines, and flow into two newspaper columns when each can be at least 30rem wide. In Cozinhar each row carries the readiness line from Hoje at a smaller size (10px dot, 15px text): green "Tens tudo", red "Falta N" followed by what is missing, ink-dim "Deve dar" when the Api cannot be sure. Ingredients that are expiring read "Usar primeiro: …" with the days-left label from the shared urgency function, led by the urgency dot of the most urgent one on the fixed 6 / 10 / 15 / 20px scale; the text turns calendar red only at the two red steps. Both dots sit in a fixed 20px slot so the text always starts in the same place. The thumbnail keeps its place but stays invisible until the image loads, so a slow or broken photo never shows an empty grey box. A recipe that can no longer be opened keeps its name in ink-dim, unlinked, with "Já não está disponível" in its meta. In Receitas feitas the row has a fixed lead column holding the times cooked as a 48px condensed numeral over a small "vezes" label, like a day number. Row actions are link buttons under the text.

### Recipe Sheet (recipe page)
The recipe page is built like today's sheet. A 6px rule opens it; the left column (same width as the day column) stacks the facts as small labels over 30–40px condensed numerals (Tempo, Preparação, Cozedura, Porções, Dificuldade), split by hairlines. To the right of a 1px black divider come the dish name as headline, the dish type and protein as meta, the description as a dim lede, the 16:9 photo when there is one, and the large actions (Adicionar ao plano primary, Pôr na lista de compras and Guardar receita secondary). An open form or a saved recipe keeps the ink border and takes the paper-shade ground, so it never reads as a second primary; "Guardada" carries a drawn check icon. Tags and the original source sit under a hairline. Below, Ingredientes (sticky on desktop) and Preparação are sections under the 6px rule; ingredients are 26px ink checkboxes in rows at least 48px tall, and each step's number is a 36px condensed numeral in a fixed 3rem column. Under 640px the facts lie down into a wrapped row above the dish and the actions go full width.

### Ementas (meal plan templates)
The index has two sections under the 6px rule, "As minhas ementas" (only when the household has some) and "Todas as ementas" with its count on the right of the heading and the search inside the section. Each template is a recipe row whose lead column holds the length in days as a 48px condensed numeral over a small "dias" label; under the name come meals and servings, a two-line description and the tags, with "Dá para editar" on the household's drafts. A template's page has the page head (name, then days, meals and servings per meal as the sub-line) and a dim lede, then Semana's two-column grammar: the days as Semana day rows with a small "DIA" label over the condensed day number in the fixed column and the meals as slot label plus dish, and a sticky side column with "Aplicar ao plano" (the form stacked field by field), then "Personalizar" (copy to the household) or "Editar". A day being edited takes the paper-shade ground across its row; its meals become hairline rows of meal select, dish and link actions, and the recipe picker opens under a 2px rule. Below 1100px the side column drops under the days, and the page head gains a large "Aplicar ao plano" primary that jumps to the form (full width under 720px); from 1101px it is hidden, since the sticky side column is in view, and that column scrolls inside itself when taller than the screen. A recipe that is no longer published stays in its day as an unlinked ink-dim dish with "Já não está disponível" in its meta, and the editor says the same on its row. Opening, saving or cancelling the editor, removing a meal and closing the picker always leave focus on the next sensible control.

### Legacy, pending migration
Product cards, verdict chips and bands, shelf labels with aisle-hue fields, and aisle-hue dots still live on Nutrição, Preços/Produtos, Promoções, Casa, Conta and the auth pages, in the store comparison in Compras, and in the shopping list's item-group headings. The shared restyle squared their pills and removed panel frames, but their layouts are not part of this world. Don't copy them onto new surfaces.

## Do's and Don'ts

### Do:
- **Do** head every section with a 6px black rule and split its rows with hairlines.
- **Do** set day numbers and counts in Archivo at 900 weight and 62% width, and dish names at 70%.
- **Do** keep a day's number in a fixed column wherever days are listed.
- **Do** show urgency by dot diameter on the fixed 6 / 10 / 15 / 20px scale.
- **Do** put prices on the yellow price tag.
- **Do** keep almanac yellow on the shell: rail, tab bar, Mais sheet, guest header.
- **Do** open a page with the title on the left and its primary action on the right.

### Don't:
- **Don't** wrap content in cards, panels with chrome, or drop shadows.
- **Don't** use calendar red for anything except today, Sundays and "running out".
- **Don't** use green for anything except "tens tudo", including prices and savings.
- **Don't** put an eyebrow or kicker above a heading.
- **Don't** animate ordinary page mounts. The tear is the only entrance, and it happens once per day.
- **Don't** treat the legacy route components or the aisle hues in `src/shared/tokens.css` as part of this world.
