# Portfolio V2 — redesign and rebuild plan

## Context

The current site (`index.html`, `css/styles.css`, `js/main.js`, vanilla, no build step) is a scroll-story: a loading gate, an 8 MB scroll-scrubbed forest video, seven hand-drawn fox SVGs with baked glow, Cormorant/Inter/Noto SC, lilac-on-obsidian, chapters named Awakening / The Hunt / The Leap / The Den / Transformation / The Snowfield, four pinned scenes, ~17,800 px tall. It is handsome and well engineered, and it is exactly the genre the brief rejects: a title card that says ORIGIN instead of the person's name, fantasy forest art, Japanese shrine-gate frames around projects, an eyebrow label and 01/02/03 numbering above every heading, experience buried at chapter five behind three pinned scenes, and a phone view whose project section shows empty gate frames between items.

The brief asks for a V2 that presents Ethan as a serious RTL / FPGA / ASIC engineer, keeps the fox identity but reinterprets it with maturity, adopts a moonlit-winter mood (midnight navy, icy cyan light, soft white, restrained violet, mist and snow), uses 1–3 genuinely special WebGL moments built with Three.js + React Three Fiber, and is art-directed rather than templated. A recruiter must get who / what kind of engineer / what was built / where worked / depth / contact within seconds.

This plan was produced after a full audit (every file read, current site screenshotted at 1440×900 and 390×844, fox drawings sampled for ink density), a research fan-out over the installed skills (R3F/Three rules, Vercel React rules, craft floor, accessibility, fonts), three independently designed directions, and adversarial judging. It records the chosen direction, the design system, the architecture, and the build/verification sequence.

## What the audit found

**Keep (strongest identity):** the seven original line drawings (especially `sitting.svg`, `howling.svg`, `bowing.svg`), the fox-as-signal idea, the "Designed & built by hand" stance, the reduced-motion / no-JS discipline, the motion voice (two curves, three durations), the self-hosted-font discipline, all factual content.

**Retire:** the loading gate and veil, the forest video, the torii-gate project frames, chapter names and hanzi watermarks, the ORIGIN wordmark as h1, section numbers and the 卷 progress rail, the horizontal skills scroll, the per-section "short clause / italic clause" headline template, the aphorism copy, the emoji favicon, the 15 px / weight-300 body text, `--moon-faint` (≈2.3:1 contrast) as a text colour, the Chinese numerals on skill cards, Cormorant Garamond and Inter.

**Fix:** content order for recruiters; page height (no pinned scenes except a short hero scrub); mobile as its own composition; `font-display: block` (only worked because the gate hid it); focus rings and tap targets under 44 px.

**Facts verified during the audit:** the `focus-or-fry` GitHub README describes an end-to-end FPGA telemetry system (UART 115200 8N1, 16× oversampling, 64-entry TX/RX FIFOs, two-flop synchronizer, framing-error detection, self-checking SystemVerilog testbenches that `$fatal`, Vivado, Artix-7 on a Digilent Basys 3, STM32F401RE firmware, 11 Verilog modules, 7+ testbenches). These real specifics will replace the current one-liner. The `previous-attempt` branch holds placeholder content and is never used as a source.

## The direction: the fox as a signal net, on a document a hardware engineer would read

Three directions were designed independently (an editorial monograph "Marginalia", a cinematic 3D-first film "Resolve", and a datasheet-in-moonlight "Silkscreen") and scored by three adversarial judges (hiring manager, design jury, creative technologist), each out of 50:

| Direction | Hiring manager | Design jury | Creative technologist |
|---|---|---|---|
| Marginalia (monograph) | 35 | 35 | 36 |
| Resolve (cinematic) | 36 | 39 | 35 |
| Silkscreen (datasheet) | **37** | **40** | **40** |

