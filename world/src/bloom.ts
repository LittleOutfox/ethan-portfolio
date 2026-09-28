// A spirit bloom, grown once at boot from a seed: gnarled roots arching out
// from its foot, most gripping down into the snow and a couple curling up at
// their tips like young ferns; a twisting stalk with pointed leaves about its
// foot; and at its top an orb of light held in a cup of curling tendrils, one
// arching up over the orb and ending in a curl. Two geometries (bark tubes,
// leaf blades); the orb and its glow are spheres drawn apart (scene/Blooms.tsx)
// at BLOOM's numbers. Local +y is up, and the arching tendril lies in the
// local x–y plane, which the layout turns toward the camera.
import { BufferAttribute, BufferGeometry, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { BLOOM, mulberry32, type Bloom } from './layout'
import { Builder } from './trees'

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Leaf blades: a lance shape along a centreline, widest a third of the way
 * out and pointed at the tip, its halves folded up a little from the midrib.
 * uv.x runs across the blade (−1 edge, 0 midrib, 1 edge), uv.y along it (0 at
 * the stalk, 1 at the tip).
 */
class Blades {
  pos: number[] = []
  nor: number[] = []
  uv: number[] = []
  idx: number[] = []

  blade(pts: Vector3[], width: number, fold: number) {
    const base = this.pos.length / 3
    const n = pts.length
    const t = new Vector3()
    const side = new Vector3()
    const nrm = new Vector3()
    const up = new Vector3(0, 1, 0)
    for (let i = 0; i < n; i++) {
      const s = i / (n - 1)
      t.copy(pts[Math.min(i + 1, n - 1)]).sub(pts[Math.max(i - 1, 0)]).normalize()
      side.copy(t).cross(up)
      if (side.lengthSq() < 1e-6) side.set(1, 0, 0)
      side.normalize()
      nrm.copy(side).cross(t).normalize()
      const w = width * 2.6 * Math.sqrt(s) * Math.pow(1 - s, 1.2)
      for (const a of [-1, 0, 1]) {
        const lift = a === 0 ? 0 : fold * w
        const p = pts[i]
        this.pos.push(p.x + side.x * w * a + nrm.x * lift, p.y + side.y * w * a + nrm.y * lift, p.z + side.z * w * a + nrm.z * lift)
        this.nor.push(nrm.x, nrm.y, nrm.z)
        this.uv.push(a, s)
      }
    }
    for (let i = 0; i < n - 1; i++) {
      const a = base + i * 3
      const b = a + 3
      this.idx.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1)
    }
  }

  geometry(): BufferGeometry {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(this.pos), 3))
    g.setAttribute('normal', new BufferAttribute(new Float32Array(this.nor), 3))
    g.setAttribute('uv', new BufferAttribute(new Float32Array(this.uv), 2))
    g.setIndex(this.idx)
    g.computeBoundingSphere()
    return g
  }
}

/** A curve grown step by step: `turn(f)` gives the change in elevation per step, f running 0..1. */
function grow(start: Vector3, azimuth: number, elevation: number, steps: number, seg: number, turn: (f: number) => number, wander = () => 0, until = -Infinity): Vector3[] {
  const p = start.clone()
  const pts = [p.clone()]
  let e = elevation
  let a = azimuth
  for (let i = 1; i <= steps; i++) {
    e += turn(i / steps)
    a += wander()
    p.x += Math.cos(a) * Math.cos(e) * seg
    p.y += Math.sin(e) * seg
    p.z += Math.sin(a) * Math.cos(e) * seg
    pts.push(p.clone())
    if (p.y < until) break
  }
  return pts
}

const taper = (n: number, r0: number, r1: number, k = 1) => Array.from({ length: n }, (_, i) => r1 + (r0 - r1) * Math.pow(1 - i / (n - 1), k))

export interface BloomGeometry {
  /** roots, stalk and tendrils */
  bark: BufferGeometry
  leaves: BufferGeometry
  /** the centreline of every root, stalk and tendril */
  stems: Vector3[][]
}

let built: BloomGeometry | null = null

/** Grow the bloom (once — later calls reuse it). */
export function buildBloom(): BloomGeometry {
  if (!built) built = grow1()
  return built
}

