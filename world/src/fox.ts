// The spirit fox that runs with you: where it goes through the journey, how
// it moves (a gait driven by the scroll), and the shape it takes each frame.
// Pure and three-free, so it can be tested; scene/SpiritFox.tsx hands the
// shape to a shader that draws it as a soft translucent volume.
//
// Its proportions are taken from a fox model Ethan chose (a sitting fox):
// its sitting pose was fitted to that model's silhouettes, side, front and
// top, and the standing and moving poses carry the same build: the head,
// muzzle, cheeks and ears, the deep chest, sturdy legs and full body. Its own space: +x is where its nose points, +y
// up, +z to its left; metres, standing about 0.48 m at the shoulder.
import { KEYS } from './keys'
import { ROUTE, heightAt } from './layout'
import { makeCameraPath, type Key, type Pose } from './path'

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const ease = (cur: number, target: number, rate: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-rate * dt))

/** Ground height where the fox treads: the terrain, or the top of a step on the torii stair. */
export function groundAt(x: number, z: number): number {
  const [ax, , az] = ROUTE[5]
  const [bx, , bz] = ROUTE[6]
  const dx = bx - ax
  const dz = bz - az
  const len2 = dx * dx + dz * dz
  const u = ((x - ax) * dx + (z - az) * dz) / len2
  const off = Math.abs((x - ax) * dz - (z - az) * dx) / Math.sqrt(len2)
  const onStair = u > 0 && u < 1 && off < 2.3
  return heightAt(x, z) + (onStair ? 0.1 : 0)
}

/**
 * Where the fox runs, set every half step of world time as a spot relative to
 * the camera there: `ahead` metres in front of it and `side` to its right
 * (left if negative), on the ground. So it keeps low in the view, right of
 * centre where the page's text leaves room: sitting beyond the stream as the
 * story opens, running along the trail's far edge through the hunt (in
 * profile, as the camera trucks with it), up beside the torii stair (between
 * the gates' pillars and their lanterns, clear of the works cards in the
 * middle of the view), beside the den's hearth, over the summit (out of the
 * craned-up view while the tails are earned) and out onto the snowfield,
 * where it sits on the left by the last spirit bloom.
 */
const FOX_SPOTS: [number, number][] = [
  [18, 5], // 0 the opening: sitting beyond the stream, right of the drawn fox
  [13, 3.2],
  [9, 2], // 1 at the forest's edge
  [9, 2],
  [9, 2.2], // 2 the hunt begins
  [8, 2],
  [6.5, 1.2], // 3 the trail turns
  [8.5, 1.5],
  [7, 3.2], // 4 the foot of the torii stair: up beside the steps
  [6.5, 3.2],
  [6.5, 3.2], // 5 the top of the stair
  [8, 1],
  [9, 3.7], // 6 the den: beside the hearth, right of the page's list
  [8, 2.5],
  [9, 2], // 7 the summit
  [10, 2],
  [10, 2], // 8 the tails (below the craned-up view)
  [9, 1],
  [8, -3.6], // 9 the snowfield: on the left by the bloom, clear of the contact card
]

/** FOX_SPOTS as ground points (x, z), one per half step of world time. */
export function foxKeys(): [number, number][] {
  const cam = makeCameraPath(KEYS)
  const pose: Pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 }
  return FOX_SPOTS.map(([ahead, side], i) => {
    cam(i / 2, pose)
    const [cx, , cz] = pose.pos
    const fx = pose.look[0] - cx
    const fz = pose.look[2] - cz
    const fl = Math.hypot(fx, fz) || 1
    return [cx + (fx / fl) * ahead - (fz / fl) * side, cz + (fz / fl) * ahead + (fx / fl) * side]
  })
}

export interface FoxSpot {
  x: number
  y: number
  z: number
  /** which way its path runs here: rotation about y, 0 facing +x */
  heading: number
}

