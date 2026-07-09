# ORIGIN — Luxury & Smoothness Audit

**Branch:** `luxury-polish` (cut from live `main` @ `7eb044f`) · **Date:** 2026-07-07
**Method:** full-code dissection of `index.html` / `css/styles.css` / `js/main.js` (every finding adversarially re-verified against the source), Lighthouse runs against a local serve, MP4 box-level analysis of `journey.mp4`, and production-bundle dissection of both reference sites — [brand.ivress.co.jp](https://brand.ivress.co.jp/) (Awwwards SOTD) and [storytelling.noomoagency.com](https://storytelling.noomoagency.com/).

---

## 0 · Executive summary

The site's bones are genuinely good — the loading gate streams **real bytes** (rare even on award sites), the Lenis/ScrollTrigger wiring is canonical, the reduced-motion story is exemplary, and the video is already encoded keyframe-every-4-frames for scrubbing. This is not a rebuild; it is a polish pass.

Three theses, each backed by evidence below:

1. **The choppiness is not one thing — it is a stack of four.** The video seek cadence (double-smoothed, seeking nearly every frame), a `letter-spacing` scrub that reflows the hero title on every scrolled frame *while* the foxfire loop forces synchronous layout, ~21 megabyte-scale SVG rasters carrying live Gaussian-blur filters, and a 7-deep fixed full-viewport layer stack. No single fix will produce butter; the top four together will.
2. **Your loading-screen instinct is half right.** The gate *does* fully preload the 9.5 MB film with honest byte progress — but the **5.4 MB of fox artwork is invisible to it**: all seven SVGs download in parallel with the tracked video (stretching the very number the counter shows) and nothing guarantees they're decoded when Enter unlocks. Award gates (verified in ivress's shipped bundle) gate on *ready-to-render* — assets fetched **and** the render path warmed — not on bytes alone.
3. **The wow gap is voice, not volume.** ivress won its jury on Animations/Transitions (8.4) with essentially *one color*. The site's motion structure is strong but speaks in stock GSAP curves and default CSS `ease`; there is no signature easing, no cursor language, no sound, no choreographed entrance handoff. Luxury = restraint + one authored motion voice, tuned relentlessly.

---

## 1 · Ground truth — measurements

| Metric | Desktop | Mobile (emulated) |
|---|---|---|
| Lighthouse Performance | **70** | **56** |
| FCP | 1.0 s | 10.5 s * |
| LCP | 2.7 s | 13.5 s * |
| TBT | 250 ms | 0 ms |
| CLS | **0.129** | 0 |
| Total page weight | **16.0 MB** | 6.6 MB (video skipped, foxes not) |

\* local-serve numbers (no gzip/H2 — Vercel will do better), but the *render-blocking chain is real*: Google Fonts CSS + three synchronous CDN scripts (cdnjs ×2, unpkg ×1) gate first paint and gate `main.js` — which is what starts the video fetch and injects every fox.

**`journey.mp4` (box-level):** H.264, 1280×720, 15.04 s, 361 frames (24 fps), **91 keyframes → exactly every 4 frames**. The code comment at `js/main.js:137` is true. The encode is scrub-friendly; the seek *cadence* is the problem (§4.1).

**The phone tier still ships 6.6 MB** even though it correctly skips the video — because all seven fox SVGs (5.4 MB) are injected eagerly regardless of viewport (§5.2).

---

## 2 · Inside the reference sites

Both reference bundles were fetched and read directly. This is what they actually do — not what blog posts say award sites do.

### 2.1 ivress (Astro + **Lenis** + Howler)

