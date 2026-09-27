// The ground and where things stand on it. Pure and seeded, so every device
// builds the same forest, and a lower tier simply draws fewer of its trees.
import { KEYS } from './keys'
import { makeCameraPath, type Pose } from './path'

/** The walking route (x, elevation, z): meadow → forest → trail → torii stair → den → summit → snowfield. */
export const ROUTE: [number, number, number][] = [
  [0, 0, 40],
  [0, 0, 14],
  [0, 0, -10],
  [4, 0, -22],
  [46, 0, -22],
  [60, 0.4, -36],
  [60, 9, -84],
  [64, 9.4, -96],
  [60, 11, -114],
  [60, 10, -150],
  [60, 9.4, -210],
]

/** Deterministic PRNG (mulberry32, as on the v2 branch). */
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

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Distance from (x, z) to a polyline of [x, z] points. */
export function distanceToCurve(x: number, z: number, pts: [number, number][]): number {
  let best = Infinity
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i]
    const [bx, bz] = pts[i + 1]
    const dx = bx - ax, dz = bz - az
    const len2 = dx * dx + dz * dz || 1
    const u = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / len2))
    const d = Math.hypot(x - (ax + u * dx), z - (az + u * dz))
    if (d < best) best = d
  }
  return best
}

/**
 * Ground height. Near the route it takes the route's own elevation (a smooth,
 * distance-weighted blend over its segments, so the stair climbs without
 * cliffs); away from it the ground rolls gently.
 */
export function heightAt(x: number, z: number): number {
  let wsum = 0, esum = 0, dmin = Infinity
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const [ax, ay, az] = ROUTE[i]
    const [bx, by, bz] = ROUTE[i + 1]
    const dx = bx - ax, dz = bz - az
    const len2 = dx * dx + dz * dz || 1
    const u = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / len2))
    const d = Math.hypot(x - (ax + u * dx), z - (az + u * dz))
    const w = 1 / (d * d * d * d + 1)
    wsum += w
    esum += w * (ay + u * (by - ay))
    if (d < dmin) dmin = d
  }
  const roll = 0.7 * Math.sin(x * 0.11 + 1.3) * Math.sin(z * 0.09 - 0.7) + 0.35 * Math.sin(x * 0.23 + z * 0.17)
  return esum / wsum + roll * smoothstep(4, 22, dmin)
}

export interface Tree {
  x: number
  y: number
  z: number
  /** trunk radius at the base (m) */
  radius: number
  height: number
  /** rotation about y and a small lean, radians */
  rot: number
  lean: number
  /** which archetype to draw */
  kind: number
}

const ROUTE_XZ: [number, number][] = ROUTE.map(([x, , z]) => [x, z])

/** Where the forest grows: none in the meadow or on the snowfield, a hollow at the den, a clearing at the summit. */
function forestDensity(x: number, z: number): number {
  let d = 1
  d *= 1 - smoothstep(10, 22, z) * 0.97 // the meadow before the forest edge
  const snow = smoothstep(-128, -140, z) // the open snowfield…
  d *= 1 - snow * smoothstep(90, 60, Math.abs(x - 60)) // …ringed by a far tree line
  d *= smoothstep(5, 9, Math.hypot(x - 74, z + 104)) // the den hollow
  d *= smoothstep(10, 16, Math.hypot(x - 60, z + 114)) // the summit clearing
  return d
}

const CANDIDATES = 2600

/**
 * The seeded forest. Candidates are drawn in random order and filtered, so the
 * first N trees are an even sample of the whole forest — lower tiers take a prefix.
 */
export function placeTrees(density: number): Tree[] {
  const rng = mulberry32(7)
  const sample = makeCameraPath(KEYS)
  const pose: Pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 }
  const cam: [number, number][] = []
  for (let t = 0; t <= KEYS.length - 1; t += 0.02) {
    sample(t, pose)
    cam.push([pose.pos[0], pose.pos[2]])
  }
  const all: Tree[] = []
  for (let i = 0; i < CANDIDATES; i++) {
    const x = -70 + rng() * 200
    const z = 40 - rng() * 280
    const keep = rng()
    const radius = 0.3 + rng() * rng() * 0.8
    const height = 12 + rng() * 14
    const rot = rng() * Math.PI * 2
    const lean = (rng() - 0.5) * 0.12
    const kind = Math.floor(rng() * 5)
    if (keep > forestDensity(x, z)) continue
    const clear = radius + 2.4
    if (distanceToCurve(x, z, cam) < clear) continue
    if (distanceToCurve(x, z, ROUTE_XZ) < clear) continue
    all.push({ x, y: heightAt(x, z), z, radius, height, rot, lean, kind })
  }
  return all.slice(0, Math.round(all.length * Math.min(1, Math.max(0, density))))
}
