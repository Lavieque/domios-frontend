---
name: DomiOS
description: A household's kitchen seen through green glass. Kitchen photography under a deep green veil, frosted panels, a serif for titles and prices.
colors:
  green-950: "#0c241b"
  green-900: "#102c23"
  green-800: "#17392c"
  green-700: "#204e39"
  green-pressed: "#163a29"
  cream: "#faf7f0"
  paper: "#f4f0e6"
  paper-2: "#e9e4d4"
  ink: "#182c22"
  ink-dim: "#4f6150"
  line: "rgb(24 44 34 / 0.16)"
  sage: "#d6e2bb"
  sage-light: "#e7efd3"
  sage-muted: "#b8c8a7"
  sage-muted-light: "#d0ddc0"
  on-dark: "#fffdf3"
  on-dark-dim: "#d3dbc8"
  on-glass-dim: "#e3e7d8"
  line-dark: "rgb(248 245 223 / 0.22)"
  glass-tint: "rgb(14 45 31 / 0.3)"
  glass-edge: "rgb(248 245 223 / 0.24)"
  field-glass: "rgb(16 45 35 / 0.45)"
  rail-glass: "rgb(16 44 35 / 0.85)"
  butter: "#fff2c9"
  gold: "#d6be94"
  gold-light: "#f5ddb0"
  coral: "#ffb4a8"
  rust: "#874a35"
  clay: "#a3371f"
typography:
  display:
    fontFamily: "Libre Caslon Display, Georgia, Times New Roman, serif"
    fontSize: "clamp(2.75rem, 7.2vw, 6rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Libre Caslon Display, Georgia, Times New Roman, serif"
    fontSize: "clamp(40px, 4.6vw, 60px)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.3px"
  title:
    fontFamily: "Libre Caslon Display, Georgia, Times New Roman, serif"
    fontSize: "clamp(26px, 2.4vw, 32px)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.3px"
  numeral:
    fontFamily: "Libre Caslon Display, Georgia, Times New Roman, serif"
    fontSize: "clamp(4rem, 8vw, 6rem)"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "'lnum' 1, 'tnum' 1"
  body:
    fontFamily: "DM Sans Variable, DM Sans, Segoe UI, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  body-app:
    fontFamily: "DM Sans Variable, DM Sans, Segoe UI, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  card-title:
    fontFamily: "DM Sans Variable, DM Sans, Segoe UI, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.35
  button:
    fontFamily: "DM Sans Variable, DM Sans, Segoe UI, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
  button-site:
    fontFamily: "DM Sans Variable, DM Sans, Segoe UI, Arial, sans-serif"
    fontSize: "0.94rem"
    fontWeight: 600
    lineHeight: 1.2
  label:
    fontFamily: "DM Sans Variable, DM Sans, Segoe UI, Arial, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.08em"
rounded:
  control-app: "7px"
  card: "9px"
  control: "10px"
  menu: "12px"
  shot: "14px"
  panel: "16px"
  band: "18px"
  pill: "999px"
spacing:
  gutter-app: "clamp(16px, 2.4vw, 34px)"
  gutter-site: "clamp(20px, 4.5vw, 64px)"
  panel-pad: "clamp(1rem, 2vw, 1.5rem)"
  card-pad: "18px"
  grid-gap: "20px"
  section-site: "clamp(4.5rem, 9vw, 8rem)"
  max-site: "76rem"
