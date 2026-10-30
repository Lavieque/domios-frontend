# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A household (the owner and their family) running their own kitchen and shopping in Portugal. Mixed use: planning the week, managing the pantry and reading prices happen at a computer; shopping lists are used on a phone, in the supermarket aisle, often one-handed.

## Product Purpose

DomiOS is a household operating system for food: a global catalog of real products and prices from Portuguese supermarket chains, active promotions and published recipes, joined to the household's own pantry, weekly meal plan and shopping lists. Success is a household that knows what it has, what to cook, what to buy and where it is cheapest, without waste.

## Positioning

The catalog is real: prices are observed per store and chain, and the Api judges each price against its own 90-day history (historic low, below average, usual, above average), checks non-card promotions against the lowest price in the 30 days before (Omnibus Directive, EU 2019/2161), and describes how often a product goes on promotion. The pantry is FIFO (open items first, then expiry), and the plan, pantry and shopping lists talk to each other (what is missing for the plan goes straight to a list; a list is split by the cheapest store).

## Operating Context

- Frontend talks to DomiOS.Api only over HTTP (`VITE_API_BASE_URL`, build-time). Everything sits behind login.
- Households: a user can belong to several; the current one is chosen per browser.
- Store comparison only uses prices from the last 3 days and only shows stores with at least one item.
- Copy is Portuguese (pt-PT), money in EUR, timezone Europe/Lisbon.

## Capabilities and Constraints

- React 19, React Router 7, Vite, TypeScript (`erasableSyntaxOnly`: no `enum`), hand-written CSS in `src/index.css`, no UI framework, light and dark via `prefers-color-scheme`.
- DTOs are hand-written in `src/api/types.ts`, mirroring the real Api DTOs (repo `DomiOS`); enums are numbers.
- Api fields the frontend may surface: `unitPrice`, `cardPrice`, `priceInsight` (label, lowest/highest/average, promotion check, promotion frequency) on store offers; `discountPercent` on promotions; `dishType`, `mainProtein`, `sourceUrl` on recipes; `substitutedByProductId` on products.
- Never invent prices, savings or counts: every number on screen comes from the Api.

## Brand Commitments

- Name and wordmark: "DomiOS" with "OS" in the second accent; the two-roof brand mark (teal + navy polylines).
- The colour palette is fixed by the user: the tokens in `src/index.css` (`--bg`, `--surface`, `--surface-2`, `--ink`, `--ink-dim`, `--line`, `--accent` teal, `--accent-soft`, `--accent-2` navy, `--accent-2-soft`, `--danger`, `--danger-soft`, light and dark sets) must not change. Redesigns change layout, type, components and presentation only. On top of these base tokens, six aisle hues (`--aisle-*`, light and dark) mark a product's top category; the user approved them on 2026-10-30 and they appear only where a category appears.

## Evidence on Hand

- Real data from the Api: products (with optional `imageUrl`), offers, promotions, ~6000 published recipes (mostly without images), meal plan templates.
- `docs/levantamento-api-2026-10-23.md`: coverage of the Api by the frontend.
- No testimonials, metrics or marketing claims exist; none may be invented.

## Product Principles

1. Truth first: show what the Api observed, with its limits (insufficient history, old prices) stated plainly.
2. The next action is obvious: what to use first, what to cook, what to buy, where.
3. One household, one system: catalog, pantry, plan and lists read as one connected tool.
4. Works in the aisle: the shopping list is usable on a phone, fast and legible.