All three judges picked Silkscreen, on the same conditions: graft Resolve's fox choreography and weather (geodesic light propagation, a moon that moves with scroll, snow confined to quiet areas, pointer-injected light, stroke-ordered release, the About paragraph swap) and Marginalia's engineering discipline (prerender as milestone one, no Lenis, the poster as a real image, contrast measured on rendered pixels). They also agreed on what to cut from Silkscreen: the draggable time-axis cursor and its "drag to unfold" caption (instructional chrome, a second writer of the morph), the "Calm" label, the fox-head nav mark, an Experience header row, "Fig. 1" captions on everything, `mix-blend-mode: screen` on the canvas, and skeletonising the autotrace (replaced by the geodesic channel). The synthesis below is that direction with those grafts and cuts applied.

One judge challenged the stack itself: a static DOM plus one `THREE.Points` object needs no React, and vanilla Three + Vite would remove hydration and the prerender step. The brief explicitly prefers the React Three Fiber ecosystem and its skills are installed, so React stays; the cost is one small prerender script, described under Architecture.

**Thesis.** The fox is Ethan's own drawing rebuilt as ~40–60k points of cold light. It is not a mascot: light travels through it the way a signal travels through a net, from nose to tail tips, along the drawn strokes. It forms in the hero facing the name; scrolling releases it tail-first into slow snow and a few quiet routing traces; at Contact the points gather into a second pose as a sign-off. Everything else is a calmly set document, hairlines and tables, the grammar a hardware hiring manager reads daily, under one moon whose position moves with scroll. No gate, no intro, no chapter names, no eyebrows, no cards.

### First viewport (desktop 1440×900)

- Ground `#070B14`, one off-axis moonlight wash (radial, upper-left, ~6% ice), a mist band in the lower quarter (2% tiling noise, screen blend). No painted backdrop.
- Nav, 64 px, transparent at top (gains a `--ground-2` plate after scroll, no blur): wordmark "Ethan Tiong" (Newsreader 500, 17 px) left; right: About · Experience · Projects · Skills · Contact (Schibsted 500, 15 px, Title Case, 44 px targets), Résumé text link, and a real `<button aria-pressed>` "Pause motion".
- Left column (grid cols 1–5): `h1` "Ethan Tiong" (Newsreader, opsz 72, wght ≈450–500, `clamp(2.75rem, 5.6vw, 5.5rem)`); role line "RTL for ASIC & FPGA" (Schibsted 500, 22 px, `--ice`, the only cyan text on the page); standfirst, verbatim from the bio: "I am most drawn to RTL design: latency, throughput, interfaces, timing, and the logic that decides how a system moves." (17 px, `--text-2`, 44ch); a run-in `<dl>` (Program · Based · Status) with one hairline under the whole group, plain text, no dot, no pill; actions: "View résumé" as the page's single outlined control (with the page's only icon, external-link), then GitHub · LinkedIn · ethan.tiong@uwaterloo.ca as underlined text links. A navy scrim sits under the type block so points never pass beneath text below 4.5:1 (verified on rendered pixels at 1024, 1280, 1440).
- Right (cols 6–12): the sitting fox point field, ~46vw wide (674:502), nose pointing up-left toward the name, tails fanning right and exiting the frame, standing on a 1 px hairline ground rule that spans cols 6–12. Positions are frozen while formed; only luminance moves. No caption, no counter, no readout, no scroll cue: the ground rule and the About heading at the fold are the continuation cue. At 1366×768 and 1280×720 the fox box drops to ~560 px wide so it never collides with the type block.
- Before WebGL is ready, the same grid cell holds `sitting-bloom.webp` as a real `<img>` with explicit width/height (it is the LCP element; zero layout shift), composited under the moon wash; the canvas crossfades over it in 720 ms. The canvas uses normal compositing (additive blending happens inside it), never `mix-blend-mode`.

### Section order and compositions

