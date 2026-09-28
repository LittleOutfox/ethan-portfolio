import { useMemo } from 'react'
import { BackSide, SphereGeometry } from 'three'
import vert from '../shaders/sky.vert.glsl?raw'
import frag from '../shaders/sky.frag.glsl?raw'
import type { Uniforms } from '../uniforms'
import { worldMaterial } from './materials'

/** Gradient, moon and the forest roof — drawn last among the opaques, only where nothing stands. */
export function Sky({ U }: { U: Uniforms }) {
  const geometry = useMemo(() => new SphereGeometry(1, 48, 24), [])
  const material = useMemo(() => worldMaterial(U, vert, frag, { side: BackSide, depthWrite: false }), [U])
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={10} />
}
