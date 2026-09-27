// Gnarled trees, grown once at boot from a seed: a twisting trunk with root
// flares, drooping main branches that reach toward local +x (the forest turns
// each tree so that side faces the path — the arch the film had), a second
// tier of branches, and on some trees clumps of dark crimson leaves.
// Each tree is two geometries — bark tubes, and crossed foliage cards the
// leaf shader cuts into leafy clumps — and the forest instances a handful.
import { BufferAttribute, BufferGeometry, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { cameraSamples, mulberry32, placeTrees, type Tree } from './layout'

export interface Archetype {
  seed: number
  /** trunk height (m) */
  height: number
  /** trunk radius just above the root flare (m) */
  radius: number
  /** main branch length (m) */
  reach: number
  branches: number
  /** how much the trunk and limbs twist */
  gnarl: number
  /** 0 bare winter tree … 1 full crimson crown */
  leaves: number
}

export const ARCHETYPES: Archetype[] = [
  { seed: 11, height: 15, radius: 0.72, reach: 8.5, branches: 4, gnarl: 0.9, leaves: 0.8 },
  { seed: 23, height: 18, radius: 0.55, reach: 6.5, branches: 5, gnarl: 0.55, leaves: 0.2 },
  { seed: 37, height: 12, radius: 0.85, reach: 9.5, branches: 3, gnarl: 1.2, leaves: 1 },
  { seed: 41, height: 20, radius: 0.5, reach: 5.5, branches: 4, gnarl: 0.45, leaves: 0 },
  { seed: 59, height: 14, radius: 0.66, reach: 7.5, branches: 4, gnarl: 1.0, leaves: 0.5 },
]

class Builder {
  pos: number[] = []
  nor: number[] = []
  up: number[] = []
  idx: number[] = []
  bones: Bone[] = []
  constructor(readonly height: number) {}

  /** A tube along `pts` with per-point radii, rings kept twist-free by parallel transport. */
  tube(pts: Vector3[], radii: number[], radial: number) {
    pts.forEach((p, i) => this.bones.push({ x: p.x, y: p.y, z: p.z, r: radii[i] }))
    const base = this.pos.length / 3
    let t = pts[1].clone().sub(pts[0]).normalize()
    const n = (Math.abs(t.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0)).cross(t).normalize()
    const b = new Vector3()
    const tNew = new Vector3()
    const axis = new Vector3()
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) {
        tNew.copy(pts[Math.min(i + 1, pts.length - 1)]).sub(pts[i - 1]).normalize()
        axis.copy(t).cross(tNew)
        const s = axis.length()
        if (s > 1e-6) n.applyAxisAngle(axis.normalize(), Math.asin(Math.min(1, s)))
        t = tNew.clone()
      }
      b.copy(t).cross(n).normalize()
      n.copy(b).cross(t).normalize()
      for (let j = 0; j < radial; j++) {
        const a = (j / radial) * Math.PI * 2
        const c = Math.cos(a)
        const s = Math.sin(a)
        const nx = n.x * c + b.x * s
        const ny = n.y * c + b.y * s
        const nz = n.z * c + b.z * s
        const r = radii[i]
        this.pos.push(pts[i].x + nx * r, pts[i].y + ny * r, pts[i].z + nz * r)
        this.nor.push(nx, ny, nz)
        this.up.push(pts[i].y / this.height)
      }
    }
    for (let i = 0; i < pts.length - 1; i++) {
      for (let j = 0; j < radial; j++) {
        const a = base + i * radial + j
        const bb = base + i * radial + ((j + 1) % radial)
        this.idx.push(a, bb, a + radial, bb, bb + radial, a + radial)
      }
    }
  }

  geometry(): BufferGeometry {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(this.pos), 3))
    g.setAttribute('normal', new BufferAttribute(new Float32Array(this.nor), 3))
    g.setAttribute('aUp', new BufferAttribute(new Float32Array(this.up), 1))
    const n = this.pos.length / 3
    g.setIndex(new BufferAttribute(n > 65535 ? new Uint32Array(this.idx) : new Uint16Array(this.idx), 1))
    g.computeBoundingSphere()
    return g
  }
}

/** Foliage: a few crossed cards per clump; the leaf shader cuts each into ragged leaves. */
class Foliage {
  pos: number[] = []
  nor: number[] = []
  uv: number[] = []
  seed: number[] = []
  idx: number[] = []

