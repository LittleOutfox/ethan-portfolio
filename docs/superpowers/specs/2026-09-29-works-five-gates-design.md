# Works: five gates, five torii, two signals — design

Date: 2026-09-29 · Branch: `works-five` (from `main` 4bd4ce4) · Approved: design ("Lgtm"), spec ("go for it", credit lines dropped)

## Goal

Add two projects to **03 · The Leap** (the works corridor), grow the 3D shrine to match,
bring back the small UART timing figure at the Focus or Fry gate, and give the new ASIC
gate a figure of its own in the same hand. Each piece lands as its own commit so it can
be tuned alone.

## Decisions (from Ethan)

- **Order, newest first:** 01 SPI PWM ASIC (2026) · 02 Focus or Fry (2025) · 03 The Encoder
  (2025) · 04 Diabetes Classifier (2024) · 05 Calming Teddy Bear (2021).
- **Tails:** unchanged. They are co-op and work history, not projects.
- **Figures:** desktop and landscape tablets only; phones and short screens don't show them.
- Nothing is pushed or merged until Ethan says so.

## 1 · The gates (page)

Two new `<article class="wgate" data-wgate>` blocks in `index.html`, built like the three
that exist (torii frame spans, ghost numeral, `.wgate-inner` with meta, title, line, role,
visit link). Numerals renumbered 01–05 in the new order. Text, from the repos' READMEs:

**01 · SPI PWM ASIC** — meta `ASIC · UWASIC · 2026`
- line: A 16-channel PWM controller behind a write-only SPI port — shift-register capture in
  417 cells, verified in cocotb and taken through SKY130 RTL-to-GDS and Tiny Tapeout precheck.
- role: `Verilog · SPI · cocotb · OpenLane2 · SKY130`
- visit: GitHub → https://github.com/LittleOutfox/spi-controlled-pwm-asic

**04 · Diabetes Classifier** — meta `Machine learning · Personal · 2024`
- line: Predicting diabetes from the CDC's national health survey — random forests and
  XGBoost against simpler baselines, tuned with hyperopt toward recall.
- (credits for the PWM generator and the preprocessing stay in the repos' READMEs, not on
  the site — Ethan's call)
- role: `Python · scikit-learn · XGBoost · hyperopt`
- visit: GitHub → https://github.com/LittleOutfox/random-forest-classifier-diabetes

Also:
- the corridor counter reads `/ 05` (`.works-count`);
- `works()` in `js/main.js`: the pin's scroll length grows with the gate count so every
  gate keeps today's scroll time: `end: '+=' + (100 + 100 * gates.length) + '%'` (400% for
  three, 600% for five). The timeline itself already loops over the gates;
- the walkthrough reads its stops from the gates, so it gains two stops by itself;
- `README.md`: "three spirit gates" → "five spirit gates".

## 2 · The shrine (3D world)

