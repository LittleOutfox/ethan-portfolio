// Scroll → world time → camera. Pure math, no DOM: the bus hands us one
// progress per story segment; their sum is the world clock (0..9), and the
// camera glides through one authored key per segment boundary.

export const SEGMENTS = ['hero', 'origin', 'hunt', 'trail', 'works', 'den', 'climb', 'tails', 'snow'] as const
export type Segment = (typeof SEGMENTS)[number]
export type Progress = Partial<Record<Segment, number>>

export type Vec3 = [number, number, number]
export interface Key {
  pos: Vec3
  look: Vec3
  /** vertical field of view in degrees, before the aspect fit */
  fov: number
}
export type Pose = Key

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** The world clock: one unit per segment, each clamped so a lagging scrub never overshoots. */
export function worldTime(p: Progress): number {
  let t = 0
  for (const k of SEGMENTS) t += clamp01(p[k] ?? 0)
  return t
}

/**
 * Slopes for a monotone cubic through evenly spaced values (Fritsch–Carlson):
 * wherever the keys stop rising or falling the curve flattens instead of
 * overshooting — a camera that runs sideways into a key never swings past it.
 */
function monotoneSlopes(y: number[]): number[] {
  const n = y.length
  const m = new Array<number>(n).fill(0)
  for (let k = 1; k < n - 1; k++) {
    const d0 = y[k] - y[k - 1]
    const d1 = y[k + 1] - y[k]
    m[k] = d0 * d1 > 0 ? 2 / (1 / d0 + 1 / d1) : 0
  }
  m[0] = y[1] - y[0]
  m[n - 1] = y[n - 1] - y[n - 2]
  return m
}

function hermite(y: number[], m: number[], k: number, s: number): number {
  const s2 = s * s
  const s3 = s2 * s
  return (2 * s3 - 3 * s2 + 1) * y[k] + (s3 - 2 * s2 + s) * m[k] + (-2 * s3 + 3 * s2) * y[k + 1] + (s3 - s2) * m[k + 1]
}

/**
 * A sampler for the camera at world time t (key i sits at t = i). Position and
 * look target each ride a monotone cubic per axis — through every key, smooth
 * across it, never overshooting between two — and fov eases key to key.
 */
export function makeCameraPath(keys: Key[]) {
  const n = keys.length
  const axis = (f: (k: Key) => number) => {
    const y = keys.map(f)
    return { y, m: monotoneSlopes(y) }
  }
  const P = [axis((k) => k.pos[0]), axis((k) => k.pos[1]), axis((k) => k.pos[2])]
  const L = [axis((k) => k.look[0]), axis((k) => k.look[1]), axis((k) => k.look[2])]
  return (t: number, out: Pose): Pose => {
    const tc = t < 0 ? 0 : t > n - 1 ? n - 1 : t
    const i = Math.min(n - 2, Math.floor(tc))
    const f = tc - i
    for (let a = 0; a < 3; a++) {
      out.pos[a] = hermite(P[a].y, P[a].m, i, f)
      out.look[a] = hermite(L[a].y, L[a].m, i, f)
    }
    const s = f * f * (3 - 2 * f)
    out.fov = keys[i].fov + (keys[i + 1].fov - keys[i].fov) * s
    return out
  }
}

const MIN_H = 38
const MAX_H = 75
const MAX_V = 80
const RAD = Math.PI / 180
const toH = (v: number, a: number) => (2 * Math.atan(a * Math.tan((v * RAD) / 2))) / RAD
const toV = (h: number, a: number) => (2 * Math.atan(Math.tan((h * RAD) / 2) / a)) / RAD

/**
 * Keep the horizontal field of view sane whatever the screen: a 2.39:1
 * ultrawide would stretch the edges past 75° across, a portrait phone would
 * shrink the world to a keyhole. Returns the vertical fov to use.
 */
export function fitFov(vfov: number, aspect: number): number {
  const h = toH(vfov, aspect)
  if (h > MAX_H) return toV(MAX_H, aspect)
  if (h < MIN_H) return Math.min(MAX_V, toV(MIN_H, aspect))
  return vfov
}
