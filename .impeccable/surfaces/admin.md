---
version: 1
slug: "admin"
primary_target: "admin"
related_targets: []
---

# Surface: admin (platform staff)

Mode: Operate. Separate Vite entry in domios-frontend (`admin/`), own deploy. Language: pt-PT only. Same system as the app and the site (DESIGN.md), palette fixed in `src/shared/tokens.css`.

Audience and job: the platform owner and staff who review access requests, look after households and users, edit the catalog (products, ingredients, recipes), read the audit log and check system health. They work at a desk, repeat the same few verbs, and must never trigger a consequential action by accident.

## Direction contract

THESIS: A calm ledger. Every record is a flat hairline row; state is a pill, verbs are quiet pills, and nothing is loud until the user has said they mean it.

OWN-WORLD: DomiOS "Aisle Sign" system without the aisle hues: cool paper, Label White rows, teal for "good / active", navy for structure and pending, red only as tint. Schibsted Grotesk, 600 headings, 800 only on the wordmark, 1px hairlines, 8/12px corners, no shadows.

WHAT STAYS CALM: no aisle colour, no solid fills except the one primary button, no shadow, no card per record, no motion beyond a 6px page fade, no icons beyond drawn chevrons. Red appears only as `danger-soft` tint with red text, on hover or when armed.

DESTRUCTIVE-CONTROL RULE: every consequential verb (approve, reject, resend, remove, disable) is a `ConfirmAction`: neutral at rest, pressed once it arms (tint, a longer confirm label, a "Cancelar" link beside it), pressed twice it runs; a failure prints under the buttons. Destructive verbs use the outlined danger pill, neutral at rest and red only on hover or when armed. No modals, no confirm dialogs, no red at rest.

DENSITY: rows of 0.9rem padding in one bordered list, controls 36px (44px under a coarse pointer), meta 13px dim, notes 14.5px; a page is head, optional chip filters and search, then the list or the facts. Read-only pages (System, Audit) use the facts list or slim rows with a dim time. Edit forms open in a hairline panel with an auto-fill field grid, a primary "Guardar" and a secondary "Cancelar".

FIRST VIEWPORT: Page title with a dim one-line purpose, actions at the right, filter chips, then the first rows with their state pills. Header: wordmark, "Admin" tag, scrolling nav, account and "Sair".

FORM: Flat row list; facts list for system state; panel plus edit grid for catalog edits.
