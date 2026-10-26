---
name: DomiOS
description: A household operating system for food, where every price is a supermarket shelf label.
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
typography:
  display:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(30px, 4.4vw, 42px)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.028em"
    fontFeature: "lnum, pnum"
  price:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "lnum, pnum"
  headline:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(19px, 2.6vw, 22px)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "15.5px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "15.5px"
    fontWeight: 450
    lineHeight: 1.5
    fontFeature: "lnum, pnum"
  label:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  tag: "2px"
  sm: "3px"
  md: "4px"
spacing:
  rail: "6px"
  gap-sm: "0.6rem"
  gap: "1rem"
  label-pad: "0.85rem 1rem 0.9rem"
  band-pad: "0.5rem 1rem"
  panel-pad: "1.25rem 1.35rem 1.4rem"
  section: "2.5rem"
  page-x: "clamp(16px, 3vw, 40px)"
  page-max: "1320px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1.05rem"
    height: "42px"
  button-primary-hover:
    backgroundColor: "{colors.accent-2}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1.05rem"
    height: "42px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.8rem"
    height: "42px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.3rem 0.8rem"
    height: "34px"
  chip-pressed:
    backgroundColor: "{colors.accent-2}"
    textColor: "{colors.surface}"
  shelf-label:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "{spacing.label-pad}"
  verdict-historic-low:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    padding: "{spacing.band-pad}"
  verdict-below-average:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
    padding: "{spacing.band-pad}"
  verdict-usual:
    backgroundColor: "{colors.accent-2-soft}"
    textColor: "{colors.ink}"
    padding: "{spacing.band-pad}"
  verdict-above-average:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.ink}"
    padding: "{spacing.band-pad}"
  verdict-none:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-dim}"
    padding: "{spacing.band-pad}"
  verdict-urgent:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.ink}"
    padding: "{spacing.band-pad}"
  pill-good:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.tag}"
    padding: "0.12rem 0.45rem"
  pill-navy:
    backgroundColor: "{colors.accent-2-soft}"
    textColor: "{colors.accent-2}"
    rounded: "{rounded.tag}"
    padding: "0.12rem 0.45rem"
  pill-muted:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.tag}"
    padding: "0.12rem 0.45rem"
  pill-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.tag}"
    padding: "0.12rem 0.45rem"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.panel-pad}"
  top-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-dim}"
    height: "60px"
    padding: "0 {spacing.page-x}"
---

# Design System: DomiOS

## Overview

**Creative North Star: "The Shelf Label"**

Every price, item and offer in DomiOS is drawn as a supermarket shelf label: a white card with a 6px navy rail across the top, the product name in bold, the price as the headline in heavy figures with a small euro sign, the unit price and store under it, and a full-width verdict band at the foot saying what the Api learned from 90 days of history. The rest of the app (panels, tables, row lists, forms) is the plain shelving the labels hang on: flat surfaces, 1px hairlines, almost-square corners.

This is an Operate tool, dense but legible. Planning happens at a desk and the shopping list is used one-handed in the aisle, so type is large for the price and calm everywhere else, and controls are at least 42px tall (list checkboxes 22px with a 32px hit row). The palette is a fixed brand commitment (see PRODUCT.md): teal and navy on cool paper in light mode, the same roles on deep green in dark mode. Redesigns change layout, type and components, never these values.

The world rejects the soft-card dashboard: no stat tiles, no pastel status pills as the main voice, no eyebrows above headings, no serif and no monospace costume.

**Key Characteristics:**
- Price is the headline: 800-weight figures at 40px (32px on phone), lining and proportional.
- A 6px navy rail tops every label and day card; teal replaces it only for the best option.
- Verdict bands close each label, filling left to right on load.
- Flat surfaces, 1px hairlines, corners of 2-4px.
- One family, Schibsted Grotesk, at 450 body to 800 display.

## Colors

