// Bakes each fox drawing (art/kitsune/<pose>.svg) into a small sampling mask:
//   R = density-normalized ink weight (where to put points),
//   G = geodesic "signal distance" from the nose along the strokes (0 = nose, 255 = farthest tip),
//   B = raw ink coverage.
// Output: public/fox/<pose>.png (512 px long edge, lossless) + public/fox/<pose>.json sidecar.
// Debug renders go to .impeccable/review/bake/. Run: npm run bake [pose ...]
import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const OUT = resolve(ROOT, 'public/fox')
const DEBUG = resolve(ROOT, '.impeccable/review/bake')
mkdirSync(OUT, { recursive: true })
mkdirSync(DEBUG, { recursive: true })

// noseHint: where the nose sits, as a fraction of the ink bounding box (x from left, y from top).
const POSES = {
  sitting: { noseHint: { x: 0.215, y: 0.13 } },
  howling: { noseHint: { x: 0.41, y: 0.02 } },
  bowing: { noseHint: { x: 0.0, y: 0.86 } },
}
const LONG_EDGE = 512
const RENDER_SCALE = 2 // rasterize at 2x the viewBox; the autotrace has no detail beyond that
const GAP_COST = 6 // walking through empty space costs this much more than walking along a stroke

const only = process.argv.slice(2)
const names = only.length ? only : Object.keys(POSES)

function gaussianKernel(sigma) {
  const r = Math.ceil(sigma * 3)
  const k = new Float32Array(2 * r + 1)
  let s = 0
  for (let i = -r; i <= r; i++) {
    k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma))
    s += k[i + r]
  }
  for (let i = 0; i < k.length; i++) k[i] /= s
  return { k, r }
}

function blur(src, W, H, sigma) {
  const { k, r } = gaussianKernel(sigma)
  const tmp = new Float32Array(W * H)
  const out = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let a = 0
      for (let i = -r; i <= r; i++) {
        const xx = Math.min(W - 1, Math.max(0, x + i))
        a += src[y * W + xx] * k[i + r]
      }
      tmp[y * W + x] = a
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let a = 0
      for (let i = -r; i <= r; i++) {
        const yy = Math.min(H - 1, Math.max(0, y + i))
        a += tmp[yy * W + x] * k[i + r]
      }
      out[y * W + x] = a
    }
  }
  return out
}

function sobel(src, W, H) {
  const out = new Float32Array(W * H)
  let max = 1e-6
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      const gx = -src[i - W - 1] - 2 * src[i - 1] - src[i + W - 1] + src[i - W + 1] + 2 * src[i + 1] + src[i + W + 1]
      const gy = -src[i - W - 1] - 2 * src[i - W] - src[i - W + 1] + src[i + W - 1] + 2 * src[i + W] + src[i + W + 1]
      const g = Math.hypot(gx, gy)
      out[i] = g
      if (g > max) max = g
    }
  }
  for (let i = 0; i < out.length; i++) out[i] /= max
  return out
}

// Dial's algorithm (bucketed Dijkstra): cost 1 per step along the dilated stroke mask,
// GAP_COST per step through empty space, so light follows strokes and only jumps gaps when it must.
function geodesic(mask, W, H, seed) {
  const INF = 0x7fffffff
  const dist = new Int32Array(W * H).fill(INF)
  const buckets = []
  const push = (d, i) => {
    ;(buckets[d] ||= []).push(i)
  }
  dist[seed] = 0
  push(0, seed)
  let maxD = 0
  for (let d = 0; d < buckets.length; d++) {
    const b = buckets[d]
    if (!b) continue
    for (let n = 0; n < b.length; n++) {
      const i = b[n]
      if (dist[i] !== d) continue
      const x = i % W
      const y = (i / W) | 0
      if (mask[i] && d > maxD) maxD = d
      if (x > 0) relax(i - 1, d)
      if (x < W - 1) relax(i + 1, d)
      if (y > 0) relax(i - W, d)
      if (y < H - 1) relax(i + W, d)
    }
    buckets[d] = null
  }
  function relax(j, d) {
    const nd = d + (mask[j] ? 1 : GAP_COST)
    if (nd < dist[j]) {
      dist[j] = nd
      push(nd, j)
    }
  }
  return { dist, maxD }
}

