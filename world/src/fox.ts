// The spirit fox that runs with you: where it goes through the journey, how
// it moves (a gait driven by the scroll), and the shape it takes each frame.
// Pure and three-free, so it can be tested; scene/SpiritFox.tsx hands the
// shape to a shader that draws it as a soft glowing volume.
//
// Its look follows the spirit foxes of the reference Ethan chose: tall ears
// and a slim pointed snout, a fluffy ruff at its chest, slender legs and a
// great bushy tail. Its own space: +x is where its nose points, +y up, +z to
// its left; metres, standing about 0.43 m at the shoulder.
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
  /** 0 standing … 1 running */
  run: number
  /** 0 trotting … 1 galloping */
  gallop: number
  /** 0 … 1 sitting */
  sit: number
  /** 0 … 1 turned to look back at you */
  look: number
  /** +1 running on with the story, −1 running back */
  dir: 1 | -1
  /** seconds since it last moved */
  still: number
}

/** A fox that has not moved yet: sitting, looking back at you, waiting. */
export function makeGait(): Gait {
  return { stride: 0, speed: 0, run: 0, gallop: 0, sit: 1, look: 1, dir: 1, still: 10 }
}

/** The legs never cycle faster than this (strides per second), however fast the scroll runs. */
const MAX_CADENCE = 3.6

