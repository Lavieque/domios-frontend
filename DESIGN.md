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
  price-label:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(52px, 7vw, 72px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "lnum, pnum"
  verdict-site:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.3
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
  page-max: "1760px"
  site-x: "clamp(16px, 4vw, 48px)"
  site-max: "72rem"
  admin-max: "76rem"
  demo-pad: "1.35rem 1.5rem 1.4rem"
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
  site-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-dim}"
    height: "64px"
    padding: "0 {spacing.site-x}"
  button-lg:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "0.6rem 1.6rem"
    height: "52px"
  demo-label:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.demo-pad}"
  demo-price:
    textColor: "{colors.ink}"
    typography: "{typography.price-label}"
  demo-verdict:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.verdict-site}"
    padding: "0.65rem 1.5rem"
  demo-verdict-historic-low:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
  demo-verdict-below-average:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
  demo-verdict-usual:
    backgroundColor: "{colors.accent-2-soft}"
    textColor: "{colors.ink}"
  demo-verdict-above-average:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.ink}"
  lang-switch-current:
    backgroundColor: "{colors.accent-2}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    height: "28px"
  row-link:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "0.8rem 1.1rem"
    height: "60px"
  cta-band:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  step-number:
    backgroundColor: "{colors.accent-2-soft}"
    textColor: "{colors.accent-2}"
    rounded: "{rounded.round}"
    size: "32px"
  admin-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-dim}"
    height: "64px"
    padding: "0 {spacing.page-x}"
  admin-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "{spacing.row-pad}"
  admin-row-armed:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
  button-danger-armed:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.pill}"
    height: "36px"
  admin-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0.25rem 1.25rem 1.25rem"
  edit-field-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.8rem"
    height: "42px"
  fact-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-dim}"
    padding: "0.7rem 1.1rem"
    height: "56px"
  brand-tag:
    backgroundColor: "{colors.accent-2-soft}"
    textColor: "{colors.accent-2}"
    rounded: "{rounded.pill}"
    padding: "0.1rem 0.55rem"
---

# Design System: DomiOS

## Overview

**Creative North Star: "The Aisle Sign"**

DomiOS borrows the supermarket's own wayfinding: every product carries the colour of its aisle, and that colour is how you find things in the catalog, the pantry and the shopping list. Six muted aisle hues sit on top of the fixed base palette (cool paper, white surface, teal for "good now", navy for structure) and appear only where a category appears: the chip dot, the tinted photo field with its pictogram, the dot on a pantry row, the dot beside a shopping-list group.

This is an Operate tool for a household that plans at a desk and shops one-handed on a phone. Body text is quiet (400), headings are calm (600), and only prices go heavy (800). Surfaces are white on cool paper with 1px hairlines and soft corners (8, 12, 16px; pills for chips, verdicts and row actions). Status speaks through round dots and tinted pills, never rails or bold bands.

The same system has two more surfaces, both on the shared tokens (`src/shared/tokens.css`) and the same family, weights and corners. The public site (`site/site.css`) is a Persuade surface in pt-PT and en: a 72rem column whose home opens on one interactive shelf label that judges its own price (the "shelf-label demonstrator"), then reads as bordered lists of rows. The admin (`admin/admin.css`) is an Operate surface for platform staff: flat hairline rows, neutral controls, consequential and destructive actions confirmed in two steps. Neither uses aisle hues; neither casts a shadow.

**Key Characteristics:**
- Aisle hue as wayfinding: one hue per top category, from chip dot to photo field to list group.
- Price is the only heavy type: 800 at 34px on cards, up to 68px on the article.
- Verdicts are tinted foot rows or pills led by an 8px round dot.
- Soft corners (8 / 12 / 16px), pill controls, 1px hairlines, no rails.
- Flat at rest; one floating dropdown in the app carries the only shadow.
- Site: one shelf label at price-hero size with a verdict foot and four verdict chips, labelled as example.
- Admin: hairline rows, state pills on the right, actions that arm before they run.

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

