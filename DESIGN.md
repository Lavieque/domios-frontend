---
name: DomiOS
description: A household operating system for food, where every product carries the colour of its aisle.
colors:
  bg: "#f0f3f5"
  surface: "#fafbfc"
  surface-2: "#e3e9eb"
  ink: "#16241f"
  ink-dim: "#5b6e71"
  line: "rgba(22, 36, 31, 0.14)"
  accent: "#2a6a78"
  accent-soft: "#dde8ea"
  accent-2: "#1e3a5c"
  accent-2-soft: "#dfe6ec"
  danger: "#b91c1c"
  danger-soft: "rgba(185, 28, 28, 0.1)"
  aisle-fresh: "#c2412d"
  aisle-fresh-soft: "#f6e4e0"
  aisle-fish: "#2f5f9e"
  aisle-fish-soft: "#e2eaf4"
  aisle-pantry: "#5f7a24"
  aisle-pantry-soft: "#ebf0dc"
  aisle-bakery: "#9a6f0a"
  aisle-bakery-soft: "#f7eed6"
  aisle-dairy: "#2f7fa8"
  aisle-dairy-soft: "#dff0f6"
  aisle-home: "#7d4f8f"
  aisle-home-soft: "#efe5f2"
  bg-dark: "#0f3f34"
  surface-dark: "#17453a"
  surface-2-dark: "#1f4f43"
  ink-dark: "#e7eeec"
  ink-dim-dark: "#9fb3b0"
  line-dark: "rgba(231, 238, 236, 0.16)"
  accent-dark: "#5fa9a0"
  accent-soft-dark: "rgba(95, 169, 160, 0.16)"
  accent-2-dark: "#6e9bc7"
  accent-2-soft-dark: "rgba(110, 155, 199, 0.16)"
  danger-dark: "#f87171"
  danger-soft-dark: "rgba(248, 113, 113, 0.14)"
  aisle-fresh-dark: "#f09a86"
  aisle-fresh-soft-dark: "rgba(240, 154, 134, 0.16)"
  aisle-fish-dark: "#8fb4e6"
  aisle-fish-soft-dark: "rgba(143, 180, 230, 0.16)"
  aisle-pantry-dark: "#b5cf72"
  aisle-pantry-soft-dark: "rgba(181, 207, 114, 0.16)"
  aisle-bakery-dark: "#e8c25c"
  aisle-bakery-soft-dark: "rgba(232, 194, 92, 0.16)"
  aisle-dairy-dark: "#86c8e6"
  aisle-dairy-soft-dark: "rgba(134, 200, 230, 0.16)"
  aisle-home-dark: "#c9a2d8"
  aisle-home-soft-dark: "rgba(201, 162, 216, 0.16)"
typography:
  price-hero:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(48px, 6vw, 68px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "lnum, pnum"
  price:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "lnum, pnum"
  display:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(28px, 4vw, 38px)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(18px, 2.4vw, 21px)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.012em"
  title:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "15.5px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "lnum, pnum"
  label:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  sm: "8px"
  button: "10px"
  md: "12px"
  lg: "16px"
  pill: "999px"
  round: "50%"
spacing:
  gap-sm: "0.6rem"
  gap: "1rem"
  label-pad: "1rem 1.1rem 1rem"
  verdict-pad: "0.55rem 1.1rem"
  row-pad: "0.9rem 1.1rem"
  panel-pad: "1.35rem 1.5rem 1.5rem"
  section: "2.5rem"
  page-x: "clamp(16px, 3vw, 40px)"
  page-max: "1320px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    typography: "{typography.title}"
    rounded: "{rounded.button}"
    padding: "0.5rem 1.15rem"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-2}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0.5rem 1.15rem"
    height: "44px"
  button-danger:
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.8rem"
    height: "36px"
  button-danger-hover:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
  icon-danger:
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.round}"
    size: "40px"
  icon-danger-hover:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
  row-action:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.85rem"
    height: "36px"
  row-action-expanded:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.8rem"
    height: "42px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.95rem"
    height: "36px"
  chip-pressed:
    backgroundColor: "{colors.accent-2}"
    textColor: "{colors.surface}"
  aisle-dot:
    rounded: "{rounded.round}"
    size: "10px"
  shelf-label:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.label-pad}"
  photo-field:
    rounded: "{rounded.lg}"
  verdict-foot:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "{spacing.verdict-pad}"
  verdict-pill:
    rounded: "{rounded.pill}"
    padding: "0.4rem 0.85rem"
  verdict-historic-low:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
  verdict-below-average:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
  verdict-usual:
    backgroundColor: "{colors.accent-2-soft}"
    textColor: "{colors.ink}"
  verdict-above-average:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.ink}"
  verdict-none:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-dim}"
  pill-good:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.pill}"
    padding: "0.15rem 0.6rem"
  pill-navy:
    backgroundColor: "{colors.accent-2-soft}"
    textColor: "{colors.accent-2}"
    rounded: "{rounded.pill}"
    padding: "0.15rem 0.6rem"
  pill-muted:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.pill}"
    padding: "0.15rem 0.6rem"
  pill-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.pill}"
    padding: "0.15rem 0.6rem"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.panel-pad}"
  store-row:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.row-pad}"
  store-bar:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.pill}"
    height: "10px"
  store-bar-best:
    backgroundColor: "{colors.accent}"
  top-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-dim}"
    height: "64px"
    padding: "0 {spacing.page-x}"