/** A sampler for the fox's spot at world time t, gliding through its keys (one per half step) as the camera glides through its own. */
export function makeFoxPath(keys: [number, number][] = foxKeys()) {
  const sample = makeCameraPath(keys.map(([x, z]): Key => ({ pos: [x, 0, z], look: [x, 0, z], fov: 0 })))
  const a: Pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 }
  const b: Pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 }
  const last = keys.length - 1
  return (t: number, out: FoxSpot): FoxSpot => {
    const u = t * 2
    const u0 = Math.min(Math.max(u - 0.008, 0), last - 0.016)
    sample(u0, a)
    sample(u0 + 0.016, b)
    const dx = b.pos[0] - a.pos[0]
    const dz = b.pos[2] - a.pos[2]
    sample(u, a)
    out.x = a.pos[0]
    out.z = a.pos[2]
    out.y = groundAt(out.x, out.z)
    out.heading = Math.atan2(-dz, dx)
    return out
  }
}

export interface Gait {
  /** strides run so far: its fraction is where the legs are in their stride */
  stride: number
  /** ground speed (m/s), smoothed */
  speed: number
  /** 0 standing … 1 on the move */
  run: number
  /** 1 walking … 0 trotting */
  walk: number
  /** 0 trotting … 1 galloping */
  gallop: number
  /** 0 … 1 sitting: its front (chest and forelegs, head held high) */
  sit: number
  /** 0 … 1 sitting: its hind end (haunches folded, tail round it), which leads as it sits and as it rises */
  sitRear: number
  /** how fast it is turning where it stands (rad/s, smoothed) */
  turn: number
  /** 0 … 1 turned to look back at you */
  look: number
  /** +1 running on with the story, −1 running back */
  dir: 1 | -1
  /** seconds since it last moved */
  still: number
}

/** A fox that has not moved yet: sitting, looking back at you, waiting. */
export function makeGait(): Gait {
  return { stride: 0, speed: 0, run: 0, walk: 1, gallop: 0, sit: 1, sitRear: 1, turn: 0, look: 1, dir: 1, still: 10 }
}

/** The legs never cycle faster than this (strides per second), however fast the scroll runs: a fox's own gallop. */
const MAX_CADENCE = 3.6
/** Strides per second at a ground speed (m/s): about one at a slow walk, near three at a trot, a fox's full rate at a gallop. */
const cadence = (v: number) => MAX_CADENCE * (1 - Math.exp(-v / 1.6))
/** How far one stride carries it at a ground speed (m): short steps at a walk, long bounds at a gallop, and past a fox's own pace, leaps. */
const strideLength = (v: number) => (v > 1e-3 ? v / cadence(v) : 1.6 / MAX_CADENCE)

/** Turning where it stands, it steps round: its paws cover about this far (m) for each radian it turns. */
const TURN_STEP = 0.22

/** Advance the gait by `ds` metres run along its path (signed) and `turn` radians turned where it stands, over `dt` seconds. */
export function stepGait(g: Gait, ds: number, dt: number, turn = 0): Gait {
  if (dt <= 0) return g
  const d = Math.abs(ds)
  g.speed = ease(g.speed, d / dt, 8, dt)
  g.turn = ease(g.turn, turn / dt, 10, dt)
  // (the last creep of a smoothed scroll, a few centimetres a second, is standing still)
  if (d > 0.05 * dt) {
    g.still = 0
    g.dir = ds > 0 ? 1 : -1
  } else g.still += dt
  const stepping = g.speed + TURN_STEP * Math.abs(g.turn)
  g.run = ease(g.run, smooth(0.05, 0.35, stepping), 8, dt)
  g.walk = ease(g.walk, 1 - smooth(0.9, 1.7, g.speed), 6, dt)
  g.gallop = ease(g.gallop, smooth(3.2, 5.5, g.speed), 6, dt)
  // its legs cover the ground it runs over, stride for stride (and only
  // while it gathers speed from a standstill do they run short of it)
  g.stride += Math.min((d + TURN_STEP * Math.abs(turn)) / strideLength(stepping), MAX_CADENCE * dt)
  g.look = ease(g.look, smooth(0.25, 0.7, g.still), 5, dt)
  // once it has stopped and turned to you, it sits: haunches first, then its
  // chest settles upright; it gets up haunches first too
  const resting = g.still > 1.2 && Math.abs(g.turn) < 0.35
  g.sitRear = ease(g.sitRear, resting ? 1 : 0, resting ? 3.2 : 14, dt)
  g.sit = ease(g.sit, resting ? 1 : 0, resting ? 1.9 : 8, dt)
  return g
}