for (const name of names) {
  const cfg = POSES[name]
  if (!cfg) throw new Error(`unknown pose ${name}`)
  const svg = readFileSync(resolve(ROOT, `art/kitsune/${name}.svg`))
  const meta = await sharp(svg).metadata()
  const W = Math.round(meta.width * RENDER_SCALE)
  const H = Math.round(meta.height * RENDER_SCALE)
  const { data } = await sharp(svg, { density: 72 * RENDER_SCALE })
    .resize(W, H, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // ink coverage 0..1: black paths on transparent
  const ink = new Float32Array(W * H)
  let minX = W, maxX = 0, minY = H, maxY = 0, count = 0
  for (let i = 0; i < W * H; i++) {
    const a = data[i * 4 + 3] / 255
    const lum = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / (3 * 255)
    const v = a * (1 - lum)
    ink[i] = v
    if (v > 0.15) {
      count++
      const x = i % W
      const y = (i / W) | 0
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  // px at render scale per px at mask scale
  const outW = W >= H ? LONG_EDGE : Math.round((LONG_EDGE * W) / H)
  const outH = W >= H ? Math.round((LONG_EDGE * H) / W) : LONG_EDGE
  const s = W / outW

  // density normalization: 1px whisker lines and near-solid tail masses get proportionate weight
  const local = blur(ink, W, H, 6 * s)
  const mass = blur(ink, W, H, 10 * s) // wide neighbourhood mass: isolated specks have almost none
  const edge = sobel(blur(ink, W, H, 1.2 * s), W, H)
  const weight = new Float32Array(W * H)
  let wmax = 1e-6
  for (let i = 0; i < W * H; i++) {
    // isolated specks (little local ink mass) are autotrace noise, not drawing: drop them
    const w = ink[i] > 0.15 && mass[i] > 0.02 ? (ink[i] / (local[i] + 0.04)) * (0.35 + 0.65 * Math.min(1, edge[i] * 1.5)) : 0
    weight[i] = w
    if (w > wmax) wmax = w
  }
  for (let i = 0; i < W * H; i++) weight[i] = Math.min(1, (weight[i] / wmax) * 1.6)

  // stroke mask, dilated so detached whiskers and tail strokes join for the geodesic walk
  const dil = blur(ink, W, H, 3 * s)
  const mask = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) mask[i] = dil[i] > 0.03 ? 1 : 0

  // nose seed: the ink pixel nearest the hint (fraction of the ink bbox)
  const hx = minX + cfg.noseHint.x * (maxX - minX)
  const hy = minY + cfg.noseHint.y * (maxY - minY)
  let seed = -1
  let best = Infinity
  for (let i = 0; i < W * H; i++) {
    if (ink[i] <= 0.3 || local[i] < 0.03) continue // skip stray specks
    const x = i % W
    const y = (i / W) | 0
    const d = (x - hx) ** 2 + (y - hy) ** 2
    if (d < best) {
      best = d
      seed = i
    }
  }
  const { dist, maxD } = geodesic(mask, W, H, seed)

  // pack channels at render scale, then downsample to the mask size
  const rgb = Buffer.alloc(W * H * 3)
  for (let i = 0; i < W * H; i++) {
    const g = dist[i] >= 0x7fffffff ? 1 : Math.min(1, dist[i] / maxD)
    rgb[i * 3] = Math.round(weight[i] * 255)
    rgb[i * 3 + 1] = Math.round(g * 255)
    rgb[i * 3 + 2] = Math.round(Math.min(1, ink[i]) * 255)
  }
  await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
    .resize(outW, outH, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9, palette: false })
    .toFile(resolve(OUT, `${name}.png`))

  // debug: geodesic as a red-to-blue ramp over the ink, density as grey
  const dbg = Buffer.alloc(W * H * 3)
  for (let i = 0; i < W * H; i++) {
    const g = dist[i] >= 0x7fffffff ? 0 : dist[i] / maxD
    const on = ink[i] > 0.15
    dbg[i * 3] = on ? Math.round(255 * (1 - g)) : 0
    dbg[i * 3 + 1] = on ? Math.round(255 * (1 - Math.abs(g - 0.5) * 2)) : 0
    dbg[i * 3 + 2] = on ? Math.round(255 * g) : 0
  }
  await sharp(dbg, { raw: { width: W, height: H, channels: 3 } })
    .resize(outW * 2, outH * 2)
    .png()
    .toFile(resolve(DEBUG, `${name}-geodesic.png`))
  const dens = Buffer.alloc(W * H)
  for (let i = 0; i < W * H; i++) dens[i] = Math.round(weight[i] * 255)
  await sharp(dens, { raw: { width: W, height: H, channels: 1 } })
    .resize(outW * 2, outH * 2)
    .png()
    .toFile(resolve(DEBUG, `${name}-density.png`))

  const side = {
    pose: name,
    viewBox: { width: meta.width, height: meta.height },
    mask: { width: outW, height: outH },
    bbox: { x: minX / W, y: minY / H, w: (maxX - minX) / W, h: (maxY - minY) / H },
    nose: { x: (seed % W) / W, y: ((seed / W) | 0) / H },
    inkPixels: count,
    maxGeodesic: maxD,
  }
  writeFileSync(resolve(OUT, `${name}.json`), JSON.stringify(side, null, 2))
  console.log(
    `${name}: ${W}x${H} -> ${outW}x${outH}, ink px ${count}, nose (${side.nose.x.toFixed(3)}, ${side.nose.y.toFixed(3)}), maxGeo ${maxD}`,
  )
}