  clump(rng: () => number, c: Vector3, size: number, cards: number) {
    const u = new Vector3()
    const v = new Vector3()
    const n = new Vector3()
    for (let k = 0; k < cards; k++) {
      // cards stand mostly upright, turned every which way around the clump
      const th = (k / cards) * Math.PI + rng() * 0.6
      const tilt = (rng() - 0.5) * 0.9
      u.set(Math.cos(th), 0, Math.sin(th))
      v.set(-Math.sin(th) * Math.sin(tilt), Math.cos(tilt), Math.cos(th) * Math.sin(tilt))
      n.copy(u).cross(v).normalize()
      const s = size * (0.8 + rng() * 0.4)
      const cx = c.x + (rng() - 0.5) * size * 0.3
      const cy = c.y + (rng() - 0.6) * size * 0.3
      const cz = c.z + (rng() - 0.5) * size * 0.3
      const sd = rng()
      const base = this.pos.length / 3
      for (const [a, b] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) {
        this.pos.push(cx + (u.x * a + v.x * b) * s, cy + (u.y * a + v.y * b) * s, cz + (u.z * a + v.z * b) * s)
        this.nor.push(n.x, n.y, n.z)
        this.uv.push(a + 0.5, b + 0.5)
        this.seed.push(sd)
      }
      this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3)
    }
  }

  geometry(): BufferGeometry | null {
    if (!this.pos.length) return null
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(this.pos), 3))
    g.setAttribute('normal', new BufferAttribute(new Float32Array(this.nor), 3))
    g.setAttribute('uv', new BufferAttribute(new Float32Array(this.uv), 2))
    g.setAttribute('aSeed', new BufferAttribute(new Float32Array(this.seed), 1))
    g.setIndex(this.idx)
    g.computeBoundingSphere()
    return g
  }
}

/** A point of a tree's frame with its radius (m): trunk and limb centrelines, leaf clumps. */
export interface Bone {
  x: number
  y: number
  z: number
  r: number
}

interface Limb {
  pts: Vector3[]
  radii: number[]
}

/** Grow a limb: it curls up early, droops toward its tip and wanders as it goes. */
function grow(
  rng: () => number,
  start: Vector3,
  dir: Vector3,
  length: number,
  r0: number,
  r1: number,
  steps: number,
  curl: number,
  droop: number,
  wander: number,
  /** pull back toward the vertical axis through the start (trunks), 0 for limbs */
  anchor = 0,
): Limb {
  const d = dir.clone().normalize()
  const p = start.clone()
  const pts = [p.clone()]
  const radii = [r0]
  const seg = length / steps
  const ph1 = rng() * 6.283
  const ph2 = rng() * 6.283
  for (let i = 1; i <= steps; i++) {
    const f = i / steps
    d.y += curl * (1 - f) * 0.16 - droop * f * 0.13
    d.x += Math.sin(i * 1.3 + ph1) * wander * 0.13
    d.z += Math.cos(i * 1.7 + ph2) * wander * 0.13
    d.x -= (p.x - start.x) * anchor
    d.z -= (p.z - start.z) * anchor
    d.normalize()
    p.addScaledVector(d, seg)
    pts.push(p.clone())
    radii.push(r0 + (r1 - r0) * Math.pow(f, 0.85))
  }
  return { pts, radii }
}

export interface ArchetypeGeometry {
  bark: BufferGeometry
  leaves: BufferGeometry | null
  /** the tree's frame, for keeping it clear of the camera */
  skeleton: Bone[]
}

const built = new Map<number, ArchetypeGeometry>()

/** Grow archetype i (once — later calls reuse it). */
export function buildArchetype(i: number): ArchetypeGeometry {
  let g = built.get(i)
  if (!g) {
    g = grow1(i)
    built.set(i, g)
  }
  return g
}