export interface Heading {
  /** which way it faces: rotation about y, 0 facing +x */
  heading: number
  /** how fast it is turning (rad/s) */
  vel: number
}

/**
 * Turn toward `target` (rad) as a body turns: easing into the turn, sweeping
 * round, easing out without overshooting (a critically damped spring,
 * quicker at a higher `rate`). Returns how far it turned.
 */
export function stepHeading(h: Heading, target: number, rate: number, dt: number): number {
  const start = h.heading
  const n = Math.max(1, Math.ceil(dt * 120))
  const step = dt / n
  for (let k = 0; k < n; k++) {
    const err = Math.atan2(Math.sin(target - h.heading), Math.cos(target - h.heading))
    h.vel += (rate * rate * err - 2 * rate * h.vel) * step
    h.heading += h.vel * step
  }
  return h.heading - start
}

/**
 * When each paw (fore left, fore right, hind left, hind right) comes down in
 * the stride. A walk sets them down in turn, a quarter stride apart: hind
 * left, fore left, hind right, fore right. A trot sets down the diagonal
 * pairs together. A gallop (a fox's rotary gallop) sets down the hinds one
 * after the other, then the fores: hind left, hind right, fore right, fore
 * left, then a bound through the air.
 */
const WALK = [0, 0.5, 0.75, 0.25]
const TROT = [0, 0.5, 0.5, 0]
const GALLOP = [0, 0.9, 0.5, 0.6]
/** Where each paw stands under it, in its own space (x, z). */
const PAW_BASE: [number, number][] = [
  [0.19, 0.055],
  [0.19, -0.055],
  [-0.2, 0.06],
  [-0.2, -0.06],
]
/** How far a paw bearing its weight travels, at most, ahead of and behind where it stands (m): at a walk, a trot, a gallop. */
const REACH = [0.13, 0.15, 0.18]
/**
 * A paw's swing forward at a gallop, as (u, x, y): u from lift-off (0) to
 * touchdown (1); x in reaches (−1 where it lifted, +1 where it lands); y in
 * lifts. A fore paw folds up and back under the chest, then reaches far out
 * ahead and comes down; a hind paw trails out behind, then swings forward
 * under the belly to land.
 */
const FORE_SWING = [[0, -1, 0], [0.25, -0.85, 0.85], [0.55, 0.1, 1], [0.82, 1.3, 0.5], [1, 1, 0]]
const HIND_SWING = [[0, -1, 0], [0.28, -1.6, 0.45], [0.6, -0.35, 0.85], [0.85, 0.85, 0.4], [1, 1, 0]]

/** A smooth track through keys (u, x, y), u rising from 0 to 1 (Catmull–Rom, its ends held). */
function track(keys: number[][], u: number): [number, number] {
  let i = 0
  while (i < keys.length - 2 && u > keys[i + 1][0]) i++
  const k0 = keys[Math.max(i - 1, 0)]
  const k1 = keys[i]
  const k2 = keys[i + 1]
  const k3 = keys[Math.min(i + 2, keys.length - 1)]
  const t = (u - k1[0]) / (k2[0] - k1[0])
  const cr = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t)
  return [cr(k0[1], k1[1], k2[1], k3[1]), cr(k0[2], k1[2], k2[2], k3[2])]
}

interface Stride {
  /** stride length (m) */
  L: number
  /** the part of a stride each paw spends on the snow */
  D: number
  /** how far ahead of where it stands a paw comes down (and how far behind it lifts off) */
  R: number
  /** how high a paw lifts as it swings forward */
  lift: number
  offsets: number[]
  walk: number
  trot: number
  gallop: number
}

