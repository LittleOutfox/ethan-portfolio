---
name: Ethan Tiong — portfolio
description: A datasheet set in moonlight; the author's fox drawing rebuilt as a field of cold-light points.
colors:
  ground: "#070b14"
  ground-plate: "#0b1220"
  ground-raised: "#111a2e"
  text: "#e8eef7"
  text-secondary: "#a9b6cc"
  text-tertiary: "#7c8aa5"
  moon: "#f4f7fb"
  ice: "#9fd8ff"
  ice-deep: "#4fa8e8"
  violet: "#b9a7f0"
  snow: "#c9d8ea"
  hairline: "rgb(159 216 255 / 0.14)"
  hairline-strong: "rgb(159 216 255 / 0.28)"
  scrim: "rgb(7 11 20 / 0.72)"
typography:
  display:
    fontFamily: "Newsreader, 'Times New Roman', Georgia, serif"
    fontSize: "clamp(2.75rem, 5.6vw, 5.5rem)"
    fontWeight: 470
    lineHeight: 0.98
    letterSpacing: "-0.015em"
    fontVariation: "opsz auto"
  heading:
    fontFamily: "Newsreader, 'Times New Roman', Georgia, serif"
    fontSize: "clamp(2rem, 3.4vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "-0.01em"
  heading-quiet:
    fontFamily: "Newsreader, 'Times New Roman', Georgia, serif"
    fontSize: "clamp(1.5rem, 2.4vw, 1.75rem)"
    fontWeight: 400
    lineHeight: 1.06
  title:
    fontFamily: "Newsreader, 'Times New Roman', Georgia, serif"
    fontSize: "clamp(1.375rem, 1.8vw, 1.75rem)"
    fontWeight: 430
    lineHeight: 1.2
  lede:
    fontFamily: "Newsreader, 'Times New Roman', Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1.45
  role:
    fontFamily: "'Schibsted Grotesk', Arial, Helvetica, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 500
    lineHeight: 1.35
  body:
    fontFamily: "'Schibsted Grotesk', Arial, Helvetica, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0.005em"
  meta:
    fontFamily: "'Schibsted Grotesk', Arial, Helvetica, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Schibsted Grotesk', Arial, Helvetica, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  note:
    fontFamily: "Newsreader, 'Times New Roman', Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
    fontVariation: "italic"
  data:
    fontFamily: "'Azeret Mono', Consolas, 'Courier New', monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.01em"
    fontFeature: "tabular-nums"
  signature:
    fontFamily: "'Noto Serif SC', 'Songti SC', SimSun, serif"
    fontSize: "0.9375rem"
    fontWeight: 300
    letterSpacing: "0.3em"
rounded:
  hairline-corner: "2px"
spacing:
  s-1: "0.25rem"
  s-2: "0.5rem"
  s-3: "0.75rem"
  s-4: "1rem"
  s-5: "1.5rem"
  s-6: "2rem"
  s-7: "3rem"
  s-8: "4rem"
  s-9: "6rem"
  s-10: "8rem"
  section: "clamp(5rem, 9vw, 7.5rem)"
  section-large: "clamp(8rem, 16vw, 14rem)"
  section-tight: "clamp(3.5rem, 6vw, 5rem)"
  block: "3rem"
  group: "1.5rem"
  inline: "0.75rem"
  gutter: "clamp(1.25rem, 5vw, 4.5rem)"
  col-gap: "1.5rem"
  nav-h: "64px"
  control-h: "44px"
