import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector2, Vector3, type PerspectiveCamera } from 'three'
import type { Bus } from '../bus'
import { KEYS } from '../keys'
import { fitFov, makeCameraPath, worldTime, type Pose } from '../path'
import { gradeAt, makeGrade } from '../grade'
import type { Uniforms } from '../uniforms'

/**
 * The single per-frame writer: reads the page's bus, places the camera on the
 * journey and sets the shared light. No React state, no allocations.
 */
export function Director({ bus, U }: { bus: Bus; U: Uniforms }) {
  const sample = useMemo(() => makeCameraPath(KEYS), [])
  const scratch = useMemo(
    () => ({ pose: { pos: [0, 0, 0], look: [0, 0, 0], fov: 45 } as Pose, look: new Vector3(), buf: new Vector2(), grade: makeGrade() }),
    [],
  )

  useFrame((state) => {
    const { pose, look, buf, grade } = scratch
    const t = worldTime(bus.p)
    sample(t, pose)

    // before the entrance settles the camera sits a little back and up
    const k = 1 - bus.intro
    const cam = state.camera as PerspectiveCamera
    cam.position.set(pose.pos[0], pose.pos[1] + k * 1.2, pose.pos[2] + k * 7)
    look.set(pose.look[0], pose.look[1], pose.look[2])
    cam.lookAt(look)
    const fov = fitFov(pose.fov, state.size.width / state.size.height)
    if (Math.abs(cam.fov - fov) > 1e-4) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }

    gradeAt(t, grade)
    U.uFogColor.value.copy(grade.fog)
    U.uFogDensity.value = grade.density
    U.uMoon.value = grade.moon
    U.uCanopy.value = grade.canopy
    U.uSnow.value = grade.snow
    U.uWarm.value = bus.warm
    U.uTime.value = state.clock.elapsedTime
    state.gl.getDrawingBufferSize(buf)
    U.uResolution.value.copy(buf)
  })
  return null
}