/** The stride it runs at: its length, the share each paw bears, and the paws' timing, blended from a walk, a trot and a gallop. */
function strideOf(g: Gait): Stride {
  const gallop = Math.min(1, Math.max(0, g.gallop))
  const walk = Math.min(1, Math.max(0, g.walk)) * (1 - gallop)
  const trot = 1 - walk - gallop
  const L = strideLength(g.speed)
  // a paw bears it for longer at a walk than a gallop, and never beyond its reach
  const reach = REACH[0] * walk + REACH[1] * trot + REACH[2] * gallop
  const D = Math.min(0.62 * walk + 0.42 * trot + 0.28 * gallop, (2 * reach) / L)
  const toGallop = gallop > walk ? 1 : 0 // the trot's hind right, counted the way that leads to the gallop
  const offsets = [0, 1, 2, 3].map((k) => WALK[k] * walk + (k === 3 ? toGallop : TROT[k]) * trot + GALLOP[k] * gallop)
  return { L, D, R: (D * L) / 2, lift: 0.035 * walk + 0.06 * trot + 0.1 * gallop, offsets, walk, trot, gallop }
}

const frac = (x: number) => x - Math.floor(x)

/**
 * Paw k, in its own space, at stride position `stride`. On the snow it stays
 * where it came down: it slides back under the body exactly as far as the
 * body runs on. Off the snow it swings forward in an arc to its next step.
 */
function pawAt(k: number, st: Stride, stride: number): V {
  const psi = frac(stride - st.offsets[k])
  const [bx, bz] = PAW_BASE[k]
  if (psi < st.D) return [bx + st.R - psi * st.L, 0.022, bz]
  const u = (psi - st.D) / (1 - st.D)
  // at a walk or a trot, an arc: a fore paw lifts early, folding at the wrist; a hind paw evenly
  let x = -1 + 2 * (0.5 - 0.5 * Math.cos(Math.PI * u))
  let y = k < 2 ? Math.sin(Math.PI * Math.pow(u, 0.75)) : Math.sin(Math.PI * u)
  // at a gallop, the full swing of a bounding stride
  if (st.gallop > 0) {
    const [gx, gy] = track(k < 2 ? FORE_SWING : HIND_SWING, u)
    x += (gx - x) * st.gallop
    y += (gy - y) * st.gallop
  }
  return [bx + st.R * x, 0.022 + st.lift * (k < 2 ? 1 : 0.85) * y, bz]
}

/**
 * The paws (0 fore left, 1 fore right, 2 hind left, 3 hind right) that came
 * down on the snow as the stride ran from `from` to `to`.
 */
export function pawsDown(from: number, to: number, g: Gait, out: number[]): number[] {
  const st = strideOf(g)
  for (let k = 0; k < 4; k++) {
    const o = st.offsets[k]
    if (Math.floor(to - o) > Math.floor(from - o)) out.push(k)
  }
  return out
}

/** Where paw k stands on the snow now, in its own space (x, z): just after it comes down, the print it leaves. */
export function pawSpot(k: number, g: Gait): [number, number] {
  const p = pawAt(k, strideOf(g), g.stride)
  return [p[0], p[2]]
}

// ---------------------------------------------------------------- the shape

type V = [number, number, number]
interface Bone {
  a: V
  ra: number
  b: V
  rb: number
}

/** How many round cones the fox is made of, and the box (its own space) that holds it in every pose. */
export const FOX_BONES = 23
export const FOX_BOX = { min: [-1.05, -0.08, -0.45] as V, max: [0.72, 0.98, 0.45] as V }

const bone = (a: V, ra: number, b: V, rb: number): Bone => ({ a, ra, b, rb })

/** The fore legs' reach: shoulder to elbow, elbow to paw (the shoulder hidden in the chest, as a fox's is). */
const FORE = [0.17, 0.175]
/** The shoulder blade swings with the leg: the share of a paw's reach the shoulder follows (and it dips as the leg reaches). */
const SHOULDER_SWING = 0.4

/** The head group (neck end, head, snout, cheeks, ears) turns about the neck's base to look back. */
const HEAD_GROUP = [2, 3, 4, 5, 6, 7, 8]

