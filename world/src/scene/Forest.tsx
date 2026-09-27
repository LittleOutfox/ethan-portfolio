import { useMemo } from 'react'
import { DoubleSide, InstancedMesh, Matrix4 } from 'three'
import barkVert from '../shaders/tree.vert.glsl?raw'
import barkFrag from '../shaders/tree.frag.glsl?raw'
import leafVert from '../shaders/leaf.vert.glsl?raw'
import leafFrag from '../shaders/leaf.frag.glsl?raw'
import type { Tree } from '../layout'
import { ARCHETYPES, buildArchetype, treeMatrix } from '../trees'
import type { Uniforms } from '../uniforms'
import { worldMaterial } from './materials'

/**
 * The seeded forest: per tree archetype, one instanced draw for the bark and
 * one for its foliage cards (kept apart so the bark, which never discards,
 * keeps the GPU's early depth test).
 */
export function Forest({ U, trees }: { U: Uniforms; trees: Tree[] }) {
  const meshes = useMemo(() => {
    const bark = worldMaterial(U, barkVert, barkFrag)
    const leaf = worldMaterial(U, leafVert, leafFrag, { side: DoubleSide })
    const mat = new Matrix4()
    const out: InstancedMesh[] = []
    ARCHETYPES.forEach((_, kind) => {
      const list = trees.filter((t) => t.kind === kind)
      if (!list.length) return
      const geo = buildArchetype(kind)
      const trunk = new InstancedMesh(geo.bark, bark, list.length)
      list.forEach((t, i) => trunk.setMatrixAt(i, treeMatrix(t, mat)))
      trunk.computeBoundingSphere()
      out.push(trunk)
      if (geo.leaves) {
        const crown = new InstancedMesh(geo.leaves, leaf, list.length)
        crown.instanceMatrix.copy(trunk.instanceMatrix)
        crown.computeBoundingSphere()
        out.push(crown)
      }
    })
    return out
  }, [U, trees])
  return (
    <>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </>
  )
}
