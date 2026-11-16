---
version: 1
slug: "site"
primary_target: "site"
related_targets: []
---

# Surface: public site (domios.pt)

Mode: Persuade (home), Read (guide and per-page pages). Separate Vite entry in domios-frontend, own deploy. Languages: pt-PT and en.

Audience and job: a Portuguese household without an account. They must understand what DomiOS is in seconds and ask for access (invite-only product). Primary action: "Pedir acesso" (form on its own page, button on every page). Proof: real captures of the current app, taken from the mock Api with example data and labelled as such, plus the one real mechanism for prices (verdict against 90-day history, Omnibus check). No invented prices, savings, counts or testimonials.

Starting point given by the user on 2026-11-13: their own preview at domios-apresentacao (kitchen-photo hero, a three-step story Despensa, Planeamento, Compras, a page-by-page tour, a closing invitation). The brief pins that structure and asks for a better version of it, so no concept roll ran. No image generation in this harness: code-led.

Unresolved: final copy review by the user; captures show the mock household ("Casa Oliveira", "Miguel"); the product capture has no observed price in the mock data; DESIGN.md still describes the retired "Folha do Dia" world.

## Direction contract

THESIS: Household first. The home opens on the kitchen the app itself lives in and answers the daily question (what is for dinner, what to use first, what is left to buy) before it mentions prices. Refuses the old price-label hero and the row of equal feature cards.

OWN-WORLD: The editorial world of the app. Deep green grounds (#102c23, #17392c), cream paper (#f4f0e6, #faf7f0), sage (#d6e2bb) for the primary action and the selected state, the kitchen photographs of the app under a green veil, Libre Caslon Display for titles and prices, DM Sans for the rest, hairlines, 10px and 18px corners, the logo on its cream plaque.

STORY: The visitor sees a calm kitchen and a promise, reads one example day, follows pantry to plan to shopping list with the real screens, opens any page of the app in the tour, learns that prices are judged against history, and requests access.

FIRST VIEWPORT: Full-bleed kitchen photograph, veil darkest on the left. Left: two-line serif headline up to 96px (second line sage), lede, "Pedir acesso" (sage, primary) and "Ver como funciona". Bottom edge: a glass strip with the real date of today and three example facts (dinner, use first, left to buy), tagged Exemplo. Header clear over the photo, solid after scroll.

FORM: The pinned structure of the user, raised: hero, story, tour, verdict, invitation. Signature interaction: the tour, the menu of the app as tabs over real captures. Motion: one entrance on the hero (lines rise, strip slides up), then motion tied to the scroll so it is the same on a phone (site/motion.ts): the hero leaves in layers, story captures tilt up and flatten, the list climbs out of the basket, story points tick off; on touch the light crosses captures with the scroll. The tour turns its own pages until touched (timer fill on the tab, swipe on phones). Reduced motion keeps plain fades only. The guide's "On this page" follows the reader: a marker slides to the current section, read ones are ticked, the rail fills; on phones it is a sticky bar of dots with the current title. seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