/** Standing, alert. */
function standing(): Bone[] {
  const bs: Bone[] = [
    bone([0.17, 0.37, 0], 0.13, [-0.2, 0.36, 0], 0.125), // 0 torso: chest → hips
    bone([0.2, 0.34, 0], 0.11, [0.23, 0.25, 0], 0.06), // 1 the deep chest
    bone([0.2, 0.43, 0], 0.09, [0.3, 0.53, 0], 0.087), // 2 neck
    bone([0.332, 0.566, 0], 0.1, [0.369, 0.546, 0], 0.09), // 3 head
    bone([0.393, 0.536, 0], 0.072, [0.551, 0.517, 0], 0.01), // 4 muzzle, long and pointed
    bone([0.351, 0.549, 0.05], 0.069, [0.3, 0.482, 0.081], 0.055), // 5 cheek, left
    bone([0.351, 0.549, -0.05], 0.069, [0.3, 0.482, -0.081], 0.055), // 6 cheek, right
    bone([0.328, 0.631, 0.072], 0.058, [0.341, 0.732, 0.136], 0.005), // 7 ear, left: broad, set wide
    bone([0.328, 0.631, -0.072], 0.058, [0.341, 0.732, -0.136], 0.005), // 8 ear, right
  ]
  for (const z of [0.055, -0.055]) {
    // 9–12 front legs: shoulder (in the chest) → elbow → paw
    const shoulder: V = [0.17, 0.35, z]
    const paw: V = [0.19, 0.022, z]
    const elbow = knee(shoulder, paw, FORE[0], FORE[1], -1)
    bs.push(bone(shoulder, 0.04, elbow, 0.03), bone(elbow, 0.026, paw, 0.022))
  }
  for (const z of [0.06, -0.06]) {
    // 13–18 hind legs: hip → knee → hock → paw
    bs.push(
      bone([-0.2, 0.33, z], 0.095, [-0.12, 0.19, z], 0.04),
      bone([-0.12, 0.19, z], 0.03, [-0.23, 0.075, z], 0.026),
      bone([-0.23, 0.075, z], 0.026, [-0.2, 0.022, z], 0.022),
    )
  }
  // 19–22 the tail, a great plume, held low and sweeping back as a fox holds it
  tail(bs, [[-0.3, 0.36, 0], [-0.42, 0.28, 0], [-0.56, 0.22, 0], [-0.71, 0.19, 0], [-0.85, 0.19, 0]])
  return bs
}

/** the tail's thickness along it, root to tip: a great plume */
const TAIL_R = [0.045, 0.08, 0.1, 0.085, 0.028]
function tail(bs: Bone[], pts: V[], r = TAIL_R) {
  for (let k = 0; k < 4; k++) bs.push(bone(pts[k], r[k], pts[k + 1], r[k + 1]))
}

/**
 * Sitting as a fox sits, as the model sits: upright, its deep chest high and
 * forward, its forelegs straight down and close together, its haunches folded
 * under it in a round mass, its hind paws tucked in beside its forepaws, and
 * its tail curled round one side of it on the snow, the tip by its forepaws.
 * Every bone here was fitted to the model's silhouettes, side, front and top.
 */
function sitting(): Bone[] {
  const bs: Bone[] = [
    bone([0.069, 0.465, 0], 0.134, [-0.129, 0.234, 0], 0.147), // 0 torso: chest high and forward, down to the haunches
    bone([0.099, 0.408, 0], 0.111, [0.096, 0.305, 0], 0.059), // 1 the deep chest
    bone([0.047, 0.52, 0], 0.093, [0.084, 0.617, 0], 0.087), // 2 neck
    bone([0.117, 0.641, 0], 0.1, [0.154, 0.621, 0], 0.09), // 3 head
    bone([0.178, 0.611, 0], 0.072, [0.336, 0.592, 0], 0.01), // 4 muzzle
  ]
  for (const s of [1, -1]) {
    bs.push(bone([0.136, 0.624, s * 0.05], 0.069, [0.085, 0.557, s * 0.081], 0.055)) // 5, 6 cheeks
  }
  for (const s of [1, -1]) {
    bs.push(bone([0.113, 0.706, s * 0.072], 0.058, [0.126, 0.807, s * 0.136], 0.005)) // 7, 8 ears
  }
  for (const s of [1, -1]) {
    const elbow: V = [0.067, 0.169, s * 0.045]
    bs.push(bone([0.075, 0.34, s * 0.045], 0.043, elbow, 0.058), bone(elbow, 0.054, [0.134, 0.022, s * 0.016], 0.022))
  }
  for (const s of [1, -1]) {
    const kn: V = [-0.036, 0.143, s * 0.083]
    const hock: V = [-0.15, 0.025, s * 0.087]
    bs.push(
      bone([-0.185, 0.147, s * 0.009], 0.118, kn, 0.065),
      bone(kn, 0.052, hock, 0.026),
      bone(hock, 0.026, [0.03, 0.022, s * 0.043], 0.022),
    )
  }
  tail(
    bs,
    [[-0.251, 0.09, -0.003], [-0.312, 0.048, -0.125], [-0.187, 0.073, -0.216], [0.027, 0.069, -0.292], [0.174, 0.046, -0.291]],
    [0.066, 0.05, 0.073, 0.073, 0.041],
  )
  return bs
}