---

# Design System: DomiOS

## Overview

**Creative North Star: "The Aisle Sign"**

DomiOS borrows the supermarket's own wayfinding: every product carries the colour of its aisle, and that colour is how you find things in the catalog, the pantry and the shopping list. Six muted aisle hues sit on top of the fixed base palette (cool paper, white surface, teal for "good now", navy for structure) and appear only where a category appears: the chip dot, the tinted photo field with its pictogram, the dot on a pantry row, the dot beside a shopping-list group.

This is an Operate tool for a household that plans at a desk and shops one-handed on a phone. Body text is quiet (400), headings are calm (600), and only prices go heavy (800). Surfaces are white on cool paper with 1px hairlines and soft corners (8, 12, 16px; pills for chips, verdicts and row actions). Status speaks through round dots and tinted pills, never rails or bold bands.

**Key Characteristics:**
- Aisle hue as wayfinding: one hue per top category, from chip dot to photo field to list group.
- Price is the only heavy type: 800 at 34px on cards, up to 68px on the article.
- Verdicts are tinted foot rows or pills led by an 8px round dot.
- Soft corners (8 / 12 / 16px), pill controls, 1px hairlines, no rails.
- Flat at rest; one floating dropdown carries the only shadow.

## Colors

Low-chroma paper and ink with two working accents, plus six aisle hues reserved for categories.

### Primary
- **Shelf Teal** (`accent`): "good now". Historic-low and below-average verdicts, the cheapest store's bar and its "Mais barato" pill, the best-option and today edge, primary button, links, focus ring, checkbox fill, caret, card price. Tint (`accent-soft`) backs good verdicts, good pills, notices and the expanded row action.

### Secondary
- **Label Navy** (`accent-2`): structure. Active nav underline, pressed chip, drawer current page, "OS" in the wordmark, recipe step numbers, selection, primary button hover. Tint (`accent-2-soft`) backs the usual-price verdict, promotion badges and warning pills.

### Tertiary
- **Price Red** (`danger`): above-average verdict dot, urgent promotions, form errors, destructive hover. Always as tint (`danger-soft`) with red or ink text; never a solid fill.

### Neutral
- **Cool Paper** (`bg`): the page.
- **Label White** (`surface`): cards, panels, rows, inputs, top bar.
- **Shelf Grey** (`surface-2`): neutral verdicts, store-bar track, muted pills, row actions, row hover (mixed 40-55%), the neutral photo field.
- **Ink** (`ink`): text, hover border on secondary controls, the price-range current marker ring.
- **Dim Ink** (`ink-dim`): secondary text, meta, inactive nav, non-best store bars (45% mix), the neutral aisle.
- **Hairline** (`line`): every border and divider.

