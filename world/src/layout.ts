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
  // the shrine's hill, west of the summit, where the far torii climb
  const hill = 9 * Math.exp(-((x - 38) ** 2 + (z + 136) ** 2) / (2 * 16 * 16))
  return esum / wsum + (roll + hill) * smoothstep(4, 22, dmin)
}

export interface Tree {
  x: number
  y: number
  z: number
  /** how far the flared base spreads (m) — what must stay clear of the camera */
  radius: number
  scale: number
  /** rotation about y (turns the tree's long branches toward the path) and a small lean, radians */
  rot: number
  lean: number
  /** which archetype to draw (trees.ts) */
  kind: number
}

/** trunk radius of each archetype in trees.ts (kept here so layout stays three-free to test) */
const TRUNK = [0.72, 0.55, 0.85, 0.5, 0.66]
/** the wide, gnarled archetypes frame the path; the tall narrow ones fill the depths */
const FRAMERS = [0, 2, 4]

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

/** Camera positions along the whole journey, every `step` of world time. */
export function cameraSamples(step: number): [number, number, number][] {
  const sample = makeCameraPath(KEYS)
  const pose: Pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 }
  const out: [number, number, number][] = []
  for (let t = 0; t <= KEYS.length - 1 + 1e-9; t += step) {
    sample(t, pose)
    out.push([pose.pos[0], pose.pos[1], pose.pos[2]])
  }
  return out
}

const CANDIDATES = 1500

/** the route point nearest (x, z) */
function nearestOnRoute(x: number, z: number): [number, number] {
  let best: [number, number] = [x, z]
  let bd = Infinity
  for (let i = 0; i < ROUTE_XZ.length - 1; i++) {
    const [ax, az] = ROUTE_XZ[i]
    const [bx, bz] = ROUTE_XZ[i + 1]
    const dx = bx - ax, dz = bz - az
    const u = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)))
    const px = ax + u * dx, pz = az + u * dz
    const d = Math.hypot(x - px, z - pz)
    if (d < bd) { bd = d; best = [px, pz] }
  }
  return best
}

/**
 * The seeded forest. Candidates are drawn in random order and filtered, so the
 * first N trees are an even sample of the whole forest — lower tiers take a prefix.
 * Trees near the path are the big gnarled framers, turned so their long
 * branches reach out over it.
 */
export function placeTrees(density: number): Tree[] {
  const rng = mulberry32(7)
  const cam: [number, number][] = cameraSamples(0.02).map(([x, , z]) => [x, z])
  const all: Tree[] = []
  for (let i = 0; i < CANDIDATES; i++) {
    const x = -70 + rng() * 200
    const z = 40 - rng() * 280
    const keep = rng()
    const r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng()
    if (keep > forestDensity(x, z)) continue
    // only where the camera can ever see: past ~65 m the fog has it anyway
    const dCam = distanceToCurve(x, z, cam)
    if (dCam > 65) continue
    const dPath = distanceToCurve(x, z, ROUTE_XZ)
    const framer = dPath < 14
    const kind = framer ? FRAMERS[Math.floor(r1 * FRAMERS.length)] : Math.floor(r1 * TRUNK.length)
    const scale = framer ? 1.0 + r2 * 0.4 : 0.75 + r2 * 0.4
    const radius = TRUNK[kind] * scale * 1.8
    const clear = radius + 3
    if (dCam < clear || dPath < clear) continue
    const [px, pz] = nearestOnRoute(x, z)
    const toward = Math.atan2(-(pz - z), px - x)
    const rot = framer ? toward + (r3 - 0.5) * 1.2 : r3 * Math.PI * 2
    const lean = (r4 - 0.5) * 0.1
    all.push({ x, y: heightAt(x, z), z, radius, scale, rot, lean, kind })
  }
  return all.slice(0, Math.round(all.length * Math.min(1, Math.max(0, density))))
}