components:
  button-outlined:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline-corner}"
    padding: "0 1.5rem"
    height: "44px"
  button-outlined-hover:
    backgroundColor: "{colors.ground-raised}"
    textColor: "{colors.moon}"
    rounded: "{rounded.hairline-corner}"
    padding: "0 1.5rem"
    height: "44px"
  link-text:
    textColor: "{colors.text}"
    typography: "{typography.body}"
  link-text-hover:
    textColor: "{colors.ice}"
    typography: "{typography.body}"
  nav-link:
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline-corner}"
    padding: "0 0.75rem"
    height: "44px"
  nav-link-hover:
    textColor: "{colors.moon}"
    typography: "{typography.label}"
    height: "44px"
  nav-bar-scrolled:
    backgroundColor: "rgb(7 11 20 / 0.92)"
    height: "64px"
  menu-sheet:
    backgroundColor: "{colors.ground-plate}"
    textColor: "{colors.text}"
    padding: "0 clamp(1.25rem, 5vw, 4.5rem)"
  menu-sheet-link:
    textColor: "{colors.text}"
    typography: "{typography.heading-quiet}"
    height: "56px"
  project-plate:
    backgroundColor: "rgb(11 18 32 / 0.6)"
    textColor: "{colors.text}"
    rounded: "0"
    padding: "3rem 2rem"
  input-byte:
    backgroundColor: "{colors.ground-plate}"
    textColor: "{colors.text}"
    typography: "{typography.data}"
    rounded: "{rounded.hairline-corner}"
    width: "3.5rem"
    height: "44px"
  skip-link:
    backgroundColor: "{colors.ground-plate}"
    textColor: "{colors.moon}"
    rounded: "{rounded.hairline-corner}"
    padding: "0.5rem 1rem"
  hairline-row:
    textColor: "{colors.text-secondary}"
    padding: "1.5rem 0"
  data-cell:
    textColor: "{colors.text-tertiary}"
    typography: "{typography.data}"
---

# Design System: Ethan Tiong — portfolio

## Overview

**Creative North Star: "A datasheet in moonlight"**

The page is a calmly set document in the grammar a hardware hiring manager reads daily (a title block, hairline ledgers, one raised plate, a timing figure) laid on a midnight-navy sheet. The only light on the page is a field of cold points that forms the author's own sitting fox in the first viewport, releases into traces and snow as the reader scrolls, and gathers again as the bowing fox beside Contact. One moon wash crosses the sky over the length of the page; a mist band rests in the lower viewport. Everything else is ink on paper: text, 1 px ice-tinted rules, and a single outlined control.

Density is editorial rather than dashboard: wide gutters, a 12-column grid, fixed measures per role (44ch hero standfirst, 62ch bio, 60ch project description), and more space above a heading than below it. The DOM never animates in. Nothing fades up, slides, or staggers; the only things that move are the point field (scrubbed to scroll, never timed), the moon wash (scroll-driven transform), and feedback transitions on hover and focus. Under Pause or reduced motion the field renders one still, page-anchored frame.

Recorded as the world's refusals, each confirmed by the shipped build: no cards, no radius above 2 px, no gradient text, no blur, no glass, no drop shadows, no eyebrow labels, no section numbers or chapter names, no glyph icons, no purple glow.

**Key Characteristics:**
- Ice `#9fd8ff` is illumination. It is text exactly once (the hero role line) and otherwise lives in the point field, the hairlines (at 14% and 28%), focus rings and link underlines.
- Violet `#b9a7f0` appears only at the fox's tail-tip points and in `::selection`.
- One luminance ramp: tone is point density; the densest overlap is the highlight; there is no separate glow pass and no CSS glow.
- Hairline rows (`1px solid` at 14%, a 28% rule to open a list) are the one structural grammar shared by ledgers, spec lists, the facts `dl`, the footer and the fox's ground rule.
- Two curves, three durations: `cubic-bezier(0.16, 1, 0.3, 1)` for movement, `cubic-bezier(0.25, 1, 0.5, 1)` for fades; 140 / 280 / 720 ms; all three collapse to 0 ms under `prefers-reduced-motion`.
- Every shipped raster is derived from the author's drawings by a checked-in script and carries its provenance.

## Colors

Midnight navy and blue-black grounds (never grey), soft white text, one ice illuminant, one violet accent reserved for tail tips and selection.

### Primary
- **Ice** (`ice`): the field's body colour and halo, the hero role line (the one place it is set as text), link-underline hover, the focus outline, caret and tap highlight, the thin scrollbar thumb (`rgb(159 216 255 / 0.22)`), and the ice-tinted hairlines derived from it.
- **Ice Deep** (`ice-deep`): underline colour of text links and the Contact email at rest; brightens to Ice on hover.

### Secondary
- **Violet** (`violet`): the fox's tail-tip points (shader `uColorTip`, blended in over the last 18% of geodesic distance from the nose) and `::selection` at 35% over the ground. Nowhere else.

### Tertiary
- **Snow** (`snow`): released-point colour in the shader (`uColorSnow`) when the fox lets go; not a CSS colour.
- **Moon** (`moon`): the brightest white. The display name, the wordmark, the Contact email, the point core (`uColorCore`), button text on hover.