1. **Hero** (above). 100svh. Scrolling the first ~80vh scrubs the stroke-ordered release (tail tips first, nose last): tail strokes flow along short Bezier lead-ins into three to five ragged horizontal signal traces whose vertical positions come from the tail groups' real extents (uneven spacing, ragged right edge, one or two luminance packets per trace, never in phase), confined to the right columns beside About and Experience at ≤20% alpha and fully faded before Projects; about 20% of the points become slow snow in the quiet areas only (the hero's upper third, the outer margins, the quiet band before Skills). Nothing drifts under a text column.
2. **About.** `h2` "About". Lede: the engineering paragraph (verbatim, Newsreader opsz 20, 22 px). Then the snowy-afternoon fox paragraph (verbatim, body). Right column, top-aligned: the facts as a `<dl>` (Based / Focus / Status) in hairline rows. Cols 11–12 empty. Composition breaks the 3/9 template: heading full width, two unequal columns beneath.
3. **Experience.** Full-width `h2`, then five 72 px hairline rows, chronological, no header row (the dates carry the sequence): year in Azeret Mono tabular, organization in Schibsted 500, role in Schibsted 400: 2024 University of Waterloo — Electrical Engineering; 2025 General Dynamics — Embedded Design; 2025 General Dynamics — RTL Design; 2026 ArchES Computing — Low-Latency FPGA Designer; 2029 University of Waterloo — Graduation, dashed rule above, `--text-3`, plus visually-hidden "(projected)". Hovering or focusing a row brightens the signal trace nearest to it (one uniform write; a 1 px hairline highlight instead under reduced motion or touch). No bullets invented; the user is asked (below) whether to add one factual line per role.
4. **Projects.** Asymmetric, no equal cards. *Focus or Fry* gets the wide plate (8 of 12 cols, `--ground-2` fill bounded by top/bottom hairlines only): meta "FPGA telemetry system · Personal · 2025", description rebuilt from README facts, a mono spec list (100 MHz clock · 115200 baud 8N1 · 16× oversampling · 64-entry TX/RX FIFOs · Artix-7 / Basys 3 · Vivado · STM32F401RE), link "focus-or-fry on GitHub", and an inline SVG **UART timing figure**: two lanes (`clk_16x`, `tx`) drawn by a pure, unit-tested function from a byte the reader can change (`<input maxlength=1>`, default "E"): start bit, eight data bits LSB-first, stop bit, 16 ticks per cell, 1 px square-cap strokes, Azeret labels, caption "UART frame, 8N1, 16× oversampled, LSB first. Change the byte to redraw." Protocol facts only. *Quadrature Encoder Block* (retitled from "The Encoder"; verbatim description) sits right in 4 cols, no frame, meta "FPGA · General Dynamics · 2025", no link (employer work). *Calming Teddy Bear* is a single hairline row beneath both with its verbatim description and the "Documentation" link. Behind the section, three low-alpha page-anchored routing traces in WebGL; the trace behind the block in reading position carries the pulse.
5. **Skills.** A definition list, two columns: RTL Design · Verification · Interfaces · Design Flow · Adaptability (verbatim lines; the italic notes kept small in `--text-3`; Adaptability last and quieter). No tiles, icons, rings, or numerals.
6. **Off the clock.** One compact band: the `h2` (a step smaller) as the first cell, then three hairline entries. ~30vh. The page's quiet area.
7. **Contact.** Left: `h2`, the email as the largest link on the page (Newsreader 36 px), GitHub · LinkedIn · Résumé as 44 px links, the line "Open · Winter 2027 co-op · Greater Toronto, open to relocate". Right: the points gather into the second pose (bowing = play-bow greeting, or howling; chosen by eye in the spike), lit from the right because the moon has crossed. Footer colophon: "© 2026 Ethan Tiong · Designed & built by hand · Set in Newsreader, Schibsted Grotesk and Azeret Mono · Fox drawings by the author" and, as a quiet aria-hidden signature, 以狐为引 (the only Chinese kept; see question 3).

### Design system

**Type** (all self-hosted woff2, `font-display: swap`, size-adjust fallbacks, only used weights):
- Display: Newsreader variable (wght + italic, opsz 6–72) — h1 opsz 72; h2 opsz 48; h3 opsz 24; lede opsz 20; italic only for the skill notes.
- Body/UI: Schibsted Grotesk variable — body 400 at 1.0625rem/1.65, +0.005em; nav/labels 500 at 0.9375rem, Title Case, never uppercase-tracked.
- Data: Azeret Mono variable, 0.8125rem, `tabular-nums` — years, spec lists, figure labels only. Banned from headings, nav, body, captions.
- Roles: display `clamp(2.75rem,5.6vw,5.5rem)` (h1 only, under 6rem), heading `clamp(2rem,3.4vw,3rem)`, title `clamp(1.375rem,1.8vw,1.75rem)`, lede 1.375rem, body 1.0625rem, meta 0.9375rem, data 0.8125rem. `text-wrap: balance` on headings, `pretty` on paragraphs. Measure 62ch bio, 60ch project text, 44ch hero.