components:
  button-primary:
    backgroundColor: "{colors.green-700}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.control-app}"
    padding: "11px 17px"
  button-primary-hover:
    backgroundColor: "{colors.green-pressed}"
    textColor: "{colors.on-dark}"
  button-sage:
    backgroundColor: "{colors.sage-muted}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control-app}"
    padding: "11px 17px"
  button-sage-hover:
    backgroundColor: "{colors.sage-muted-light}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.rust}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.control-app}"
    padding: "11px 17px"
  button-site:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.ink}"
    typography: "{typography.button-site}"
    rounded: "{rounded.control}"
    padding: "0 1.15rem"
    height: "46px"
  button-site-hover:
    backgroundColor: "{colors.sage-light}"
    textColor: "{colors.ink}"
  button-site-dark:
    backgroundColor: "{colors.green-700}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button-site}"
    rounded: "{rounded.control}"
    padding: "0 1.15rem"
    height: "46px"
  button-site-dark-hover:
    backgroundColor: "{colors.green-900}"
    textColor: "{colors.on-dark}"
  glass-panel:
    backgroundColor: "{colors.glass-tint}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-pad}"
  product-card:
    backgroundColor: "{colors.glass-tint}"
    textColor: "{colors.on-dark}"
    typography: "{typography.card-title}"
    rounded: "{rounded.panel}"
    padding: "{spacing.card-pad}"
  field-app:
    backgroundColor: "{colors.field-glass}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.control-app}"
  search-field:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
  field-site:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.8rem 0.95rem"
  chip:
    textColor: "{colors.on-dark}"
    rounded: "{rounded.pill}"
    padding: "0 0.9rem"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  rail:
    backgroundColor: "{colors.rail-glass}"
    textColor: "{colors.on-dark}"
    width: "216px"
    padding: "28px 18px 22px"
  rail-link:
    textColor: "{colors.on-dark-dim}"
    rounded: "{rounded.control-app}"
    padding: "10px 15px"
  tab:
    textColor: "{colors.on-dark-dim}"
    rounded: "{rounded.menu}"
    height: "54px"
  brand-plaque:
    backgroundColor: "{colors.cream}"
    rounded: "{rounded.menu}"
    padding: "0.5rem 0.85rem 0.5rem 0.7rem"
---

# Design System: DomiOS

## Overview

**Creative North Star: "The Kitchen Through Green Glass"**

DomiOS is a household's own kitchen seen at the end of the day, through a pane of green glass. Every area of the app has its own atmospheric photograph (the pantry shelves, the market basket, the stove, the table), fixed behind the page and darkened by a deep green veil that runs from nearly opaque on the reading side to almost clear on the far side. Content floats over it on frosted panels: a green-tinted gradient, a heavy blur, a thin cream edge and soft corners. Titles and prices are set in a high-contrast display serif; everything you read or press is in a quiet geometric sans.

The app is dark-only and warm: cream type on green glass, sage for the second action, a thread of gold for "you are here", butter-yellow for links. Density is moderate: cards of a fixed width flow in an auto-fill grid with a 20px gap, panels breathe at 1 to 1.5rem of padding, and the phone turns photo cards into compact rows so several fit on one screen in the supermarket aisle. The public site lives in the same world, but it alternates: dark green bands with photography carry the header, the hero, the tour, the inner page heads and the footer, while long reading runs on light cream paper with dark green ink.

This world replaced the tear-off calendar ("Folha do Dia") on the app and the old shared-token look on the site. Its condensed Archivo numerals, 6px ink rules, calendar red and pale teal frame are retired.

**Key Characteristics:**
- An area photograph behind every app page, always under a green veil; the site reuses the same scenes on its page heads.
- Frosted glass panels (gradient tint, 32px blur, 1px cream edge, 16px corners) as the one content surface in the app; glass inside glass goes flat.
- Libre Caslon Display at 400 only, for titles, prices and big numerals; DM Sans for all reading and every control.
- Cream type on green in the app; dark green ink on cream paper for reading on the site.
- Gold marks the current place, sage marks the second action, butter marks links.
- The original logo, unchanged, on a cream plaque.

## Colors

A narrow green family from near-black forest to bottle green, warmed by cream and paper, with sage as the soft companion and three small warm accents that each carry one meaning.