### Neutral
- **Ground** (`ground`): the page. Also `theme-color`.
- **Ground Plate** (`ground-plate`): the menu sheet, the skip link, the byte input; at 60% opacity it is the one raised project plate.
- **Ground Raised** (`ground-raised`): the outlined button's hover fill; at 55% it is the base of the mist band gradient.
- **Text** (`text`), **Text Secondary** (`text-secondary`), **Text Tertiary** (`text-tertiary`): the three text tones. Headings, titles, labels and `dd` values are Text; body copy, roles and stack lines are Secondary; meta, data, years, `dt` terms, notes and the signature are Tertiary. Body contrast on the rendered navy stays at or above 4.5:1; the hero block carries a feathered navy scrim (`scrim`) so field points never pass beneath type.
- **Hairline** / **Hairline Strong** (`hairline`, `hairline-strong`): ice at 14% for row dividers, 28% for the rule that opens a ledger, the button border, the fox's ground rule, and the scrolled nav's bottom edge (drawn as a `0 1px 0` box-shadow, the only box-shadow in the system).

### Named Rules
**The One Ice Line Rule.** Ice is set as text exactly once on the page: the hero role line. Every other appearance of Ice is illumination (points, hairlines, underlines, focus), never copy.

**The Tail-Tip Rule.** Violet is never a UI colour. It exists in the tail tips of the fox and in `::selection`, and nothing else may borrow it.

**The Navy, Never Grey Rule.** Every ground is a blue-black (`#070b14`, `#0b1220`, `#111a2e`). No neutral grey surface, no pure black, no white surface.

## Typography

**Display Font:** Newsreader, variable optical size, instanced 400–520 (fallback Times New Roman / Georgia, metric-matched at 104%)
**Body Font:** Schibsted Grotesk, instanced 400–500 (fallback Arial / Helvetica, metric-matched at 98%)
**Data Font:** Azeret Mono 400, tabular numerals
**Signature Font:** Noto Serif SC 300, subset to the four glyphs 以狐为引, footer only

**Character:** A serif with optical sizing for the name and headings, a plain grotesk for everything read, a monospace confined to measurements. All four faces are self-hosted WOFF2, subset by `scripts/make-fonts.py`, `font-display: swap` with metric fallbacks; only the display and body faces are preloaded.

### Hierarchy
- **Display** (470, `clamp(2.75rem, 5.6vw, 5.5rem)`, 0.98, −0.015em, Moon): the name, once. Optical sizing on; renders at roughly 80 px at 1440.
- **Heading** (400, `clamp(2rem, 3.4vw, 3rem)`, 1.06, −0.01em): section `h2`s, with `3rem` below before content.
- **Heading Quiet** (400, `clamp(1.5rem, 2.4vw, 1.75rem)`, 1.06): the Off the clock `h2`, which sits beside its list rather than above it; also the size of menu-sheet links.
- **Title** (430, `clamp(1.375rem, 1.8vw, 1.75rem)`, 1.2): project titles, skill names.
- **Lede** (400 serif, 1.375rem, 1.45): the first About paragraph.
- **Role** (500 grotesk, 1.375rem, 1.35, Ice): the hero role line. A one-element role.
- **Body** (400, 1.0625rem, 1.65, Text Secondary): standfirst, bio, descriptions, skill lines; measure 44ch / 62ch / 60ch by course.
- **Meta** (400, 0.9375rem, 1.5, Text Tertiary): project meta and stack lines, status line, footer colophon, `dt` terms.
- **Label** (500, 0.9375rem, 1.4, +0.01em, Text): form labels, hobby names, nav links, button and action text. Never uppercase.
- **Note** (400 italic serif, 1.0625rem, 1.5, Text Tertiary): the one-line aside under a skill.
- **Data** (400 mono, 0.8125rem, 1.5, +0.01em, tabular, Text Tertiary): years in the experience ledger, measured parameters, the byte input and readout. Never headings or prose.
- **Wordmark** (500 serif, 1.0625rem, Moon): the nav's left anchor.

### Named Rules
**The Data-Only Mono Rule.** Azeret Mono is reserved for measurements, years and identifiers. It never sets a heading, a label or a sentence.

**The Measure-Per-Course Rule.** Each course of text has a fixed measure matched to its role: 44ch for the hero standfirst, 62ch for the bio, 60ch for a project description.