The public site and the admin use no aisle hue. The full hue marks dots and pictograms; the `-soft` tint fills photo fields. Dark mode swaps every base and aisle token for its `-dark` value; aisle tints become 16% alpha.

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
- **Price label, site** (800, clamp(52px, 7vw, 72px), 1, -0.04em): the demo label's price; euro sign at 0.4em and 700. The only 800 on the site besides the wordmark (21px).
- **Site headings** (600): h1 clamp(30px, 4.6vw, 52px) at 1.06 and -0.03em; h2 clamp(20px, 2.6vw, 26px) at 1.18; h3 16px. Ledes are dim, clamp(16.5px, 1.6vw, 19px), 58ch. The demo name is 600 at clamp(20px, 2.4vw, 24px).
- **Verdict, site** (600, 14px, 1.3): the verdict foot of the demo label; chips 14px 550.
- **Admin headings** (600): h1 clamp(26px, 3.4vw, 34px) at 1.1 and -0.025em with a 15px dim `page-sub`; h2 matches Headline, 2rem above. Row titles 15.5px, notes 14.5px, meta and times 13px dim.

### Named Rules
**The Price Weight Rule.** 800 belongs to prices and the wordmark. Titles and headings stop at 600.

**The Proportional Figures Rule.** Figures are `lining-nums proportional-nums` everywhere, tables and dates included; Schibsted's tabular comma splits "1,19". Numeric columns align right.

**The No Eyebrow Rule.** Headings stand alone; no small uppercase kicker above a title.

## Layout

One column, max 1760px (aligned with the full-width top bar), padding clamp(16px, 3vw, 40px), 2.25rem top and 5rem bottom. Pages open with title, a dim `page-sub` line (1.75rem below), a search/filter row (gap 0.6rem), then content; sections sit 2.5rem apart with headline left and a link or count right, baseline-aligned.

Product cards fill auto-fill grids at minmax(15.5rem, 1fr), gap 1rem (10.5rem, gap 0.65rem under 720px). Under 480px each product card becomes a horizontal row: a 6rem photo field on the left, body and verdict on the right. The aisle chip row scrolls sideways below 900px and wraps above.

The plan week shows all seven days in one row from 1500px. Adding to the pantry is two columns from 1100px: search, results, location chips and hint in a sticky left column (20-26rem), the "Por guardar" rows and the save bar on the right. Promotion cards reuse the product card: the photo field (neutral, offers carry no category) with the discount as a navy-tint tag.

The article is two columns (0.85fr photo / 1.15fr info, gap clamp(1.5rem, 4vw, 3.25rem)), stacking under 760px. Lists (pantry, shopping list, store rows) are one bordered container of rows with hairline dividers. Pantry rows are a 10px dot column + name + expiry + actions grid; actions wrap under the name below 1100px and everything stacks under 720px. The shopping list groups unpurchased items by top category, each group headed by an aisle dot, name and count.

Under 1100px the top bar keeps the wordmark and a "Menu" button that opens a right-side drawer.

### Public site and admin
**Site.** One column, max 72rem, padding clamp(16px, 4vw, 48px), 5rem bottom, under a sticky 64px header (wordmark, menu links, language switch, "Pedir acesso"; the links wrap to their own line under 700px). The home hero is two columns (1.05fr copy, 0.95fr demo label capped at 30rem, gap clamp(1.5rem, 5vw, 4.5rem)) and stacks under 880px. Bands follow at clamp(3rem, 7vw, 5.5rem) apart: a three-cell bordered strip (judge list, flow; stacked under 820px), two bordered row lists of menus (stacked under 820px), a guide teaser and the tinted request band. A feature page is text beside a capture (1fr / 1.1fr, stacking under 900px) and drops to a single 46rem column when no capture exists. The guide is a sticky 15rem table of contents beside numbered steps; the request page is form (1.2fr) beside the "what happens next" list (0.8fr). The footer is three columns (1.4fr, 0.6fr, 0.6fr) over a one-line honesty note.

