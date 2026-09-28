import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector2, Vector3, type PerspectiveCamera } from 'three'
import type { Bus } from '../bus'
import { KEYS, KEYS_PORTRAIT } from '../keys'
import { fitFov, makeCameraPath, worldTime, type Pose } from '../path'
import { gradeAt, makeGrade } from '../grade'
import type { Uniforms } from '../uniforms'

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const RAD = Math.PI / 180

/**
 * The single per-frame writer: reads the page's bus, places the camera on the
 * journey and sets the shared light. No React state, no allocations.
 */
export function Director({ bus, U }: { bus: Bus; U: Uniforms }) {
  const path = useMemo(() => makeCameraPath(KEYS), [])
  const portrait = useMemo(() => makeCameraPath(KEYS_PORTRAIT), [])
  const s = useMemo(
    () => ({
      pose: { pos: [0, 0, 0], look: [0, 0, 0], fov: 45 } as Pose,
      alt: { pos: [0, 0, 0], look: [0, 0, 0], fov: 45 } as Pose,
      look: new Vector3(),
      fwd: new Vector3(),
      right: new Vector3(),
      up: new Vector3(),
      buf: new Vector2(),
      grade: makeGrade(),
      pointer: { x: 0, y: 0, at: -10, mouse: false },
      lean: { x: 0, y: 0 },
    }),
    [],
  )

  // the pointer stirs the air (mouse and touch); the mouse also turns the view a hair
  useEffect(() => {
    const p = s.pointer
    const onMove = (e: PointerEvent) => {
      p.x = (e.clientX / window.innerWidth) * 2 - 1
      p.y = 1 - (e.clientY / window.innerHeight) * 2
      p.at = performance.now() / 1000
      p.mouse = e.pointerType === 'mouse'
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [s])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = worldTime(bus.p)
    const aspect = state.size.width / state.size.height
    path(t, s.pose)

    // portrait phones frame a few moments differently (keys.ts)
    const tall = smoothstep(1.0, 0.72, aspect)
    if (tall > 0) {
      portrait(t, s.alt)
      for (let a = 0; a < 3; a++) s.pose.look[a] += (s.alt.look[a] - s.pose.look[a]) * tall
    }

    // before the entrance settles the camera sits a little back and up
    const k = 1 - bus.intro
    const cam = state.camera as PerspectiveCamera
    cam.position.set(s.pose.pos[0], s.pose.pos[1] + k * 1.2, s.pose.pos[2] + k * 7)
    s.look.set(s.pose.look[0], s.pose.look[1], s.pose.look[2])

    // the mouse leans the view by half a degree at most (touch never does)
    const p = s.pointer
    const ease = 1 - Math.exp(-dt * 4)
    s.lean.x += ((p.mouse ? p.x : 0) - s.lean.x) * ease
    s.lean.y += ((p.mouse ? p.y : 0) - s.lean.y) * ease
    s.fwd.subVectors(s.look, cam.position)
    const dist = s.fwd.length()
    s.fwd.divideScalar(dist)
    s.right.crossVectors(s.fwd, cam.up).normalize()
    s.up.crossVectors(s.right, s.fwd)
    const reach = dist * Math.tan(0.5 * RAD)
    s.look.addScaledVector(s.right, s.lean.x * reach).addScaledVector(s.up, s.lean.y * reach * 0.6)
    cam.lookAt(s.look)

    // scroll speed breathes into the lens: a slight widening and lean, sub-perceptual on purpose
    const v = Math.max(-1, Math.min(1, bus.vel))
    cam.rotateZ(v * 0.3 * RAD)
    const fov = fitFov(s.pose.fov, aspect) + Math.abs(v) * 1.5
    if (Math.abs(cam.fov - fov) > 1e-4) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }

    gradeAt(t, s.grade)
    // the tail bands ease toward the count the page has earned; the moon brightens with them
    U.uTails.value += (bus.tails - U.uTails.value) * (1 - Math.exp(-dt * 3))
    U.uFogColor.value.copy(s.grade.fog)
    U.uFogDensity.value = s.grade.density
    U.uMoon.value = s.grade.moon * (0.55 + 0.09 * U.uTails.value)
    U.uCanopy.value = s.grade.canopy
    U.uSnow.value = s.grade.snow
    U.uHaze.value = s.grade.haze
    U.uWarm.value = bus.warm
    U.uTime.value = state.clock.elapsedTime
    // the foxfire wakes as the story begins
    U.uWake.value = 0.25 + 0.75 * smoothstep(0.3, 1.8, t)
    const since = performance.now() / 1000 - p.at
    U.uPointer.value.set(p.x, p.y, Math.exp(-since * 2.5))
    state.gl.getDrawingBufferSize(s.buf)
    U.uResolution.value.copy(s.buf)
    U.uScale.value = s.buf.y / (2 * Math.tan((cam.fov * RAD) / 2))
  })
  return null
}
