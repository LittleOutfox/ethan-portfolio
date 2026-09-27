import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector2, Vector3, type PerspectiveCamera } from 'three'
import type { Bus } from '../bus'
import { KEYS } from '../keys'
import { fitFov, makeCameraPath, worldTime, type Pose } from '../path'
import { gradeAt, makeGrade } from '../grade'
import type { Uniforms } from '../uniforms'

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * The single per-frame writer: reads the page's bus, places the camera on the
 * journey and sets the shared light. No React state, no allocations.
 */
export function Director({ bus, U }: { bus: Bus; U: Uniforms }) {
  const sample = useMemo(() => makeCameraPath(KEYS), [])
  const scratch = useMemo(
    () => ({
      pose: { pos: [0, 0, 0], look: [0, 0, 0], fov: 45 } as Pose,
      look: new Vector3(),
      buf: new Vector2(),
      grade: makeGrade(),
      pointer: { x: 0, y: 0, at: -10 },
    }),
    [],
  )

  // the pointer stirs the air (mouse and touch alike)
  useEffect(() => {
    const p = scratch.pointer
    const onMove = (e: PointerEvent) => {
      p.x = (e.clientX / window.innerWidth) * 2 - 1
      p.y = 1 - (e.clientY / window.innerHeight) * 2
      p.at = performance.now() / 1000
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [scratch])

  useFrame((state, delta) => {
    const { pose, look, buf, grade, pointer } = scratch
    const dt = Math.min(delta, 0.05)
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
    U.uHaze.value = grade.haze
    U.uWarm.value = bus.warm
    U.uTime.value = state.clock.elapsedTime
    // the tail bands ease toward the count the page has earned
    U.uTails.value += (bus.tails - U.uTails.value) * (1 - Math.exp(-dt * 3))
    // the foxfire wakes as the story begins
    U.uWake.value = 0.25 + 0.75 * smoothstep(0.3, 1.8, t)
    const since = performance.now() / 1000 - pointer.at
    U.uPointer.value.set(pointer.x, pointer.y, Math.exp(-since * 2.5))
    state.gl.getDrawingBufferSize(buf)
    U.uResolution.value.copy(buf)
    U.uScale.value = buf.y / (2 * Math.tan((cam.fov * Math.PI) / 360))
  })
  return null
}