function grow1(i: number): ArchetypeGeometry {
  const a = ARCHETYPES[i]
  const rng = mulberry32(a.seed)
  const B = new Builder(a.height)
  const H = a.height
  const R = a.radius

  // trunk: rises from below ground with a slow twist and a flared base
  const steps = 16
  const lean = new Vector3((rng() - 0.5) * 0.25, 1, (rng() - 0.5) * 0.25)
  const trunk = grow(rng, new Vector3(0, -0.8, 0), lean, H, R, R * 0.2, steps, 0.05, 0, a.gnarl * 0.9, 0.12)
  trunk.radii = trunk.radii.map((r, k) => r + R * 0.75 * Math.exp(-(k / steps) * 12))
  B.tube(trunk.pts, trunk.radii, 9)

  // roots: thick flares that dive back into the ground
  const roots = 4 + Math.floor(rng() * 3)
  for (let k = 0; k < roots; k++) {
    const th = (k / roots) * Math.PI * 2 + rng() * 0.8
    const start = trunk.pts[1].clone().add(new Vector3(0, rng() * 0.3, 0))
    const root = grow(rng, start, new Vector3(Math.cos(th), -0.25, Math.sin(th)), 1.8 + rng() * 2, R * 0.6, 0.07, 6, 0, 1.4, 0.6)
    B.tube(root.pts, root.radii, 6)
  }

  // main branches, the first two sweeping toward +x (the path side)
  const tips: Vector3[] = []
  for (let k = 0; k < a.branches; k++) {
    const f = 0.34 + (k / a.branches) * 0.5 + rng() * 0.08
    const at = Math.min(steps - 1, Math.round(f * steps))
    const th = k < 2 ? (rng() - 0.5) * 1.9 : rng() * Math.PI * 2
    const el = 0.35 + rng() * 0.55
    const dir = new Vector3(Math.cos(th) * Math.cos(el), Math.sin(el), Math.sin(th) * Math.cos(el))
    const len = a.reach * (0.75 + rng() * 0.45) * (1 - 0.35 * f)
    const limb = grow(rng, trunk.pts[at], dir, len, trunk.radii[at] * 0.62, 0.05, 9, 0.35, 0.7 + rng() * 0.6, a.gnarl)
    B.tube(limb.pts, limb.radii, 7)
    tips.push(limb.pts[limb.pts.length - 1])

    // a second tier of branches
    const kids = 2 + Math.floor(rng() * 2)
    for (let c = 0; c < kids; c++) {
      const g = 3 + Math.floor(rng() * 5)
      const pd = limb.pts[g + 1].clone().sub(limb.pts[g]).normalize()
      const kd = pd.add(new Vector3(rng() - 0.5, rng() * 0.6, rng() - 0.5).multiplyScalar(1.4))
      const kid = grow(rng, limb.pts[g], kd, len * (0.35 + rng() * 0.25), limb.radii[g] * 0.65, 0.025, 6, 0.2, 0.9, a.gnarl * 0.8)
      B.tube(kid.pts, kid.radii, 5)
      tips.push(kid.pts[kid.pts.length - 1])
    }
  }
  tips.push(trunk.pts[steps])

  // crimson foliage on the leafier archetypes
  const F = new Foliage()
  for (const tip of tips) {
    if (rng() < a.leaves * 0.7) {
      const size = 1.3 + rng() * 1.0
      F.clump(rng, tip, size, 4)
      B.bones.push({ x: tip.x, y: tip.y, z: tip.z, r: size * 0.6 })
    }
  }
  return { bark: B.geometry(), leaves: F.geometry(), skeleton: B.bones }
}

const _e = new Euler()
const _q = new Quaternion()
const _p = new Vector3()
const _s = new Vector3()

/** The instance transform for a placed tree — the one the forest draws with. */
export function treeMatrix(t: Tree, out: Matrix4): Matrix4 {
  _e.set(t.lean, t.rot, t.lean * 0.6)
  _q.setFromEuler(_e)
  _p.set(t.x, t.y - 0.2, t.z)
  _s.setScalar(t.scale)
  return out.compose(_p, _q, _s)
}

/**
 * The forest the world draws: the seeded placement, minus any tree whose
 * actual frame (a wandering trunk, a drooping limb, a leaf clump) would come
 * within `margin` metres of the camera anywhere on its journey.
 */
export function forestFor(density: number, margin = 2.3): Tree[] {
  const cam = cameraSamples(0.01)
  const m = new Matrix4()
  const v = new Vector3()
  return placeTrees(density).filter((t) => {
    const reach = (ARCHETYPES[t.kind].reach + ARCHETYPES[t.kind].height) * t.scale
    const near = cam.filter((c) => Math.hypot(c[0] - t.x, c[2] - t.z) < reach + margin)
    if (!near.length) return true
    treeMatrix(t, m)
    for (const b of buildArchetype(t.kind).skeleton) {
      v.set(b.x, b.y, b.z).applyMatrix4(m)
      const r = b.r * t.scale + margin
      for (const c of near) {
        const dx = v.x - c[0], dy = v.y - c[1], dz = v.z - c[2]
        if (dx * dx + dy * dy + dz * dz < r * r) return false
      }
    }
    return true
  })
}