**Admin.** One column, max 76rem, padding 2.25rem clamp(16px, 3vw, 40px) 5rem. The 64px header holds wordmark, an "Admin" tag, a scrolling nav and the account at the right. Pages open with a flex page head (h1, dim sub, actions right), an optional chip row and search, then one `rows` list. A row is a grid of main / state / actions (gap 0.75rem 1.5rem, padding 0.9rem 1.1rem) and stacks under 900px; edit forms are auto-fill grids at 15rem; the facts list is label (8-14rem) / value / badge.

### Named Rules
**The Flat Row Rule.** Admin records are rows in one hairline-bordered list: title and meta on the left, state pills, then actions on the right, dividers instead of cards. Facts use the same container as a label/value list. Density comes from 0.9rem row padding and 36px controls, never from smaller text.

**The In-Aisle Rule.** The shopping list fits a phone: items grouped by aisle, store breakdowns closed, unpriced items behind one disclosure, and each row shows a "Chain · €" good pill for its cheapest store.

## Elevation & Depth

Flat. Cards, panels and rows separate from the page by Cool Paper against Label White and 1px hairlines. The best option and today's day card take a 2px teal edge (1px border plus 1px inset ring), not a shadow. A linked card lifts 2px on hover with a darker hairline. The public site and the admin carry no shadow at all, not even the float; their only depth cues are hairlines and tints.

### Shadow Vocabulary
- **Float** (`box-shadow: var(--shadow)`): the product search results that float over the add-to-pantry form. Nothing else.

### Named Rules
**The Flat Shelf Rule.** Surfaces are flat at rest and on hover; shadow is only for something that floats over other content.

## Shapes

Soft corners on a short scale: 8px (`sm`) for inputs, notices, thumbnails, drawer rows, breakdowns; 10px for buttons and pagination; 12px (`md`) for cards, panels, tables, row lists and store rows; 16px (`lg`) for the article photo field. Chips, pills, verdict pills, row actions, danger buttons and store bars are full pills. Dots are round: 8px verdict and drawer markers, 10px aisle dots, the 18px price-range marker, the 40px icon-danger hit area. Every border is a 1px hairline; the active nav underline is a 2px inset navy shadow. The card photo field runs edge to edge, clipped by the card. On the site the shelf label, row lists, strips and FAQ are 12px with clipped overflow so dividers meet the corner; the request band and capture frames are 16px; the language switch, chips, pills and step numbers are pill or round. In the admin rows, facts, panels and filters use 12px, fields and edit fieldsets 8px.

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

### Settings List (Casa, Conta)
Casa and Conta are left-aligned in a 54rem column. Facts and account actions sit in one 12px bordered list of rows (min 60px, padding 0.8rem 1.1rem, hairline dividers): a 10rem 600 label, then the value with a pill or a dim hint, and the action pushed right (a 14px 650 teal link, a secondary button, or a danger button for "Sair em todos"). Under 640px the label takes its own line. The household switcher is a chip row (pressed chip = current household).

### Member Row
One bordered list of members, the caller first, then by role and name. Each row is a 44px round initials avatar (Shelf Grey; navy tint for "tu"), name 600, a meta line (role pill: navy for Administrador, muted otherwise; age; an 8px dot, filled teal "Com conta" or hollow dim "Sem conta") and restriction tags (hairline pills). Actions on the right: "Editar" and "Ligar conta" as row actions, "Remover" / "Sair da casa" as a danger button. Editing, linking and removing open inline under the name on a faint Shelf Grey tint; removal asks once more with a 44px danger-outlined confirm. "Acrescentar membro" adds a two-column form as the list's last row (one column under 640px).

### Disclosures
Store breakdowns and event history are `<details>` in hairline containers; 600 summaries with Shelf Grey hover and open state; drawn CSS chevrons rotate on open.