**The No-Eyebrow Rule.** Headings stand alone. No kicker, eyebrow, section number or uppercase tracking above them; hierarchy is carried by size, face and space.

## Layout

A 12-column grid (`repeat(12, minmax(0, 1fr))`, 1.5rem column gap) inside a container of `min(100% − 2 × gutter, 1560px)` with a fluid gutter `clamp(1.25rem, 5vw, 4.5rem)`. The fixed, transparent nav is 64 px; `scroll-padding-top` is 64 px + 1rem on `html` so every anchor, skip-link jump and keyboard focus clears it.

Hero at 1440×900: the title block in columns 1–5 (max 34rem, vertically centred, 4rem above and 14svh below), the fox plate in columns 6–12 aligned to the bottom with a 15svh margin, standing on a 1px strong hairline. Below 1280 px the block widens to 6 columns and the plate to 7–12. Below 960 px the hero becomes a single column in reading order: name, role, standfirst, facts, actions, then the fox as a full-bleed figure (`width: 100% + 2 × gutter`) between the actions and About, so type never sits over points.

Section rhythm: `clamp(5rem, 9vw, 7.5rem)` above each section; Projects opens with the large interval `clamp(8rem, 16vw, 14rem)` (the page changes tempo at the work); Off the clock uses the tight interval `clamp(3.5rem, 6vw, 5rem)` and sets its heading in columns 1–3 beside a list in 5–11. Ledgers (Experience, Skills) span 9 of 12 columns; the About prose spans 7. Within blocks: 3rem between a heading and its content, 1.5rem between paragraphs, 0.75rem inline. Spacing is a 4 px base (0.25rem through 8rem) with semantic steps for section, block, group and inline.

Experience rows: `7rem / minmax(0, 14rem) / 1fr` for year, organisation, role with baseline alignment and 1.5rem vertical padding; on phones they stack. Skills entries: 4fr / 5fr. The project plate is 7fr / 5fr with the UART figure spanning both columns beneath. Everything collapses to one column below 960 px.

Breakpoints observed: 1280 px (hero column shift, project plate goes full width) and 960 px (single column, menu sheet replaces inline nav links, fox release follows the figure rather than the viewport).

## Elevation & Depth

Flat. There are no drop shadows anywhere; the only `box-shadow` values are the scrolled nav's 1 px hairline bottom edge (`0 1px 0 var(--hairline)`) and the focus ring's 5 px ground-coloured halo that separates the outline from whatever is beneath it. Depth is carried by three things: tonal layering (the 60% navy plate over the ground, the 92% ground behind the scrolled nav, the 60% ground `::backdrop` behind the menu sheet), the atmosphere (a fixed moon wash, `radial-gradient` of ice at 7.5% → 3% → transparent, 120vw wide, translated by `transform` alone from 12% to 85% across the viewport as the page scrolls; and a fixed 32vh mist band from `rgb(17 26 46 / 0.55)` to transparent with a 1.5% fractal-noise grain, screen-blended, present only where the mist is), and the point field itself, whose luminance rises 12% on the moonlit side.

### Named Rules
**The No Glow Pass Rule.** Tone is point density. The field's brightness comes from overlapping two-lobe sprites (tight core, 12% halo) drawn additively; there is no bloom, no CSS `filter`, no `backdrop-filter`, no `text-shadow`.

**The Grain Only in the Mist Rule.** The 1.5% noise lives on the mist band's pseudo-element and nowhere else. The ground, plate and sheet are clean.

## Shapes

Rectilinear. The single radius is 2 px and it is applied only where a stroke closes a box: the outlined button, the byte input, the skip link, the focus ring and nav-link hit areas. Everything else is square. Rules are 1 px, ice-tinted, and come in two weights (14% divider, 28% opener). The one raised plate has top and bottom hairlines and no side borders. Projected (expected) experience rows are marked with a 1 px dashed strong hairline above. Drawn icons (one: the external-link arrow) use a 1.25 stroke, square caps, on a 16-unit grid, and inherit `currentColor`. The UART figure is 1 px strokes, no fill, no radius.

## Components

### Buttons
- **Shape:** hairline corner (2px radius), `1px solid` strong hairline border, 44 px minimum height, `0 1.5rem` padding, inline-flex with 0.5rem gap for the icon.
- **Outlined (the one control):** transparent over the ground, Text colour, Label type (500 / 0.9375rem). Used once: "View résumé", with the external-link icon. On phones it spans the full width.
- **Hover / Active:** fill Ground Raised, border ice at 45%, text Moon; 140 ms fade curve. Active repeats the fill.
- **Focus:** the global ring: 2 px ice outline, 3 px offset, 5 px ground halo.

