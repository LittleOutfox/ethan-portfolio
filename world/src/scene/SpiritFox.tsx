import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, CustomBlending, Mesh, OneFactor, OneMinusSrcAlphaFactor, Vector3, Vector4 } from 'three'
import vert from '../shaders/spiritfox.vert.glsl?raw'
import frag from '../shaders/spiritfox.frag.glsl?raw'
import type { Bus } from '../bus'
import { FOX_BONES, FOX_BOX, foxPose, makeFoxPath, makeGait, pawSpot, pawsDown, stepGait, stepHeading, type FoxSpot, type Heading } from '../fox'
import { worldTime } from '../path'
import type { Uniforms } from '../uniforms'
import { worldMaterial } from './materials'

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * The spirit fox that travels with you: its spot on its path keeps a few
 * metres ahead of the camera (fox.ts), and it keeps to that spot as you
 * scroll, its gait driven by the ground it covers (a walk, a trot, a gallop,
 * its paws planted on the snow as they bear it); when you stop, it looks back
 * at you, steps round to face you and sits. One draw: the box it stands in,
 * marched through by its shader.
 */
export function SpiritFox({ bus, U }: { bus: Bus; U: Uniforms }) {
  const s = useMemo(() => {
    const uniforms = {
      uFoxBones: { value: Array.from({ length: FOX_BONES * 2 }, () => new Vector4()) },
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
      path: makeFoxPath(),
      gait: makeGait(),
      spot: { x: 0, y: 0, z: 0, heading: 0 } as FoxSpot,
      prev: { x: 0, z: 0, t: -1 },
      /** which way it faces, and how fast it is turning */
      turn: { heading: 0, vel: 0 } as Heading,
      fade: 1,
      down: [] as number[],
      nextPaw: 0,
    }
  }, [U])

  useFrame((state, delta) => {
    // real time, not the smoothed frame step: after a hitch it catches up rather than falling behind
    const dt = Math.min(delta, 0.25)
    const t = worldTime(bus.p)
    const { spot, prev, gait } = s
    // it keeps its place beside you: its spot, wherever the scroll has brought you
    s.path(t, spot)
    if (prev.t < 0) s.turn.heading = spot.heading
    // how far it ran this frame, signed by the story's direction; a long jump
    // across the story it doesn't run: it thins away and forms again where you land
    let ds = prev.t < 0 ? 0 : Math.hypot(spot.x - prev.x, spot.z - prev.z) * Math.sign(t - prev.t)
    if (Math.abs(ds) > 25) {
      ds = 0
      s.fade = 0
    }
    prev.x = spot.x
    prev.z = spot.z
    prev.t = t
    // it faces the way it runs (turning round when you scroll back); a moment
    // after it stops, it turns to face you, easing into the turn and out of
    // it, and its legs step round as it turns
    const cam = state.camera.position
    let facing = s.turn.heading
    let rate = 6
    if (gait.still < 0.3) {
      facing = spot.heading + (gait.dir < 0 ? Math.PI : 0)
      rate = 7
    } else if (gait.still > 0.6) {
      facing = Math.atan2(-(cam.z - spot.z), cam.x - spot.x)
      rate = 3
    }
    const turned = stepHeading(s.turn, facing, rate, dt)
    const strideBefore = gait.stride
    stepGait(gait, ds, dt, turned)

    // and its head leads: it looks back at you first
    const dx = cam.x - spot.x
    const dz = cam.z - spot.z
    const c = Math.cos(s.turn.heading)
    const sn = Math.sin(s.turn.heading)
    const lx = dx * c - dz * sn
    const lz = dx * sn + dz * c
    const toward = Math.max(-2, Math.min(2, Math.atan2(-lz, lx)))
    foxPose(gait, state.clock.elapsedTime, toward * gait.look, s.bones)
    const bones = s.uniforms.uFoxBones.value
    for (let i = 0; i < FOX_BONES * 2; i++) bones[i].fromArray(s.bones, i * 4)

    // a touch dimmer while it waits for you; on a phone, where the page's text
    // fills the screen, it waits as a faint ghost; on a long jump across the
    // story it thins to a wisp
    const tall = smooth(1.0, 0.72, state.size.width / state.size.height)
    const fadeTo = (1 - (1 - gait.run) * (0.15 + 0.5 * tall)) * (1 - 0.75 * smooth(60, 150, gait.speed))
    s.fade += (fadeTo - s.fade) * (1 - Math.exp(-dt * 6))
    s.uniforms.uFoxFade.value = s.fade

    s.mesh.position.set(spot.x, spot.y, spot.z)
    s.mesh.rotation.y = s.turn.heading

    // where a paw comes down it leaves a print of light in the snow
    s.down.length = 0
    pawsDown(strideBefore, gait.stride, gait, s.down)
    for (const k of s.down) {
      const [px, pz] = pawSpot(k, gait)
      const ch = Math.cos(s.turn.heading)
      const sh = Math.sin(s.turn.heading)
      const paw = U.uPaws.value[s.nextPaw]
      paw.set(spot.x + px * ch + pz * sh, spot.z - px * sh + pz * ch, state.clock.elapsedTime, s.fade * gait.run)
      s.nextPaw = (s.nextPaw + 1) % U.uPaws.value.length
    }
  })

  return <primitive object={s.mesh} />
}