### Site: Header and Language Switch
Sticky 64px bar on Label White with a hairline foot: wordmark (800, 21px, "OS" navy) and two-roof mark, menu links 500 at 14.5px dim (hover ink on a Shelf Grey fill, 8px), then at the right the language switch, a dim login link (hidden under 700px) and a 40px primary "Pedir acesso". The switch is a hairline pill holding pt and en links (12.5px 650, 28px); the current one (`aria-current`) fills navy with white text. Both languages ship from typed dictionaries (`site/i18n`); numbers format with `pt-PT` or `en-GB`.

### Site: Shelf-label Demonstrator (signature)
**The Shelf Label Rule.** The public site proves the product with one object: a label surface (Label White, 12px, hairline) holding the name, the price at 800 and the 90-day range, closed by a verdict foot. Only the verdict, the price and the range marker change between states; the label itself never gains imagery, shadow or decoration.
- **Label:** Label White, 1px hairline, 12px, clipped; body padding 1.35rem 1.5rem 1.4rem. Top to bottom: a muted "Exemplo" pill, the product name (600), the unit line (14px dim), the price (price label, euro at 0.4em), the price range, then the verdict foot.
- **Price range:** the app's range (8px track graded teal, navy tint, red tint; 2px dim tick at the average; 18px Label White dot ringed 4px in ink at the current price) with a 12.5px legend of min, average and max. The dot slides (0.45s ease-out) when the verdict changes.
- **Verdict foot:** full-width row under a hairline, 14px 600, padding 0.65rem 1.5rem, led by an 8px dot, announced politely. Tones match the app's verdict: historic low (teal tint, teal text and dot), below average (teal tint, ink text, teal dot), usual (navy tint, navy dot), above average (red tint, red dot); Shelf Grey with a dim dot by default.
- **Verdict chips:** four pills under the label (the standard chip: 36px, hairline, 14px 550), each led by an 8px dot in its tone (teal, teal, navy, red); `aria-pressed` fills navy with white text and rings the dot 2px in Label White. They flip the label between the four states; a caption above them and a note below say it is an example.
**The Example Rule.** Every figure on the public site is example data and says so: the label carries a muted "Exemplo" pill and a note beneath it. No invented prices, savings or counts appear outside that label.

### Site: Row Link List
Menus are listed as one 12px bordered list of rows per group (min 60px, padding 0.8rem 1.1rem, hairline dividers): a 600 16.5px name, a 14px dim hint, a drawn 20px chevron right. Hover mixes Shelf Grey at 45%; no lift. The group heading is a dim 14px 650 h3.

### Site: Strips, Request Band and Guide
- **Judge list / Flow:** one bordered 12px strip of three cells (padding 1.35rem 1.5rem 1.4rem, hairline between cells), a 16px 600 h3 and 15px dim text each.
- **Request band:** 16px corners, `accent-soft` fill with a 35% teal hairline, ink text (dim ink falls under 4.5:1 on the tint), headline left and a primary button right. The guide teaser shares the shape on Label White with a secondary button.
- **Guide:** table of contents with a 1px left rule and dim links; steps separated by hairlines, each h2 led by a 32px round navy-tint number; step lists use navy markers; a notice is an 8px `accent-soft` block with a teal hairline; the FAQ is a bordered `<details>` list with a drawn chevron that rotates.
- **Request form:** 34rem column, labels 14px 650, the standard 42px input (8px, hairline, 2px teal outline and 4px `accent-soft` ring on focus), a hidden honeypot field, an error block (`danger-soft`, red 600) and a confirmation panel on Label White.
- **Capture (`Shot`):** a real app screenshot in a hairline frame with 16px corners and a 13px dim caption; the shopping-list capture is phone-width (19rem). If the file is missing the figure is omitted.
- **Primary button, large:** 52px, padding 0.6rem 1.6rem, 16.5px, used for "Pedir acesso" in the hero; "Ver como funciona" is a 600 teal text link.