The shrine already stands one great torii per page gate, placed from `bus.gates` (each
gate's pass point in the works pin). Three places assume three:

- `world/src/scene/World.tsx` accepts `bus.gates` only when `length === 3` → accept any
  non-empty list with every pass point in (0, 1);
- `world/src/keys.ts` `GATE_PASS_DEFAULT` (the fallback before the page reports) → the five
  pass points the page produces: gate i passes at `(2 + 2.6·i + 2.4) / (2 + 2.6·n + 1.1)`,
  i.e. `[0.273, 0.435, 0.596, 0.758, 0.919]` for n = 5 (the same formula gives today's
  `[0.40, 0.64, 0.88]` for n = 3);
- `world/src/scene/Foxfire.tsx` lanterns `toriiPlaces(gates).slice(0, 3)` →
  `.slice(0, gates.length)`.

The fox's path is tested to keep beside the stair (not behind the cards) while the works
cards show; with five gates the cards show from ~t 4.15 to ~4.95 instead of 4.25–4.85, so
that test's window and, if it fails, the fox's stair spots are retuned. `js/world/scene.js`
rebuilt, `scene.js?v=` bumped.

## 3 · The two signals

Both follow the Focus or Fry figure that lived on `main-effects` (4a5424b): a pure
generator module (no DOM, tested) and a figure module that draws an SVG timing diagram in
the site's hairlines and redraws only when the input changes. No animation.

**Focus or Fry — the UART frame (restored as it was):** `js/uart.js` (8N1 frame, 16×
oversampling; polylines, centre-sample positions, byte from a character, hex/binary
readout) and `js/uart-figure.js` (a head row "One frame on tx · Byte [E] · 0x45 · 0b…", two
lanes `clk_16x` and `tx`, cell labels, centre-bit samples as spirit marks, a visually
hidden caption listing the bits).

**SPI PWM ASIC — the write and the output (new, same hand):** `js/spi.js` and
`js/spi-figure.js`. A head row "One write on SPI · Duty [128] · 50.0% · 0x04 ← 0x80"
(the duty box takes 0–255; arrow keys step it). Lanes, top to bottom:
- `nCS` low across the frame, rising after the last bit (the commit);
- `SCLK` idle low, 16 pulses (SPI mode 0);
- `COPI` the 16 bits MSB first — `W`, `A6…A0` = 0x04, `D7…D0` = the duty — each bit valid
  on its rising edge, labelled beneath;
- `PWM` two periods of the output at that duty.

Duty follows the RTL (`pwm_peripheral.v`): high while an 8-bit counter < duty, except duty
255 which is always high — so the duty fraction is `d/256`, and `255 → 100%`. The
generator exposes `spiWrite(addr, data)` (frame bits and polylines), `pwmHigh(duty)` and
`dutyPercent(duty)`.

**On the page:** each figure mounts in a `<div class="wgate-signal" data-signal="uart|spi">`
inside its gate (`.wgate.has-signal`). In `works()` the figure moves with the gate's
inscription (appears, dissolves, passes through with it). The gate that carries a figure
lifts its inscription to make room at its feet (as on `main-effects`). All of it lives
under `@media (min-width: 961px) and (min-height: 700px)`; elsewhere the figure is
`display: none` and the gate is unchanged. Both modules load as `type="module"` scripts.

**Accessibility:** the input is a real labelled `<input>`; the readout is an
`aria-live="polite"` `<output>`; the SVG is `aria-hidden` with a visually hidden caption
that states the frame in words.

**Types for the tests:** `js/uart.d.ts` and `js/spi.d.ts` so the world's strict
type-check accepts the tests' imports.

## 4 · Tests

- `world/test/uart.test.ts`: the `main-effects` assertions (frame layout, levels, polyline
  edges, clock, centre samples, byteFromChar, formatByte), ported to TS.
- `world/test/spi.test.ts`: 16 bits MSB first with W=1, address 0x04 and the data; SCLK has
  16 rising edges, each in the middle of its COPI bit; nCS low across all 16 and high
  after; `pwmHigh`/`dutyPercent` for 0, 1, 128, 254, 255 against the RTL's rule;
  out-of-range input throws.
- `world/test/fox.test.ts`: the works-cards window updated for five gates.
- The existing world suite stays green.

## 5 · Commits

1. **Works: five gates, newest first** — two new gates, renumbering, counter, pin length, README.
2. **The shrine stands five torii** — World/keys/Foxfire, fox test window, rebuilt scene.js.
3. **The signal returns at the Focus or Fry gate** — uart.js, uart-figure.js, d.ts, tests,
   CSS, main.js hook, index.html.
4. **A write at the ASIC gate** — spi.js, spi-figure.js, d.ts, tests, CSS, index.html.

## 6 · Verification before handing back

- `cd world && npm test` and `npm run typecheck` green.
- `.playwright-mcp` sweeps at the common sizes (3440×1440, 1920×1080, 1512×982, 1440×900,
  1366×768, 1280×720, 1024×768, 820×1180, 390×844, 844×390, 667×375): ink fox vs text
  (`overlap.js`), text vs text (`collide.js`/`sideways.js`) at every station including the
  five gates.
- The walkthrough (`walk.js`, desktop and touch): every stop lands, gate counters read
  01–05.
- Screenshots of both figures; typing into each redraws it.

## Out of scope

The tails; the hunt's skills; any new art; the field/WebGL effects on `main-effects`.