/** Advance the gait by `ds` metres run along its path (signed) over `dt` seconds. */
export function stepGait(g: Gait, ds: number, dt: number): Gait {
  if (dt <= 0) return g
  const d = Math.abs(ds)
  g.speed = ease(g.speed, d / dt, 10, dt)
  if (d > 1e-5) {
    g.still = 0
    g.dir = ds > 0 ? 1 : -1
  } else g.still += dt
  g.run = ease(g.run, smooth(0.15, 1.0, g.speed), 8, dt)
  g.gallop = ease(g.gallop, smooth(3.5, 8, g.speed), 4, dt)
  const strideLength = 0.9 + 0.9 * g.gallop
  g.stride += Math.min(d / strideLength, MAX_CADENCE * dt)
  g.look = ease(g.look, smooth(0.25, 0.7, g.still), 5, dt)
  const resting = g.still > 1.8
  g.sit = ease(g.sit, resting ? 1 : 0, resting ? 2.2 : 9, dt)
  return g
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

/** The head group (neck end, head, snout, cheeks, ears) turns about the neck's base to look back. */
const HEAD_GROUP = [2, 3, 4, 5, 6, 7, 8]

/** Standing, alert. */
function standing(): Bone[] {
  const bs: Bone[] = [
    bone([0.17, 0.37, 0], 0.1, [-0.17, 0.36, 0], 0.078), // 0 torso: chest → hips
    bone([0.19, 0.34, 0], 0.085, [0.26, 0.27, 0], 0.05), // 1 the ruff at its chest
    bone([0.2, 0.41, 0], 0.062, [0.29, 0.5, 0], 0.052), // 2 neck
    bone([0.29, 0.52, 0], 0.07, [0.35, 0.515, 0], 0.06), // 3 head
    bone([0.36, 0.5, 0], 0.042, [0.5, 0.47, 0], 0.011), // 4 snout
    bone([0.32, 0.49, 0.042], 0.046, [0.28, 0.465, 0.075], 0.026), // 5 cheek, left
    bone([0.32, 0.49, -0.042], 0.046, [0.28, 0.465, -0.075], 0.026), // 6 cheek, right
    bone([0.3, 0.56, 0.042], 0.034, [0.28, 0.7, 0.075], 0.004), // 7 ear, left
    bone([0.3, 0.56, -0.042], 0.034, [0.28, 0.7, -0.075], 0.004), // 8 ear, right
  ]
  for (const z of [0.055, -0.055]) {
    // 9–12 front legs: shoulder → elbow → paw
    bs.push(bone([0.17, 0.3, z], 0.032, [0.18, 0.16, z], 0.02), bone([0.18, 0.16, z], 0.016, [0.19, 0.02, z], 0.02))
  }
  for (const z of [0.06, -0.06]) {
    // 13–18 hind legs: hip → knee → hock → paw
    bs.push(
      bone([-0.16, 0.31, z], 0.05, [-0.11, 0.19, z], 0.026),
      bone([-0.11, 0.19, z], 0.02, [-0.19, 0.08, z], 0.016),
      bone([-0.19, 0.08, z], 0.016, [-0.17, 0.02, z], 0.02),
    )
  }
  // 19–22 the tail, a great plume: it hangs, swells, and curls up at its tip like a flame
  tail(bs, [[-0.23, 0.37, 0], [-0.33, 0.25, 0], [-0.45, 0.17, 0], [-0.6, 0.2, 0], [-0.7, 0.33, 0]])
  return bs
}

const TAIL_R = [0.045, 0.085, 0.11, 0.09, 0.028]
function tail(bs: Bone[], pts: V[]) {
  for (let k = 0; k < 4; k++) bs.push(bone(pts[k], TAIL_R[k], pts[k + 1], TAIL_R[k + 1]))
}

/** Sitting on its haunches, its tail wrapped round its forepaws. */
function sitting(): Bone[] {
  const bs: Bone[] = [
    bone([0.13, 0.39, 0], 0.1, [-0.1, 0.15, 0], 0.085),
    bone([0.15, 0.37, 0], 0.085, [0.21, 0.29, 0], 0.05),
    bone([0.15, 0.44, 0], 0.062, [0.22, 0.55, 0], 0.052),
    bone([0.22, 0.57, 0], 0.07, [0.28, 0.565, 0], 0.06),
    bone([0.29, 0.55, 0], 0.042, [0.43, 0.52, 0], 0.011),
    bone([0.25, 0.54, 0.042], 0.046, [0.21, 0.515, 0.075], 0.026),
    bone([0.25, 0.54, -0.042], 0.046, [0.21, 0.515, -0.075], 0.026),
    bone([0.23, 0.61, 0.042], 0.034, [0.21, 0.75, 0.075], 0.004),
    bone([0.23, 0.61, -0.042], 0.034, [0.21, 0.75, -0.075], 0.004),
  ]
  for (const z of [0.055, -0.055]) {
    bs.push(bone([0.13, 0.32, z], 0.032, [0.15, 0.17, z], 0.02), bone([0.15, 0.17, z], 0.016, [0.17, 0.02, z], 0.02))
  }
  for (const z of [0.075, -0.075]) {
    const s = Math.sign(z)
    bs.push(
      bone([-0.09, 0.16, z], 0.05, [0.02, 0.1, z + s * 0.015], 0.026),
      bone([0.02, 0.1, z + s * 0.015], 0.02, [-0.14, 0.035, z + s * 0.005], 0.016),
      bone([-0.14, 0.035, z + s * 0.005], 0.016, [-0.02, 0.02, z], 0.02),
    )
  }
  tail(bs, [[-0.15, 0.1, 0], [-0.12, 0.09, -0.14], [0.03, 0.115, -0.19], [0.18, 0.095, -0.15], [0.27, 0.06, -0.07]])
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

/** Where in the stride each leg is (front left, front right, hind left, hind right): a trot pairs the diagonals; a gallop takes them in turn, fronts then hinds. */
const TROT = [0, 0.5, 0.5, 0]
const GALLOP = [0, 0.12, 0.55, 0.67]
const legOffset = (k: number, gallop: number) => TROT[k] + (GALLOP[k] - TROT[k]) * gallop
/** how far a paw reaches ahead of where it stands, at a trot → a gallop */
const reachOf = (gallop: number) => 0.08 + 0.06 * gallop

/**
 * The legs (0 front left, 1 front right, 2 hind left, 3 hind right) whose
 * paws came down on the snow as the stride ran from `from` to `to`: each
 * lands as its swing ends, a quarter of the way round its own stride.
 */
export function pawsDown(from: number, to: number, gallop: number, out: number[]): number[] {
  for (let k = 0; k < 4; k++) {
    const o = legOffset(k, gallop) - 0.25
    if (Math.floor(to + o) > Math.floor(from + o)) out.push(k)
  }
  return out
}

/** Where leg k's paw lands, in the fox's own space (x, z). */
export function pawSpot(k: number, gallop: number): [number, number] {
  return [(k < 2 ? 0.19 : -0.17) + reachOf(gallop), [0.055, -0.055, 0.06, -0.06][k]]
}

/** Running: a trot that stretches into a gallop, the legs reaching and lifting in turn, the body bobbing, the tail streaming behind. */
function running(phase: number, gallop: number): Bone[] {
  const bs = standing()
  const tau = Math.PI * 2
  const s = Math.sin(tau * phase)
  // the body: bobbing at a trot, rocking and flexing at a gallop
  const bob = 0.016 * Math.cos(2 * tau * phase) * (1 - gallop)
  const rock = 0.03 * s * gallop
  const flex = 0.025 * Math.sin(tau * phase + 1) * gallop
  const chest: V = [0.17 + flex, 0.37 + bob + rock, 0]
  const hips: V = [-0.17 - flex, 0.36 + bob - rock, 0]
  const shift = (i: number, dx: number, dy: number) => {
    for (const p of [bs[i].a, bs[i].b]) {
      p[0] += dx
      p[1] += dy
    }
  }
  bs[0].a = chest
  bs[0].b = hips
  // the head rides steadier than the body, lower and further forward at speed; ears laid back
  for (const i of [1, 2, 3, 4, 5, 6, 7, 8]) shift(i, flex + 0.02 * gallop, bob * 0.5 + rock * 0.6 - 0.03 * gallop)
  for (const i of [7, 8]) bs[i].b[0] -= 0.04
  // legs, each at its own point in the stride
  const reach = reachOf(gallop)
  const lift = 0.06 + 0.04 * gallop
  const legs = [
    { root: 9, front: true, z: 0.055, k: 0 },
    { root: 11, front: true, z: -0.055, k: 1 },
    { root: 13, front: false, z: 0.06, k: 2 },
    { root: 16, front: false, z: -0.06, k: 3 },
  ]
  for (const leg of legs) {
    const psi = tau * (phase + legOffset(leg.k, gallop))
    const swing = Math.cos(psi) // > 0 while the leg swings forward, lifted
    const px = Math.sin(psi) * reach
    const py = lift * Math.pow(Math.max(swing, 0), 1.5)
    if (leg.front) {
      const root: V = [chest[0], chest[1] - 0.07, leg.z]
      const paw: V = [0.19 + px, 0.02 + py, leg.z]
      const l1 = dist(bs[leg.root].a, bs[leg.root].b)
      const l2 = dist(bs[leg.root + 1].a, bs[leg.root + 1].b)
      const elbow = knee(root, paw, l1, l2, -1)
      bs[leg.root].a = root
      bs[leg.root].b = elbow
      bs[leg.root + 1].a = elbow
      bs[leg.root + 1].b = paw
    } else {
      const root: V = [hips[0] + 0.01, hips[1] - 0.05, leg.z]
      const paw: V = [-0.17 + px, 0.02 + py, leg.z]
      const hock: V = [paw[0] - 0.02, paw[1] + 0.06, leg.z]
      const l1 = dist(bs[leg.root].a, bs[leg.root].b)
      const l2 = dist(bs[leg.root + 1].a, bs[leg.root + 1].b)
      const kn = knee(root, hock, l1, l2, 1)
      bs[leg.root].a = root
      bs[leg.root].b = kn
      bs[leg.root + 1].a = kn
      bs[leg.root + 1].b = hock
      bs[leg.root + 2].a = hock
      bs[leg.root + 2].b = paw
    }
  }
  // the tail streams out behind, higher at a gallop, waving
  const lift2 = 0.04 + 0.03 * gallop
  const pts: V[] = [[hips[0] - 0.06, hips[1] + 0.01, 0], [-0.37, 0.33, 0], [-0.53, 0.33, 0], [-0.7, 0.37, 0], [-0.83, 0.44, 0]]
  pts.forEach((p, k) => {
    if (k === 0) return
    p[1] += lift2 * k * 0.3 + 0.012 * k * Math.sin(tau * phase - k * 0.9)
    p[2] += 0.018 * k * Math.sin(tau * phase - k * 0.8)
  })
  bs.splice(19, 4)
  tail(bs, pts)
  return bs
}

/** Weighted sum of poses (their bones matched one to one). */
function blend(poses: [Bone[], number][]): Bone[] {
  const out = standing()
  out.forEach((o, i) => {
    o.a = [0, 0, 0]
    o.b = [0, 0, 0]
    o.ra = 0
    o.rb = 0
    for (const [p, w] of poses) {
      if (w <= 0) continue
      for (let k = 0; k < 3; k++) {
        o.a[k] += p[i].a[k] * w
        o.b[k] += p[i].b[k] * w
      }
      o.ra += p[i].ra * w
      o.rb += p[i].rb * w
    }
  })
  return out
}

/**
 * The fox's shape for its gait at `time` (s), its head turned `look` radians
 * (toward +z when positive) to look back at you. Writes FOX_BONES round cones
 * into `bones` as (a.xyz, ra, b.xyz, rb), and its two eyes into `eyes` as
 * (xyz, radius).
 */
export function foxPose(g: Gait, time: number, look: number, bones: Float32Array, eyes: Float32Array) {
  const wRun = Math.min(1, Math.max(0, g.run))
  const wSit = Math.min(1, Math.max(0, g.sit)) * (1 - wRun)
  const wStand = 1 - wRun - wSit
  const poses: [Bone[], number][] = [[standing(), wStand], [sitting(), wSit]]
  if (wRun > 0) poses.push([running(g.stride % 1, g.gallop), wRun])
  const bs = blend(poses)

  // at rest it breathes, and its tail sways
  const rest = 1 - wRun
  bs[0].ra += 0.003 * Math.sin(time * 2.1) * rest
  for (let i = 19; i < 23; i++) {
    const k = i - 18
    const sway = 0.012 * k * Math.sin(time * 1.3 - k * 0.7) * rest
    bs[i].a[2] += sway * (k > 1 ? 1 : 0)
    bs[i].b[2] += sway * 1.3
  }

  // the eyes sit on the front of its head, either side of the snout's root
  const head = bs[3]
  const eyePts: V[] = [
    [head.b[0] + 0.012, head.b[1] + 0.022, 0.028],
    [head.b[0] + 0.012, head.b[1] + 0.022, -0.028],
  ]

  // looking back: the head group turns about the neck's base
  if (Math.abs(look) > 1e-4) {
    const pivot = bs[2].a
    const cs = Math.cos(look)
    const sn = Math.sin(look)
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
    eyePts.forEach(turn)
  }

  bs.forEach((b, i) => {
    bones.set([b.a[0], b.a[1], b.a[2], b.ra, b.b[0], b.b[1], b.b[2], b.rb], i * 8)
  })
  eyePts.forEach((p, i) => eyes.set([p[0], p[1], p[2], 0.011], i * 4))
}

