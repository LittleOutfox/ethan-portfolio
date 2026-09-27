// Bakes each fox drawing (assets/kitsune/<pose>.svg) into the lossless WebP
// rasters the page ships (assets/kitsune/<pose>-<w>.webp) — one file per
// srcset candidate, rendered by Chrome itself so every pixel is the one the
// browser would have drawn from the vector at that size.
//
// Why rasters: the drawings are autotraced — 130k–500k path commands in
// 0.38–1.25 MB of markup per pose. Nothing on the page zooms them, but the
// browser re-rasterized that path soup whenever a mount's compositor layer
// changed, which the scroll choreography does on every frame: 20–100 ms
// main-thread stalls that landed as dropped frames (measured on a 120 Hz
// desktop: p99 frame 58 ms with the SVGs, 9 ms with these rasters).
//
// Why Chrome and not sharp/librsvg: the ink is hundreds of thousands of tiny
// overlapping fills, and every rasterizer antialiases their seams differently
// — a librsvg bake read visibly heavier than the browser's own render. A
// screenshot of the <img> at the target width is a transcription: verified
// pixel-identical to the live SVG at 1x (mean |Δα| ≤ 0.001/255) and within
// AA noise at 2x.
//
// Candidates: WIDTHS mirrors FOX in js/main.js — each width is the widest
// CSS width some mount is given at some tier (css/styles.css) × a device
// pixel ratio. Retina candidates get an explicit bitmap height that is a
// whole multiple of their density (an odd 2x height lays out as a half CSS
// pixel and the browser resamples the whole bitmap by one row). Keep the
// three tables in sync when a mount's width rule changes.
//
// Run:   node tools/bake-fox-rasters.mjs [pose ...]   (from any cwd)
// Needs: Chrome installed; `playwright` resolvable (npm i -D playwright, or
//        the global @playwright/cli install, which this script falls back
//        to); sharp (node_modules). Opens a Chrome window for a few seconds
//        — the shipped files were baked headed, on the GPU raster path.
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)) // the repo root, from any cwd
const SRC = resolve(ROOT, 'assets/kitsune')

// [width, snap]: snap 1 = natural height (the 1x transcription, fractional
// height snapped by the browser exactly as the live SVG's was); 2 = even
// height for 2x displays; 6 = whole for both 2x and 3x (the veil fox is the
// one mount a 3x phone shows near its desktop size).
const POSES = {
  sitting: { vb: [674, 502], widths: [[620, 1], [840, 1], [1240, 2], [1680, 2]], note: '.hero-spirit 620 · .tails-scene 840' },
  bowing: { vb: [665, 592], widths: [[580, 1], [680, 1], [1160, 2], [1360, 2]], note: '.origin-fox min(44vw, 580) · 680 at ≥1700px' },
  howling: { vb: [546, 569], widths: [[520, 1], [620, 1], [1040, 2], [1240, 2]], note: '.fire-fox min(40vw, 520) · 620 at ≥1700px' },
  walking: { vb: [630, 404], widths: [[480, 1], [960, 2]], note: '.hunt-fox clamp(300, 34vw, 480)' },
  standing: { vb: [450, 750], widths: [[400, 1], [800, 2]], note: '.pool-fox-wrap min(28vw, 400)' },
  diving: { vb: [399, 721], widths: [[310, 1], [620, 2]], note: '.works-fox clamp(200, 21vw, 310)' },
  descending: { vb: [232, 533], widths: [[160, 1], [320, 2], [480, 6]], note: '.veil-spirit clamp(110, 16vh, 160)' },
}

async function loadPlaywright() {
  try { return await import('playwright') } catch (e) { /* not installed locally */ }
  const global = process.env.APPDATA && join(process.env.APPDATA, 'npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs')
  try { if (global) return await import(pathToFileURL(global).href) } catch (e) { /* no global cli either */ }
  throw new Error('playwright not found — npm i -D playwright (or npm i -g @playwright/cli)')
}

const only = process.argv.slice(2)
const names = only.length ? only : Object.keys(POSES)
for (const n of names) if (!POSES[n]) throw new Error(`unknown pose ${n}`)

const { chromium } = await loadPlaywright()
const browser = await chromium.launch({ channel: 'chrome', headless: false })
const ctx = await browser.newContext({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: 1 })
// serve the drawings from a private origin — no dev server needed
await ctx.route('http://bake.local/**', (route) => {
  const { pathname } = new URL(route.request().url())
  if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html style="background:transparent"><body style="margin:0;background:transparent"></body></html>' })
  return route.fulfill({ path: join(SRC, pathname.replace(/^\/kitsune\//, '')), contentType: 'image/svg+xml' })
})
const page = await ctx.newPage()
await page.goto('http://bake.local/')

for (const name of names) {
  const cfg = POSES[name]
  const svgBytes = readFileSync(join(SRC, `${name}.svg`)).length
  for (const [W, snap] of cfg.widths) {
    const exact = (W * cfg.vb[1]) / cfg.vb[0]
    const H = snap === 1 ? null : Math.round(exact / snap) * snap
    await page.setViewportSize({ width: Math.max(W + 40, 400), height: Math.max(Math.ceil(exact) + 40, 400) })
    await page.evaluate(([src, W, H]) => {
      document.body.innerHTML = `<img id="fx" src="${src}" style="display:block;width:${W}px;height:${H ? H + 'px' : 'auto'};margin:0">`
      return document.getElementById('fx').decode()
    }, [`/kitsune/${name}.svg?w=${W}`, W, H])
    await page.waitForTimeout(60)
    const png = await page.locator('#fx').screenshot({ omitBackground: true, type: 'png', scale: 'css' })
    const out = join(SRC, `${name}-${W}.webp`)
    const info = await sharp(png).webp({ lossless: true, effort: 6 }).toFile(out)
    console.log(
      `${name}-${W}: ${info.width}x${info.height} (${snap === 1 ? 'natural' : 'snap ' + snap})  ` +
        `${(info.size / 1024).toFixed(0)} KB — ${(100 - (100 * info.size) / svgBytes).toFixed(1)}% under the SVG  (${cfg.note})`,
    )
  }
}

await browser.close()
