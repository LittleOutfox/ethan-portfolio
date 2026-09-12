// Render the fallback posters from the baked masks with the field's own material, so the
// no-WebGL, JS-off, low-tier and reduced-motion paths show the same stipple fox the shader draws:
// white core, ice halo, violet tail tips, additive two-lobe sprites, sRGB-encoded premultiplied
// alpha (the same gamma-on-alpha the fragment shader has by design). Writes
// public/fox/<pose>-poster.webp and records the provenance in public/fox/<pose>.json.
//
//   node scripts/make-posters.mjs            # sitting and bowing
//   node scripts/make-posters.mjs sitting    # one pose
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FOX = resolve(ROOT, 'public/fox')

// the HIGH tier: 60k points at 4.2 px on a ~660 px plate, rendered here at 2x
const POINTS = 60_000
const POINT_SIZE = 4.2
const SCALE = 2
const OUT_W = 648 * SCALE
const COLORS = { body: '#9FD8FF', tip: '#B9A7F0', core: '#F4F7FB' }

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const linearToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)
const hexLinear = (hex) => [1, 3, 5].map((i) => srgbToLinear(parseInt(hex.slice(i, i + 2), 16) / 255))
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const mix = (a, b, t) => a + (b - a) * t

async function render(name) {
  const side = JSON.parse(await readFile(resolve(FOX, `${name}.json`), 'utf8'))
  const { data, info } = await sharp(resolve(FOX, `${name}.png`)).raw().toBuffer({ resolveWithObject: true })
  const MW = info.width
  const MH = info.height
  const ch = info.channels
  const W = OUT_W
  const H = Math.round((OUT_W * MH) / MW)

  // CDF over the weight channel, stratified draws, jitter inside the pixel: the runtime sampler
  const cdf = new Float64Array(MW * MH)
  let total = 0
  for (let i = 0; i < MW * MH; i++) {
    total += data[i * ch]
    cdf[i] = total
  }
  if (total === 0) throw new Error(`${name}: mask has no density`)
  const rng = mulberry32(name === 'sitting' ? 1 : 2)
  const pts = []
  for (let i = 0; i < POINTS; i++) {
    const u = ((i + rng()) / POINTS) * total
    let lo = 0
    let hi = MW * MH - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cdf[mid] < u) lo = mid + 1
      else hi = mid
    }
    const x = ((lo % MW) + rng()) / MW
    const y = (Math.floor(lo / MW) + rng()) / MH
    const geo = data[lo * ch + 1] / 255
    pts.push({ x, y, geo, seedY: rng(), seedZ: rng() })
  }

  const body = hexLinear(COLORS.body)
  const tip = hexLinear(COLORS.tip)
  const acc = new Float32Array(W * H * 4)
  for (const p of pts) {
    // the vertex shader's per-point terms, formed pose, no pulse, moon far away (lit ~ 1)
    const big = p.seedY >= 0.9 ? 1 : 0
    const sizeMul = big ? 3 : 0.7 + 0.6 * (p.seedY / 0.9)
    const depth = 0.65 + 0.35 * p.seedZ
    const lum = 0.8 * depth
    const alpha = (big ? 0.08 : 0.3) * (0.7 + 0.3 * depth)
    const t = smoothstep(0.82, 1, p.geo)
    const rgb = [mix(body[0], tip[0], t) * lum, mix(body[1], tip[1], t) * lum, mix(body[2], tip[2], t) * lum]
    const size = POINT_SIZE * sizeMul * SCALE
    const cx = p.x * W
    const cy = p.y * H
    const r = Math.ceil(size / 2)
    const x0 = Math.max(0, Math.floor(cx - r))
    const x1 = Math.min(W - 1, Math.ceil(cx + r))
    const y0 = Math.max(0, Math.floor(cy - r))
    const y1 = Math.min(H - 1, Math.ceil(cy + r))
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        // the fragment shader: gl_PointCoord - 0.5, two lobes, premultiplied, sRGB-encoded, added
        const d = Math.hypot((x + 0.5 - cx) / size, (y + 0.5 - cy) / size)
        if (d > 0.5) continue
        let core = 1 - smoothstep(0, 0.2, d)
        core = core * core * core
        let halo = 1 - smoothstep(0, 0.5, d)
        halo = halo * halo
        const a = alpha * (core + halo * 0.12)
        const o = (y * W + x) * 4
        acc[o] += linearToSrgb(rgb[0] * a)
        acc[o + 1] += linearToSrgb(rgb[1] * a)
        acc[o + 2] += linearToSrgb(rgb[2] * a)
        acc[o + 3] += a
      }
    }
  }

  // the canvas is premultiplied over the ground; a WebP carries straight alpha
  const out = Buffer.alloc(W * H * 4)
  for (let i = 0; i < W * H; i++) {
    const a = Math.min(1, acc[i * 4 + 3])
    for (let c = 0; c < 3; c++) {
      const v = Math.min(1, acc[i * 4 + c])
      out[i * 4 + c] = Math.round(255 * (a > 0 ? Math.min(1, v / a) : 0))
    }
    out[i * 4 + 3] = Math.round(255 * a)
  }
  const file = `${name}-poster.webp`
  await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile(resolve(FOX, file))
  side.poster = {
    file,
    width: W,
    height: H,
    points: POINTS,
    pointSize: POINT_SIZE * SCALE,
    renderedWith: 'scripts/make-posters.mjs',
    renderedAt: new Date().toISOString().slice(0, 10),
  }
  await writeFile(resolve(FOX, `${name}.json`), JSON.stringify(side, null, 2) + '\n')
  console.log(`${name}: ${W}x${H}, ${POINTS} points -> ${file}`)
}

const only = process.argv.slice(2)
for (const name of only.length ? only : ['sitting', 'bowing']) await render(name)
