# ORIGIN — 起源

A nine-tailed fox scroll-story portfolio. One continuous journey through a moonlit ink forest — each chapter earned, like every tail.

**Ethan Tiong** · Electrical Engineering @ University of Waterloo · RTL for ASIC & FPGA

## The story

| Chapter | | |
|---|---|---|
| 00 | The Veil / Hero | ORIGIN — where the tales begin |
| 01 | Awakening 觉醒 | the fox wakes, and remembers its name |
| 02 | The Hunt | signals, traced through the dark — five disciplines |
| 03 | The Leap | selected works, caught in motion — three spirit gates |
| 04 | The Den 炉火 | not every night is a hunt |
| 05 | Transformation 蜕变 | every tail is earned — five milestones, five tails |
| 06 | The Snowfield 雪 | the snow waits. leave a trace |

## Craft notes

- **Hand-drawn ink foxes** — seven original SVG drawings, rendered as translucent moonlight spirits through a three-layer bloom (no raster AI art).
- **One continuous journey** — a graded forest video scrubbed by total scroll progress, melted into the ink at every edge.
- **Every tail is earned** — the sitting fox's five tails are baked into separate bitmaps at load (canvas alpha compositing over untouched artwork) and unfurl one per milestone.
- **Proper Chinese** — every hanzi is Simplified Chinese, natively reviewed (起源 · 觉醒 · 炉火 · 蜕变 · 以狐为引); set in Noto Serif SC.
- **Motion with intent** — GSAP ScrollTrigger + Lenis; pinned chapters, masked line reveals, a horizontal hunt, gates you pass through. Reduced-motion and no-JS fallbacks included.

## Stack

Vanilla HTML / CSS / JavaScript. GSAP 3.12 (ScrollTrigger) and Lenis via CDN. No build step.

## Run locally

```
python -m http.server 4173
```

Then open http://localhost:4173. A static server is required (the scroll-scrubbed video is fetched as a blob).

## Repository notes

The earlier iteration of this portfolio is preserved on the [`previous-attempt`](../../tree/previous-attempt) branch.

---

Designed & built by hand. 以狐为引 — the fox leads the way.
