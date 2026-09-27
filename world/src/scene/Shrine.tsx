import { useMemo } from 'react'
import { BoxGeometry, Color, CylinderGeometry, Euler, InstancedMesh, Matrix4, Quaternion, Vector3, type BufferGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import vert from '../shaders/solid.vert.glsl?raw'
import frag from '../shaders/solid.frag.glsl?raw'
import { KEYS } from '../keys'
import { heightAt, ROUTE } from '../layout'
import { makeCameraPath, type Pose } from '../path'
import type { Uniforms } from '../uniforms'
import { worldMaterial } from './materials'

/** A torii at human scale (pillars 3.4 m), its lintel's ends turned up. Local +z is the way through. */
function toriiGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = []
  for (const x of [-1.35, 1.35]) {
    const pillar = new CylinderGeometry(0.15, 0.18, 3.6, 10)
    pillar.rotateZ(x < 0 ? -0.02 : 0.02)
    pillar.translate(x, 1.8, 0)
    parts.push(pillar)
  }
  const kasagi = new BoxGeometry(4.1, 0.2, 0.36, 24, 1, 1)
  const kp = kasagi.attributes.position
  for (let i = 0; i < kp.count; i++) kp.setY(i, kp.getY(i) + 0.05 * Math.pow(kp.getX(i) / 2.05, 4) * 4)
  kasagi.translate(0, 3.62, 0)
  const shimaki = new BoxGeometry(3.6, 0.14, 0.28)
  shimaki.translate(0, 3.42, 0)
  const nuki = new BoxGeometry(3.3, 0.16, 0.14)
  nuki.translate(0, 2.85, 0)
  const strut = new BoxGeometry(0.16, 0.45, 0.14)
  strut.translate(0, 3.12, 0)
  parts.push(kasagi, shimaki, nuki, strut)
  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()))
  merged.computeVertexNormals()
  return merged
}

/**
 * The shrine: stone steps up the stair, three great torii the camera walks
 * through exactly when the page's own gates pass (bus.gates, works progress),
 * and a line of smaller gates climbing on into the mist, never reached.
 */
export function Shrine({ U, gates }: { U: Uniforms; gates: number[] }) {
  const meshes = useMemo(() => {
    const sample = makeCameraPath(KEYS)
    const pose: Pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 }
    const m = new Matrix4()
    const q = new Quaternion()
    const e = new Euler()
    const p = new Vector3()
    const s = new Vector3()

    // gates: the three the camera crosses (works is world time 4 → 5), then the far climb
    const place: { x: number; z: number; yaw: number; scale: number }[] = []
    for (const g of gates) {
      sample(4 + g, pose)
      const ahead = sample(4 + g + 0.01, { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 })
      const yaw = Math.atan2(ahead.pos[0] - pose.pos[0], ahead.pos[2] - pose.pos[2])
      place.push({ x: pose.pos[0], z: pose.pos[2], yaw, scale: 1.6 })
    }
    // the far gates climb the shrine hill to the west of the summit
    const farYaw = Math.atan2(41 - 57, -132 + 92)
    for (let k = 0; k < 14; k++) {
      const f = k / 13
      place.push({ x: 57 - f * 16, z: -92 - f * 40, yaw: farYaw, scale: 1.1 - f * 0.15 })
    }
    const torii = new InstancedMesh(
      toriiGeometry(),
      worldMaterial(U, vert, frag, {
        uniforms: { uColor: { value: new Color(0.017, 0.0055, 0.0055) }, uRimColor: { value: new Color(0.03, 0.016, 0.014) } },
      }),
      place.length,
    )
    place.forEach((g, i) => {
      e.set(0, g.yaw, 0)
      q.setFromEuler(e)
      p.set(g.x, heightAt(g.x, g.z) - 0.1, g.z)
      s.setScalar(g.scale)
      torii.setMatrixAt(i, m.compose(p, q, s))
    })
    torii.computeBoundingSphere()

    // the stone stair: one step per 0.9 m of run between the stair's foot and top
    const [ax, , az] = ROUTE[5]
    const [bx, , bz] = ROUTE[6]
    const run = Math.hypot(bx - ax, bz - az)
    const count = Math.floor(run / 0.9)
    const steps = new InstancedMesh(
      new BoxGeometry(4.6, 0.4, 0.95),
      worldMaterial(U, vert, frag, {
        uniforms: { uColor: { value: new Color(0.012, 0.011, 0.016) }, uRimColor: { value: new Color(0.012, 0.014, 0.024) } },
      }),
      count,
    )
    const yaw = Math.atan2(bx - ax, bz - az)
    for (let i = 0; i < count; i++) {
      const f = (i + 0.5) / count
      const x = ax + (bx - ax) * f
      const z = az + (bz - az) * f
      e.set(0, yaw, 0)
      q.setFromEuler(e)
      p.set(x, heightAt(x, z) - 0.1, z)
      s.set(1, 1, 1)
      steps.setMatrixAt(i, m.compose(p, q, s))
    }
    steps.computeBoundingSphere()
    return [torii, steps]
  }, [U, gates])

  return (
    <>
      {meshes.map((mesh, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </>
  )
}
