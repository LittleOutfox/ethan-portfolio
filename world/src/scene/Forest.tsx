import { useMemo } from 'react'
import { CylinderGeometry, Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three'
import vert from '../shaders/trunk.vert.glsl?raw'
import frag from '../shaders/trunk.frag.glsl?raw'
import type { Tree } from '../layout'
import type { Uniforms } from '../uniforms'
import { worldMaterial } from './materials'

/** The seeded forest as one instanced draw. */
export function Forest({ U, trees }: { U: Uniforms; trees: Tree[] }) {
  const mesh = useMemo(() => {
    const geometry = new CylinderGeometry(0.55, 1, 1, 7, 6, true)
    geometry.translate(0, 0.5, 0)
    const material = worldMaterial(U, vert, frag)
    const m = new InstancedMesh(geometry, material, trees.length)
    const mat = new Matrix4()
    const q = new Quaternion()
    const e = new Euler()
    const p = new Vector3()
    const s = new Vector3()
    trees.forEach((t, i) => {
      e.set(t.lean, t.rot, t.lean * 0.5)
      q.setFromEuler(e)
      p.set(t.x, t.y - 0.4, t.z)
      s.set(t.radius, t.height, t.radius)
      m.setMatrixAt(i, mat.compose(p, q, s))
    })
    m.instanceMatrix.needsUpdate = true
    m.computeBoundingSphere()
    return m
  }, [U, trees])
  return <primitive object={mesh} />
}