**Colour tokens:** `--ground #070B14`, `--ground-2 #0B1220`, `--ground-3 #111A2E`, `--text #E8EEF7`, `--text-2 #A9B6CC`, `--text-3 #7C8AA5` (≥5:1 floor), `--ice #9FD8FF`, `--ice-deep #4FA8E8`, `--moon #F4F7FB`, `--violet #B9A7F0` (tail-tip points and `::selection` only, never type, never gradient), `--hairline rgba(159,216,255,.14)`, `--hairline-strong .28`, `--mist`, `--scrim rgba(7,11,20,.72)`, `--focus #9FD8FF`. Shader colours are read from these tokens at init so CSS and GLSL never drift. `color-scheme: dark`, `theme-color #070B14`.

**Surface:** content sits on the ground; no cards, no rounded panels, no glass, no gradient text, no borders thicker than 1 px, one raised plate per section at most. Hierarchy from four devices: hairlines, tables/dl rows, one plate, and space. Buttons: hairline-outlined rectangle, 2 px radius, 44 px tall. Links: 1 px `--ice-deep` underline at 0.18em offset, brighten to `--ice`.

**Spacing:** 4 px base; tokens `--space-section clamp(6rem,12vw,10rem)`, `--space-block 3rem`, `--space-group 1.5rem`, `--space-inline .75rem`; more space above every heading than below; intervals vary (large before Projects and Contact, compressed Off the clock).

**Motion:** `--ease-move cubic-bezier(.16,1,.3,1)`, `--ease-fade cubic-bezier(.25,1,.5,1)`; `--t-1 140ms` feedback, `--t-2 280ms` state, `--t-3 720ms` authored. Three choreographed WebGL moments (Resolve on load, Release across the hero exit, Gather into Contact), all scrubbed through a frame-rate-independent lerp so they are reversible and interruptible. DOM sections never animate in; no parallax on text. Under `prefers-reduced-motion` or the Pause control: one static formed frame, no scrub, no Lenis, feedback transitions kept.

**Browser surfaces themed:** `::selection`, caret, thin scrollbar, two-tone focus ring (2 px ice + 3 px offset + ground spacer), underline offset, tabular numerals, tap highlight.

**Signature interaction:** touching the fox injects light. Pointer position (passive `pointermove`, no raycasting) sends a luminance wavefront outward along the strokes: touch the nose and light runs down the spine and splits into the tails. The pose never moves. An idle nose-to-tail pulse every ~6 s guarantees every visitor sees it. On touch, a tap does it once.

### Mobile (390 px) — its own composition

Nav 56–64 px with a real "Menu" button opening a full-height sheet (five sections, Résumé, GitHub, LinkedIn, email, Pause motion; 52 px rows; focus trapped; Escape closes). Hero: name, role line, standfirst, then the fox as a full-bleed figure box (100vw × ~74vw) between the text and the actions, so text never overlaps points; actions stacked full-width. Tables become year-above-title rows; the UART figure scrolls horizontally in its own container with a hint; Contact shows the static bowing poster; no margin traces. Coarse-pointer devices get the LOW tier (14k points, DPR 1.25, hero only; loop stops when the hero leaves). Breakpoints are content-driven (≈640, 960, 1200) plus `clamp()`.

## Architecture

**Stack:** Vite 8 + React 19 + TypeScript; `three` 0.186 + `@react-three/fiber` 9.7 (no drei, nothing here needs it); GSAP 3.15 ScrollTrigger; CSS Modules + a custom-property token layer under `@layer`; ESLint flat config with `no-restricted-imports` so only `src/webgl` may import `three` or `@react-three/*`; Vitest for the pure functions; `sharp` (dev) for the offline bake. Lenis is not installed initially: native scroll keeps keyboard/anchor/focus behaviour free and the lerp already smooths the field; it is a polish-phase decision (desktop-only, wired to hash links) only if wheel stepping visibly hurts.