### Text links
- Underlined in Ice Deep, 1 px thickness, 0.18em offset; text colour Text. Hover and active brighten both text and underline to Ice over 140 ms. Hero and Contact links are Label weight with a 44 px hit height. External links append a visually hidden "(opens in a new tab)".
- **Contact email:** the same link grammar set in the display face at `clamp(1.5rem, 2.6vw, 2.25rem)`, Moon, 0.16em underline offset, `overflow-wrap: anywhere`.

### Hairline rows (ledgers, spec lists, facts)
- A list opens with a 28% rule and each row closes with a 14% rule. Experience rows are 1.5rem padding, baseline-aligned, 4.5rem minimum height, and a hover that lights the nearest released trace in the field (Pause and reduced motion exempt). Spec list items are Data type with 0.5rem padding. The hero facts `dl` is a two-column run-in (`max-content / 1fr`) with a single rule under the whole group.

### Cards / Containers
- There are no cards. The one raised surface is the lead project plate: Ground Plate at 60%, top and bottom strong hairlines, no side borders, no radius, `3rem 2rem` padding (2rem / 1rem on phones), bled 2rem into the left gutter on desktop.

### Inputs / Fields
- **Byte input (UART figure):** 3.5rem wide, 44 px tall, Ground Plate fill, strong hairline border, 2 px radius, Data face at 1rem (the iOS no-zoom floor), centred text. Hover lifts the border to ice 45%; focus takes the global ring. Paired with a Label and a Data readout.

### Navigation
- Fixed 64 px transparent bar; once scrolled past 48 px it fills to ground at 92% with a 1 px hairline edge (280 ms fade). Wordmark left (serif 500, Moon, 44 px tall). Links right: Label type, Text Secondary, 44 px tall, 0.75rem side padding; hover Moon, active Ice. The Pause control sits last in Text Tertiary and turns Ice when paused; its label is the state ("Pause motion" / "Resume motion"), no `aria-pressed`.
- Below 960 px the links collapse to a "Menu" button that opens a native `<dialog>` sheet: full-viewport Ground Plate, ground `::backdrop` at 60%, hairline list of 56 px rows set in the display face at 1.5rem, followed by GitHub, LinkedIn, email and the Pause control. With JavaScript off the sheet is not used; the links stay in the bar, wrap, and the header becomes static so it cannot cover the name.
- **Skip link:** fixed top-left, Ground Plate with a strong hairline border, Moon text, translated off-screen until focus-visible (280 ms move curve).

### The fox field (signature component)
- One `THREE.Points`, one geometry, one material, one draw call, additive blending, screen-space positions in CSS px anchored to two DOM plates (`[data-plate="a"]` hero 512:381, `[data-plate="b"]` contact 512:456) so the poses land exactly on their cells. Colours: body Ice, tip Violet (last 18% of geodesic distance), snow `#c9d8ea`, core Moon.
- **Tiers** decided before the WebGL chunk loads: high 60 000 points / DPR cap 1.75 / 4.2 px; medium 34 000 / 1.5 / 4.2 px; low 16 000 / 1.25 / 3.8 px and hero-only (no Gather, field fades out past About); none when WebGL2 is unavailable, a software rasteriser is detected, or Save-Data is on. Coarse pointers, ≤ 4 cores, < 4 GB or a weak mobile GPU take low; ≤ 8 cores, < 8 GB, Intel or integrated-class GPUs take medium. Three long frames (> 25 ms) in a row regress the pixel ratio toward 1 until frames recover. `?tier=high|medium|low|none` forces a tier; `?motion=reduce` forces the reduced-motion path.
- **Three scrubbed moments:** Resolve (the arrival: the fox forms nose-first over ~1.8 s on first load, once per visit), Release (formA sweeps 1.3 → −0.3 across the first 80% of a viewport of scroll on desktop, or as the hero figure leaves the viewport on phones; tail tips let go first along an arc, never a straight line), Gather (formB sweeps −0.3 → 1.3 as Contact approaches from 140% to 20% of the viewport; the poster hands over at a third formed). Between Skills and Contact the field fades to zero and the render loop sleeps. Every scrubbed value is integrated with `k = 1 − 0.001^dt` (about 100 ms time constant), never snapped.
- **Pulses:** a luminance packet runs nose-to-tail every 6 s; a pointer over a plate injects a ring pulse (900 px/s, 60 px width, 1.4 s decay), throttled to one per 400 ms for mouse move. Released traces carry slow packets and brighten beside a hovered Experience row.
- **Still frame:** Pause (persisted in `localStorage` under `motion`) or `prefers-reduced-motion` switches the frameloop to demand mode: drift 0, formed fox at full, one frame per scroll or resize so the page-anchored poses leave with their sections. No clock runs.
- **Posters beneath:** `/fox/sitting-poster.webp` (648×482) loads with `fetchpriority="high"`; `/fox/bowing-poster.webp` (648×577) lazily. They fill the cells exactly (`object-fit: fill`) and fade out over 720 ms once `[data-live]` is set, so the crossfade is invisible. They are the whole fox for no-JS, no-WebGL, low-tier Contact and failed-chunk paths.

