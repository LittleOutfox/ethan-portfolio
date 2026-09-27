import { useMemo } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three'
import vert from '../shaders/air.vert.glsl?raw'
import frag from '../shaders/air.frag.glsl?raw'
import { mulberry32 } from '../layout'
import type { Uniforms } from '../uniforms'

/** Motes in the forest that become snow on the snowfield — one GPU-animated draw around the camera. */
export function Air({ U, density }: { U: Uniforms; density: number }) {
  const points = useMemo(() => {
    const rng = mulberry32(5)
    const n = Math.round(4200 * density)
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n * 4)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = rng() * 44
      pos[i * 3 + 1] = rng() * 26
      pos[i * 3 + 2] = rng() * 44
      seed.set([rng(), rng(), rng(), 0.4 + rng() * 0.6], i * 4)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new BufferAttribute(seed, 4))
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
    pts.renderOrder = 21
    return pts
  }, [U, density])
  return <primitive object={points} />
}