A cool, low-chroma paper and ink palette with two working accents: teal for "good now", navy for structure.

### Primary
- **Shelf Teal** (`accent`): the "good now" colour. Historic-low verdict band (solid), best-store rail (`is-best`), today's day card rail, the "Mais barato" pill, the primary button, links, focus ring, checkbox fill and text caret. Its tint (`accent-soft`) backs the below-average band and cheapest-store pills.

### Secondary
- **Label Navy** (`accent-2`): the structural colour. Label and day-card rail, active nav underline, pressed chip, "OS" in the wordmark, step numbers in recipes, the price-range current marker, text selection, and the primary button hover. Its tint (`accent-2-soft`) backs the usual-price band, promotion badges and the near-expiry pill.

### Tertiary
- **Price Red** (`danger`): above-average verdict marker, promotions ending within two days, form errors. Always as a tint (`danger-soft`) behind ink or red text, never as a solid fill.

### Neutral
- **Cool Paper** (`bg`): the page.
- **Label White** (`surface`): labels, panels, inputs, the top bar, tables.
- **Shelf Grey** (`surface-2`): neutral verdict bands, the price-range track, muted pills, code blocks, row hover (mixed at 55%).
- **Ink** (`ink`): text, table header rule (2px), hover border on secondary controls.
- **Dim Ink** (`ink-dim`): secondary text, meta lines, legends, inactive nav.
- **Hairline** (`line`): every 1px border and row divider.

Dark mode (`prefers-color-scheme: dark`) swaps every role for its `-dark` value. Two component overrides apply in dark: the primary button text becomes `bg`, and the historic-low band becomes a teal tint with ink text and a teal marker instead of a solid fill.

### Named Rules
**The Fixed Palette Rule.** The colour tokens in `:root` and the dark block are the user's brand commitment. Do not add, tune or replace them; express new states with the existing tokens and their tints.

**The Good Now Rule.** Teal means "this is the good choice right now": historic low, cheapest store, today, the primary action. Structure and neutral emphasis use navy or ink.

## Typography

**Display Font:** Schibsted Grotesk Variable (with Segoe UI, Helvetica Neue, Arial)
**Body Font:** Schibsted Grotesk Variable
**Label/Mono Font:** none; one family throughout, loaded from `@fontsource-variable/schibsted-grotesk`.

**Character:** A newsy, sturdy grotesk that reads like price-label print at 800 and stays quiet at 450 for body text.

### Hierarchy
- **Display** (800, clamp(30px, 4.4vw, 42px), 1.04, -0.028em): page titles only, balanced wrap.
- **Price** (800, 40px, 1, -0.035em): the label price; 34px in the store comparison grid, 32px under 720px. The euro sign or percent sits at 0.45em, weight 700; "desde" at 13px dim.
- **Headline** (800, clamp(19px, 2.6vw, 22px), 1.15, -0.015em): section heads, 2.5rem above.
- **Title** (700, 15.5px, 1.3): label names, row titles, buttons (700, 15px). Recipe card titles step up to 750, 17px.
- **Body** (450, 15.5px, 1.5): running text; ledes cap at 62ch, recipe steps at 70ch.
- **Label** (650-700, 12.5-13.5px): verdict bands, pills, meta lines, table headers, field labels. Sentence case, no tracking.

### Named Rules
**The Proportional Figures Rule.** Figures are lining and proportional everywhere (`font-variant-numeric: lining-nums proportional-nums`), including tables, dates and timestamps. Schibsted Grotesk's tabular comma takes a full figure cell and splits "1,19" into "1 , 19". Tables align numeric columns right instead of relying on tabular figures.

**The No Eyebrow Rule.** Headings stand alone. No small uppercase kicker or tracked label above a title.

## Layout

