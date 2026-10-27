---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/index.css"]
---

## Scope

Whole DomiOS web app (shell plus every route in `src/App.tsx`). Mode: Operate. Households planning at a computer and shopping on a phone.

## Task and content

Read real prices and their history verdict, find products, plan the week, use the pantry in FIFO order, run shopping lists in the aisle and pick the cheapest store. Surface Api fields the old frontend ignored: unit price, card price, price insight (90-day label, Omnibus check, promotion frequency), promotion discount percent, recipe dish type and main protein (filters and labels), recipe source link, substitute product. Colours are pinned: tokens in `src/index.css` stay byte-identical.

## Direction contract

THESIS: Every price, item and offer is a supermarket shelf label: the number is the headline, €/kg sits under it, and a verdict band says what the Api learned from 90 days. Refuses the soft-card dashboard with stat tiles and pastel pills.

OWN-WORLD: Fixed palette (bg #f0f3f5, surface, navy #1e3a5c as the label rail and shell, teal #2a6a78 only for "good now": historic low, cheapest store, today, primary action). Schibsted Grotesk throughout, heavy 800 lining figures for prices (proportional everywhere, including tables and dates, because the face's tabular comma takes a full cell and splits "1,19" into "1 , 19"; tables align numbers right instead), 500 body. Square corners (2–4px), 1px hairlines, a 6px navy top rail on labels, full-width verdict bands at the label foot. No serif, no mono costume, no eyebrows.

STORY: The household sees what a thing costs and whether that is good, then acts: add to pantry, to list, to plan.

FIRST VIEWPORT: Compact light top bar (wordmark, grouped nav, household switch, account); page title with a one-line count; search and filter row; grid of shelf labels (name, brand, big price, unit price and store, card price, verdict band). On phone: nav collapses to a scrolling tab strip, labels stack two-up for products and full width for lists.

FORM: Shelf price label, IMPECCABLE’S PICK (my rank 1 of 7); seed: efece9fa54a8c918

SIGNATURE: The verdict band. Every offer with `priceInsight` ends in a band (Mínimo de 90 dias in teal, Abaixo da média, Habitual, Acima da média in danger tint, Histórico insuficiente muted); promotions add the Omnibus real discount line. Motion: labels settle in with a short staggered rise once per page load, bands fill left to right.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
