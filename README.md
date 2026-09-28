# ORIGIN — 起源

A nine-tailed fox scroll-story portfolio. One continuous journey through a moonlit winter forest — each chapter earned, like every tail.

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

- **Hand-drawn ink foxes** — seven original ink drawings, rendered as translucent moonlight spirits through a three-layer bloom (no raster AI art). The autotraced vectors are baked in Chrome to lossless rasters at every display density the page shows them (`tools/bake-fox-rasters.mjs`), so the ink is pixel-for-pixel the browser's own render and scrolling never re-rasterizes a megabyte of path data.
- **One continuous journey** — a real-time 3D winter forest under the moon that one camera travels through as you scroll: gnarled willows grown from a seed, frosted and hung with snow, deep snow underfoot where a few spirit blooms grow, each an orb of aqua light held up on a twisting stalk, and a spirit stream at the forest's edge, where a great willow stands; a stone stair through three red torii and their lanterns, a den whose fire has melted the snow, a summit where the grandest willow stands beside the moon, and a snowfield where a lone willow waits. Snow falls slowly the whole way, spirit orbs lead the way up to the shrine, and a spirit fox runs with you from the first view to the last: a slender, see-through blue spirit drawn by a shader as a glowing volume; it dashes after you in a bounding gallop driven by the scroll, leaving pawprints of light in the snow, and when you stop, it turns to face you, then sits and waits. The pinned chapters drive the camera with their own scrubbed progress, so the world moves in exact step with them — the great torii pass with the page's gates, and the moon brightens with each earned tail. No textures or models are downloaded; the whole world is one ~200 KB module (on the RTX 5060 Ti it was built on, it holds the display's refresh rate at 3440×1440).
- **Every tail is earned** — the sitting fox's five tails are baked into separate bitmaps at load (canvas alpha compositing over untouched artwork) and unfurl one per milestone.
- **Proper Chinese** — every hanzi is Simplified Chinese, natively reviewed (起源 · 觉醒 · 炉火 · 蜕变 · 以狐为引); set in Noto Serif SC.
- **Motion with intent** — GSAP ScrollTrigger + Lenis; pinned chapters, masked line reveals, a horizontal hunt, gates you pass through. Reduced-motion and no-JS fallbacks included.

## Stack

Vanilla HTML / CSS / JavaScript. GSAP 3.12 (ScrollTrigger) and Lenis, self-hosted under `js/vendor/` (no CDN). The site itself has no build step.

The 3D world is its own small package in `world/` (React 19 + React Three Fiber + three.js, built with Vite) that compiles to **one committed file**, `js/world/scene.js`, loaded as a module. `js/main.js` stays the only owner of the scroll: it publishes each chapter's progress on `window.__world`, and a last GSAP ticker listener asks the world to draw, so page and world share one frame loop. Without WebGL2 (or with reduced motion, data saver, forced colours or `?world=off`) the page runs as before, with its 2D foxfire and snow.

## Run locally

```
python -m http.server 4173
```

Then open http://localhost:4173. A static server is required (the world loads as an ES module).

### The 3D world

```
cd world
npm install
npm test           # path, layout, tree and tier logic
npm run build      # writes js/world/scene.js — commit it
npm run dev        # the same build, rebuilt on every save
```

After changing the world, bump the `?v=` on `js/world/scene.js` in `index.html`'s head script. To look at a device class: `?tier=high|medium|low|none`; `?world=off` shows the page without it.

If a fox drawing changes, rebake its rasters (needs Chrome and `playwright`; `npm i -D playwright sharp`):

```
node tools/bake-fox-rasters.mjs [pose ...]
```

## Repository notes

The earlier iteration of this portfolio is preserved on the [`previous-attempt`](../../tree/previous-attempt) branch.

---

Designed & built by hand. 以狐为引 — the fox leads the way.
