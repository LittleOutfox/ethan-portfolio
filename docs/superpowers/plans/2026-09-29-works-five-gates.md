# Works: Five Gates, Five Torii, Two Signals — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two more works gates (SPI PWM ASIC, Diabetes Classifier) in newest-first order, a shrine of five torii to match, the UART timing figure restored at the Focus or Fry gate, and a new SPI/PWM timing figure at the ASIC gate.

**Architecture:** The page (`index.html`, `js/main.js`, `css/styles.css`) is vanilla; the works corridor is one pinned GSAP timeline that already loops over `[data-wgate]`. The 3D world (`world/`, React-Three-Fiber, built to `js/world/scene.js`) stands one torii per pass point the page reports on `window.__world.gates`. Each timing figure is a pure generator ES module (no DOM, unit-tested with the world's vitest) plus a figure ES module that draws an SVG and redraws on input.

**Tech Stack:** vanilla JS + GSAP 3.12.5 ScrollTrigger + Lenis 1.1.14 (page); TypeScript, React 19, R3F 9.7, three 0.186, Vite 8, vitest 4 (world); Playwright MCP scripts in `.playwright-mcp/` (untracked) for layout sweeps.

**Spec:** `docs/superpowers/specs/2026-09-29-works-five-gates-design.md`

## Global Constraints

- Gate order, newest first: 01 SPI PWM ASIC · 02 Focus or Fry · 03 The Encoder · 04 Diabetes Classifier · 05 Calming Teddy Bear.
- Tails section: unchanged.
- No credit lines for Damir Gazizullin or Toby Anderson on the site (they stay in the repos' READMEs).
- Never claim the site was designed or built by hand.
- Figures show only under `@media (min-width: 961px) and (min-height: 700px)`; elsewhere `display: none` and the gate is exactly as today.
- Nothing animates in the figures; they redraw only on input.
- One commit per task; commit messages end with the two trailer lines:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_0193HDkAL8DshmGXcYurEwRm`.
- Nothing is pushed or merged until Ethan says so.
- Cache busts: bump `css/styles.css?v=`, `js/main.js?v=`, `js/world/scene.js?v=` whenever the file changes (currently 47, 36, 15).

## Review Focus

1. Two figures on one page: each must mount only its own kind (`[data-signal="uart"]` / `[data-signal="spi"]`) with unique caption ids, or aria-describedby and selectors cross-talk. (Task 3 and Task 4 each assert their mount selector and id in a DOM check.)
2. Keys inside the figures' inputs: ←/→ must not step the walkthrough (it already ignores INPUT targets), and ↑/↓ in the duty box must step the value, not scroll the page. (Task 4, browser check.)
3. Garbage in the duty box — `''`, `'abc'`, `'300'`, `'-5'`, `'0012'` — must never throw or draw nonsense. (Task 4, `dutyFromText` unit tests.)
4. At 1280×720, the smallest screen that shows the figures, a figure must not overlap its gate's inscription. (Tasks 3 and 4, collision sweep at 1280×720.)
5. The figure moves with GSAP (`y`, `autoAlpha`); a CSS `transform` on it would be overwritten and misplace it after a resize, so it is centred with margins, not `translateX(-50%)`. (Tasks 3/4 CSS.)

---

### Task 1: Five gates, newest first

**Files:**
- Modify: `index.html` (the `.works-gates` block and `.works-count`, ~lines 215–267; `js/main.js?v=` bump)
- Modify: `js/main.js` (`works()` pin length, ~line 899; header comment ~line 884)
- Modify: `README.md:14`
- Test: `.playwright-mcp/walk.js` (untracked harness) — make its works stops generic over the gates

**Interfaces:**
- Produces: five `article.wgate[data-wgate]` in the order above; ScrollTrigger timeline labels `gate0`…`gate4` (already generated per gate); `window.__world.gates` with five pass points.

- [ ] **Step 1: Make the walkthrough harness expect every gate (the failing check)**

In `.playwright-mcp/walk.js`, replace the works stops and the counter checks so they follow the page's gates:

```js
// in expected():
const gatesN = document.querySelectorAll('[data-wgate]').length;
const gateStops = Array.from({ length: gatesN }, (_, g) => at(works, 'gate' + g));
return [
  0,
  top('#origin'),
  wide ? centre(cards[1], cards[1]) : centre(cards[0], cards[0]),
  wide ? centre(cards[3], cards[4]) : centre(cards[4], cards[4]),
  ...gateStops,
  Math.min(top('#fire') + fire.offsetHeight / 2 - window.innerHeight / 2, top('#fire .ch-head') - 0.12 * window.innerHeight),
  at(tails, 'earned'),
  ScrollTrigger.maxScroll(window),
].map(Math.round);
```

and in the stop loop, with `const G = await page.evaluate(() => document.querySelectorAll('[data-wgate]').length);` before it:

```js
if (i >= 4 && i < 4 + G) {
  const g = i - 4;
  if (s.relic !== '0' + (g + 1)) out.errors.push(`stop ${i}: works counter reads ${s.relic}`);
  if (s.gates[g] < 0.95) out.errors.push(`stop ${i}: gate ${g + 1} not open (${s.gates[g]})`);
}
if (i === 4 + G + 1 && (s.tail !== '05' || s.lit !== 5)) out.errors.push(`tails stop: ${s.tail}, ${s.lit} lit`);
```

plus, after the loop: `if (G !== 5) out.errors.push('expected five gates, found ' + G);`

- [ ] **Step 2: Run it against today's page to see it fail**

Serve the site (`python -m http.server 4173 --bind 127.0.0.1` from the repo root), open `http://127.0.0.1:4173/#1440x900` and run `.playwright-mcp/walk.js`.
Expected: `errors` contains `expected five gates, found 3`.

- [ ] **Step 3: Rewrite the gates block in `index.html`**

Replace everything inside `<div class="works-gates">…</div>` with the five gates below (the torii frame spans are identical in every gate), and change the counter to `/ 05`:

```html
        <div class="works-gates">
          <article class="wgate" data-wgate>
            <div class="wgate-frame" aria-hidden="true">
              <span class="wg-kasagi"></span>
              <span class="wg-shima"></span>
              <span class="wg-nuki"></span>
              <span class="wg-pillar wg-l"></span>
              <span class="wg-pillar wg-r"></span>
            </div>
            <span class="wscene-num" aria-hidden="true">01</span>
            <div class="wgate-inner">
              <p class="wscene-meta">ASIC · UWASIC · 2026</p>
              <h3 class="wscene-title">SPI PWM ASIC</h3>
              <p class="wscene-line">A 16-channel PWM controller behind a write-only SPI port&nbsp;— shift-register capture in 417 cells, verified in cocotb and taken through SKY130 RTL-to-GDS and Tiny Tapeout precheck.</p>
              <p class="wscene-role">Verilog&nbsp;· SPI&nbsp;· cocotb&nbsp;· OpenLane2&nbsp;· SKY130</p>
              <a class="wscene-visit" href="https://github.com/LittleOutfox/spi-controlled-pwm-asic" target="_blank" rel="noopener" aria-label="GitHub (opens in a new tab)">GitHub <span class="visit-arrow" aria-hidden="true">↗</span></a>
            </div>
          </article>
          <article class="wgate" data-wgate>
            <div class="wgate-frame" aria-hidden="true">
              <span class="wg-kasagi"></span>
              <span class="wg-shima"></span>
              <span class="wg-nuki"></span>
              <span class="wg-pillar wg-l"></span>
              <span class="wg-pillar wg-r"></span>
            </div>
            <span class="wscene-num" aria-hidden="true">02</span>
            <div class="wgate-inner">
              <p class="wscene-meta">UART core · Personal · 2025</p>
              <h3 class="wscene-title">Focus or Fry</h3>
              <p class="wscene-line">A fully parameterized UART in Verilog&nbsp;— 16× oversampling, phase-accurate sampling, FIFO buffering and flow control, verified in SystemVerilog.</p>
              <p class="wscene-role">Verilog&nbsp;· FSMs&nbsp;· FIFO&nbsp;· SystemVerilog</p>
              <a class="wscene-visit" href="https://github.com/LittleOutfox/focus-or-fry/" target="_blank" rel="noopener" aria-label="GitHub (opens in a new tab)">GitHub <span class="visit-arrow" aria-hidden="true">↗</span></a>
            </div>
          </article>
          <article class="wgate" data-wgate>
            <div class="wgate-frame" aria-hidden="true">
              <span class="wg-kasagi"></span>
              <span class="wg-shima"></span>
              <span class="wg-nuki"></span>
              <span class="wg-pillar wg-l"></span>
              <span class="wg-pillar wg-r"></span>
            </div>
            <span class="wscene-num" aria-hidden="true">03</span>
            <div class="wgate-inner">
              <p class="wscene-meta">FPGA · General Dynamics · 2025</p>
              <h3 class="wscene-title">The Encoder</h3>
              <p class="wscene-line">A quadrature encoder block in VHDL&nbsp;— FSM control and measurement logic, exposing position, speed and error status through a CSR-mapped AXI4-Lite window.</p>
              <p class="wscene-role">VHDL&nbsp;· FSM&nbsp;· <span class="nowrap">AXI4-Lite</span>&nbsp;· SystemVerilog&nbsp;TB</p>
            </div>
          </article>
          <article class="wgate" data-wgate>
            <div class="wgate-frame" aria-hidden="true">
              <span class="wg-kasagi"></span>
              <span class="wg-shima"></span>
              <span class="wg-nuki"></span>
              <span class="wg-pillar wg-l"></span>
              <span class="wg-pillar wg-r"></span>
            </div>
            <span class="wscene-num" aria-hidden="true">04</span>
            <div class="wgate-inner">
              <p class="wscene-meta">Machine learning · Personal · 2024</p>
              <h3 class="wscene-title">Diabetes Classifier</h3>
              <p class="wscene-line">Predicting diabetes from the CDC’s national health survey&nbsp;— random forests and XGBoost against simpler baselines, tuned with hyperopt toward recall.</p>
              <p class="wscene-role">Python&nbsp;· scikit-learn&nbsp;· XGBoost&nbsp;· hyperopt</p>
              <a class="wscene-visit" href="https://github.com/LittleOutfox/random-forest-classifier-diabetes" target="_blank" rel="noopener" aria-label="GitHub (opens in a new tab)">GitHub <span class="visit-arrow" aria-hidden="true">↗</span></a>
            </div>
          </article>
          <article class="wgate" data-wgate>
            <div class="wgate-frame" aria-hidden="true">
              <span class="wg-kasagi"></span>
              <span class="wg-shima"></span>
              <span class="wg-nuki"></span>
              <span class="wg-pillar wg-l"></span>
              <span class="wg-pillar wg-r"></span>
            </div>
            <span class="wscene-num" aria-hidden="true">05</span>
            <div class="wgate-inner">
              <p class="wscene-meta">First build · 2021</p>
              <h3 class="wscene-title">Calming Teddy Bear</h3>
              <p class="wscene-line">An Arduino bear that sensed racing hearts and answered with a lullaby and a warm tummy&nbsp;— easing anxiety by up to 52% at a care centre and a dental clinic.</p>
              <p class="wscene-role">Arduino&nbsp;· <span class="nowrap">Heart-rate</span> sensing&nbsp;· C++</p>
              <a class="wscene-visit" href="https://docs.google.com/document/d/1dKNdC3heJWIDP0wO4JZW94xYDHml6rhj4n3I9VjYhfo/edit?usp=sharing" target="_blank" rel="noopener" aria-label="Documentation (opens in a new tab)">Documentation <span class="visit-arrow" aria-hidden="true">↗</span></a>
            </div>
          </article>
        </div>
        <p class="works-count" aria-hidden="true"><span id="relicNum">01</span> / 05</p>
```

- [ ] **Step 4: Let the pin grow with the gates (`js/main.js`)**

In `works()`, replace `end: '+=400%',` with:

```js
        // every gate keeps the scroll it had when there were three (400%)
        end: '+=' + (100 + 100 * gates.length) + '%',
```

and change the section comment `// ---- 03 · the leap: three torii gates ---…` to `// ---- 03 · the leap: a torii gate for every work ---…`. Bump `js/main.js?v=36` → `?v=37` in `index.html`.

- [ ] **Step 5: README**

`README.md:14`: `selected works, caught in motion — three spirit gates` → `selected works, caught in motion — five spirit gates`.

- [ ] **Step 6: Run the harness again**

Run `.playwright-mcp/walk.js` at `#1440x900` and at `#390x844:touch`.
Expected: `errors: []`, twelve stops, the works counter reads 01…05 at stops 4…8.

- [ ] **Step 7: Commit**

```bash
git add index.html js/main.js README.md
git commit -F - <<'EOF'
Works: five gates, newest first

Two more works: the SPI PWM ASIC (UWASIC, 2026) opens the corridor and
the Diabetes Classifier (2024) comes fourth, before the first build.
The corridor's pin grows with its gates (100% + 100% a gate), so each
keeps the scroll it had; the counter reads / 05 and the walkthrough
gains a stop for each new gate.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0193HDkAL8DshmGXcYurEwRm
EOF
```

---

### Task 2: The shrine stands five torii

**Files:**
- Modify: `world/src/keys.ts` (`GATE_PASS_DEFAULT`, ~line 70)
- Modify: `world/src/scene/World.tsx:21-25`
- Modify: `world/src/scene/Foxfire.tsx:52-53`
- Modify: `world/src/scene/Shrine.tsx` comments (lines ~45-47, ~82-84)
- Test: `world/test/keys.test.ts` (new), `world/test/fox.test.ts` (works-cards window)
- Build: `js/world/scene.js`; `index.html` `scene.js?v=15` → `?v=16`

**Interfaces:**
- Consumes: `window.__world.gates` (five pass points from Task 1).
- Produces: `export function gatePasses(n: number): number[]` in `world/src/keys.ts`; `GATE_PASS_DEFAULT = gatePasses(5)`.

- [ ] **Step 1: Write the failing test** — `world/test/keys.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { GATE_PASS_DEFAULT, gatePasses } from '../src/keys'

describe('the works gates’ pass points', () => {
  it('matches the page’s timeline: gate i passes at (2 + 2.6i + 2.4) / (2 + 2.6n + 1.1)', () => {
    const three = gatePasses(3)
    expect(three).toHaveLength(3)
    ;[0.4037, 0.6422, 0.8807].forEach((v, i) => expect(three[i]).toBeCloseTo(v, 3))
  })

  it('defaults to five gates, evenly spread through the corridor', () => {
    expect(GATE_PASS_DEFAULT).toHaveLength(5)
    ;[0.2733, 0.4348, 0.5963, 0.7578, 0.9193].forEach((v, i) => expect(GATE_PASS_DEFAULT[i]).toBeCloseTo(v, 3))
    for (let i = 1; i < 5; i++) expect(GATE_PASS_DEFAULT[i]).toBeGreaterThan(GATE_PASS_DEFAULT[i - 1])
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `cd world && npx vitest run test/keys.test.ts`
Expected: FAIL — `gatePasses` is not exported.

- [ ] **Step 3: Implement** — in `world/src/keys.ts` replace `export const GATE_PASS_DEFAULT = [0.4, 0.64, 0.88]` with:

```ts
/**
 * Where each of n works gates passes through, as a fraction of the works pin:
 * the page's timeline (js/main.js works()) starts gate i at 2 + 2.6i and sweeps
 * it past the screen's edges 2.4 later; the whole timeline runs 2 + 2.6n + 1.1.
 */
export function gatePasses(n: number): number[] {
  const total = 2 + 2.6 * n + 1.1
  return Array.from({ length: n }, (_, i) => (2 + 2.6 * i + 2.4) / total)
}

/** The pass points before the page reports its own: five gates. */
export const GATE_PASS_DEFAULT = gatePasses(5)
```

- [ ] **Step 4: Accept any number of gates** — `world/src/scene/World.tsx`:

```tsx
  // where the page's own torii pass through (works progress); fixed once the page has built them
  const gates = useMemo(
    () => (bus.gates.length > 0 && bus.gates.every((g) => g > 0 && g < 1) ? bus.gates.slice() : GATE_PASS_DEFAULT),
    [bus],
  )
```

`world/src/scene/Foxfire.tsx`: `for (const g of toriiPlaces(gates).slice(0, 3)) {` → `for (const g of toriiPlaces(gates).slice(0, gates.length)) {` and its comment "each great torii" stays. In `Shrine.tsx` change "first the three great gates the camera crosses" → "first a great gate for every work the camera crosses" and "three great torii the camera walks" → "a great torii for every work, which the camera walks".

- [ ] **Step 5: Widen the fox's works-cards window** — `world/test/fox.test.ts`, test `keeps out from behind the works cards…`: comment "from works 0.3 to 0.75" → "from works 0.15 to 0.95 (five gates)", loop `for (let t = 4.25; t <= 4.85; t += 0.05)` → `for (let t = 4.15; t <= 4.95; t += 0.05)`.

- [ ] **Step 6: Run the world suite**

Run: `cd world && npm test && npm run typecheck`
Expected: all pass. If the fox test fails at the new window's ends, move the fox's stair spots right in `world/src/fox.ts` `FOX_SPOTS` (index 8 `[7, 3.2]` and index 9 `[6.5, 3.2]`), 0.2 m at a time, until it passes; keep every other path test green.

- [ ] **Step 7: Build and bump**

Run: `cd world && npm run build` (writes `js/world/scene.js`); `index.html`: `js/world/scene.js?v=15` → `?v=16`.

- [ ] **Step 8: Commit** — `git add world/src world/test js/world/scene.js index.html`, message "The shrine stands five torii" + trailers.

---

### Task 3: The signal returns at the Focus or Fry gate

**Files:**
- Create: `js/uart.js` (from `git show 4a5424b:js/uart.js`, unchanged)
- Create: `js/uart.d.ts`
- Create: `js/uart-figure.js` (from `git show 4a5424b:js/uart-figure.js`, three changes below)
- Test: `world/test/uart.test.ts` (ported from `git show 4a5424b:tools/uart.test.js`)
- Modify: `index.html` (Focus or Fry gate: `has-signal`, the mount div, the module script; css/main bumps)
- Modify: `css/styles.css` (figure styles, after the `.wscene-visit` hover rules ~line 800)
- Modify: `js/main.js` (`works()`: the inscription tweens carry the figure)

**Interfaces:**
- Produces (`js/uart.js`): `FRAME_CELLS = 12`; `uartFrame(byte: number, oversample = 16)`; `txLevels(frame)`; `txPolyline(frame, width, high, low)`; `clockPolyline(frame, width, high, low)`; `centreSampleXs(frame, width)`; `sampledBits(frame)`; `byteFromChar(ch: string)`; `formatByte(byte: number)`.
- Produces (page): `.wgate-signal[data-signal="uart"]`; shared figure classes `.sig-head .sig-title .sig-byte .sig-input .sig-readout .sig-scroll .sig-svg .sig-rules .sig-clk .sig-sample .sig-tx .sig-marks .sig-label .sig-cap` — Task 4 reuses them.

- [ ] **Step 1: Port the tests** — create `world/test/uart.test.ts` from `git show 4a5424b:tools/uart.test.js` with: the import path `'../../js/uart.js'`; `parsePoints`/`verticalEdgeXs` typed (`(points: string): [number, number][]`, `(points: string): number[]`); the NUL test written as `expect(byteFromChar('\u0000')).toBe(0)` (the old file held a raw NUL byte); every assertion otherwise unchanged.

- [ ] **Step 2: Run it to see it fail**

Run: `cd world && npx vitest run test/uart.test.ts`
Expected: FAIL — cannot find `../../js/uart.js`.

- [ ] **Step 3: Restore the generator and its types**

`git show 4a5424b:js/uart.js > js/uart.js`, then write `js/uart.d.ts`:

```ts
export interface UartBit { name: string; value: 0 | 1; startTick: number; endTick: number }
export interface UartFrame { byte: number; oversample: number; ticksPerBit: number; bits: UartBit[]; totalTicks: number }
export const FRAME_CELLS: number
export function uartFrame(byte: number, oversample?: number): UartFrame
export function txLevels(frame: UartFrame): Uint8Array
export function txPolyline(frame: UartFrame, width: number, high: number, low: number): string
export function clockPolyline(frame: UartFrame, width: number, high: number, low: number): string
export function centreSampleXs(frame: UartFrame, width: number): number[]
export function sampledBits(frame: UartFrame): UartBit[]
export function byteFromChar(ch: string): number
export function formatByte(byte: number): string
```

- [ ] **Step 4: Run the tests** — `cd world && npx vitest run test/uart.test.ts && npm run typecheck` → PASS.

- [ ] **Step 5: Restore the figure** — `git show 4a5424b:js/uart-figure.js > js/uart-figure.js`, then:
  - `document.querySelectorAll('[data-signal]')` → `document.querySelectorAll('[data-signal="uart"]')`;
  - every `sigCap` → `uartCap` (two occurrences of `aria-describedby="sigCap"`, one `id="sigCap"`);
  - the import stays `'./uart.js?v=1'`.

- [ ] **Step 6: Mount it** — in `index.html`, the Focus or Fry gate becomes `<article class="wgate has-signal" data-wgate>` and gets, after its `.wgate-inner`:

```html
            <!-- the signal at the gate's feet: one UART frame, drawn by js/uart-figure.js -->
            <div class="wgate-signal" data-signal="uart"></div>
```

and after `<script src="js/main.js?v=…"></script>`:

```html
  <!-- the signals at the gates' feet (desktop and landscape tablets only; see css) -->
  <script type="module" src="js/uart-figure.js?v=1"></script>
```

- [ ] **Step 7: Move it with the inscription** — `js/main.js` `works()`, inside `gates.forEach`, after `var inner = …`:

```js
      var signal = gate.querySelector('.wgate-signal');
      var script = signal ? [inner, signal] : inner; // a gate's signal comes and goes with its words
```

and use `script` in place of `inner` in the two tweens that fade the inscription in (`at + 0.45`) and out (`at + STEP - 0.75`).

- [ ] **Step 8: Styles** — `css/styles.css`, after the `.wscene-visit` hover block:

```css
/* the signals at the gates' feet: small timing diagrams in the site's hairlines,
   the controls in the corridor's small caps. Only where a gate has room for one */
.wgate-signal { display: none; }
@media (min-width: 961px) and (min-height: 700px) {
  /* the gate that carries a signal lifts its inscription to make room at its feet */
  .has-signal .wgate-inner { padding-bottom: 24vh; }
  .has-signal .wscene-title { font-size: clamp(56px, 9vw, 150px); }
  .has-signal .wscene-meta { margin-bottom: 2.4vh; }
  .has-signal .wscene-line { margin-top: 2.4vh; }
  .has-signal .wscene-role { margin-top: 3vh; }
  .has-signal .wscene-visit { margin-top: 2vh; }
  .wgate-signal {
    display: block;
    position: absolute; left: 0; right: 0; bottom: 14vh;
    width: min(56vw, 900px); margin: 0 auto; /* centred by margins: GSAP owns its transform */
    pointer-events: auto;
    text-align: left;
  }
}
.sig-head {
  display: flex; align-items: baseline; gap: 22px; flex-wrap: wrap;
  margin-bottom: 1.2vh;
  font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase;
  color: var(--moon-faint);
}
.sig-title { color: var(--moon-dim); }
.sig-byte { display: inline-flex; align-items: baseline; gap: 10px; }
.sig-input {
  width: 1.6em; padding: 0 0 2px;
  font-family: var(--serif); font-size: 22px; line-height: 1; text-align: center;
  letter-spacing: 0; text-transform: none;
  color: var(--moon); background: transparent;
  border: 0; border-bottom: 1px solid var(--spirit-soft); border-radius: 0;
  caret-color: var(--spirit);
  transition: border-color var(--dur-2) var(--out-soft);
}
.sig-input:hover, .sig-input:focus { border-color: var(--spirit); outline: none; }
.sig-input:focus-visible { outline: 1px solid var(--spirit); outline-offset: 4px; }
.sig-readout { font-variant-numeric: tabular-nums; letter-spacing: 0.2em; }
.sig-scroll { overflow-x: auto; scrollbar-width: none; }
.sig-scroll::-webkit-scrollbar { display: none; }
.sig-scroll:focus-visible { outline: 1px solid var(--spirit); outline-offset: 6px; }
.sig-svg { display: block; width: 100%; min-width: 560px; height: auto; }
.sig-rules line { stroke: var(--hairline); stroke-width: 1; shape-rendering: crispEdges; }
.sig-clk line { stroke: rgba(var(--spirit-rgb), 0.35); stroke-width: 1; shape-rendering: crispEdges; }
.sig-clk line.sig-sample { stroke: var(--spirit); }
.sig-tx polyline { fill: none; stroke: rgba(var(--moon-rgb), 0.85); stroke-width: 1; stroke-linecap: square; stroke-linejoin: miter; shape-rendering: crispEdges; }
.sig-marks line { stroke: var(--spirit); stroke-width: 3; shape-rendering: crispEdges; }
.sig-label { font-family: var(--serif); font-style: italic; font-size: 17px; fill: var(--moon-faint); }
/* the caption is for assistive tech: the head row already says what the figure is */
.sig-cap, .sig-bits { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
```

(The old head row was 10px; 11px keeps the site's 11px floor.) Bump `css/styles.css?v=` and `js/main.js?v=`.

- [ ] **Step 9: Check it on the page**

At 1512×982 and 1280×720: scroll to the Focus or Fry gate (walkthrough stop "Focus or Fry"); expected: the figure sits below the inscription inside the pillars, head row "One frame on tx · Byte [E] · 0x45 · 0b01000101"; typing `A` redraws with `0x41 · 0b01000001`; only one element has id `uartCap`; the collision sweep (`.playwright-mcp/sideways.js` with `#1280x720,1512x982|gate2`) reports no hits. At 390×844 and 844×390: no figure, gate unchanged.

- [ ] **Step 10: Commit** — `git add js/uart.js js/uart.d.ts js/uart-figure.js world/test/uart.test.ts index.html css/styles.css js/main.js`, message "The signal returns at the Focus or Fry gate" + trailers.

---

### Task 4: A write at the ASIC gate

**Files:**
- Create: `js/spi.js`, `js/spi.d.ts`, `js/spi-figure.js`
- Test: `world/test/spi.test.ts`
- Modify: `index.html` (ASIC gate: `has-signal`, mount div, module script; css bump)
- Modify: `css/styles.css` (lane styles for the SPI figure, after Task 3's block)

**Interfaces:**
- Consumes: Task 3's `.wgate-signal` rules, `.sig-*` classes, the `works()` hook (any `.wgate-signal` moves with its inscription).
- Produces (`js/spi.js`): `DUTY_REG = 0x04`; `FRAME_CELLS = 18`; `spiWrite(addr: number, data: number): { addr, data, bits: {name, value}[] }`; `csPolyline(width, high, low)`; `sclkPolyline(width, high, low)`; `sampleXs(width): number[]`; `copiPolyline(frame, width, high, low)`; `pwmHigh(duty): number`; `dutyPercent(duty): string`; `pwmPolyline(duty, width, high, low, periods = 2)`; `formatWrite(addr, data): string`; `dutyFromText(text: string): number | null`.

- [ ] **Step 1: Write the failing tests** — `world/test/spi.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  copiPolyline, csPolyline, DUTY_REG, dutyFromText, dutyPercent, FRAME_CELLS,
  formatWrite, pwmHigh, pwmPolyline, sampleXs, sclkPolyline, spiWrite,
} from '../../js/spi.js'

function parsePoints(points: string): [number, number][] {
  return points.trim().split(/\s+/).map((p) => p.split(',').map(Number) as [number, number])
}
function verticalEdges(points: string): { x: number; up: boolean }[] {
  const pts = parsePoints(points)
  const out: { x: number; up: boolean }[] = []
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    if (x0 === x1 && y0 !== y1) out.push({ x: x0, up: y1 < y0 })
  }
  return out
}

describe('spiWrite', () => {
  it('frames a write MSB first: W, the 7-bit address, the 8-bit datum', () => {
    const f = spiWrite(DUTY_REG, 0x80)
    expect(f.bits.map((b) => b.name)).toEqual(['W', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'A0', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'])
    expect(f.bits.map((b) => b.value)).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0])
  })

  it('rejects an address outside 0..127, a datum outside 0..255 and fractions', () => {
    expect(() => spiWrite(128, 0)).toThrow(RangeError)
    expect(() => spiWrite(-1, 0)).toThrow(RangeError)
    expect(() => spiWrite(4, 256)).toThrow(RangeError)
    expect(() => spiWrite(4, 1.5)).toThrow(RangeError)
    expect(() => spiWrite(4, Number.NaN)).toThrow(RangeError)
  })
})

describe('the lanes (SPI mode 0, 18 cells: one before the frame, 16 bits, one after)', () => {
  const W = 864
  const c = W / FRAME_CELLS

  it('nCS falls half a cell in, stays low across all 16 bits, and rises half a cell after (the commit)', () => {
    expect(verticalEdges(csPolyline(W, 10, 26))).toEqual([{ x: 0.5 * c, up: false }, { x: 17.5 * c, up: true }])
  })

  it('SCLK idles low and pulses once per bit, rising mid-bit and falling at the bit’s end', () => {
    const edges = verticalEdges(sclkPolyline(W, 38, 54))
    expect(edges).toHaveLength(32)
    for (let k = 1; k <= 16; k++) {
      expect(edges[2 * (k - 1)].x).toBeCloseTo((k + 0.5) * c, 6)
      expect(edges[2 * (k - 1)].up).toBe(true)
      expect(edges[2 * k - 1].x).toBeCloseTo((k + 1) * c, 6)
      expect(edges[2 * k - 1].up).toBe(false)
    }
    const pts = parsePoints(sclkPolyline(W, 38, 54))
    expect(pts[0]).toEqual([0, 54])
    expect(pts[pts.length - 1]).toEqual([W, 54])
  })

  it('samples COPI on every SCLK rising edge, in the middle of its bit', () => {
    const xs = sampleXs(W)
    expect(xs).toHaveLength(16)
    xs.forEach((x, k) => expect(x).toBeCloseTo((k + 1.5) * c, 6))
  })

  it('COPI holds each bit across its cell and changes only on cell boundaries', () => {
    const f = spiWrite(DUTY_REG, 0x80)
    const edges = verticalEdges(copiPolyline(f, W, 66, 82))
    // low → W=1 at cell 1; 1 → A6=0 at cell 2; A2=1 at cell 6, A1=0 at cell 7; D7=1 at cell 9, D6=0 at cell 10
    expect(edges.map((e) => Math.round(e.x / c))).toEqual([1, 2, 6, 7, 9, 10])
    for (const e of edges) expect(Math.abs(e.x / c - Math.round(e.x / c))).toBeLessThan(1e-6)
  })
})

describe('the PWM it sets (pwm_peripheral.v: high while an 8-bit counter < duty; 255 is always high)', () => {
  it('turns the duty byte into the fraction of each period the output is high', () => {
    expect(pwmHigh(0)).toBe(0)
    expect(pwmHigh(1)).toBe(1 / 256)
    expect(pwmHigh(128)).toBe(0.5)
    expect(pwmHigh(254)).toBe(254 / 256)
    expect(pwmHigh(255)).toBe(1)
    expect(dutyPercent(128)).toBe('50.0%')
    expect(dutyPercent(255)).toBe('100.0%')
    expect(dutyPercent(0)).toBe('0.0%')
    expect(() => pwmHigh(256)).toThrow(RangeError)
  })

  it('draws two periods, flat at 0% and 100%', () => {
    expect(parsePoints(pwmPolyline(0, 400, 118, 134))).toEqual([[0, 134], [400, 134]])
    expect(parsePoints(pwmPolyline(255, 400, 118, 134))).toEqual([[0, 118], [400, 118]])
    const edges = verticalEdges(pwmPolyline(128, 400, 118, 134))
    expect(edges.map((e) => [e.x, e.up])).toEqual([[0, true], [100, false], [200, true], [300, false]])
  })
})

describe('the duty box and the readout', () => {
  it('keeps digits, clamps to 0..255, and waits on an empty box', () => {
    expect(dutyFromText('128')).toBe(128)
    expect(dutyFromText('0012')).toBe(12)
    expect(dutyFromText('300')).toBe(255)
    expect(dutyFromText('-5')).toBe(5)
    expect(dutyFromText('a1b2')).toBe(12)
    expect(dutyFromText('')).toBeNull()
    expect(dutyFromText('abc')).toBeNull()
  })

  it('prints the write as address ← datum in hex', () => {
    expect(formatWrite(DUTY_REG, 0x80)).toBe('0x04 ← 0x80')
    expect(formatWrite(DUTY_REG, 5)).toBe('0x04 ← 0x05')
  })
})
```

- [ ] **Step 2: Run to see them fail** — `cd world && npx vitest run test/spi.test.ts` → FAIL, cannot find `../../js/spi.js`.

- [ ] **Step 3: Implement `js/spi.js`**

```js
/* ------------------------------------------------------------
   spi.js — pure generator for one write to the SPI PWM ASIC: a
   16-bit SPI Mode 0 frame, MSB first (W, a 7-bit address, an
   8-bit datum), and the PWM the duty register sets, as the chip's
   RTL has it. No DOM, no state. Tested in world/test/spi.test.ts.
   ------------------------------------------------------------ */

/** the duty-cycle register */
export const DUTY_REG = 0x04;
/** cells across the diagram: one before the frame (nCS falls), the 16 bits, one after (nCS rises) */
export const FRAME_CELLS = 18;

function checkByte(what, v, max) {
  if (!Number.isInteger(v) || v < 0 || v > max) {
    throw new RangeError('spi: ' + what + ' must be an integer in 0..' + max + ', received ' + v);
  }
}
function num(n) { return String(Number(n.toFixed(3))); }
function pt(x, y) { return num(x) + ',' + num(y); }
function hex2(v) { return '0x' + v.toString(16).toUpperCase().padStart(2, '0'); }

/** The 16 bits of a write of `data` to `addr`, MSB first. */
export function spiWrite(addr, data) {
  checkByte('address', addr, 127);
  checkByte('data', data, 255);
  const bits = [{ name: 'W', value: 1 }];
  for (let i = 6; i >= 0; i--) bits.push({ name: 'A' + i, value: (addr >> i) & 1 });
  for (let i = 7; i >= 0; i--) bits.push({ name: 'D' + i, value: (data >> i) & 1 });
  return { addr: addr, data: data, bits: bits };
}

/** nCS: high, falls half a cell in, low across the 16 bits, rises half a cell after the last — the commit. */
export function csPolyline(width, high, low) {
  const c = width / FRAME_CELLS;
  return [pt(0, high), pt(0.5 * c, high), pt(0.5 * c, low), pt(17.5 * c, low), pt(17.5 * c, high), pt(width, high)].join(' ');
}

/** SCLK in mode 0: idle low; in each bit's cell it rises at the middle (the sample) and falls at the end. */
export function sclkPolyline(width, high, low) {
  const c = width / FRAME_CELLS;
  const pts = [pt(0, low)];
  for (let k = 1; k <= 16; k++) {
    const xm = (k + 0.5) * c;
    const xe = (k + 1) * c;
    pts.push(pt(xm, low), pt(xm, high), pt(xe, high), pt(xe, low));
  }
  pts.push(pt(width, low));
  return pts.join(' ');
}

/** x of each SCLK rising edge — where the chip samples COPI — one per bit. */
export function sampleXs(width) {
  const c = width / FRAME_CELLS;
  const xs = [];
  for (let k = 1; k <= 16; k++) xs.push((k + 0.5) * c);
  return xs;
}

/** COPI: low outside the frame, each bit held across its cell; edges only on cell boundaries. */
export function copiPolyline(frame, width, high, low) {
  const c = width / FRAME_CELLS;
  const levels = [0].concat(frame.bits.map(function (b) { return b.value; }), [0]);
  const y = function (v) { return v ? high : low; };
  const pts = [pt(0, y(levels[0]))];
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] === levels[i - 1]) continue;
    pts.push(pt(i * c, y(levels[i - 1])), pt(i * c, y(levels[i])));
  }
  pts.push(pt(width, y(levels[levels.length - 1])));
  return pts.join(' ');
}

/** The share of each period the output is high: counter < duty over 256 counts; 255 is always high. */
export function pwmHigh(duty) {
  checkByte('duty', duty, 255);
  return duty === 255 ? 1 : duty / 256;
}

/** The duty as a percentage with one decimal, e.g. '50.0%'. */
export function dutyPercent(duty) {
  return (pwmHigh(duty) * 100).toFixed(1) + '%';
}

/** The output across [0, width]: `periods` periods, each high for pwmHigh(duty) of it. */
export function pwmPolyline(duty, width, high, low, periods) {
  if (periods === undefined) periods = 2;
  const f = pwmHigh(duty);
  if (f === 0) return pt(0, low) + ' ' + pt(width, low);
  if (f === 1) return pt(0, high) + ' ' + pt(width, high);
  const pw = width / periods;
  const pts = [];
  for (let p = 0; p < periods; p++) {
    const x0 = p * pw;
    const xh = x0 + f * pw;
    pts.push(pt(x0, low), pt(x0, high), pt(xh, high), pt(xh, low));
  }
  pts.push(pt(width, low));
  return pts.join(' ');
}

/** The write for the readout, e.g. '0x04 ← 0x80'. */
export function formatWrite(addr, data) {
  return hex2(addr) + ' ← ' + hex2(data);
}

/** The duty box's text as a duty: digits only, clamped to 255; null while there are none. */
export function dutyFromText(text) {
  const digits = String(text).replace(/\D+/g, '');
  if (!digits) return null;
  return Math.min(255, parseInt(digits, 10));
}
```

- [ ] **Step 4: Types** — `js/spi.d.ts`:

```ts
export interface SpiBit { name: string; value: 0 | 1 }
export interface SpiFrame { addr: number; data: number; bits: SpiBit[] }
export const DUTY_REG: number
export const FRAME_CELLS: number
export function spiWrite(addr: number, data: number): SpiFrame
export function csPolyline(width: number, high: number, low: number): string
export function sclkPolyline(width: number, high: number, low: number): string
export function sampleXs(width: number): number[]
export function copiPolyline(frame: SpiFrame, width: number, high: number, low: number): string
export function pwmHigh(duty: number): number
export function dutyPercent(duty: number): string
export function pwmPolyline(duty: number, width: number, high: number, low: number, periods?: number): string
export function formatWrite(addr: number, data: number): string
export function dutyFromText(text: string): number | null
```

- [ ] **Step 5: Run the tests** — `cd world && npx vitest run test/spi.test.ts && npm test && npm run typecheck` → all PASS.

- [ ] **Step 6: The figure** — `js/spi-figure.js`:

```js
/* ------------------------------------------------------------
   spi-figure.js — the signal at the foot of the SPI PWM ASIC gate
   One write to the duty register, drawn as a timing diagram from
   the pure generator in ./spi.js: nCS, SCLK and COPI across the
   16-bit frame (MSB first, sampled on SCLK's rising edges), and
   the PWM the new duty sets, two periods on its own time scale.
   Changing the duty redraws it; nothing animates.
   ------------------------------------------------------------ */
import { copiPolyline, csPolyline, DUTY_REG, dutyFromText, dutyPercent, formatWrite, pwmPolyline, sampleXs, sclkPolyline, spiWrite } from './spi.js?v=1';

const SVG = 'http://www.w3.org/2000/svg';
/* viewBox geometry (user units): 18 cells of 48 across the plot */
const VB_W = 976;
const VB_H = 150;
const PLOT_X = 104;
const PLOT_W = 864;
const LANE_LABEL_X = 92;
const CS = [10, 26];
const SCLK = [38, 54];
const COPI = [66, 82];
const BIT_LABEL_Y = 100;
const PWM = [116, 132];
const RULE_TOP = 4;
const RULE_BOTTOM = 88;
const SAMPLE_HALF = 5;

function el(name, attrs, parent) {
  const n = document.createElementNS(SVG, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

function lane(svg, cls, points) {
  const g = el('g', { class: cls, transform: 'translate(' + PLOT_X + ' 0)' }, svg);
  el('polyline', { points: points, 'vector-effect': 'non-scaling-stroke' }, g);
}

function draw(svg, duty) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const frame = spiWrite(DUTY_REG, duty);
  const cellW = PLOT_W / 18;

  // bit-cell boundaries across the three SPI lanes
  const rules = el('g', { class: 'sig-rules' }, svg);
  for (let i = 1; i <= 17; i++) {
    const x = PLOT_X + i * cellW;
    el('line', { x1: x, x2: x, y1: RULE_TOP, y2: RULE_BOTTOM, 'vector-effect': 'non-scaling-stroke' }, rules);
  }

  lane(svg, 'sig-tx', csPolyline(PLOT_W, CS[0], CS[1]));
  lane(svg, 'sig-tx', sclkPolyline(PLOT_W, SCLK[0], SCLK[1]));
  lane(svg, 'sig-tx', copiPolyline(frame, PLOT_W, COPI[0], COPI[1]));
  lane(svg, 'sig-pwm', pwmPolyline(duty, PLOT_W, PWM[0], PWM[1]));

  // the chip samples COPI on each SCLK rising edge
  const marks = el('g', { class: 'sig-marks', transform: 'translate(' + PLOT_X + ' 0)' }, svg);
  sampleXs(PLOT_W).forEach(function (x, k) {
    const y = frame.bits[k].value ? COPI[0] : COPI[1];
    el('line', { x1: x, x2: x, y1: y - SAMPLE_HALF, y2: y + SAMPLE_HALF, 'vector-effect': 'non-scaling-stroke' }, marks);
  });

  const text = function (x, y, anchor, s, cls) {
    const t = el('text', { class: cls || 'sig-label', x: x, y: y, 'text-anchor': anchor, 'dominant-baseline': 'central' }, svg);
    t.textContent = s;
  };
  text(LANE_LABEL_X, (CS[0] + CS[1]) / 2, 'end', 'nCS');
  text(LANE_LABEL_X, (SCLK[0] + SCLK[1]) / 2, 'end', 'SCLK');
  text(LANE_LABEL_X, (COPI[0] + COPI[1]) / 2, 'end', 'COPI');
  text(LANE_LABEL_X, (PWM[0] + PWM[1]) / 2, 'end', 'pwm');
  frame.bits.forEach(function (b, k) {
    text(PLOT_X + (k + 1.5) * cellW, BIT_LABEL_Y, 'middle', b.name, 'sig-label sig-bit');
  });
  return frame;
}

function mount(root) {
  root.innerHTML =
    '<div class="sig-head">' +
      '<span class="sig-title">One write on SPI</span>' +
      '<label class="sig-byte">Duty <input class="sig-input sig-duty" type="text" inputmode="numeric" maxlength="3" autocomplete="off" spellcheck="false" value="128" aria-describedby="spiCap"></label>' +
      '<output class="sig-readout" aria-live="polite"></output>' +
    '</div>' +
    '<div class="sig-scroll" tabindex="0" role="group" aria-label="SPI timing diagram, scrolls sideways" aria-describedby="spiCap"></div>' +
    '<p class="sig-cap" id="spiCap">SPI mode 0, 16 bits, MSB first: a write bit, the 7-bit address 0x04 (the duty register) and the 8-bit duty, sampled on each rising edge of SCLK and committed when nCS rises. The pwm lane shows two periods of the output, about 3 kHz, at its own time scale.<span class="sig-bits"></span></p>';
  const svg = el('svg', { viewBox: '0 0 ' + VB_W + ' ' + VB_H, class: 'sig-svg', 'aria-hidden': 'true', focusable: 'false' }, root.querySelector('.sig-scroll'));
  const input = root.querySelector('.sig-duty');
  const readout = root.querySelector('.sig-readout');
  const bits = root.querySelector('.sig-bits');
  let last = 128;

  function render(duty) {
    last = duty;
    const frame = draw(svg, duty);
    readout.textContent = dutyPercent(duty) + ' · ' + formatWrite(DUTY_REG, duty);
    bits.textContent = ' Bits: ' + frame.bits.map(function (b) { return b.name + ' ' + b.value; }).join(', ') + '.';
  }
  input.addEventListener('input', function () {
    const d = dutyFromText(input.value);
    if (d === null) return; // an empty box waits for a number
    if (String(d) !== input.value) input.value = String(d);
    render(d);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const step = e.shiftKey ? 16 : 1;
    const cur = dutyFromText(input.value);
    const from = cur === null ? last : cur;
    const next = Math.max(0, Math.min(255, from + (e.key === 'ArrowUp' ? step : -step)));
    input.value = String(next);
    render(next);
  });
  input.addEventListener('blur', function () {
    if (dutyFromText(input.value) === null) input.value = String(last);
  });
  input.addEventListener('focus', function () { input.select(); });
  render(128);
}

document.querySelectorAll('[data-signal="spi"]').forEach(mount);
```

- [ ] **Step 7: Mount it and style its lanes** — `index.html`: the ASIC gate becomes `<article class="wgate has-signal" data-wgate>` with `<div class="wgate-signal" data-signal="spi"></div>` after its `.wgate-inner`, and `<script type="module" src="js/spi-figure.js?v=1"></script>` after the UART figure's script. `css/styles.css`, after Task 3's rules:

```css
.sig-duty { width: 2.2em; }
.sig-pwm polyline { fill: none; stroke: var(--spirit); stroke-width: 1; stroke-linecap: square; stroke-linejoin: miter; shape-rendering: crispEdges; }
.sig-bit { font-size: 14px; }
```

Bump `css/styles.css?v=`.

- [ ] **Step 8: Check it on the page**

At 1512×982 and 1280×720 at the SPI PWM ASIC gate (walkthrough stop 4): head row "One write on SPI · Duty [128] · 50.0% · 0x04 ← 0x80"; typing `255` redraws the pwm lane flat high and the readout `100.0% · 0x04 ← 0xFF`; `0` → flat low, `0.0%`; typing `300` leaves `255`; ↑ in the box → 129 and the page does not scroll; → in the box does not step the walkthrough (`scrollY` unchanged); one `#spiCap`, one `#uartCap`; the collision sweep with `|gate1,gate2` at `#1280x720,1512x982,1920x1080,3440x1440` reports no hits. At 390×844, 844×390 and 820×1180: no figures, gates unchanged.

- [ ] **Step 9: Commit** — `git add js/spi.js js/spi.d.ts js/spi-figure.js world/test/spi.test.ts index.html css/styles.css`, message "A write at the ASIC gate" + trailers.

---

### Final checks (after Task 4)

- `cd world && npm test && npm run typecheck` green; `npm run build` leaves `js/world/scene.js` unchanged (`git status` clean).
- `.playwright-mcp/walk.js` at `#1440x900` and `#390x844:touch`: `errors: []`, 12 stops.
- `.playwright-mcp/sideways.js` at `#3440x1440,1920x1080,1512x982,1440x900,1366x768,1280x720,1024x768,820x1180,390x844,844x390,667x375`: no text-over-text, nothing cut off in a pinned chapter at any resting station (the known mid-scroll under-nav moments aside).
- `.playwright-mcp/overlap.js` (ink fox vs text) at the laptop sizes: clean.
- Screenshots of both figures for Ethan.