### Aisle Hues
Each top category maps to one aisle by name (`src/catalog/aisles.ts`); the container class sets `--aisle` and `--aisle-soft` for everything inside. Unmatched categories fall back to Dim Ink / Shelf Grey so a colour never points at the wrong aisle.
- **Fresh Red** (`aisle-fresh`): fruit, vegetables, butcher, charcuterie.
- **Fish Blue** (`aisle-fish`): fish, seafood, cod.
- **Pantry Olive** (`aisle-pantry`): grocery, oils, rice, pasta, tins, drinks, coffee.
- **Bakery Ochre** (`aisle-bakery`): bread, pastry, cereals, biscuits, sweets.
- **Dairy Sky** (`aisle-dairy`): milk, yoghurt, cheese, eggs, butter.
- **Home Plum** (`aisle-home`): cleaning, hygiene, baby, pets.

The full hue marks dots and pictograms; the `-soft` tint fills photo fields. Dark mode swaps every base and aisle token for its `-dark` value; aisle tints become 16% alpha.

### Named Rules
**The Fixed Palette Rule.** Base tokens are the user's brand commitment and stay byte-identical. The six aisle pairs (approved 2026-10-30) are the only additions; express new states with existing tokens and tints.

**The Wayfinding Rule.** An aisle hue appears only where a category appears: chip dot, photo field, pictogram, pantry row dot, list group dot. Never on buttons, prices, verdicts or text.

**The Good Now Rule.** Teal means "the good choice right now": historic low, cheapest store, today, the primary action. Structure uses navy or ink.

## Typography

**Display Font:** Schibsted Grotesk Variable (with Segoe UI, Helvetica Neue, Arial)
**Body Font:** Schibsted Grotesk Variable
**Label/Mono Font:** none; one family, from `@fontsource-variable/schibsted-grotesk`.

**Character:** A sturdy grotesk kept calm at 400-600 so the 800 price figures carry the page.

### Hierarchy
- **Price hero** (800, clamp(48px, 6vw, 68px), 1, -0.04em): the article price; euro sign at 0.4em.
- **Price** (800, 34px, 1, -0.035em): card prices; 32px under 720px, 30px in the store comparison grid. Euro sign 0.45em at 700; "desde" 13px 600 dim.
- **Display** (600, clamp(28px, 4vw, 38px), 1.08, -0.025em): page titles, balanced wrap.
- **Headline** (600, clamp(18px, 2.4vw, 21px), 1.2, -0.012em): section heads, 2.5rem above.
- **Title** (600, 15.5px, 1.3): card names, row titles, buttons (15px), h3 (16px). Recipe card titles 650 at 17px.
- **Body** (400, 15.5px, 1.55): running text; ledes 62ch, recipe steps 70ch.
- **Label** (600, 12.5-14px): verdicts (13px foot, 14px pill), pills, tags, meta, table headers.
- **Store price** (700, 19px, -0.01em): the figure in an "Onde comprar" row, card price beneath at 12.5px teal.

### Named Rules
**The Price Weight Rule.** 800 belongs to prices and the wordmark. Titles and headings stop at 600.

**The Proportional Figures Rule.** Figures are `lining-nums proportional-nums` everywhere, tables and dates included; Schibsted's tabular comma splits "1,19". Numeric columns align right.

**The No Eyebrow Rule.** Headings stand alone; no small uppercase kicker above a title.

## Layout

One centered column, max 1320px, padding clamp(16px, 3vw, 40px), 2.25rem top and 5rem bottom. Pages open with title, a dim `page-sub` line (1.75rem below), a search/filter row (gap 0.6rem), then content; sections sit 2.5rem apart with headline left and a link or count right, baseline-aligned.

Product cards fill auto-fill grids at minmax(15.5rem, 1fr), gap 1rem (10.5rem, gap 0.65rem under 720px). Under 480px each product card becomes a horizontal row: a 6rem photo field on the left, body and verdict on the right. The aisle chip row scrolls sideways below 900px and wraps above.

The article is two columns (0.85fr photo / 1.15fr info, gap clamp(1.5rem, 4vw, 3.25rem)), stacking under 760px. Lists (pantry, shopping list, store rows) are one bordered container of rows with hairline dividers. Pantry rows are a 10px dot column + name + expiry + actions grid; actions wrap under the name below 1100px and everything stacks under 720px. The shopping list groups unpurchased items by top category, each group headed by an aisle dot, name and count.