- **Runs the same scroll library as ORIGIN.** Butter on Lenis is a solved problem; it's discipline, not stack.
- **Honest gate, capped at 99:** the flip-digit counter tracks real `loadProgress` events, is hard-capped `Math.min(99, …)`, and only shows 100 + fades the veil on a **`compileEnd`** event — i.e. assets fetched *and* the render path warmed (first frame paintable). Two-stage strategy: only intro-critical assets gate entry; secondary music/SFX lazy-load after.
- **Double-smoothed scroll:** Lenis emits normalized progress; the render loop applies a second frame-rate-independent damp (`damp(current, target, λ≈12, dt)`) and **every effect on the page maps off that one value**.
- **Motion voice = two curves total:** `cubic-bezier(.19,1,.22,1)` (expo-out — fast attack, long luxurious settle) and `cubic-bezier(.25,1,.5,1)` (quart-out). That's the entire easing vocabulary of an Awwwards SOTD.
- **Sound is a first-class layer:** a full Howler manager — ambient tracks, `fadeIn/fadeOut` (0.5–2 s), a low-pass filter for ducking.
- **Deliberate resolution trade:** canvas ships DPR 1 by default (`?hd=true` opts into retina). Jury still scored motion 8.4.
- Self-hosted display font (`basilia_compress_d.woff2`), sections declared as data (`screenHeights`, per-chapter easing), per-letter spans pre-split in the HTML.

### 2.2 Noomo "Storytelling" (Nuxt + Three.js + GSAP ScrollSmoother)

- **The gate is physical:** `await assetsManager.loadAll()` (Draco meshes, KTX2/Basis GPU textures, HDR env) → `setSceneLoaded` → and crucially **ScrollSmoother is created *paused* and only unpaused 1.2 s into the reveal**. The user *cannot* scroll into an unready world. That's the "~5 s of loading before you enter" you sensed.
- **Preloader exit is a feathered radial mask** — GSAP tweens one custom property (`--reveal-radius`: 0 → 200vmax, 2 s, power3.inOut) on a radial-gradient `mask-image` with a ~14vmax feather band. The world is revealed through an expanding soft aperture — one composited property, massively more cinematic than an opacity fade.
- **Scroll velocity is a scene input:** `getVelocity()/viewportHeight` is piped into shader uniforms every frame — fast scrolling visibly energizes the world, then it settles. This, more than smoothing, is why their scroll *feels* alive.
- **One store as the animation bus:** named 0..1 scalars (`iceTransition`, `videoTransition`, …) tweened by GSAP; DOM and WebGL both read the same value. Perfect layer sync by construction.
- Smoothing config: `smooth: 1.5, normalizeScroll: true, smoothTouch: true, ignoreMobileResize: true`. Decode work moved off the critical path (`createImageBitmap`, async `decode()`, `requestVideoFrameCallback`).

### 2.3 The transferable pattern

> **Gate on ready-to-render, not bytes. Drive everything from one damped scroll value. Speak one easing language. Reveal through a mask, not a fade. Let scroll velocity touch the world. Add one more sense (sound).**

---

## 3 · What ORIGIN already gets right

Worth naming, because none of it should be broken in the polish pass:

- **Real byte-accurate gate** for the film — streamed `fetch` reader feeding the % counter (`main.js:98–116`), monotonic, 12 s failsafe. Most sites fake this; ORIGIN doesn't.
- **Canonical Lenis wiring** (`main.js:405–412`): `lenis.on('scroll', ScrollTrigger.update)`, driven from `gsap.ticker`, `lagSmoothing(0)` on desktop — the exact pattern Lenis's docs prescribe.
- **Scrub-ready video encode** (keyframe/4) fetched as a blob so it's seekable on any server; the scrub loop caches page height and never overlaps seeks.
- **Honest device tiering**: phones/save-data/2g-3g never download the film (`v.remove()`), phones drop the third bloom layer — conditional *non-render*, not CSS hiding.
- **Exemplary reduced-motion / no-js fallbacks** (`styles.css:934–981`): pinned scenes re-laid-out as static flow, canvases removed, veil auto-dismissed.
- **Foxfire canvas avoids the classic sins**: pre-rendered sprites, no per-frame gradients, no `shadowBlur`, DPR capped, snow canvas pauses offscreen via IntersectionObserver.
- Craft details: `::selection` on-palette, `tabular-nums` on counters, descender-safe masked line reveals, 100svh fallbacks, `ScrollTrigger.refresh()` after fonts + load, art direction encoded as comments ("the world is ink").

---

## 4 · Why the scroll is choppy — ranked root causes

