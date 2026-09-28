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
 * The spirit stream: it winds across the meadow just before the forest edge,
 * and the camera crosses it on the way in. Its centreline is z as a function
 * of x (two sines); terrain.frag.glsl draws the water from the same numbers.
 */
export const STREAM = { z: 17, a1: 3, f1: 0.08, p1: 0.4, a2: 1.2, f2: 0.21, p2: -1.3, width: 1.9 }

export function streamZ(x: number): number {
  const s = STREAM
  return s.z + s.a1 * Math.sin(s.f1 * x + s.p1) + s.a2 * Math.sin(s.f2 * x + s.p2)
}

/** Distance (m) from (x, z) to the stream's centreline, measured across the water. */
export function streamDistance(x: number, z: number): number {
  const s = STREAM
  const slope = s.a1 * s.f1 * Math.cos(s.f1 * x + s.p1) + s.a2 * s.f2 * Math.cos(s.f2 * x + s.p2)
  return Math.abs(z - streamZ(x)) / Math.sqrt(1 + slope * slope)
}

/**
 * The great trees, old willows of the widest kind: one at the forest's edge,
 * left of the meadow, its limbs reaching out over the path — the story starts
 * under it — one alone on a rise out on the snowfield, where it ends, and the
 * grandest of all on the snow east of the summit, beside the moon as the
 * tails are earned. Each stands in a glade of its own.
 */
export const GREAT_TREES: { x: number; z: number; scale: number; kind: number; glade: number; rot?: number }[] = [
  { x: -11, z: 6, scale: 3.2, kind: 2, glade: 14 },
  { x: 3.5, z: -206.7, scale: 1.9, kind: 2, glade: 20 },
  // turned so its long limbs reach east, away from the page's timeline
  { x: 118, z: -184, scale: 3.3, kind: 2, glade: 26, rot: 0 },
]

/**
 * Ground height. Near the route it takes the route's own elevation (a smooth,
 * distance-weighted blend over its segments, so the stair climbs without
 * cliffs); away from it the ground rolls gently, except along the stream,
 * which lies level in a shallow bed.
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
  const ds = streamDistance(x, z)
  const level = smoothstep(STREAM.width, STREAM.width + 10, ds)
  const bed = 0.25 * (1 - smoothstep(STREAM.width * 0.5, STREAM.width + 0.8, ds))
  // the snowfield's tree stands on a low hill, its roots clear of the drifts
  const [, lone] = GREAT_TREES
  const rise = 5 * Math.exp(-((x - lone.x) ** 2 + (z - lone.z) ** 2) / (2 * 12 * 12))
  return esum / wsum + (roll + hill) * smoothstep(4, 22, dmin) * level - bed + rise
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

/** Turn a tree so its long branches (local +x) reach toward the path. */
function towardPath(x: number, z: number): number {
  const [px, pz] = nearestOnRoute(x, z)
  return Math.atan2(-(pz - z), px - x)
}

/**
 * The seeded forest: the great trees first, then candidates drawn in random
 * order and filtered, so the first N trees are an even sample of the whole
 * forest — lower tiers take a prefix. Trees near the path are the big gnarled
 * framers, turned so their long branches reach out over it; none grows in the
 * stream, a great tree's glade or a spirit bloom's clearing.
 */
export function placeTrees(density: number): Tree[] {
  const great: Tree[] = GREAT_TREES.map((g) => ({
    x: g.x, y: heightAt(g.x, g.z), z: g.z,
    radius: TRUNK[g.kind] * g.scale * 1.8, scale: g.scale,
    rot: g.rot ?? towardPath(g.x, g.z), lean: 0, kind: g.kind,
  }))
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
    if (streamDistance(x, z) < STREAM.width + radius) continue
    if (GREAT_TREES.some((g) => Math.hypot(x - g.x, z - g.z) < g.glade)) continue
    if (placeBlooms().some((b) => Math.hypot(x - b.x, z - b.z) < radius + BLOOM.reach * b.scale + 0.5)) continue
    const rot = framer ? towardPath(x, z) + (r3 - 0.5) * 1.2 : r3 * Math.PI * 2
    const lean = (r4 - 0.5) * 0.1
    all.push({ x, y: heightAt(x, z), z, radius, scale, rot, lean, kind })
  }
  return [...great, ...all.slice(0, Math.round(all.length * Math.min(1, Math.max(0, density))))]
}

/**
 * A spirit bloom's proportions at scale 1 (bloom.ts grows it to match): the
 * height of its orb's centre, the orb's radius, the glow about it, and how
 * far its roots reach across the snow (m).
 */
export const BLOOM = { orbY: 1.2, orbR: 0.26, glowR: 1.0, reach: 1.3 }

/**
 * Where the spirit blooms grow, each placed by eye as a moment of its own: at
 * world time t it stands `ahead` metres in front of the camera and `side`
 * metres to its right (left if negative) — out where the page keeps no text,
 * and never in the opening view, which is the title's alone. At the forest's
 * edge, walking in; partway up the torii stair and at its top; at the summit
 * clearing's edge; out on the snowfield.
 */
const BLOOM_SPOTS: { t: number; ahead: number; side: number; scale: number }[] = [
  { t: 1.2, ahead: 11, side: 6, scale: 1.3 },
  { t: 4.45, ahead: 9.5, side: -5.5, scale: 1.35 },
  { t: 4.75, ahead: 9, side: 5.5, scale: 1.4 },
  { t: 7.6, ahead: 21, side: 9.5, scale: 1.5 },
  { t: 9, ahead: 14, side: -7, scale: 1.55 },
]

export interface Bloom {
  x: number
  y: number
  z: number
  scale: number
  /** rotation about y: its local x–y plane (the tendril's arc over the orb) faces the camera at its moment */
  rot: number
}

let blooms: Bloom[] | null = null

/** The spirit blooms: the same few at every tier (they are cheap, and each is a moment). */
export function placeBlooms(): Bloom[] {
  if (blooms) return blooms
  const sample = makeCameraPath(KEYS)
  const pose: Pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 }
  blooms = BLOOM_SPOTS.map(({ t, ahead, side, scale }) => {
    sample(t, pose)
    const [cx, , cz] = pose.pos
    const fx = pose.look[0] - cx, fz = pose.look[2] - cz
    const fl = Math.hypot(fx, fz) || 1
    // forward and right along the ground: right of (fx, fz) is (−fz, fx)
    const x = cx + (fx / fl) * ahead - (fz / fl) * side
    const z = cz + (fz / fl) * ahead + (fx / fl) * side
    return { x, y: heightAt(x, z), z, scale, rot: Math.atan2(cx - x, cz - z) }
  })
  return blooms
}

/** Each bloom's orb (x, y, z) and scale: the lights the terrain is lit by. */
export function bloomOrbs(): [number, number, number, number][] {
  return placeBlooms().map((b) => [b.x, b.y + BLOOM.orbY * b.scale, b.z, b.scale])
}