### Admin: Shell, Rows and Facts
- **Shell:** 64px Label White header with hairline foot; the nav reuses the app's active treatment (ink 650 with a 2px navy inset underline); the "Admin" tag is a navy-tint pill (12.5px 650).
- **Row:** the flat row of the Flat Row Rule. Title is strong text with a dim email or secondary on the same baseline, an optional 14.5px note (60ch), a 13px dim meta line (figures lining and proportional), state pills right-aligned, actions right-aligned (min 9rem). Audit rows drop to two columns with a nowrap dim time; edit rows are a single column; slim rows (0.6rem) carry recipe steps and lines.
- **Filter chips and search:** the standard chip row above the list (pressed navy), a 34rem search (input + button) and a bold 14px result count; the pager is two secondary buttons around a dim "Página X de Y".
- **Facts list:** one 12px bordered list of rows (min 56px, padding 0.7rem 1.1rem) with a 600 label, a dim 14px value line led by a 16px 650 ink figure, and a pill or link pill at the right ("Ligada" good, "Só log" muted, "Ver pedidos" navy). Under 720px the detail drops to its own line.
- **State line:** loading and empty states are plain dim text; errors are the `danger-soft` block with `role="alert"`.

### Admin: Pills and ConfirmAction
- **Pills:** the four app pill tones (good teal, navy, muted, danger), 12.5px 600. Status maps are fixed per page: Pendente navy, Aprovado good, Rejeitado muted, "Conta criada" good.
- **ConfirmAction** (`admin/components.tsx`) has two tones.
**The Armed Rule.** In the admin a consequential verb asks twice, inline, in place. At rest it is a neutral row action (or a neutral outlined danger button); pressed, it swaps to the armed tint with a longer confirm label plus a "Cancelar" link; the second press runs it and a failure shows as red text under the buttons. No modal, no red at rest.
- **Neutral tone** (Aprovar, Reenviar convite): row action (Shelf Grey pill, 36px); armed it takes the teal tint, teal text and a 45% teal border.
- **Danger tone** (Rejeitar, remover): the transparent outlined pill with dim text; hover and armed turn red text, 45% red border and `danger-soft` fill.
- Disabled controls drop to 45%; under a coarse pointer row actions, danger buttons, chips and link buttons grow to 44px.

### Admin: Edit Form and Panel
A panel is a 12px hairline container on Label White (padding 0.25rem 1.25rem 1.25rem) holding an edit form: an auto-fill grid (15rem, gap 0.9rem 1.1rem) of fields (13.5px 650 label, 42px input, select or textarea at 8px, optional 12.5px dim hint; `wide` spans the row), a nutrition fieldset (8px hairline, 9.5rem columns), then a primary submit button (reads "A guardar…" while busy) beside a secondary "Cancelar". Focus is the teal border with an `accent-soft` ring; a saved confirmation is a 14px 600 teal line. Search, rename and add-line forms reuse the same inputs and buttons.

### Motion
Ease-out `cubic-bezier(0.16, 1, 0.3, 1)`. Pages fade up 6px (0.4s); cards rise 8px (0.45s, 30ms stagger, capped at 12); store bars grow once. All motion collapses under `prefers-reduced-motion`. The site has one authored entrance: hero copy, demo label (90ms later) and page heads rise 8px in 0.5s, plus the range marker slide and smooth anchor scrolling (off under reduced motion). The admin rises its page content 6px in 0.4s.

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
- **Do** keep the site's one 800 figure the demo price (and the wordmark), and label it as example data.
- **Do** change only verdict, price and range marker when the demo label flips state.
- **Do** arm consequential admin actions in two inline steps, neutral at rest, and show record state as pills on the right of a hairline row.
- **Do** ship every site string in both pt-PT and en from the typed dictionaries.

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
- **Don't** show unlabeled prices, savings or counts on the public site.
- **Don't** give admin records their own cards or shadows, or put red on a control at rest.
- **Don't** open a modal to confirm an admin action; confirm in the row.
