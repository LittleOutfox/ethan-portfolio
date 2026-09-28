import { useMemo } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three'
import vert from '../shaders/flower.vert.glsl?raw'
import frag from '../shaders/flower.frag.glsl?raw'
import { placeFlowers } from '../layout'
import type { Uniforms } from '../uniforms'

/** A rare glowing flower here and there on the snow — one draw. */
export function Flowers({ U, density }: { U: Uniforms; density: number }) {
  const points = useMemo(() => {
    const flowers = placeFlowers(density)
    const pos = new Float32Array(flowers.length * 3)
    const look = new Float32Array(flowers.length * 2)
    flowers.forEach((f, i) => {
      pos.set([f.x, f.y, f.z], i * 3)
      look.set([f.size, f.phase], i * 2)
    })
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aLook', new BufferAttribute(look, 2))
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
    pts.renderOrder = 19
    return pts
  }, [U, density])
  return <primitive object={points} />
}