function grow1(): BloomGeometry {
  const rng = mulberry32(71)
  const R = BLOOM.orbR
  const C = new Vector3(0, BLOOM.orbY, 0)
  const B = new Builder(BLOOM.orbY + R)
  const stems: Vector3[][] = []
  const tube = (pts: Vector3[], radii: number[], radial: number) => {
    B.tube(pts, radii, radial)
    stems.push(pts)
  }
  const L = new Blades()
  const psi = rng() * Math.PI * 2

  // the stalk: bowed and twisting, flared at its foot (which is sunk well into
  // the snow, wherever the ground slopes), rising to just beneath the orb
  const top = BLOOM.orbY - R * 1.02
  const stalk: Vector3[] = []
  for (let i = 0; i <= 14; i++) {
    const s = i / 14
    const bow = 0.1 * Math.sin(Math.PI * s)
    const a = psi + 2.4 * s
    stalk.push(new Vector3(bow * Math.cos(a), -0.4 + (top + 0.4) * s, bow * Math.sin(a)))
  }
  tube(stalk, stalk.map((_, i) => 0.034 + 0.03 * (1 - i / 14) + 0.04 * Math.exp(-(i / 14) * 10)), 8)

  // roots arching out from its foot: most grip down into the snow, a couple
  // lie low and curl up at their tips
  const roots = 6
  for (let k = 0; k < roots; k++) {
    const th = psi + (k / roots) * Math.PI * 2 + (rng() - 0.5) * 0.5
    const start = new Vector3(Math.cos(th) * 0.05, 0.12 + rng() * 0.06, Math.sin(th) * 0.05)
    const wander = () => (rng() - 0.5) * 0.22
    const pts =
      k % 3 === 1
        ? grow(start, th, 0.35, 14, 0.085 + rng() * 0.01, (f) => (f < 0.64 ? -0.09 : 0.6), wander)
        : grow(start, th, 0.6 + rng() * 0.2, 16, 0.1 + rng() * 0.02, () => -0.17, wander, -0.1)
    tube(pts, taper(pts.length, 0.045, 0.006, 0.8), 6)
  }

  // the cup: four tendrils from the stalk's top curling up around the orb's
  // lower half, hugging it, their tips flaring out below its middle
  for (let k = 0; k < 4; k++) {
    const phi0 = psi + (k / 4) * Math.PI * 2 + (rng() - 0.5) * 0.4
    const pts: Vector3[] = []
    for (let i = 0; i <= 10; i++) {
      const s = i / 10
      const theta = Math.PI - 0.12 - s * (1.2 + rng() * 0.1)
      const rho = R * (1.1 + 0.3 * Math.pow(smooth(0.55, 1, s), 1.5))
      const phi = phi0 + 0.7 * s
      pts.push(new Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)).multiplyScalar(rho).add(C))
    }
    tube(pts, taper(pts.length, 0.022, 0.005), 5)
  }

  // the arch: from the stalk's top up the orb's far side (local −x), over its
  // crown and down the near side, ending in a curl like a fern's
  const arch: Vector3[] = [new Vector3(0, top - 0.06, 0)]
  const sweep = Math.PI + 0.5
  for (let i = 0; i <= 16; i++) {
    const s = i / 16
    const beta = 0.4 + s * sweep
    const rho = R * (1.16 + 0.12 * s)
    arch.push(new Vector3(-Math.sin(beta) * rho, BLOOM.orbY - Math.cos(beta) * rho, 0.03 * Math.sin(Math.PI * s)))
  }
  const end = arch[arch.length - 1].clone()
  const beta = 0.4 + sweep
  let heading = Math.atan2(Math.sin(beta), -Math.cos(beta))
  const curl = 0.3
  for (let i = 1; i <= 14; i++) {
    const f = i / 14
    heading += (3 + 40 * f * f) * (curl / 14)
    end.x += Math.cos(heading) * (curl / 14)
    end.y += Math.sin(heading) * (curl / 14)
    arch.push(end.clone())
  }
  tube(arch, taper(arch.length, 0.028, 0.005, 0.7), 6)

  // leaves: a rosette about the stalk's foot, arching out and down, and two
  // small ones up the stalk
  for (let k = 0; k < 6; k++) {
    const th = psi + 0.3 + (k / 6) * Math.PI * 2 + (rng() - 0.5) * 0.5
    const start = new Vector3(Math.cos(th) * 0.04, 0.05 + rng() * 0.06, Math.sin(th) * 0.04)
    const len = 0.4 + rng() * 0.2
    const droop = 1.4 + rng() * 0.6
    const pts = grow(start, th, 0.75 + rng() * 0.4, 8, len / 8, () => -droop / 8, () => 0.04)
    L.blade(pts, 0.075 + rng() * 0.03, 0.35)
  }
  for (const s of [0.5, 0.66]) {
    const at = stalk[Math.round(s * 14)]
    const th = psi + rng() * Math.PI * 2
    const pts = grow(at, th, 0.55, 6, 0.24 / 6, () => -0.16)
    L.blade(pts, 0.05, 0.3)
  }

  return { bark: B.geometry(), leaves: L.geometry(), stems }
}

const _e = new Euler()
const _q = new Quaternion()
const _p = new Vector3()
const _s = new Vector3()

/** The instance transform for a placed bloom — the one every part of it draws with. */
export function bloomMatrix(b: Bloom, out: Matrix4): Matrix4 {
  _e.set(0, b.rot, 0)
  _q.setFromEuler(_e)
  _p.set(b.x, b.y - 0.03, b.z)
  _s.setScalar(b.scale)
  return out.compose(_p, _q, _s)
}
