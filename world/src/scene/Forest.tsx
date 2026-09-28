import { useMemo } from 'react'
import { DoubleSide, InstancedMesh, Matrix4 } from 'three'
import barkVert from '../shaders/tree.vert.glsl?raw'
import barkFrag from '../shaders/tree.frag.glsl?raw'
import leafVert from '../shaders/leaf.vert.glsl?raw'
import leafFrag from '../shaders/leaf.frag.glsl?raw'
import drapeVert from '../shaders/drape.vert.glsl?raw'
import drapeFrag from '../shaders/drape.frag.glsl?raw'
import type { Tree } from '../layout'
import { ARCHETYPES, buildArchetype, treeMatrix } from '../trees'
import type { Uniforms } from '../uniforms'
import { worldMaterial } from './materials'

/**
 * The seeded forest: per tree archetype, one instanced draw for the bark, one
 * for its crown and one for its willow curtains (kept apart so the bark, which
 * never discards, keeps the GPU's early depth test). With MSAA the cut-out
 * cards soften their edges through alpha-to-coverage.
 */
export function Forest({ U, trees, msaa }: { U: Uniforms; trees: Tree[]; msaa: boolean }) {
  const meshes = useMemo(() => {
    const bark = worldMaterial(U, barkVert, barkFrag)
    const leaf = worldMaterial(U, leafVert, leafFrag, { side: DoubleSide, alphaToCoverage: msaa })
    const drape = worldMaterial(U, drapeVert, drapeFrag, { side: DoubleSide, alphaToCoverage: msaa })
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
      for (const [g, m] of [[geo.crown, leaf], [geo.drapes, drape]] as const) {
        if (!g) continue
        const mesh = new InstancedMesh(g, m, list.length)
        mesh.instanceMatrix.copy(trunk.instanceMatrix)
        mesh.computeBoundingSphere()
        out.push(mesh)
      }
    })
    return out
  }, [U, trees, msaa])
  return (
    <>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </>
  )
}