/** Two-bone reach in the leg's own plane (x, y): the middle joint, bent toward `bend` (+1 forward, −1 back). */
function knee(root: V, foot: V, l1: number, l2: number, bend: number): V {
  const dx = foot[0] - root[0]
  const dy = foot[1] - root[1]
  const d = Math.min(Math.hypot(dx, dy), (l1 + l2) * 0.999)
  const ux = dx / (Math.hypot(dx, dy) || 1)
  const uy = dy / (Math.hypot(dx, dy) || 1)
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0))
  // the perpendicular to (ux, uy) that points forward (+x) when the leg hangs down
  const px = -uy * bend
  const py = ux * bend
  return [root[0] + ux * a + px * h, root[1] + uy * a + py * h, root[2]]
}

const dist = (a: V, b: V) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/** Draw `p` in toward `root` (in x, y) until it is no further than `reach`; returns how far it moved it. */
function within(root: V, p: V, reach: number): [number, number] {
  const dx = p[0] - root[0]
  const dy = p[1] - root[1]
  const d = Math.hypot(dx, dy)
  if (d <= reach) return [0, 0]
  const k = reach / d - 1
  p[0] += dx * k
  p[1] += dy * k
  return [dx * k, dy * k]
}

/**
 * On the move: a walk, a trot or a gallop. Its paws are planted on the snow
 * while they bear it and swing forward between steps; its body rides over
 * them, dipping a little as the paws take its weight at a walk or a trot,
 * and at a gallop bounding: its back gathered as the hind legs reach under
 * it, stretched as the fore legs reach out, its chest rising off the hind
 * legs' drive. The head rides steadier than the body; the tail hangs at a
 * walk and streams out behind at a gallop.
 */
