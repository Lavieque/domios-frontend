---
version: 2
slug: "admin"
primary_target: "admin"
related_targets: []
---

# Surface: admin (platform staff)

Mode: Operate. Separate Vite entry in domios-frontend (`admin/`), own deploy. Language: pt-PT only. Same world as the app and the site (DESIGN.md): the kitchen through green glass. Dark only.

Audience and job: the platform owner and staff who review access requests, look after users and households, edit the catalog (products, recipes, ingredients, stores, promotions), read the audit log and check system health. They work at a desk, repeat the same few verbs, and must never trigger a consequential action by accident.

## Direction contract

THESIS: The app's glass, used as a ledger. Every record is a flat hairline row inside one glass panel; state is a pill, verbs are quiet slabs, and nothing is loud until the user has said they mean it.

OWN-WORLD: DESIGN.md as is. Area photograph (copied to `admin/public/scenes`) under the green veil, a 216px forest-glass rail with the logo on its cream plaque and the gold 3px inset for "you are here", Libre Caslon Display 400 for h1/h2 and big numerals, DM Sans for the rest, muted-sage secondary and bottle-green primary buttons, butter links.

WHAT STAYS CALM: no kicker above headings, one glass layer (a panel inside a panel goes flat), no motion beyond one 8px page entrance, icons are drawn 1.7px strokes in the rail only. Coral appears only as danger text on a wash, on hover or when armed.

DESTRUCTIVE-CONTROL RULE: every consequential verb (approve, reject, resend, remove, disable, close, cancel, discontinue) is a `ConfirmAction`: neutral at rest, pressed once it arms (tint, a longer confirm label, a "Cancelar" link beside it), pressed twice it runs; a failure prints under the buttons. Destructive verbs use the outlined danger slab, neutral at rest. No modals, no confirm dialogs.

STRUCTURE: Rail groups: Visão geral + Pedidos (with the pending count as the one badge); Utilizadores + Casas; Produtos, Receitas, Ingredientes, Lojas, Promoções (each its own route under `/catalogo/`); Sistema + Auditoria. Under 900px the rail becomes a sticky top bar with a scrolling nav.

DENSITY: rows of 0.9rem padding with a 40px avatar or photo thumb, controls 34-40px (44px under a coarse pointer), meta 13px dim. A page is head (serif title, one-line purpose), optional chips and search, then the list or the facts. Visão geral: linked counts, then a 3:2 split of pending requests against health and recent actions.
