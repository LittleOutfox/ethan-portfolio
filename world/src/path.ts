// Scroll → world time → camera. Pure math, no DOM: the bus hands us one
// progress per story segment; their sum is the world clock (0..9), and the
// camera glides along Catmull-Rom curves through one authored key per
// segment boundary.
import { CatmullRomCurve3, Vector3 } from 'three'

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
 * A sampler for the camera at world time t (key i sits at t = i). Positions and
 * look targets ride centripetal Catmull-Rom curves, so the camera passes through
 * every key without a corner; fov eases between neighbouring keys.
 */
export function makeCameraPath(keys: Key[]) {
  const n = keys.length
  const pos = new CatmullRomCurve3(keys.map((k) => new Vector3(...k.pos)), false, 'centripetal')
  const look = new CatmullRomCurve3(keys.map((k) => new Vector3(...k.look)), false, 'centripetal')
  const v = new Vector3()
  return (t: number, out: Pose): Pose => {
    const tc = t < 0 ? 0 : t > n - 1 ? n - 1 : t
    const u = tc / (n - 1)
    pos.getPoint(u, v)
    out.pos[0] = v.x; out.pos[1] = v.y; out.pos[2] = v.z
    look.getPoint(u, v)
    out.look[0] = v.x; out.look[1] = v.y; out.look[2] = v.z
    const i = Math.min(n - 2, Math.floor(tc))
    const f = tc - i
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
