import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, CustomBlending, Mesh, OneFactor, OneMinusSrcAlphaFactor, Vector3, Vector4 } from 'three'
import vert from '../shaders/spiritfox.vert.glsl?raw'
import frag from '../shaders/spiritfox.frag.glsl?raw'
import type { Bus } from '../bus'
import { FOX_BONES, FOX_BOX, foxPose, makeFoxPath, makeGait, pawSpot, pawsDown, stepGait, type FoxSpot } from '../fox'
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
 * The spirit fox that runs with you: it keeps to its path a few metres ahead
 * of the camera (fox.ts), its legs driven by how far the scroll has carried
 * it; when you stop it looks back at you, then sits and waits. One draw: the
 * box it stands in, marched through by its shader.
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
      prev: { x: 0, z: 0, t: -1 },
      heading: 0,
      fade: 1,
      down: [] as number[],
      nextPaw: 0,
    }
  }, [U])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = worldTime(bus.p)
    const { spot, prev, gait } = s
    s.path(t, spot)
    if (prev.t < 0) s.heading = spot.heading
    // how far the scroll carried it along its path this frame, signed by the story's direction
    const ds = prev.t < 0 ? 0 : Math.hypot(spot.x - prev.x, spot.z - prev.z) * Math.sign(t - prev.t)
    prev.x = spot.x
    prev.z = spot.z
    prev.t = t
    const strideBefore = gait.stride
    stepGait(gait, ds, dt)

    // it faces the way it runs (turning round when you scroll back); once it
    // has stopped, it turns to face you, and sits
    const cam = state.camera.position
    if (gait.still === 0) {
      const target = spot.heading + (gait.dir < 0 ? Math.PI : 0)
      s.heading += wrap(target - s.heading) * (1 - Math.exp(-dt * 9))
    } else if (gait.still > 0.9) {
      const target = Math.atan2(-(cam.z - spot.z), cam.x - spot.x)
      s.heading += wrap(target - s.heading) * (1 - Math.exp(-dt * 2.5))
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
    const target = (1 - (1 - gait.run) * (0.15 + 0.5 * tall)) * (1 - 0.75 * smooth(16, 40, gait.speed))
    s.fade += (target - s.fade) * (1 - Math.exp(-dt * 6))
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