### Primary
- **Bottle Green** (`green-700`): the app's primary button and selected chip, the site's dark button, the step numbers in the guide, the caret and the focus ring on the site's paper. It presses to **Pressed Green** (`green-pressed`) in the app.
- **Forest** (`green-900`): the ground of the site's hero, tour band and inner page heads, the solid site header after scroll, and (as `rail-glass`, 85% opaque with a 16px blur) the app's desktop rail and phone tab bar.
- **Deep Forest** (`green-800`): the app's page ground behind the photograph, the site's demo card and the frame behind phone captures. **Night Forest** (`green-950`) is the site footer and the bezel of phone captures.

### Secondary
- **Sage** (`sage`): on the site, the primary call to action, the selected tour tab and chip, the filled cell of the verdict scale, the "now" dot on the price range and text selection. Hover lightens to **Sage Light** (`sage-light`).
- **Muted Sage** (`sage-muted`): the app's second button ("button-secondary" and "button-sage"), dark green text on it; hover lifts to `sage-muted-light`.

### Tertiary
- **Gold** (`gold`): the app's "you are here": the 3px inset on the active rail link, the 3px bar over the active tab, the border of the phone menu button when one of its destinations is open, and the dot beside the user's name. **Gold Light** (`gold-light`) is the app's focus ring on the phone bar and menu, and the ground of the pending/warning badge.
- **Butter** (`butter`): every link in the app (bare links, link buttons, arrow links, breadcrumbs), weight 700, underlined on hover.
- **Coral** (`coral`): danger and "today" text on dark glass. **Rust** (`rust`) is the filled danger button. On the site's paper the error colour is **Clay** (`clay`) on a 9% clay wash.

### Neutral
- **Cream** (`cream`): the logo plaque, the app's search field, the site's form fields and the light ground of the closing band.
- **Paper** (`paper`) and **Paper 2** (`paper-2`): the site's reading ground, and its notices and side boxes.
- **Ink** (`ink`) and **Ink Dim** (`ink-dim`): text on the site's paper; ink also sits on sage buttons in both surfaces. **Line** (`line`) is the hairline between rows on paper.
- **On Dark** (`on-dark`): all type on green, the app's `--ink`. **On Dark Dim** (`on-dark-dim`) is secondary text on the site's green bands and the resting colour of rail links and tabs; the app's glass uses the slightly lighter **On Glass Dim** (`on-glass-dim`) for its dim ink, with meta lines between that and on-dark.
- **Glass** (`glass-tint`, `glass-edge`, `field-glass`, `line-dark`): the panel tint (a 120deg gradient from this value to `rgb(14 35 25 / 0.16)`), its 1px edge, the translucent ground of app fields, and hairlines on green.

### Named Rules
**The Green Veil Rule.** Text never sits on a bare photograph. A green gradient veil goes between them, darkest on the reading side (82 to 96% opaque) and thinning toward the far side (10 to 30%); on phones it turns vertical, clear at the top over the photograph and solid forest under the text. The site's closing band is the one inversion: a cream veil over a light photograph, for dark ink.

**The Gold Thread Rule.** In the app, gold means "you are here" and nothing else: the active rail link, the active tab, the open menu, the signed-in user. Selection elsewhere (a pressed chip, a filter) uses green or a cream wash, never gold.

**The Plaque Rule.** The logo keeps its own colours (two roofs, "Domi" in `#16241f`, "OS" in `#1e3a5c`) and always sits on a cream plaque with 12px corners and a soft shadow, in the app and on the site. Never set it straight on green or recolour it.

## Typography

**Display Font:** Libre Caslon Display (with Georgia, Times New Roman, serif)
**Body Font:** DM Sans Variable (with DM Sans, Segoe UI, Arial, sans-serif)

**Character:** a hairline-contrast display serif, used only at its single 400 weight, gives the titles and prices the voice of a cookbook; DM Sans does all the work underneath, plain and legible at small sizes on glass.