A single centered column, max 1320px, with horizontal padding clamp(16px, 3vw, 40px) and 2.25rem top / 5rem bottom. Pages open with the title, a one-line dim count or summary (`page-sub`, 1.75rem below), then a search and filter row (gap 0.6rem), then content. Sections are separated by 2.5rem; a section head carries the headline left and a "see all" link right, baseline-aligned.

Labels sit in auto-fill grids: products at minmax(15.5rem, 1fr), recipes at 17rem, week days at 14.5rem, stores at 13rem, all with a 1rem gap. Under 720px the product grid tightens to 10.5rem columns (two-up on a phone) with a 0.65rem gap. The home page ("Hoje") is a 1.4fr / 1fr two-column grid that stacks under 900px. Lists (pantry, shopping list) are a single bordered container of rows with hairline dividers; pantry rows are a three-column grid that stacks under 720px.

Under 1100px the top bar wraps: the account links move to the right of the wordmark and the grouped nav becomes a full-width horizontally scrolling tab strip with hidden scrollbar.

### Named Rules
**The Aisle Rule.** The shopping list must fit the first phone screen: the store comparison is compact, per-store breakdowns are closed by default, unpriced items sit behind a single disclosure, and every item row shows a "Chain · €" pill for its cheapest store, so no breakdown needs opening to shop.

## Elevation & Depth

The system is flat. Labels, panels, tables and lists separate from the page by the contrast between Cool Paper and Label White and by 1px hairlines, not by shadow. The only shadow in use is on the floating product search results list on the add-to-pantry form. A linked label lifts 2px on hover with a darker hairline; that is a movement, not a shadow.

### Shadow Vocabulary
- **Float** (`box-shadow: var(--shadow)`; light `0 1px 2px rgba(22, 36, 31, 0.06), 0 8px 24px -12px rgba(22, 36, 31, 0.18)`): dropdown results that float over content. Nothing else.

### Named Rules
**The Flat Shelf Rule.** Surfaces are flat at rest and on hover. Shadow is reserved for something that genuinely floats over other content.

## Shapes

Corners are almost square: 2px for pills, tags and thumbnails; 3px (`sm`) for labels, buttons, inputs, chips and notices; 4px (`md`) for panels, tables and row-list containers. The only round shape is the 12px current-price dot on the price range. Every border is a 1px hairline except three deliberate weights: the 6px top rail on labels and day cards, the 3px active nav underline, and the 2px ink rule under table headers. Verdict bands run edge to edge inside the label (the label clips them) and open with an 8px square marker drawn in CSS.

## Components

### Buttons
Solid, compact and square-shouldered.
- **Shape:** 3px radius, min height 42px, padding 0.5rem 1.05rem, 700 weight at 15px.
- **Primary:** teal fill and border, Label White text (Cool Paper text in dark).
- **Hover / Focus:** primary turns navy; secondary border turns ink; press nudges 1px down; focus is a 2px teal outline offset 2px. Disabled at 50% opacity.
- **Secondary:** Label White with hairline border and ink text.
- **Link button:** teal underlined text at 14px, 650 weight, turning navy on hover; used for row actions like "Remover" and "Mudar nome".

### Chips
- **Style:** filter chips, 34px tall, 3px radius, hairline border on Label White, 600 weight at 14px.
- **State:** pressed (`aria-pressed`) fills navy with white text; hover darkens the border to ink.

### Pills
Small 2px-radius tags at 12.5px, 650 weight, tint background with matching text: good (teal), navy (promotions, near expiry, "warning"), muted, danger. On the shopping list the good pill carries "Chain · €" for the item's cheapest store.

### Cards / Containers
- **Corner Style:** 3px for labels, 4px for panels.
- **Background:** Label White on Cool Paper.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px hairline; labels and day cards add the 6px navy rail.
- **Internal Padding:** labels 0.85rem 1rem 0.9rem (0.7rem 0.8rem on phone); panels 1.25rem 1.35rem 1.4rem.