Every item verified against source with line references. Ordered by expected contribution to the felt choppiness.

### 4.1 The film seeks nearly every frame, through two stacked smoothers — HIGH
`js/main.js:153–163`. The rAF loop lerps `cur += (target−cur) × 0.12` (not delta-time corrected) and issues `v.currentTime = cur` whenever the delta exceeds **0.03 s — less than one frame at 24 fps**, so while scrolling a seek is issued on essentially every rAF. Each seek is an async decode (≤4 frames from keyframe); frames present at *seek-completion* times, not on a regular cadence — that latency jitter **is** the visible stutter. And because the 0.12 lerp sits on top of Lenis's own 1.25 s ease, the film keeps seeking for ~1 s *after the wheel stops* — stutter while the eye is at rest, maximally noticeable. On 120 Hz displays the un-corrected lerp converges twice as fast and can issue ~120 seeks/s.

**Fix (S):** delta-correct the lerp (`cur += (target−cur) × (1 − Math.pow(0.88, dt×60))`), raise the seek threshold to ~1 frame (1/30 s), cap seek issuance at ~30 Hz. Fewer, frame-sized seeks present far smoother than per-rAF micro-seeks.
**Fix (L, highest leverage):** re-encode all-intra (`-g 1`, slightly lower res/bitrate — it renders at 0.55 opacity behind a dark veil; budget stays ~similar) so every seek is a single-frame decode. This is the standard award-site scrub encode. Keep the lerp (dt-corrected) — on touch it's the only smoothing layer.

### 4.2 `letter-spacing` is scrubbed on the char-split hero title — HIGH
`js/main.js:548`. The pinned hero timeline scrubs `letterSpacing: '0.22em'` on an `<h1>` split into per-character `inline-block` spans. letter-spacing is a **layout property**: every scrolled frame of roughly the first half of the hero pin dirties layout and repaints a up-to-290px serif headline — *on the very first scroll gesture of the visit, where the smoothness impression forms*. Worse, it compounds with 4.3: any frame where layout is dirty turns the foxfire loop's `getBoundingClientRect` into a forced synchronous layout — classic read/write thrash.

**Fix (S):** replace with per-character `x` transforms in the same scrubbed timeline (spread ≈ 0.17 em of rendered font size, centered on the middle glyph; recompute on `ScrollTrigger` refresh). Compositor-only, visually near-identical.

### 4.3 Foxfire forces layout every frame, forever — and runs behind the opaque veil from t=0 — MEDIUM
`js/main.js:224–226, 259`. `fireSection.getBoundingClientRect()` runs in the rAF loop every frame of the site's life (the file's own comment at L135 — "never read layout in the loop" — forbids exactly this in the adjacent scrub loop). Cheap on clean-layout frames; a forced reflow whenever GSAP has written styles that frame — i.e. **while scrolling, precisely when it hurts**. The loop also runs full-tilt (clear + 24–54 additive sprites) behind the fully opaque veil from parse time, competing with the video download during the gate.

**Fix (S):** drive `warmth` from a `scrub` ScrollTrigger on `#fire` (`onUpdate: self => targetWarm = max(0, 1 − 1.6·|1 − 2·self.progress|)` reproduces the current curve exactly; keep the gBCR path only as a `!MOTION` fallback), and start the loop from `enter()`.