Under 1100px the top bar keeps the wordmark and a "Menu" button that opens a right-side drawer.

### Named Rules
**The In-Aisle Rule.** The shopping list fits a phone: items grouped by aisle, store breakdowns closed, unpriced items behind one disclosure, and each row shows a "Chain · €" good pill for its cheapest store.

## Elevation & Depth

Flat. Cards, panels and rows separate from the page by Cool Paper against Label White and 1px hairlines. The best option and today's day card take a 2px teal edge (1px border plus 1px inset ring), not a shadow. A linked card lifts 2px on hover with a darker hairline.

### Shadow Vocabulary
- **Float** (`box-shadow: var(--shadow)`): the product search results that float over the add-to-pantry form. Nothing else.

### Named Rules
**The Flat Shelf Rule.** Surfaces are flat at rest and on hover; shadow is only for something that floats over other content.

## Shapes

Soft corners on a short scale: 8px (`sm`) for inputs, notices, thumbnails, drawer rows, breakdowns; 10px for buttons and pagination; 12px (`md`) for cards, panels, tables, row lists and store rows; 16px (`lg`) for the article photo field. Chips, pills, verdict pills, row actions, danger buttons and store bars are full pills. Dots are round: 8px verdict and drawer markers, 10px aisle dots, the 18px price-range marker, the 40px icon-danger hit area. Every border is a 1px hairline; the active nav underline is a 2px inset navy shadow. The card photo field runs edge to edge, clipped by the card.

## Components

### Buttons
Soft, compact, 600 weight.
- **Shape:** 10px radius, min height 44px, padding 0.5rem 1.15rem, 15px.
- **Primary:** teal fill and border, Label White text (Cool Paper text in dark).
- **Hover / Focus:** primary turns navy; secondary border turns ink; press nudges 1px; focus is a 2px teal outline offset 2px; disabled 50%.
- **Secondary:** Label White, hairline border, ink text.
- **Link button:** teal 14px 600 text, navy underline on hover; inline edits like "Mudar nome".

### Row Actions and Destructive Controls
- **Row action:** Shelf Grey pill, 36px, 14px 550 ink; hover adds a 25% ink border; expanded (`aria-expanded`) turns teal tint with teal text. Used for the pantry verbs "Abrir" and "Usar".
- **Danger button:** transparent pill with hairline border and dim text at rest; on hover red text, 45% red border and `danger-soft` fill. Separated from row actions by 0.6rem.
- **Icon danger:** 40px round, transparent, dim inline-SVG bin (20px); hover red on `danger-soft`. Used for removing shopping-list items.

### Chips
- **Style:** 36px pills, hairline border on Label White, 14px 550. Aisle chips lead with a 10px aisle dot.
- **State:** pressed fills navy with white text, the dot ringed 2px in Label White; hover darkens the border to ink.

### Pills
12.5px 600 pills (padding 0.15rem 0.6rem), tint with matching text: good (teal), navy (promotions, warnings), muted, danger. Status tags share the shape.

### Cards / Containers
- **Corner Style:** 12px for cards and panels.
- **Background:** Label White on Cool Paper.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px hairline; best option and today get the teal edge.
- **Internal Padding:** cards 1rem 1.1rem (0.7rem 0.8rem on phone); panels 1.35rem 1.5rem 1.5rem.

### Inputs / Fields
- **Style:** 42px, 1px hairline, 8px radius, Label White, 15px, dim placeholder. Selects carry a drawn SVG chevron; search a drawn magnifier inset 0.8rem.
- **Focus:** teal border and a 3px `accent-soft` ring.
- **Error:** `danger-soft` block, 8px radius, red 600 text.

### Navigation
64px top bar on Label White with a hairline bottom; not sticky. Wordmark 800 at 21px, "OS" navy, beside the two-roof mark. Links 500 at 14.5px dim in two groups split by a hairline; active link turns ink at 650 with a 2px navy underline at the bar's foot. Under 1100px a 40px "Menu" button opens a modal `<dialog>` drawer from the right (min(22rem, 88vw), 0.28s) over a 42% black scrim; rows are 52px with a 16.5px 600 name and 13px dim hint; the current page gets a navy tint, navy name and an 8px round navy dot.