### Raster provenance
Every shipped raster is generated from `art/kitsune/*.svg` (the author's seven drawings; not shipped) by a checked-in script:
- `public/fox/{sitting,bowing}.png`: 512 px sampling masks (R density, G geodesic distance from the nose, B ink) baked by `scripts/bake-fox-masks.mjs` on 2026-09-12; each has a `.json` sidecar recording source SVG, viewBox, mask size, ink bbox, nose position, ink pixel count, max geodesic and the poster's parameters.
- `public/fox/{sitting,bowing}-poster.webp`: rendered by `scripts/make-posters.mjs` on 2026-09-12 from the masks with the field's own material (60 000 points, 4.2 px at 2× → 8.4, same colours, same sRGB-encoded premultiplied alpha); provenance recorded under `poster` in each sidecar.
- `public/favicon.svg`, `favicon-32.png`, `favicon-64.png`, `apple-touch-icon.png`: the sitting fox's head cut from the drawing by `scripts/make-favicons.mjs`, white ink `#e8eef7` on ground `#070b14`.
- `public/og.png` (1200×630): a capture of the finished hero (commit `bafc2f3`); no generating script.

## Do's and Don'ts

### Do:
- **Do** set every rule as `1px solid` ice at 14% (dividers) or 28% (openers, borders, the ground rule); open a list with the strong rule and close each row with the light one.
- **Do** keep the DOM static: no entrance animation, no stagger, no scroll-triggered reveal. Motion belongs to the point field, the moon wash's `transform`, and 140 ms hover/focus fades.
- **Do** use exactly two curves and three durations: `cubic-bezier(0.16, 1, 0.3, 1)` for movement, `cubic-bezier(0.25, 1, 0.5, 1)` for fades; 140 / 280 / 720 ms; all zero under reduced motion.
- **Do** give every interactive element a 44 px minimum hit height and the global focus ring (2 px ice, 3 px offset, 5 px ground halo).
- **Do** label state in words ("Pause motion" / "Resume motion", "(expected)", "(opens in a new tab)"), never by colour alone.
- **Do** set measurements, years and identifiers in Data (Azeret Mono, tabular) and everything read in Schibsted Grotesk.
- **Do** keep the fox anchored to a DOM plate with a hairline ground rule and a poster beneath; a new pose needs a mask, a sidecar and a poster from the same scripts.
- **Do** keep `scroll-padding-top` at nav height + 1rem and the skip link, `main`, and `footer` landmarks intact.

### Don't:
- **Don't** set Ice as text anywhere but the hero role line, and don't use Violet outside tail tips and `::selection`.
- **Don't** add cards, glass, blur, `backdrop-filter`, drop shadows, gradient text, or any radius above 2 px.
- **Don't** add eyebrows, kickers, section numbers, chapter names or uppercase tracked labels above headings.
- **Don't** use glyph or icon-font icons; draw them at 1.25 stroke with square caps in `currentColor`.
- **Don't** add a glow pass, bloom, `text-shadow` or CSS glow; the field's tone is density alone.
- **Don't** let grain appear outside the mist band, or raise it above 1.5%.
- **Don't** animate the field on a clock when Pause or reduced motion is active; render one still frame per scroll or resize.
- **Don't** use a grey, black or white surface; every ground is one of the three navies.
- **Don't** ship a raster without a generating script and recorded provenance.
