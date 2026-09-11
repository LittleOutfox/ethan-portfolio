# Portfolio V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio as the approved "fox as a signal net on a document a hardware engineer would read" direction: a recruiter-first single page with one GPU point-cloud fox sampled from Ethan's own drawings.

**Architecture:** Vite 8 + React 19 + TypeScript SPA prerendered to static HTML at build; content as typed data; CSS Modules over a token layer; one lazy WebGL chunk (three + R3F) rendering a single `THREE.Points` driven by a plain scroll bus; GSAP ScrollTrigger scrubs the bus; no state on the frame path.

**Tech Stack:** react 19.2, three 0.186, @react-three/fiber 9.7, gsap 3.15, vite 8, vitest 4, sharp (bake only), Newsreader / Schibsted Grotesk / Azeret Mono self-hosted.

**Spec:** docs/superpowers/specs/2026-09-11-portfolio-v2-design.md

## Global Constraints

- Facts verbatim from PRODUCT.md "Evidence on Hand"; nothing invented; experience one line per entry; Overleaf résumé link; only 以狐为引 in Chinese.
- No loading gate, no scroll hijack, readable with JS and WebGL off, WCAG AA, pause control, reduced-motion path.
- Only `src/webgl/**` may import `three` or `@react-three/*` (ESLint enforces).
- Craft floor: no eyebrows above headings, no section numbers, no same-size card grids, no gradient text, no glass, mono only in `.data`.
- Budgets: entry JS < 150 KB brotli, WebGL chunk ≤ 300 KB, draw calls = 1, contrast ≥ 4.5:1 on rendered pixels.

---

## Phase 1 — Spike (gate) ✅

- [x] Bake script with density normalization, speck rejection, geodesic channel, debug renders (`scripts/bake-fox-masks.mjs`)
- [x] Sampler with seeded PRNG + Hilbert order + tests (`src/webgl/sample.ts`, `sample.test.ts`)
- [x] Screen-space point shader, single draw call (`src/webgl/FoxPoints.tsx`, `shaders/`)
- [x] Spike page renders sitting → bowing morph; fox reads as a drawing at 40k points
- [x] Contact pose chosen: bowing (wide, low, a greeting beside the email block)

## Phase 2 — Foundation and the whole page in HTML/CSS

- [x] Task 2.1 Content data: `src/content/{profile,experience,projects,skills,offTheClock,links,types}.ts` with verbatim copy; `npm run typecheck`.
- [x] Task 2.2 Global styles: tokens, fonts, reset, base roles, utilities (`src/styles/*`) — done in spike commit; verify in browser.
- [x] Task 2.3 Shell: `App.tsx` with skip link, `<Nav>` (wordmark, links, Résumé, Pause motion button, Menu sheet on mobile), `<main>`, footer.
- [x] Task 2.4 Hero section: title block (h1, role line, standfirst, run-in dl, actions) + fox plate cell with poster `<img>` and ground rule.
- [x] Task 2.5 About, Experience, Projects (plate + rows, figure placeholder), Skills, Off the clock, Contact sections with real copy.
- [x] Task 2.6 Prerender pipeline (`vite build` → `--ssr` → `scripts/prerender.mjs`), verify dist/index.html contains full content; `npm run build` clean.
- [x] Task 2.7 Screenshots at 1440/1280/1024/768/390, JS-off render, keyboard walk; critique and fix. ★ review workflow (wf_dd042799-8b2).
- [x] Commit.

## Phase 3 — WebGL

- [x] Task 3.1 `tiers.ts` (WebGL2 probe, coarse pointer, cores, memory, GPU blocklist) and the lazy `FoxField` chunk mounted after first paint.
- [x] Task 3.2 Worker sampling (`sample.worker.ts`) with module cache; main-thread fallback.
- [x] Task 3.3 Plate anchoring from the DOM cells via ResizeObserver (`plates.a/b`), poster crossfade (Resolve), idle pulse, moon wash + `lightX`.
- [x] Task 3.4 Scroll bus with ScrollTrigger: Release across the hero exit (formA 1.3 → −0.3), traces beside About/Experience, snow in quiet areas, active-trace pulse, frame-loop gates.
- [x] Task 3.5 Gather at Contact (formB), lit from the right.
- [x] Task 3.6 Pointer/touch pulse; Experience row hover → trace brighten.
- [x] Task 3.7 Pause motion (aria-pressed, localStorage), reduced-motion static frame, context-loss recovery, perf assertions (r3f-perf dev), fragment budget.
- [~] Task 3.8 Screenshots done; real-GPU check blocked (Chrome tab hidden); ★ review workflow running. Commit done.

## Phase 4 — Projects figure and tables

- [x] Task 4.1 `src/figures/uart.ts` frame generator + tests (idle high, start low, LSB first, stop high, 16 ticks/cell).
- [x] Task 4.2 `UartFigure.tsx` SVG with byte input and caption; hairline rows for Experience/Skills/Off the clock; Contact.
- [x] Commit.

## Phase 5 — Mobile and intermediate widths

- [x] Own compositions at 390/768/1024; hero fox box; menu sheet; tables; figure scroll container; LOW tier; safe areas; tap targets. Screenshots. Commit.

## Phase 6 — Polish

- [x] Review round one applied (recruiter, design jury, creative technologist lenses): hero facts, heading margins, rhythm tokens, mono creep, release band, clock ticks, blending, loop gates, reduced motion, pruning.
- [x] Favicons from the drawing, fonts instanced and subset, lazy Three chunk, robots/sitemap/llms.txt, README, `impeccable detect --json` clean, Lighthouse mobile 92 / desktop 100.
- [x] Lenis decision: native scroll kept (the lerp smooths the field; keyboard and anchors stay native).
- [x] OG image from the finished hero (1200×630, 166 KB).
- [x] a11y lens + synthesis results; contrast on rendered pixels; reduced-motion check.

## Phase 7 — Final audit

- [ ] ★ Adversarial workflow (AI-look, recruiter, a11y, perf, robustness); fixes; second round; impeccable finish reviewer; documenter (DESIGN.md + sidecar); README; PR v2 → main.
