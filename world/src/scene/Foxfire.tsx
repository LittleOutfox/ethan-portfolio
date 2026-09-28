import { useMemo } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three'
import vert from '../shaders/foxfire.vert.glsl?raw'
import frag from '../shaders/foxfire.frag.glsl?raw'
import { HEARTH, KEYS } from '../keys'
import { heightAt, mulberry32 } from '../layout'
import { makeCameraPath, type Pose } from '../path'
import type { Uniforms } from '../uniforms'
import { toriiPlaces } from './Shrine'

/**
 * Every light in the world that isn't the moon or a spirit bloom: spirit
 * orbs leading the way along the path and hanging in the trees, lanterns
 * beside the great torii, and embers over the den's hearth. One draw.
 */
export function Foxfire({ U, density, gates }: { U: Uniforms; density: number; gates: number[] }) {
  const points = useMemo(() => {
    const rng = mulberry32(99)
    const pos: number[] = []
    const seed: number[] = []
    const kind: number[] = []
    const add = (x: number, y: number, z: number, size: number, light: number, k: number) => {
      pos.push(x, y, z)
      seed.push(rng(), size, 0.5 + rng(), light)
      kind.push(k)
    }

    // orbs: a procession low along the path, ahead of wherever the camera
    // walks, and bigger, fewer ones hanging high among the trees — below and
    // above eye level, so they frame the band the page's text reads in rather
    // than crossing it. Through the forest and up to the shrine only: the den
    // has its fire, and up on the summit the moon is the light.
    // The sprite is the orb's width over 0.6 (the rest of it is the glow).
    const sample = makeCameraPath(KEYS)
    const a: Pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 }
    const b: Pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 }
    const orb = (until: number, near: number, far: number, low: number, high: number, width: number, grow: number) => {
      const t = 0.25 + rng() * (until - 0.25)
      sample(t, a)
      sample(Math.min(9, t + 0.08), b)
      const fx = b.pos[0] - a.pos[0], fz = b.pos[2] - a.pos[2]
      const fl = Math.hypot(fx, fz) || 1
      const ahead = 6 + rng() * 16
      const side = (rng() < 0.5 ? -1 : 1) * (near + rng() * (far - near))
      const x = a.pos[0] + (fx / fl) * ahead - (fz / fl) * side
      const z = a.pos[2] + (fz / fl) * ahead + (fx / fl) * side
      add(x, heightAt(x, z) + low + rng() * (high - low), z, (width + rng() * grow) / 0.6, 0.5 + rng() * 0.6, 0)
    }
    for (let i = 0; i < Math.round(110 * density); i++) orb(5.3, 1.5, 6.5, 0.3, 1.3, 0.1, 0.22)
    for (let i = 0; i < Math.round(30 * density); i++) orb(5.3, 4, 12, 5, 9, 0.18, 0.26)

    // a stone lantern either side of each great torii, a little outside its pillars
    for (const g of toriiPlaces(gates).slice(0, 3)) {
      for (const side of [-1, 1]) {
        const off = side * (1.35 * g.scale + 1.3)
        const x = g.x + Math.cos(g.yaw) * off
        const z = g.z - Math.sin(g.yaw) * off
        add(x, heightAt(x, z) + 1.1, z, 1.1, 0.9, 9)
      }
    }

    // the den: embers rising off the hearth, and the fire's own soft glow
    const [hx, hy, hz] = HEARTH
    for (let i = 0; i < Math.round(46 * density); i++) {
      const r = rng() * 1.6
      const th = rng() * 6.283
      add(hx + Math.cos(th) * r, hy - 0.6, hz + Math.sin(th) * r, 0.06 + rng() * 0.1, 0.7 + rng() * 0.5, 1)
    }
    add(hx, hy - 0.2, hz, 4, 0.3, 2)

    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
    g.setAttribute('aSeed', new BufferAttribute(new Float32Array(seed), 4))
    g.setAttribute('aKind', new BufferAttribute(new Float32Array(kind), 1))
    g.computeBoundingSphere()
    const mat = new ShaderMaterial({
      uniforms: U,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    const pts = new Points(g, mat)
    pts.frustumCulled = false
    pts.renderOrder = 20
    return pts
  }, [U, density, gates])
  return <primitive object={points} />
}