### Inputs / Fields
- **Style:** 42px tall, 1px hairline, 3px radius, Label White, 15px text, dim placeholder. Selects use a drawn chevron SVG. Search carries a drawn magnifier SVG inset 0.8rem.
- **Focus:** border turns teal with a 3px `accent-soft` ring.
- **Error / Disabled:** errors are a `danger-soft` block with red 600-weight text above the form.

### Navigation
Sticky 60px top bar on Label White with a hairline bottom. Wordmark "DomiOS" at 800, 21px, "OS" in navy, beside the two-roof mark (teal and navy polylines). Nav links are 600 weight at 14.5px in dim ink, in two groups (household: Hoje, Plano, Despensa, Listas; catalog: Produtos, Promoções, Receitas, Ementas) split by a hairline divider; account links (Casa, Conta) sit at the far right. Active link is navy with a 3px navy underline at the bar's foot. On mobile the groups become a scrolling tab strip.

### Tables
Label White, 14.5px cells with 0.65rem 0.9rem padding and hairline rows, a 12.5px dim 700-weight header over a 2px ink rule, numeric columns right-aligned, row hover in Shelf Grey at 55%.

### Shelf Label (signature)
The container for anything with a price: product, store offer, promotion, store total. Name (title), meta (13.5px dim), price (price role, pushed to the bottom of the body), unit price ("€/kg" with the figure in ink), card price in teal 700 ("com cartão"), foot meta. Promotions use the label with the announced discount as the number ("−25%") and the deadline as the band. The best option swaps the navy rail for teal. Labels rise 8px into place on load, staggered 30ms per index (capped at 12).

### Verdict Band (signature)
A full-width 13px 700-weight band at the label foot with an 8px square marker. It maps the Api `PriceLabel`: 0 Insufficient history and "none" in Shelf Grey with dim text; 1 Historic low in solid teal with white text ("Mínimo dos últimos N dias"); 2 Below average on teal tint with a teal marker; 3 Usual on navy tint with a navy marker; 4 Above average on red tint with a red marker. "urgent" (promotion ends within two days) reuses the red tint. The store comparison reuses the tones: best store 1, complete store 3, partial store none. The band wipes in left to right (clip-path, 0.5s) 120ms after its label.

### Price Range
A 4px Shelf Grey track from the period's lowest to highest price, a 1px dim tick at the average and a 12px navy dot ringed in Label White at the current price, with a 12.5px legend (mín, média, máx) beneath.

### Disclosures
Store breakdowns and the event history are `<details>` rows: hairline container, 700-weight summary with Shelf Grey hover and open state. The event history uses a drawn CSS chevron that rotates when open.

## Do's and Don'ts

### Do:
- **Do** make the price the largest thing on any label (800, 40px; 32px on phone) with the currency at 0.45em.
- **Do** end every offer that has a `priceInsight` with a verdict band, and every label with the 6px rail.
- **Do** use `lining-nums proportional-nums` for every figure, tables and dates included, and right-align numeric table columns.
- **Do** keep teal for "good now" (historic low, cheapest store, today, primary action) and navy for structure.
- **Do** keep controls at least 42px tall and shopping list rows at least 56px.
- **Do** keep the shopping list's store breakdowns closed by default and unpriced items behind a disclosure.
- **Do** draw icons as inline SVG or CSS shapes (magnifier, select chevron, band marker, disclosure chevron).

### Don't:
- **Don't** change, add to or tune the colour tokens.
- **Don't** use tabular figures; the tabular comma splits "1,19".
- **Don't** put eyebrows or kickers above headings.
- **Don't** use a coloured border-left as an accent; the only side border is the neutral hairline between nav groups.
- **Don't** use emoji or text glyphs as icons, or gradient text.
- **Don't** add shadows to labels, panels or cards, or round corners past 4px.
- **Don't** add a second typeface, a serif or a monospace costume.
- **Don't** build stat tiles or soft dashboard cards; numbers live on shelf labels or in a plain catalog line.