### Photo Field (signature)
The product image sits on its aisle's `-soft` tint: 16:10 on cards (edge to edge), square with 16px corners on the article (4:3 under 760px). Photos are contained at ~70-80% and multiplied into the tint (normal blend in dark). A Label White pill tag with the aisle dot and category name sits top-left. Without a photo, the aisle pictogram (single-stroke 24px SVG, 1.6 stroke, in the aisle hue) centres in a shorter field (16:7 card, 4:3 article); unknown categories show a shopping bag on Shelf Grey.

### Verdict (signature)
Maps the Api `PriceLabel`, always led by an 8px round dot. On a card it is a full-width foot row (13px 600, padding 0.55rem 1.1rem, hairline top); loose, it is a pill (14px, padding 0.4rem 0.85rem). Tones: 0 / none Shelf Grey with dim text and dim dot; 1 Historic low teal tint, teal text, teal dot ("Mínimo dos últimos N dias"); 2 Below average teal tint, teal dot; 3 Usual navy tint, navy dot; 4 Above average red tint, red dot; urgent red tint, red dot.

### Onde comprar (signature)
One row per store in a 12px bordered list: chain and store/unit price, a 10px pill bar (Shelf Grey track) whose fill is the price as a share of the highest (min 8%), the price (700, 19px) with card price under it in teal, then a verdict pill and a drawn chevron. The cheapest row's bar is teal with a "Mais barato" pill; others fill in 45% dim ink; out-of-stock rows go dim with a danger pill. Bars grow left to right once on load (0.7s, 70ms stagger by price order, after 150ms). Each row opens (`<details>`) to seen date, card validity, promotion badge, the price range and insight notes. Under 640px the bar drops to its own line.

### Price Range
An 8px pill track graded from teal through navy tint to red tint, a 2px dim tick at the average and an 18px Label White dot ringed 4px in ink at the current price, with a 12.5px legend (mín, média, máx).

### Aisle Dot
10px round dot in `--aisle`. Leads aisle chips, the photo tag, pantry rows (own grid column) and shopping-list group headings.

### Disclosures
Store breakdowns and event history are `<details>` in hairline containers; 600 summaries with Shelf Grey hover and open state; drawn CSS chevrons rotate on open.

### Motion
Ease-out `cubic-bezier(0.16, 1, 0.3, 1)`. Pages fade up 6px (0.4s); cards rise 8px (0.45s, 30ms stagger, capped at 12); store bars grow once. All motion collapses under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** make the price the heaviest thing on any card or article (800; 34px card, up to 68px article) with the euro sign at 0.4-0.45em.
- **Do** carry the aisle hue wherever a category appears: chip dot, photo field, pictogram, pantry row dot, list group dot.
- **Do** fall back to Dim Ink / Shelf Grey when a category matches no aisle.
- **Do** lead every verdict with an 8px round dot, as a foot row on cards and a pill elsewhere.
- **Do** keep teal for "good now" and navy for structure.
- **Do** keep destructive controls neutral at rest and red only on hover.
- **Do** use `lining-nums proportional-nums` for every figure and right-align numeric columns.
- **Do** keep controls at least 36px (primary buttons 44px, inputs 42px) and shopping-list rows at least 56px.
- **Do** draw icons as inline SVG or CSS shapes.

### Don't:
- **Don't** change or tune the base colour tokens, or add hues beyond the six aisle pairs.
- **Don't** use aisle hues on buttons, prices, verdicts or text.
- **Don't** use 800 weight for headings or titles.
- **Don't** bring back top rails, square markers or solid verdict bands.
- **Don't** put eyebrows or kickers above headings.
- **Don't** use a coloured border-left as an accent.
- **Don't** use emoji or text glyphs as icons, or gradient text.
- **Don't** add shadows to cards, panels or rows.
- **Don't** use tabular figures.
- **Don't** add a second typeface.
