import { useMemo } from 'react'
import { BufferAttribute, PlaneGeometry } from 'three'
import vert from '../shaders/terrain.vert.glsl?raw'
import frag from '../shaders/terrain.frag.glsl?raw'
import { ROUTE, distanceToCurve, heightAt } from '../layout'
import type { Uniforms } from '../uniforms'
import { worldMaterial } from './materials'

const ROUTE_XZ: [number, number][] = ROUTE.map(([x, , z]) => [x, z])
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** The ground: one displaced grid, with the path and the snowfield baked per vertex. */
function buildTerrain(): PlaneGeometry {
  const g = new PlaneGeometry(420, 700, 150, 230)
  g.rotateX(-Math.PI / 2)
  g.translate(30, 0, -170)
  const pos = g.attributes.position as BufferAttribute
  const path = new Float32Array(pos.count)
  const snow = new Float32Array(pos.count)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    pos.setY(i, heightAt(x, z))
    path[i] = 1 - smooth(0.8, 3.2, distanceToCurve(x, z, ROUTE_XZ))
    snow[i] = smooth(-126, -140, z)
  }
  g.setAttribute('aPath', new BufferAttribute(path, 1))
  g.setAttribute('aSnow', new BufferAttribute(snow, 1))
  g.computeVertexNormals()
  return g
}

export function Terrain({ U }: { U: Uniforms }) {
  const geometry = useMemo(buildTerrain, [])
  const material = useMemo(() => worldMaterial(U, vert, frag, { defines: { BLOOMS: U.uBlooms.value.length } }), [U])
  return <mesh geometry={geometry} material={material} />
}
