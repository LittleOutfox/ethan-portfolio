import { useMemo } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector3 } from 'three'
import vert from '../shaders/foxfire.vert.glsl?raw'
import frag from '../shaders/foxfire.frag.glsl?raw'
import { HEARTH, KEYS, MOON_DIR, SUMMIT } from '../keys'
import { heightAt, mulberry32 } from '../layout'
import { makeCameraPath, type Pose } from '../path'
import type { Uniforms } from '../uniforms'

/**
 * Every light in the world that isn't the moon: the kitsunebi leading the way
 * along the path, embers over the den's hearth, and the five tail bands that
 * rise behind the summit as each tail is earned. One draw.
 */
export function Foxfire({ U, density }: { U: Uniforms; density: number }) {
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

    // the procession: ahead of wherever the camera walks, off to either side
    const sample = makeCameraPath(KEYS)
    const a: Pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 }
    const b: Pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 }
    const wisps = Math.round(170 * density)
    for (let i = 0; i < wisps; i++) {
      const t = 0.25 + rng() * 8.6
      sample(t, a)
      sample(Math.min(9, t + 0.08), b)
      const fx = b.pos[0] - a.pos[0], fz = b.pos[2] - a.pos[2]
      const fl = Math.hypot(fx, fz) || 1
      const ahead = 6 + rng() * 16
      const side = (rng() < 0.5 ? -1 : 1) * (1.5 + rng() * 5)
      const x = a.pos[0] + (fx / fl) * ahead - (fz / fl) * side
      const z = a.pos[2] + (fz / fl) * ahead + (fx / fl) * side
      add(x, heightAt(x, z) + 0.8 + rng() * 2.8, z, 0.18 + rng() * 0.3, 0.5 + rng() * 0.6, 0)
    }

    // the den: embers rising off the hearth, and the fire's own soft glow
    const [hx, hy, hz] = HEARTH
    for (let i = 0; i < Math.round(46 * density); i++) {
      const r = rng() * 1.6
      const th = rng() * 6.283
      add(hx + Math.cos(th) * r, hy - 0.6, hz + Math.sin(th) * r, 0.06 + rng() * 0.1, 0.7 + rng() * 0.5, 1)
    }
    add(hx, hy - 0.2, hz, 4, 0.3, 2)

    // five tail bands fanning up from a point beneath the moon, ahead of the summit
    const md = new Vector3(MOON_DIR[0], 0, MOON_DIR[2]).normalize()
    const base = new Vector3(SUMMIT[0] + md.x * 34, 0, SUMMIT[2] + md.z * 34)
    base.y = heightAt(base.x, base.z) + 2
    const right = new Vector3(-md.z, 0, md.x)
    for (let bnd = 1; bnd <= 5; bnd++) {
      const ang = (-0.95 + ((bnd - 1) / 4) * 1.9) * 0.9
      const end = base.clone().addScaledVector(right, Math.sin(ang) * 16).add(new Vector3(0, Math.cos(ang) * 17, 0))
      const ctrl = base.clone().addScaledVector(right, Math.sin(ang) * 3).add(new Vector3(0, 10, 0))
      const n = Math.round(40 * Math.max(0.5, density))
      for (let i = 0; i < n; i++) {
        // the bands begin a little above their shared root, so the five
        // don't pile into one bright knot where they meet
        const f = 0.12 + ((i + rng() * 0.5) / n) * 0.88
        const u = 1 - f
        const x = u * u * base.x + 2 * u * f * ctrl.x + f * f * end.x
        const y = u * u * base.y + 2 * u * f * ctrl.y + f * f * end.y
        const z = u * u * base.z + 2 * u * f * ctrl.z + f * f * end.z
        add(x, y, z, 0.14 + (1 - f) * 0.16, (0.5 + 0.4 * (1 - f)) * Math.min(1, (f - 0.12) * 5), 2 + bnd)
      }
    }

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
  }, [U, density])
  return <primitive object={points} />
}