**Prerender:** `vite build` for the client plus `vite build --ssr src/entry-server.tsx`, then `scripts/prerender.mjs` renders the app with React 19 `prerender` (`react-dom/static`) and injects the HTML into `dist/index.html`; `main.tsx` hydrates. The WebGL layer is client-only behind the lazy boundary, and device-dependent state (tier, pause preference) is applied after hydration in effects so there are no mismatches. Every section is readable before JS and with JS off. This is milestone one, not an afterthought.

**Layering:** fixed canvas at z 0, `pointer-events: none`, `aria-hidden`, `tabIndex -1`, outside `<main>`; content at z 1 on the opaque ground; skip link first in DOM.

**WebGL layer (one draw call):**
- Offline `scripts/bake-fox-masks.mjs`: rasterize `sitting.svg` and the contact pose (plus `howling` for comparison) at 2× viewBox, density-normalize (`ink / (gaussianBlur(ink, 6px) + eps)` so 1 px whiskers and near-solid tail masses get proportionate points), compute a geodesic "signal distance" channel from the nose by BFS over a 6 px-dilated mask (fallback: normalized x along the drawing), write 512 px lossless PNG masks (R = density, G = geodesic) + JSON sidecars (bbox, centroid, aspect, nose).
- Runtime `src/webgl/sample.worker.ts`: fetch masks, CDF-stratified sampling with a seeded PRNG, Hilbert-sort both poses so index *i* corresponds spatially, stride-decimate for tiers, author the scatter pose deterministically (≈6% on Bezier routing traces with 45° jogs, ≈20% snow columns in the margins, the rest a depth-stratified volume), post transferable buffers into a module cache keyed by pose+tier.
- Geometry: `position` Float32×3 (scatter), `aFoxA`/`aFoxB` Uint16×2 normalized, `aSeed` Uint8×4 (phase, size, drift, class), `aGeo` Uint8×2 (geodesic per pose) — ~26 B/point; `frustumCulled=false` with a manual bounding sphere; `matrixAutoUpdate=false`.
- Shader: vertex `highp`, branchless, three-way barycentric weights `uWeights` normalized on the CPU, per-point formation threshold from `aGeo` so release is stroke-ordered, drift gated by the scatter weight, curl noise on HIGH (2 octaves), sin-flow on LOW, pre-wrapped `uTime`, `gl_PointSize` DPR-aware and clamped to `ALIASED_POINT_SIZE_RANGE`, one `mediump vec4` varying. Fragment: analytic two-lobe sprite, additive, `depthTest/depthWrite false`, no texture, no discard, no alphaTest, `#include <tonemapping_fragment>` and `<colorspace_fragment>`. No post-processing, no bloom: glow comes from additive overlap plus an ~8% larger "bloom-seed" class.
- Canvas: `dpr [1, tier cap]` (1.75 / 1.5 / 1.25), `frameloop="always"` with gates (never when hidden, paused, reduced-motion, or between Skills and the approach to Contact, where it resumes for the Gather), `performance` regression on, `gl {antialias:false, alpha:true, depth:false, stencil:false}`, camera fov 35, normal compositing.
- Scroll bus: `src/motion/scrollBus.ts` owns one plain target object `{formA, formB, lightX, activeTrace, pulse}`; ScrollTriggers with `scrub` tween it; one `useFrame` lerps the pose weights and light with `k = 1 − 0.001^dt` and is the only writer of uniforms; page-anchored positions (the fox on its hero ground rule, the traces beside Experience, the Contact pose in its cell) use raw `scrollY` and `ResizeObserver`-measured cell rectangles (`uPlateRect`), never the lerped value, so the cloud never slips off its hairline during scroll. A `quickSetter` writes `lightX` to the moon-wash transform (wash layer capped at ~140vw × 120vh). Zero `setState` on the frame or scroll path.
- Lazy boundary above the Canvas: `lazy(() => import('./webgl/FoxField'))` after first paint via rAF → `requestIdleCallback`; `manualChunks` isolates three; budget ≤300 KB brotli async, entry <150 KB. WebGL2 probed before import so unsupported devices never download the chunk.
- Robustness: `webglcontextlost` → preventDefault + poster; `webglcontextrestored` → keyed remount from cached arrays; two failures → permanent poster. Tested with `WEBGL_lose_context`.
- Dev: `r3f-perf` behind `import.meta.env.DEV`; assert calls = 1, geometries = 1, textures = 0; fragments/frame ≤ ~7M on HIGH.