### Hierarchy
- **Display** (400, clamp(2.75rem, 7.2vw, 6rem), line-height 1): the site hero only, in two lines, the second in sage.
- **Headline** (400, clamp(40px, 4.6vw, 60px), line-height 1.05): the app's page titles, the product name and the auth title. The site's inner page heads use the same role at clamp(2.4rem, 5.4vw, 4.5rem) with max 20ch, and its section heads at clamp(2.1rem, 4.4vw, 3.75rem).
- **Title** (400, clamp(26px, 2.4vw, 32px), line-height 1.1): panel and section headings in the app; the site's story and step headings sit at 1.75 to 2.75rem in the same face.
- **Numeral** (400, lining tabular figures): prices on the price tag and store rows, meter values, the site's demo price (up to 6rem) and its 4rem guide step numbers.
- **Body** (400, 17px, line-height 1.6): reading on the site, measures of 34 to 40rem. The app's ledes are 16px at 1.6 with a 36rem cap (`body-app`).
- **Card title** (700, 15px, line-height 1.35): product and recipe names on cards; h3 in the app is DM Sans 700 too.
- **Button** (600, 12px in the app; 0.94rem on the site): every button label.
- **Label** (700, 0.68rem, 0.08em, uppercase): small outlined tags on the site ("Exemplo"). App badges are sentence case DM Sans 500 on a pale sage pill.

### Named Rules
**The One Serif Rule.** The serif appears at 400 only, and only for h1, h2, prices and large numerals. Card titles, h3, buttons, labels, meta and body are DM Sans. Headings are never uppercase.

**The No Kicker Rule.** Don't put an eyebrow or kicker above a heading. The title carries the page; context sits in the lede under it or in the breadcrumb above it.

## Layout

**App.** On desktop the shell is a grid of a 216px sticky glass rail and the page (max 1900px, side gutter clamp(16px, 2.4vw, 34px)); the rail can collapse to give the page the full width. A top bar runs across the page: the rail toggle, a cream pill search (max 380px), the household pill and the avatar, over a 1px cream hairline. Pages stack glass panels with a 19 to 20px gap; card collections are an auto-fill grid of `minmax(min(100%, 17rem), 1fr)` with a 20px gap. Hoje is a 2.1fr / 1fr grid of panels. Under 900px the rail and household pill disappear, the bar becomes logo, search and a 42px glass menu button that drops a sheet from the top, and a five-slot glass tab bar is fixed to the bottom, clear of the safe area. Under 640px, photo cards become compact rows with the thumbnail on the left.

**Site.** One column of max 76rem, side gutter clamp(20px, 4.5vw, 64px), full-bleed bands whose content stays on that column. Sections are generous (clamp(4.5rem, 9vw, 8rem) top and bottom). The hero fills up to 100svh with the photograph on the right and a glass "one day in the app" strip at its foot. Story rows alternate 5:8 and 8:5, copy against a capture. Under 900px everything goes to one column, the hero photograph shows clear at the top with the text on forest below, and the tour tabs become a horizontal scroller that fades at the right edge. The header collapses to a menu toggle under 860px.

**The One Scene Per Area Rule.** Each app area has its own photograph (Hoje, Despensa, Plano, Compras, Cozinhar, Receitas, Ementas, Nutrição, Produtos, Promoções, Casa), and the site's inner page heads reuse the same scenes. A new area gets its own scene, under the same veil.

**The Paper For Reading Rule.** On the site, dark green bands frame (header, hero, tour, page heads, footer) and paper carries the reading (story, feature lists, guide, forms). Don't run long text on green.

## Elevation & Depth

Depth is atmospheric and layered: photograph, veil, glass, content. Shadows exist but are soft, wide and always green-black (`rgb(6 23 14)` in the app, `rgb(16 44 35)` on the site), never grey and never hard-edged. Glass panels carry a gentle ambient shadow with a 1px inner highlight on the top edge; cards lift on hover; captures on the site float on a long negative-spread shadow.

