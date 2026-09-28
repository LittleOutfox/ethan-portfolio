import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, CustomBlending, Mesh, OneFactor, OneMinusSrcAlphaFactor, Vector3, Vector4 } from 'three'
import vert from '../shaders/spiritfox.vert.glsl?raw'
import frag from '../shaders/spiritfox.frag.glsl?raw'
import type { Bus } from '../bus'
import { FOX_BONES, FOX_BOX, foxPose, makeDash, makeFoxPath, makeGait, pawSpot, pawsDown, stepDash, stepGait, type FoxSpot } from '../fox'
import { worldTime } from '../path'
import type { Uniforms } from '../uniforms'
import { worldMaterial } from './materials'

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
/** the shortest turn from one angle to another */
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/**
 * The spirit fox that runs with you: its spot on its path keeps a few metres
 * ahead of the camera (fox.ts), and it follows that spot in dashes, a
 * bounding gallop whose stride is driven by the ground it covers; when you
 * stop, it looks back at you, turns to face you and sits. One draw: the box
 * it stands in, marched through by its shader.
 */
export function SpiritFox({ bus, U }: { bus: Bus; U: Uniforms }) {
  const s = useMemo(() => {
    const uniforms = {
      uFoxBones: { value: Array.from({ length: FOX_BONES * 2 }, () => new Vector4()) },
      uFoxEyes: { value: [new Vector4(), new Vector4()] },
      uFoxFade: { value: 1 },
      uFoxBoxMin: { value: new Vector3(...FOX_BOX.min) },
      uFoxBoxMax: { value: new Vector3(...FOX_BOX.max) },
    }
    const material = worldMaterial(U, vert, frag, {
      uniforms,
      defines: { FOX_BONES },
      transparent: true,
      depthWrite: false,
      blending: CustomBlending,
      blendSrc: OneFactor,
      blendDst: OneMinusSrcAlphaFactor,
    })
    const [x0, y0, z0] = FOX_BOX.min
    const [x1, y1, z1] = FOX_BOX.max
    const box = new BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    const mesh = new Mesh(box, material)
    mesh.renderOrder = 17
    return {
      mesh,
      uniforms,
      bones: new Float32Array(FOX_BONES * 8),
      eyes: new Float32Array(8),
      path: makeFoxPath(),
      gait: makeGait(),
      spot: { x: 0, y: 0, z: 0, heading: 0 } as FoxSpot,
      target: { x: 0, y: 0, z: 0, heading: 0 } as FoxSpot,
      dash: makeDash(),
      /** its own place along its path, in world time: it chases the camera's */
      u: -1,
      targetPrev: { x: 0, z: 0 },
      targetSpeed: 0,
      prev: { x: 0, z: 0, t: -1 },
      heading: 0,
      fade: 1,
      down: [] as number[],
      nextPaw: 0,
    }
  }, [U])

  useFrame((state, delta) => {
    // real time, not the smoothed frame step: after a hitch it catches up rather than falling behind
    const dt = Math.min(delta, 0.25)
    const t = worldTime(bus.p)
    const { spot, target, prev, gait } = s
    // its spot, and how fast the scroll is carrying that along
    s.path(t, target)
    if (s.u < 0) {
      s.u = t
      s.targetPrev.x = target.x
      s.targetPrev.z = target.z
    }
    const moved = Math.hypot(target.x - s.targetPrev.x, target.z - s.targetPrev.z) / Math.max(dt, 1e-3)
    s.targetSpeed += (moved - s.targetSpeed) * (1 - Math.exp(-dt * 8))
    s.targetPrev.x = target.x
    s.targetPrev.z = target.z
    // it dashes after its spot along its path; a long jump across the story
    // it doesn't run: it thins away and forms again where you land
    s.path(s.u, spot)
    const gap = Math.hypot(target.x - spot.x, target.z - spot.z)
    if (gap > 25) {
      s.u = t
      s.fade = 0
    } else if (gap > 1e-4) {
      const step = stepDash(s.dash, gap, s.targetSpeed, dt)
      s.u += (t - s.u) * Math.min(1, step / gap)
    }
    s.path(s.u, spot)
    if (prev.t < 0) s.heading = spot.heading
    // how far it ran this frame, signed by the story's direction
    const ds = prev.t < 0 ? 0 : Math.hypot(spot.x - prev.x, spot.z - prev.z) * Math.sign(s.u - prev.t)
    prev.x = spot.x
    prev.z = spot.z
    prev.t = s.u
    const strideBefore = gait.stride
    stepGait(gait, ds, dt)

    // it faces the way it runs (turning round when you scroll back); once it
    // has stopped, it turns to face you, and sits
    const cam = state.camera.position
    if (gait.still === 0) {
      const way = spot.heading + (gait.dir < 0 ? Math.PI : 0)
      s.heading += wrap(way - s.heading) * (1 - Math.exp(-dt * 9))
    } else if (gait.still > 0.9) {
      const toYou = Math.atan2(-(cam.z - spot.z), cam.x - spot.x)
      s.heading += wrap(toYou - s.heading) * (1 - Math.exp(-dt * 2.5))
    }
    // and its head leads: it looks back at you first
    const dx = cam.x - spot.x
    const dz = cam.z - spot.z
    const c = Math.cos(s.heading)
    const sn = Math.sin(s.heading)
    const lx = dx * c - dz * sn
    const lz = dx * sn + dz * c
    const toward = Math.max(-2, Math.min(2, Math.atan2(-lz, lx)))
    foxPose(gait, state.clock.elapsedTime, toward * gait.look, s.bones, s.eyes)
    const bones = s.uniforms.uFoxBones.value
    for (let i = 0; i < FOX_BONES * 2; i++) bones[i].fromArray(s.bones, i * 4)
    s.uniforms.uFoxEyes.value[0].fromArray(s.eyes, 0)
    s.uniforms.uFoxEyes.value[1].fromArray(s.eyes, 4)

    // a touch dimmer while it waits for you; on a phone, where the page's text
    // fills the screen, it waits as a faint ghost; on a long jump across the
    // story it thins to a wisp
    const tall = smooth(1.0, 0.72, state.size.width / state.size.height)
    const fadeTo = (1 - (1 - gait.run) * (0.15 + 0.5 * tall)) * (1 - 0.75 * smooth(60, 150, gait.speed))
    s.fade += (fadeTo - s.fade) * (1 - Math.exp(-dt * 6))
    s.uniforms.uFoxFade.value = s.fade

    s.mesh.position.set(spot.x, spot.y, spot.z)
    s.mesh.rotation.y = s.heading

    // where a paw comes down it leaves a print of light in the snow
    s.down.length = 0
    pawsDown(strideBefore, gait.stride, gait.gallop, s.down)
    for (const k of s.down) {
      const [px, pz] = pawSpot(k, gait.gallop)
      const ch = Math.cos(s.heading)
      const sh = Math.sin(s.heading)
      const paw = U.uPaws.value[s.nextPaw]
      paw.set(spot.x + px * ch + pz * sh, spot.z - px * sh + pz * ch, state.clock.elapsedTime, s.fade * gait.run)
      s.nextPaw = (s.nextPaw + 1) % U.uPaws.value.length
    }
  })

  return <primitive object={s.mesh} />
}
