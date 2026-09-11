/**
 * Pure point-sampling helpers shared by the worker and the tests.
 * Input: a baked mask (R = density weight, G = geodesic distance, B = ink) as RGBA pixels.
 * Output: N points in mask-normalized space (0..1, y down), each carrying its geodesic value,
 * sorted along a Hilbert curve so index i is spatially coherent across poses.
 */

export interface MaskImage {
  width: number
  height: number
  /** RGBA, row-major, as returned by ImageData.data */
  data: Uint8ClampedArray | Uint8Array
}

export interface SampledPose {
  /** x, y pairs in 0..1 mask space (y down), Hilbert-sorted */
  xy: Float32Array
  /** geodesic distance 0..1 per point (0 = nose) */
  geo: Float32Array
  count: number
}

/** Deterministic PRNG (mulberry32) so every device samples identical clouds. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hilbert curve index of (x, y) on a 2^order grid (x, y in 0..2^order-1). */
export function hilbertIndex(order: number, x: number, y: number): number {
  const n = 1 << order
  let d = 0
  for (let s = n >> 1; s > 0; s >>= 1) {
    const rx = (x & s) > 0 ? 1 : 0
    const ry = (y & s) > 0 ? 1 : 0
    d += s * s * ((3 * rx) ^ ry)
    if (ry === 0) {
      if (rx === 1) {
        x = n - 1 - x
        y = n - 1 - y
      }
      const t = x
      x = y
      y = t
    }
  }
  return d
}

/**
 * Draw `count` stratified samples from the mask's R channel (density), read G (geodesic) at each,
 * jitter within the pixel, then Hilbert-sort. Weighted sampling means thin whisker strokes and
 * heavy tail masses both receive points in proportion to the baked density, not raw ink.
 */
export function samplePose(mask: MaskImage, count: number, seed = 1): SampledPose {
  const { width, height, data } = mask
  const n = width * height
  const cdf = new Float64Array(n)
  let acc = 0
  for (let i = 0; i < n; i++) {
    acc += data[i * 4] // R = density weight
    cdf[i] = acc
  }
  if (acc <= 0) throw new Error('mask has no density')

  const rng = mulberry32(seed)
  const xy = new Float32Array(count * 2)
  const geo = new Float32Array(count)
  const keys = new Uint32Array(count)
  const order = 10
  const grid = (1 << order) - 1

  for (let k = 0; k < count; k++) {
    const u = ((k + rng()) / count) * acc
    // binary search the CDF
    let lo = 0
    let hi = n - 1
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (cdf[mid] < u) lo = mid + 1
      else hi = mid
    }
    const px = lo % width
    const py = (lo / width) | 0
    const x = (px + rng()) / width
    const y = (py + rng()) / height
    xy[k * 2] = x
    xy[k * 2 + 1] = y
    geo[k] = data[lo * 4 + 1] / 255
    keys[k] = hilbertIndex(order, Math.min(grid, (x * grid) | 0), Math.min(grid, (y * grid) | 0))
  }

  // sort by Hilbert key (index array sort, then gather)
  const idx = new Uint32Array(count)
  for (let i = 0; i < count; i++) idx[i] = i
  idx.sort((a, b) => keys[a] - keys[b])
  const sxy = new Float32Array(count * 2)
  const sgeo = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const j = idx[i]
    sxy[i * 2] = xy[j * 2]
    sxy[i * 2 + 1] = xy[j * 2 + 1]
    sgeo[i] = geo[j]
  }
  return { xy: sxy, geo: sgeo, count }
}

/** Take every k-th point of a Hilbert-ordered pose (stride decimation keeps the spread even). */
export function decimate(pose: SampledPose, count: number): SampledPose {
  if (count >= pose.count) return pose
  const step = pose.count / count
  const xy = new Float32Array(count * 2)
  const geo = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const j = Math.min(pose.count - 1, Math.floor(i * step))
    xy[i * 2] = pose.xy[j * 2]
    xy[i * 2 + 1] = pose.xy[j * 2 + 1]
    geo[i] = pose.geo[j]
  }
  return { xy, geo, count }
}