function moving(g: Gait): Bone[] {
  const bs = standing()
  const st = strideOf(g)
  const tau = Math.PI * 2
  const ph = g.stride
  // the body: dipping a little as the paws take its weight at a walk or a
  // trot; at a gallop long and level, gathering and stretching, rising a
  // little in the bound, running low
  const bob = -(0.006 * st.walk + 0.014 * st.trot) * Math.cos(2 * tau * (ph - st.D / 2))
  const rise = 0.03 * st.gallop * (0.5 + 0.5 * Math.cos(tau * (ph - (st.D + 0.5) / 2)))
  const gather = 0.04 * st.gallop * Math.cos(tau * (ph - 0.45))
  const rock = 0.015 * st.gallop * Math.sin(tau * (ph - 0.55))
  const y = bob + rise - 0.015 * st.trot - 0.04 * st.gallop
  const chest: V = [0.17 - gather, 0.37 + y + rock, 0]
  const hips: V = [-0.2 + gather, 0.36 + y - rock, 0]
  bs[0].a = chest
  bs[0].b = hips
  // the neck and head ride with the chest, the head steadier than the body
  for (let i = 1; i <= 8; i++) {
    for (const p of [bs[i].a, bs[i].b]) {
      p[0] += chest[0] - 0.17
      p[1] += (chest[1] - 0.37) * (i === 1 ? 1 : 0.6)
    }
  }
  // the neck reaches forward and down with speed, the head held level at
  // the end of it, nodding with the stride: as each fore paw lands at a walk
  // or a trot, once a stride at a gallop
  const reach = -(0.05 * st.walk + 0.2 * st.trot + 0.45 * st.gallop)
  const nod =
    -0.035 * st.walk * Math.cos(2 * tau * ph) -
    0.04 * st.trot * Math.cos(2 * tau * (ph - 0.05)) -
    0.05 * st.gallop * Math.cos(tau * (ph - 0.95))
  const neck = bs[2].a
  const turnXY = (p: V, pivot: V, angle: number) => {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    const dx = p[0] - pivot[0]
    const dy = p[1] - pivot[1]
    p[0] = pivot[0] + dx * c - dy * s
    p[1] = pivot[1] + dx * s + dy * c
  }
  turnXY(bs[2].b, neck, reach + nod)
  for (let i = 3; i <= 8; i++) {
    turnXY(bs[i].a, neck, reach + nod)
    turnXY(bs[i].b, neck, reach + nod)
  }
  const skull: V = [bs[3].a[0], bs[3].a[1], 0]
  for (let i = 3; i <= 8; i++) {
    turnXY(bs[i].a, skull, -0.75 * reach)
    turnXY(bs[i].b, skull, -0.75 * reach)
  }
  // ears laid back at speed
  for (const i of [7, 8]) bs[i].b[0] -= 0.02 * st.trot + 0.06 * st.gallop
  // the legs: each paw where its stride puts it, the joints between found by reach
  for (let k = 0; k < 4; k++) {
    const paw = pawAt(k, st, ph)
    const z = PAW_BASE[k][1]
    if (k < 2) {
      // the shoulder blade swings with the leg, and dips as it reaches
      const dx = paw[0] - PAW_BASE[k][0]
      const root: V = [chest[0] + SHOULDER_SWING * dx, chest[1] - 0.02 - Math.min(1.5 * dx * dx, 0.05), z]
      within(root, paw, (FORE[0] + FORE[1]) * 0.99)
      const elbow = knee(root, paw, FORE[0], FORE[1], -1)
      const b = 9 + k * 2
      bs[b].a = root
      bs[b].b = elbow
      bs[b + 1].a = elbow
      bs[b + 1].b = paw
    } else {
      const b = 13 + (k - 2) * 3
      const root: V = [hips[0] + 0.01, hips[1] - 0.05, z]
      const hock: V = [paw[0] - 0.02, paw[1] + 0.06, z]
      const l1 = dist(bs[b].a, bs[b].b)
      const l2 = dist(bs[b + 1].a, bs[b + 1].b)
      const pull = within(root, hock, (l1 + l2) * 0.99)
      paw[0] += pull[0]
      paw[1] += pull[1]
      const kn = knee(root, hock, l1, l2, 1)
      bs[b].a = root
      bs[b].b = kn
      bs[b + 1].a = kn
      bs[b + 1].b = hock
      bs[b + 2].a = hock
      bs[b + 2].b = paw
    }
  }
  // the tail: hanging low at a walk, swaying slowly; at a trot or a gallop
  // streaming straight out behind, a little below its back, steady, with
  // only a small bounce that follows the body's, late
  const out = Math.min(1, st.trot + st.gallop)
  const hang: V[] = [[-0.3, 0.36, 0], [-0.42, 0.28, 0], [-0.56, 0.22, 0], [-0.71, 0.19, 0], [-0.85, 0.19, 0]]
  const stream: V[] = [[-0.3, 0.36, 0], [-0.45, 0.33, 0], [-0.61, 0.3, 0], [-0.77, 0.27, 0], [-0.92, 0.25, 0]]
  const pts = hang.map((h, k): V => {
    const p: V = [h[0] + (stream[k][0] - h[0]) * out, h[1] + (stream[k][1] - h[1]) * out, 0]
    p[0] += hips[0] + 0.2
    p[1] += (hips[1] - 0.36) * (1 - k / 5)
    p[1] += 0.006 * k * (st.trot * Math.cos(2 * tau * (ph - 0.1 * k)) + st.gallop * Math.sin(tau * (ph - 0.12 * k)))
    p[2] += 0.008 * k * st.walk * Math.sin(tau * (ph - 0.1 * k))
    return p
  })
  bs.splice(19, 4)
  tail(bs, pts)
  return bs
}