### Shadow Vocabulary
- **Glass** (`box-shadow: 0 12px 36px rgb(6 23 14 / 0.22), inset 0 1px 0 rgb(255 255 255 / 0.1)`): every glass panel at rest.
- **Lift** (`box-shadow: 0 14px 38px rgb(6 23 14 / 0.3)`): a whole-card link on hover, with `translateY(-3px)`. Small photo cards use `0 8px 20px rgb(6 23 14 / 0.25)`.
- **Plaque** (`box-shadow: 0 6px 18px rgb(6 23 14 / 0.25)`): the logo plaque and the phone menu button (`0 4px 14px rgb(6 23 14 / 0.28)`).
- **Capture** (`box-shadow: 0 36px 60px -34px rgb(16 44 35 / 0.6), 0 12px 22px -14px rgb(16 44 35 / 0.32)`): app screenshots on the site's paper; `0 40px 70px -36px rgb(0 0 0 / 0.7)` on green.

### Named Rules
**The Flat Inside Glass Rule.** Glass is one layer deep. A panel inside a panel loses its blur and shadow and becomes a 6% cream wash (`rgb(255 255 240 / 0.06)`); lists inside panels lose their box entirely.

**The Lift Means Link Rule.** Only something you can open as a whole (a product, recipe or photo card) lifts on hover. Panels, rows and buttons don't move.

## Shapes

Soft and consistent within each surface. In the app, controls (buttons, fields, rail links, row actions) are 7px, photo cards and small thumbnails 9px, glass panels and photo-topped cards 16px, the phone tab, menu button and logo plaque 12px. Chips and badges are pills (25px and 20px, effectively round), the search is a 30px pill, avatars and the rail toggle are circles. On the site, controls and notices are 10px, captures 14px, large boxes (demo card, story scene, the "after" box) 18px, chips and the caption over a scene are pills, tags 5px, phone captures 30px with a 6px forest bezel. Photographs inside cards run edge to edge with square inner corners, clipped by the card. Icons are inline SVG strokes.

## Components