**Content:** `src/content/*.ts` typed data (profile, experience, projects, skills, offTheClock, links); no facts in JSX.

**Project structure:**
```
scripts/bake-fox-masks.mjs      scripts/prerender.mjs
src/main.tsx  src/App.tsx
src/content/{profile,experience,projects,skills,offTheClock,links,types}.ts
src/styles/{layers,tokens,reset,fonts,base,typography,utilities}.css
src/components/{Nav,SkipLink,PauseMotion,Link,Button,Table,Plate,Icon,...}
src/sections/{hero,about,experience,projects,skills,off-the-clock,contact}/Section.tsx + .module.css
src/figures/uart.ts (+ uart.test.ts)   src/figures/UartFigure.tsx
src/webgl/{FoxField.tsx,FoxPoints.tsx,sample.worker.ts,tiers.ts,shaders/fox.vert.glsl,fox.frag.glsl}
src/motion/{scrollBus.ts,registerGsap.ts,usePrefersReducedMotion.ts,MotionProvider.tsx}
public/fox/{sitting,bowing}.png + .json, public/fonts/*.woff2 (incl. the existing noto-sc subset), favicons
art/kitsune/*.svg (the source drawings, kept for provenance; not shipped)
```

**Removed from the shipped site:** `assets/journey.mp4`, the vendor JS, `css/`, `js/`, `tools/bake-blooms.js`, the bloom webps except the two posters, the Chinese numerals and watermarks. The drawings move to `art/`.

**Meta / SEO:** title "Ethan Tiong — RTL & FPGA Design Engineer"; description keeps the good clauses of the current one minus "told as a nine-tailed fox story"; canonical `https://www.etiong.com/`; new 1200×630 OG image rendered from the finished hero; SVG + PNG favicon cut from the fox head; Vercel analytics beacons kept as deferred scripts.

## Build sequence

Each phase ends with a run, Playwright screenshots at 1440×900, 1280×720, 1024, 768, 390, a written critique, and fixes, before the next begins. Ultracode is on, so review rounds fan out as workflows (design-jury, accessibility, performance, recruiter lenses) at the milestones marked ★.