### 4.4 ~21 megabyte-SVG rasters with live Gaussian blurs — HIGH (paired with §6.1)
`js/main.js:31–38` + `styles.css:265–279, 665–667, 778–780`. Eight mounts × 3 stacked `<img>` copies of 0.38–1.25 MB path-data SVGs, each copy carrying its own filter chain — `blur(16px)` (the most expensive CSS filter) on every `bloom2`. Filters force per-element render surfaces; blurred layers get padding-inflated GPU textures that live while the mounts are GSAP-animated (condense reveals, parallax, the works fox's 400 %-pin scrub cross-fading all three copies, an *infinite* hunt-fox yoyo). Cost = GPU memory + fill-rate on integrated GPUs, plus a main-thread raster spike the first time each megabyte SVG paints — the "section-entry hitch."

**Fix (M):** bake the glow. The bloom layers are blurred to 5–16 px — vector fidelity is *wasted* on them. Pre-render each fox's bloom(s) to half-resolution WebP (blur hides the downscale) and keep only the sharp layer as SVG (or raster it at 2× too; nothing zooms). Bake per-variant for the fire/pool tinted foxes, or bake neutral white glow + cheap color-matrix filter (no blur). Keep the `bloom2/bloom/sharp` class names — `condense()` keys off them. The tails chapter (`main.js:737–821`) already proves this bake pattern works in this codebase.

### 4.5 Seven fixed full-viewport layers; grain is 4× viewport — MEDIUM
`index.html:24–32` + `styles.css:51–104`. Every scrolled frame the compositor blends ~7 viewport-fills: video (with a per-frame `brightness/saturate/contrast` filter pass), gradient veil, foxfire canvas, tint, grain, halo (`mix-blend-mode: screen`), plus nav/rail — pure fill-rate tax on integrated GPUs. `.grain` at `inset:-50%` is a 200vw×200vh composited texture whose keyframes only ever move it ±2 % — ~46 % of the overscan per side can never be seen. (Note: the steps(4) transform anim itself is compositor-cheap; the waste is texture size and overdraw, not "recompositing every 350 ms.") The dead `#veil` (plus its three decoded fox rasters) also stays mounted at z-100 forever after entry.

**Fixes (S/M):** bake `brightness(0.9) contrast(1.03)` into the mp4 grade and delete the CSS filter (`saturate(1)` is already a no-op); shrink grain to `inset:-3%`/`-64px` with fixed-px keyframe offsets (do **not** switch to `background-position` — that's a main-thread repaint); pause grain under `html.gated`; `veil.remove()` on the `.gone` transitionend; fold `.journey-veil`'s static gradients elsewhere if convenient (keep `.tint` its own layer — its opacity is GSAP-scrubbed and compositor-only).

### 4.6 Touch: two scroll-hijacking systems fight — MEDIUM (mobile-only)
`js/main.js:400–412`. `ScrollTrigger.normalizeScroll(true)` on touch **plus** an unconditional Lenis instance = two systems each believing they own scroll intent — GSAP's docs warn against exactly this pairing; it's a known source of pinned-scene jitter on iOS/Android.

**Fix (S):** one owner per input class — `if (ScrollTrigger.isTouch !== 1) lenis = new Lenis(…)`; let normalizeScroll own touch. The anchor handler already null-checks `lenis`.

### 4.7 Housekeeping (LOW, do opportunistically)
- Scroll cue animates `top` → infinite main-thread layout; switch keyframes to `translateY` (`styles.css:422–429`) — parent already clips.
- `backdrop-filter: blur(10px)` on `.pool-card` re-blurs a *live* backdrop (video + snow canvas + grain) every frame it's on screen (`styles.css:797–798`); the card sits on near-black at 0.05 alpha — bake a slightly more opaque gradient and delete it.
- Snow pointer handlers call gBCR per event (`main.js:298–309`) — cache page-space offsets at resize, compute from `e.pageX/Y`.
- Canvas resize handlers lack the mobile URL-bar guard `measure()` has (`main.js:207/288` vs `144`) — add the same `COARSE && width-unchanged` early-return.
- Journey rAF loop is never cancelled (zombie after video error); snow loop spins as a no-op offscreen; gate both on lifecycle flags. Keep loops **off** `gsap.ticker` — they deliberately survive a CDN failure.
- Permanent `will-change` on three full-viewport `.wgate`s + others — toggle from the works-pin's `onToggle` at the pin boundary instead (`styles.css:567`, `main.js:627–636`).
- Tails chapter bakes six supersampled ~1350×1000 canvases + PNG encodes in one main-thread task the moment `sitting.svg` loads (`main.js:836–863`) — wrap in `requestIdleCallback` (setTimeout fallback) with a ScrollTrigger force-trigger on approach.

---

## 5 · The loading gate — from honest to award-grade

The gate's architecture is already right (real bytes, monotonic, failsafe). What it gates is incomplete, and what happens *around* it leaks.

### 5.1 The film starts downloading too late — HIGH
`index.html:297–300` + `main.js:97–98`. The 9.5 MB film — the thing the gate exists to wait for — doesn't start fetching until `main.js` executes, and `main.js` is a synchronous script queued behind **three synchronous third-party CDN scripts**. That's ~300 ms–1.5 s of dead veil ("00") on a median connection. The `<video preload="auto">` is a no-op (no `src`).
**Fix (S):** start the fetch from the existing inline head script (`index.html:16`) — replicate the LEAN/reduced-motion guards (do **not** use a static `<link rel=preload>`: it would force 9.5 MB onto the phones that `main.js` deliberately exempts), stash `window.__journeyFetch`, consume it in `journey()`.

### 5.2 The foxes are invisible to the gate — HIGH (your instinct, confirmed)
`main.js:31–38, 50–51`. `weights = { video: 0.9, fonts: 0.1 }` — the 5.4 MB of fox art contributes zero. All seven SVGs download in parallel with the tracked video (stretching the counter), and Enter can unlock while the hero fox is mid-flight, un-decoded. First paint of each fox is a heavy decode+raster+filter that lands mid-experience.
**Fix (M):** gate the above-fold art — await `img.decode()` on the veil fox (`descending`) + hero fox (`sitting`) sharp layers, weights ≈ `{video:0.75, foxes:0.15, fonts:0.1}` (decode() must resolve the gate on fulfil *or* reject; failsafe must cover it). Give the five below-fold foxes `loading="lazy" decoding="async"` — or inject on ScrollTrigger approach with generous lead — so they stop stealing gated bandwidth. **This makes the counter finish faster *and* truer simultaneously.**
Also: preload `descending.svg` in the head — the current preload (`sitting`) is the *wrong first fox*; the veil's own centerpiece waits for three CDN scripts before it starts downloading (`index.html:14` vs `:35`).

### 5.3 Warm the render path behind the veil (the `compileEnd` idea) — M
Bytes ≠ paintable. During the gate, after each above-fold SVG decodes, draw it once to an offscreen canvas (warms rasterization); seek the film to 2–3 positions (warms the decode pipeline); keep scroll locked (already done via `gated`/`lenis.stop()` — good) and only release it ~1 s into the reveal, like Noomo. Cap the visible counter at 99 until warm-up completes, then settle 99→100 as a beat.

### 5.4 The gate's edges leak — S each
- **12 s failsafe lies** (`main.js:66`): it snaps the counter to 100 with nothing guaranteed. Make it honest: expose `gate.forceReady()` that unlocks Enter *without* faking `parts=1`, swap the button copy to "enter while the forest loads", let the real % keep counting. And in `loadedmetadata`, set `cur`/`currentTime` to the *scroll-mapped* target before adding `.ready` so a late film fades in on the correct frame instead of visibly fast-forwarding from frame 0.
- **Inertial scroll skips the Enter moment** (`main.js:380–381`): trackpad momentum from before readiness fires `enter()` the instant the gate opens, skipping the 100 %-settle and button reveal entirely. Require >400 ms post-ready + accumulated deltaY threshold for wheel/touch entry.
- **CDN stall = frozen black veil**: the failsafe lives *inside* `main.js`, so if unpkg stalls, nothing runs — the veil sits at "00" with a dead button until the browser's network timeout. **Self-host gsap/ScrollTrigger/lenis under `/js/vendor/`** (~90 KB total, same-origin, H2-multiplexed, kills the SRI question too).
- **Fonts flash inside the veil** (`index.html:10–12`): render-blocking Google Fonts + `display=swap` = fallback type on the very first luxury frame, then a mid-intro swap (system CJK → Noto on 狐). The site uses exactly **26 unique CJK glyphs** — subset Noto Serif SC to them (~10–15 KB via pyftsubset), subset Cormorant/Inter to latin, self-host with `font-display: block` + preloads (the preloads are load-bearing; block alone would blank the veil text).

---

## 6 · The luxury gap — wow factor

### 6.1 One motion voice — the single highest-leverage wow fix — S
**Zero `cubic-bezier()` in 981 lines of CSS** (every transition is default `ease`/`ease-out` across an ad-hoc 0.35/0.4/0.5/0.6/0.7/0.9/1.1/2.4 s scale) and the GSAP side mixes power1/2/3/4/expo/sine — three-plus similar-but-different decays, no signature. ivress ships two curves total.
**Fix:** define tokens — `--out-expo: cubic-bezier(0.16,1,0.3,1)`, one soft-out, a 3-step duration scale — sweep all 13 CSS transitions; register GSAP `CustomEase` "ink" (long-tail decel) + one inOut, and sweep the tween catalog. One find-replace pass; transforms the feel.

### 6.2 The entrance is a class flip, not a moment — S
`main.js:361–375`. Enter = `.gone` opacity fade on the whole veil group at once (counter, wordmark, fox, button fade as one flat sheet) while the hero starts underneath. **Steal Noomo's exit:** a feathered radial `mask-image` reveal blooming outward from the Enter button / fox — GSAP tweens one `--reveal-radius` custom property, 0 → 150vmax over ~1.6 s on your `--out-expo`. It reads as **ink dispersing in water** — more on-theme for this site than for Noomo's. Stagger the veil's inner elements out (yPercent+opacity only — no filter tweens on the megabyte fox at the first-impression moment), then `veil.remove()` on complete. Keep the plain class flip as the `!MOTION` fallback.

### 6.3 The cursor promises a language it never speaks — S/M
`main.js:920–936`. The halo follows the mouse and does nothing else, ever — over the Enter button, nav, work gates, mail link. On both reference sites the cursor is the primary affordance layer.
**Fix:** delegated `pointerover` sets a `hovering` flag (`e.target.closest('a, button, [data-cursor]')`); lerp a scale variable *inside the existing ticker* (a separate GSAP tween would be clobbered — the ticker rewrites `transform` every frame): `hs += ((hovering ? 2.6 : 1) − hs) × 0.14`, composed into the same transform string. Optional: tiny contextual labels ("enter", "view"), and a velocity-reactive stretch. Later: let fast cursor movement spawn a few foxfire embers — the "cursor touches the world" trick at 2D cost.

### 6.4 Scroll velocity should touch the world — M, the "alive" trick
Currently velocity affects only foxfire drift (`main.js:216–221` — good instinct, buried). Broadcast **one damped scroll value + velocity** (ivress's `damp(λ≈12)` pattern) and let it drive: ember count/streak, a subtle skew/y-lag on the fox mounts (`gsap.quickTo`), grain/tint intensity. Small magnitudes (0.1–0.5 range — Arizio's rule). This converts "smooth scroll" into "the world reacts to your scroll," the strongest perceived-luxury signal available without WebGL.

### 6.5 Sound — the missing sense — M
Both references ship audio; ORIGIN owns the *perfect* unlock moment (the gated Enter click grants user activation). One looping ambient bed (snow-wind + distant shrine bell, −30 LUFS quiet), fading in over ~2 s on enter; duck low-pass near the fire chapter (drive from a `#fire` scrub trigger); persistent on-palette mute toggle in the nav, choice persisted in localStorage. Caveat (verified): wheel/touch entry paths do **not** grant activation — `.catch()` the `play()` and re-arm on the next real gesture.

### 6.6 Hover micro-interactions are flat — M
Every interactive hover is a single color crossfade at a uniform 0.4 s; even the nav underline fires only on `.active`, never on `:hover` (`styles.css:222–229`) — and the works links (the site's main CTAs) get the flattest treatment of all. Build **one** layered utility pattern: directional underline sweep (enter-left/exit-right via instant `transform-origin` swap — scaleX is compositor-only), the existing literal "↗" in `.wscene-visit` wrapped in a span and translated 3–4 px on a 60 ms delay, all on `--out-expo`. Replace the fire-list's per-frame `text-shadow` transition with a pre-painted `::after { content: attr(data-text) }` glow crossfaded via opacity.

### 6.7 Craft edges juries and recruiters actually check — all S
- **Share cards: the cheapest wow surface is currently blank.** No OG/Twitter meta at all — a recruiter pasting the URL into LinkedIn/Slack/Discord gets bare text. Add og:title/description/url + a 1200×630 raster of the hero fox + moon, `twitter:card=summary_large_image`, `theme-color: #08070d`, canonical, real favicon set (the 🦊 emoji data-URI fails in Safari and reads as a weekend hack next to Cormorant).
- **`:focus-visible`** — nothing styled; stock blue ring on obsidian. Two on-palette rules (use full-opacity `--spirit` for WCAG non-text contrast).
- **Scrollbar** — default OS bar over the ink world (the site even has its own `.rail` progress). `scrollbar-color` + `::-webkit-scrollbar`, thin, on-palette.
- **Native `@media (prefers-reduced-motion)`** duplicates of the three `animation:none` rules — today calm-mode depends on JS having run; the veil animates during exactly the gate window (or forever, if main.js fails).
- Color-token hygiene: ~25 hand-typed rgba() restatements of the three hues — add `--spirit-rgb`-style channel tokens; standardize watermark alphas per depth tier. *(unverified by the adversarial pass — but confirmed by direct read)*

---

## 7 · Roadmap — three passes

### Pass 1 · Butter (the choppiness, ~a day)
1. Seek cadence: dt-corrected lerp + 1-frame threshold + 30 Hz cap (§4.1-S)
2. Kill the `letter-spacing` scrub → per-char transforms (§4.2)
3. Foxfire: ScrollTrigger-driven warmth, start on enter (§4.3)
4. Grain shrink + gated pause; delete video CSS filter (bake into grade); veil.remove() (§4.5)
5. Touch: Lenis xor normalizeScroll (§4.6)
6. Housekeeping sweep (§4.7 — each is minutes)
7. **Measure**: before/after DevTools performance trace while scrolling; target zero long tasks during steady scroll.

### Pass 2 · The Gate (the award-site entrance, ~a day)
1. Early video fetch from head w/ guards (§5.1)
2. Gate the above-fold foxes; lazy the rest (§5.2)
3. Self-host vendor JS + subset/self-host fonts, `display:block` + preloads (§5.4)
4. Honest failsafe + inertia-proof Enter + scroll-mapped late-film start (§5.4)
5. Warm-up pass + 99 %-cap beat (§5.3)
6. Radial-mask ink-disperse reveal + staggered veil exit (§6.2)
7. Consider re-encoding journey.mp4 all-intra ~720p (§4.1-L) — biggest single smoothness lever, pairs naturally with this pass.

### Pass 3 · The Voice (wow, 1–2 days, mostly tuning)
1. Easing tokens CSS+GSAP, one sweep (§6.1)
2. Cursor language (§6.3)
3. Velocity → world (§6.4)
4. Hover pattern utility (§6.6)
5. OG cards / focus / scrollbar / reduced-motion media (§6.7)
6. Sound bed + mute toggle (§6.5) — last, it's the most taste-dependent.

> **Tuning discipline** (the Arizio lesson): after Pass 3 lands, spend sessions *only* adjusting curve/duration/magnitude numbers — the difference between "nice" and "expensive" lives there, not in more features.

---

## Appendix · Verification notes

39 findings were generated by three independent code-dissection passes and each was re-verified by an adversarial agent instructed to refute it (13 confirmed, 22 confirmed-with-corrections — corrections folded into the text above, 1 refuted and excluded: "add a poster / remove `preload=auto`" — the attribute is load-bearing for the error-fallback path, and the veil covers the load window anyway). 3 findings lost their verifier to rate-limit errors (§4.5-partial, §4.7 backdrop-filter, §6.7 color tokens) and were re-verified by direct code read during synthesis. Reference-site claims come from their shipped production bundles (fetched 2026-07-07), not from secondhand writeups. Lighthouse numbers are local-serve (python http.server, no gzip/H2) — treat mobile FCP/LCP as pessimistic bounds; the render-blocking chain and byte weights are accurate.