/** The bones of its front (chest, neck, head, forelegs); bone 0 (chest → hips) has its chest end in front and its hip end behind. */
const FRONT = (i: number) => i < 13

/**
 * The fox's shape for its gait at `time` (s), its head turned `look` radians
 * (toward +z when positive) to look back at you. Writes FOX_BONES round cones
 * into `bones` as (a.xyz, ra, b.xyz, rb).
 */
export function foxPose(g: Gait, time: number, look: number, bones: Float32Array) {
  const wRun = Math.min(1, Math.max(0, g.run))
  const ease3 = (x: number) => {
    const c = Math.min(1, Math.max(0, x))
    return c * c * (3 - 2 * c)
  }
  // it sits in two parts: its front and its hind end, each easing in and out
  const front = ease3(g.sit) * (1 - wRun)
  const rear = ease3(g.sitRear) * (1 - wRun)
  const stand = standing()
  const sit = sitting()
  const move = wRun > 0 ? moving(g) : null
  const bs = standing()
  const mixEnd = (i: number, end: 'a' | 'b', r: 'ra' | 'rb', wSit: number) => {
    const wStand = 1 - wRun - wSit
    for (let k = 0; k < 3; k++) {
      bs[i][end][k] = stand[i][end][k] * wStand + sit[i][end][k] * wSit + (move ? move[i][end][k] * wRun : 0)
    }
    bs[i][r] = stand[i][r] * wStand + sit[i][r] * wSit + (move ? move[i][r] * wRun : 0)
  }
  for (let i = 0; i < FOX_BONES; i++) {
    mixEnd(i, 'a', 'ra', FRONT(i) ? front : rear)
    mixEnd(i, 'b', 'rb', FRONT(i) && i !== 0 ? front : rear)
  }

  // at rest it breathes, its tail sways, and it looks about a little
  const rest = 1 - wRun
  bs[0].ra += 0.003 * Math.sin(time * 2.1) * rest
  for (let i = 19; i < 23; i++) {
    const k = i - 18
    const sway = 0.012 * k * Math.sin(time * 1.3 - k * 0.7) * rest
    bs[i].a[2] += sway * (k > 1 ? 1 : 0)
    bs[i].b[2] += sway * 1.3
  }
  const idleYaw = rest * (0.1 * Math.sin(time * 0.41) + 0.06 * Math.sin(time * 0.97 + 1.3))
  const idlePitch = rest * (0.05 * Math.sin(time * 0.53 + 0.4) + 0.03 * Math.sin(time * 1.31))
  const pivot = bs[2].a
  if (Math.abs(idlePitch) > 1e-4) {
    const c = Math.cos(idlePitch)
    const s = Math.sin(idlePitch)
    const tilt = (p: V) => {
      const dx = p[0] - pivot[0]
      const dy = p[1] - pivot[1]
      p[0] = pivot[0] + dx * c - dy * s
      p[1] = pivot[1] + dx * s + dy * c
    }
    tilt(bs[2].b)
    for (let i = 3; i <= 8; i++) {
      tilt(bs[i].a)
      tilt(bs[i].b)
    }
  }

  // looking back: the head group turns about the neck's base
  const yaw = look + idleYaw
  if (Math.abs(yaw) > 1e-4) {
    const cs = Math.cos(yaw)
    const sn = Math.sin(yaw)
    const turn = (p: V) => {
      const x = p[0] - pivot[0]
      const z = p[2] - pivot[2]
      p[0] = pivot[0] + x * cs + z * sn
      p[2] = pivot[2] - x * sn + z * cs
    }
    for (const i of HEAD_GROUP) {
      if (i !== 2) turn(bs[i].a)
      turn(bs[i].b)
    }
  }

  bs.forEach((b, i) => {
    bones.set([b.a[0], b.a[1], b.a[2], b.ra, b.b[0], b.b[1], b.b[2], b.rb], i * 8)
  })
}