**Phase 0 — Records and branch.** Create branch `v2`. Write `PRODUCT.md` (impeccable init, from this brief and the audit), run the impeccable concept-seed roll and record the direction contract in the surface brief (the brief-pinned world above beats the roll; challengers' raises are noted), save this design as `docs/superpowers/specs/2026-09-11-portfolio-v2-design.md` and the granular task plan as `docs/superpowers/plans/2026-09-11-portfolio-v2.md`, update `.gitignore` (node_modules, dist, .playwright-mcp, .impeccable/review), save project memory.

**Phase 1 — Spike: the fox in points (gate).** Scaffold Vite + React + TS. Write and unit-test the bake script; bake sitting, bowing, howling. Standalone page renders the sampled cloud at 34k and 60k points at 1440 and 390. Screenshot. Judge: do 1 px whiskers and tail outlines read as drawn strokes rather than a smudge? Tune the edge/density weighting; pick the contact pose by eye; verify the geodesic channel lights nose→tails in order. Nothing else is built until this reads right.

**Phase 2 — Foundation and the whole page in HTML/CSS.** Tokens, fonts (copy woff2 to `public/fonts`, `@font-face` with swap + size-adjust, preload the two critical files), layers, reset, typography roles, layout primitives (grid, plate, hairline row, table, dl), Nav + Menu sheet + skip link + Pause control, content data files, all seven sections with real copy and the poster in the hero, prerender script, ESLint boundary, README rewrite. The page must be complete, readable, and keyboard-usable with no WebGL and no JS. ★ Review.

**Phase 3 — WebGL.** FoxField chunk, tiers and probes, poster crossfade (Resolve), idle stroke pulse, moon wash + `uLightX`; then the Release scrub (stroke-ordered, snow + traces) and the projects' active-trace pulse; then Gather at Contact; then the pointer pulse; context-loss handling; reduced-motion and Pause paths; perf assertions and fragment budget on a mid-range laptop profile. ★ Review (creative-technologist + design lenses).

**Phase 4 — Projects figure and tables.** `uart.ts` frame generator with tests (idle high, start low, LSB first, stop high, 16 ticks per cell), the SVG figure with byte input, experience table, skills dl, off-the-clock band, contact.

**Phase 5 — Mobile and intermediate widths.** Own compositions at 390/768/1024; hero fox box; menu sheet; tables; figure scroll container; LOW tier behaviour; safe areas; tap targets.

**Phase 6 — Polish passes.** Typography (measure, opsz, weight at DPR 1), spacing rhythm (computed values, heading above > below), alignment and optical corrections, hover/focus/active states, browser surfaces, motion timing, 3D composition and lighting, contrast measured against rendered pixels under every text block (scrim where needed), Lenis decision, favicon, OG image, meta. `impeccable detect --json` on changed targets; fix mechanical findings.

**Phase 7 — Final audit.** ★ Adversarial workflow: template/AI-look hunt, recruiter 30-second test, accessibility (landmarks, headings, focus, contrast, reduced motion, pause control), performance (Lighthouse, bundle sizes, draw calls, frame timing, no allocations in `useFrame`), robustness (no WebGL, JS off, context loss, resize, fast scroll, reverse scroll), links, console errors, layout shift. Fix everything material; confirm with one more round. Spawn the impeccable finish reviewer and documenter (DESIGN.md + sidecar). Commit in small steps throughout; final PR from `v2` to `main`.

## Verification

- `npm run build` clean; `npm run lint` clean; `npm test` green (figure generator, sampler, bake helpers).
- Playwright (MCP): screenshots at the five widths per phase; JS-disabled and WebGL-off renders; keyboard walk (skip link → nav → hero links → figure input → contact); reduced-motion emulation; console has zero errors.
- Recruiter test: name, role, school, status, resume, GitHub, email visible in the first frame at 1440 and 390 without scrolling or waiting.
- Performance: entry JS < 150 KB brotli, WebGL chunk ≤ 300 KB, masks < 70 KB, draw calls = 1, no GC sawtooth during scroll, 60 fps on the dev machine and a throttled-CPU profile; Lighthouse mobile ≥ 90 performance, 100 accessibility.
- Contrast sampled from rendered pixels under every text block ≥ 4.5:1.
- External links resolve (GitHub repo, LinkedIn, Overleaf, Google Doc).

## Decisions made without asking (override anytime)

- Migrate to Vite + React + TS (the brief prefers the React 3D ecosystem; the previous attempt was already Vite + React). A vanilla-Three build was considered and set aside for that reason.
- No draggable time-axis cursor in the hero; the pointer light pulse is the signature interaction and scroll owns the unfold.
- Remove the loading gate, video, chapter names, hanzi watermarks, numerals, and torii frames.
- Reorder sections for recruiters; rename to plain words; retitle "The Encoder" to "Quadrature Encoder Block"; expand Focus or Fry with README facts only.
- Keep the "up to 52%" teddy-bear figure verbatim as Ethan's own claim (flag: confirm it is traceable in the linked doc).
- Newsreader + Schibsted Grotesk + Azeret Mono; no Lenis until proven necessary; no drei; no post-processing.
- Hobbies stay, compact.

## Confirmed with Ethan (2026-09-11)

- Experience is presented as given: year, organization, role. No bullets added.
- The résumé link keeps the Overleaf URL exactly as today (no hosted PDF).
- Chinese characters: only the footer signature 以狐为引 remains, aria-hidden, set in the existing subset `noto-sc.woff2`.
- Build path is code-led; recorded in `.impeccable/config.json` at execution so the direction contract, not an image comp, is the contract.