### Buttons
Small, firm green slabs in the app; larger sage slabs on the site.
- **Shape:** gently rounded (7px app, 10px site).
- **Primary (app):** bottle green with a 1px sage-cream edge (`rgb(214 223 203 / 0.55)`), cream 12px/600 text, padding 11px 17px (13px 20px large). Hover presses to the darker green.
- **Secondary (app):** muted sage with dark green text and a lighter sage edge; hover lightens.
- **Danger (app):** rust fill with cream text.
- **Primary (site):** sage with dark green ink, 46px tall (56px large), 0.94rem/600. Hover lightens to sage light; active nudges down 1px; a trailing arrow slides 4px right on hover.
- **Dark (site):** bottle green, hover to forest. **Ghost (site, on green):** 8% cream wash with a cream hairline and an 8px blur. **Outline (site, on paper):** 1px ink border, 7% ink wash on hover.
- **Links:** butter 700 in the app, underlined on hover; on the site, 600 with a 1px underline at 40% that firms up on hover.
- **Focus:** a 2px outline (cream, the app's `--ink`, across the app; gold light on the phone bar and menu; bottle green on paper and sage on green on the site), offset 2 to 3px.

### Chips
- **Style:** pills. App chips are 8px 15px, 12px, on the glass wash with a cream hairline; site chips are 44px tall with a cream hairline on green.
- **State:** selected fills bottle green (app) or sage with ink (site); hover is a 10% cream wash.
- **Badges (app):** sentence-case pills, pale sage ground with dark green text; pending uses the gold-light ground.
- **Cooked mark (app):** a 24px sage circle with a dark green check, top-left over a recipe card's photograph. It is informational only: the text ("cooked 2 times, last on …") shows in a forest tooltip on hover or keyboard focus, never as a label on the card.

### Cards / Containers
- **Corner Style:** 16px glass panels and product/recipe cards; 9px photo cards; 18px boxes on the site.
- **Background:** the glass gradient over the area photograph; when a browser can't blur, a solid `rgb(23 57 44 / 0.88)`.
- **Shadow Strategy:** glass shadow at rest, lift on hover for whole-card links (see Elevation & Depth).
- **Border:** 1px glass edge.
- **Internal Padding:** clamp(1rem, 2vw, 1.5rem) for panels, 18px for card bodies. Product and recipe cards put the photograph on top (185px or 16:10) and the text under it; a missing photo shows a faint drawn bowl, never an empty grey box.

### Inputs / Fields
- **Style (app):** translucent forest (`field-glass`) with a cream hairline, 7px corners, cream text, light placeholders. The search is the exception: a cream pill with dark text.
- **Style (site):** cream ground, 1px ink border at 40%, 10px corners, 1rem text, green caret.
- **Focus:** the border turns bottle green with a 2px green outline on the site; in the app the border turns cream with a 1px cream ring.
- **Error:** clay text on a 9% clay wash on the site; coral on glass in the app.

### Navigation
- **Rail (desktop app):** 216px of forest glass with a 16px blur and a cream hairline on the right, the logo plaque, a small tracked tagline, groups split by white hairlines, 14px/500 links with 19px icons. Hover and active are a 10% white wash; active adds the 3px gold inset. The user sits at the foot beside a gold dot.
- **Tab bar (phone app):** five slots of 23px icon over 11.5px/600 label, at least 54px tall, on forest glass with a 22px blur; active takes a 10% cream wash and a 3px gold bar above.
- **Top menu (phone app):** a 42px glass square opens a sheet that drops from the top (0.42s, cubic-bezier(0.16, 1, 0.3, 1)) and leaves faster (0.22s).
- **Site header:** transparent over the hero, solid forest with a hairline after scroll; 0.94rem/500 links that underline on hover, a PT/EN switch, the sage call to action on the right.

### Glass Panel over a Scene (signature)
The defining object: a frosted panel over the area's photograph. Some panels carry a second photograph inside, masked in from the right edge (the "edge photo"), so the kitchen continues behind the content. On the site the same object appears as the hero's glance strip, a glass band over the photograph showing one day in the app.

### Demo Tour Card
Demo build only. The welcome dialog is a centred forest-gradient box (16px corners) over a blurred, darkened scene, with a serif title and one name field. The step card sits bottom right (16px gutter on phones, 360px wide at most), never over the whole page: tracked sage eyebrow ("Step 3 of 8"), a row of 3px progress segments (done in sage), a short sage "Done: …" line after a step finishes, a 23px serif title, and a sage primary button that leads to the right page. It shrinks to a pill with a pulsing sage dot, and while it is open the page gets extra bottom padding, so it never hides the last controls.

### Price Verdict
Prices are serif numerals. The 90-day verdict is a row of four small squares from cheapest to dearest with the current cell filled (sage on the site), and the range is a 2px hairline with a tick at the average and a dot at today's price.

## Do's and Don'ts

### Do:
- **Do** put an area photograph behind every app page and a green veil between it and the text.
- **Do** set content on glass panels (16px corners, 1px cream edge, glass shadow) and flatten any panel nested inside one.
- **Do** use Libre Caslon Display at 400 for titles, prices and big numerals, and DM Sans for everything else.
- **Do** mark the current place with gold and only with gold.
- **Do** keep the logo in its own colours on the cream plaque.
- **Do** use soft, green-black shadows, and lift only whole-card links on hover.
- **Do** turn photo cards into compact thumbnail rows on the phone and keep the tab bar within thumb reach.

### Don't:
- **Don't** put an eyebrow or kicker above a heading.
- **Don't** put text straight on a photograph without the veil.
- **Don't** set the serif in bold, in uppercase, or for body, buttons or labels.
- **Don't** use hard-edged, offset or grey shadows.
- **Don't** nest blurred glass inside blurred glass.
- **Don't** set running text or meta lines below 12px; only the phone tab labels (11.5px, under their icons) go smaller.
- **Don't** bring back the Folha do Dia: condensed Archivo numerals, 6px ink rules, calendar red, the pale teal frame.
