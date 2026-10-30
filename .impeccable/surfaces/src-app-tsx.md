---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/index.css"]
---

## Scope

Whole DomiOS web app (shell plus every route in `src/App.tsx`). Mode: Operate. Households planning at a computer and shopping on a phone.

## Task and content

Read real prices and their 90-day verdict, find products, plan the week, use the pantry in FIFO order, run shopping lists in the aisle and pick the cheapest store. The article detail is a first-class screen: photo, price, verdict, history range, where to buy. Base colour tokens in `src/index.css` stay byte-identical (user, 2026-10-30); category hues are added on top.

## Direction contract

THESIS: The supermarket's own wayfinding: every product carries the colour of its aisle, and that colour is how you find things in the catalog, the pantry and the shopping list. Refuses the grid of identical railed labels and the bold-everything density.

OWN-WORLD: Base palette unchanged (cool paper, white surface, teal "good now", navy structure). Six muted aisle hues (fresh red, fish blue, pantry olive, bakery yellow, dairy sky, home plum) used only where a category appears: chip dot, photo field, group marker. Schibsted Grotesk at 400 body, 600 titles, 800 only for prices. Soft corners (10px cards, 16px photo fields, pill chips and verdicts), hairlines, no rails, no shadows at rest.

STORY: The household sees what a thing is, what it costs, whether that is good and where it is cheapest, then adds it to the pantry; lists are filled from the list page, the plan and recipes.

FIRST VIEWPORT: Article detail: crumb, then two columns: a 16px-rounded photo field tinted in the aisle hue, and the name, brand and pack, a 64px price, the verdict pill, unit and card price, the 90-day range and the actions. Below, "Onde comprar": one row per store with a bar scaled to price, cheapest in teal. Catalog: aisle chips with colour dots over a grid of photo cards.

FORM: Cores por categoria (user-steered free-palette round, then base palette restored by the user), IMPECCABLE'S PICK of that round; seed:6d3837fa1aa324e6

SIGNATURE: Aisle colour as wayfinding: one hue per top category, from the chip to the photo field to the shopping-list group. Motion: store bars grow left to right once on load, ordered by price.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
