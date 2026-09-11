import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial, Sphere, Vector2, Vector3, Vector4 } from 'three'
import vert from './shaders/fox.vert.glsl?raw'
import frag from './shaders/fox.frag.glsl?raw'
import { assert, control, flags, isStill, live, plates, pulse, smooth, target } from './bus'

export interface FieldBuffers {
  count: number
  /** scatter pose: x, y CSS px, z pseudo depth */
  position: Float32Array
  /** pose A xy in mask space, uint16 normalized */
  foxA: Uint16Array
  foxB: Uint16Array
  /** phase, size, drift, class: uint8 normalized */
  seed: Uint8Array
  /** geodesic A, B: uint8 normalized */
  geo: Uint8Array
}

export interface FieldColors {
  body: string
  tip: string
  snow: string
  core: string
}

interface Props {
  buffers: FieldBuffers
  colors: FieldColors
  pointSize: number
  /** shader clock offset so uTime stays small */
  epoch: number
  /** called once the first frame with these buffers has been drawn */
  onFirstFrame?: () => void
}

const TIME_WRAP = 600
const liveAssert = { y: 0, amp: 0 }

/** One THREE.Points, one geometry, one material, one draw call. */
export function FoxPoints({ buffers, colors, pointSize, epoch, onFirstFrame }: Props) {
  const gl = useThree((s) => s.gl)
  const materialRef = useRef<ShaderMaterial>(null)
  const frames = useRef(0)

  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(buffers.position, 3))
    g.setAttribute('aFoxA', new BufferAttribute(buffers.foxA, 2, true))
    g.setAttribute('aFoxB', new BufferAttribute(buffers.foxB, 2, true))
    g.setAttribute('aSeed', new BufferAttribute(buffers.seed, 4, true))
    g.setAttribute('aGeo', new BufferAttribute(buffers.geo, 2, true))
    // positions are computed in the shader; never let three cull on the scatter pose alone
    g.boundingSphere = new Sphere(new Vector3(0, 0, 0), 1e9)
    return g
  }, [buffers])

  const uniforms = useMemo(() => {
    const ctx = gl.getContext()
    const range = ctx.getParameter(ctx.ALIASED_POINT_SIZE_RANGE) as Float32Array | null
    const maxSize = range ? range[1] : 64
    return {
      uViewport: { value: new Vector2(1, 1) },
      uScrollY: { value: 0 },
      uPlateA: { value: new Vector4(0, 0, 1, 1) },
      uPlateB: { value: new Vector4(0, 0, 1, 1) },
      uFormA: { value: live.formA },
      uFormB: { value: live.formB },
      uTime: { value: 0 },
      uDpr: { value: 1 },
      uPointSize: { value: pointSize },
      uMaxPointSize: { value: Math.min(maxSize, 96) },
      uLightX: { value: live.lightX },
      uPulse: { value: new Vector4(-1e6, -1e6, -1e6, 0) },
      uColorBody: { value: new Color(colors.body) },
      uColorTip: { value: new Color(colors.tip) },
      uColorSnow: { value: new Color(colors.snow) },
      uColorCore: { value: new Color(colors.core) },
      uIdlePulse: { value: 1 },
      uDrift: { value: 1 },
      uFade: { value: 1 },
      uAssert: { value: new Vector2(0, 0) },
    }
    // colours and point size are fixed for the life of the material
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl])

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => {
    frames.current = 0
  }, [buffers])

  useFrame((state, delta) => {
    const m = materialRef.current
    if (!m) return
    const u = m.uniforms
    const dt = Math.min(delta, 0.1)
    const now = performance.now() / 1000 - epoch
    const still = isStill()
    if (still) {
      // no clock: snap to the scroll-written target so each redraw is exactly one still frame
      live.formA = target.formA
      live.formB = target.formB
      live.lightX = target.lightX
      live.fade = target.fade
      live.drift = 0
    } else {
      // the arrival: a slower settle while the fox first resolves
      const k = now < flags.introUntil ? smooth(dt * 0.28) : smooth(dt)
      live.formA += (target.formA - live.formA) * k
      live.formB += (target.formB - live.formB) * k
      live.lightX += (target.lightX - live.lightX) * k
      live.drift += (target.drift - live.drift) * k
      live.fade += (target.fade - live.fade) * k
    }
    liveAssert.y = assert.y
    liveAssert.amp += (assert.amp - liveAssert.amp) * smooth(dt * 1.5)

    const w = state.size.width
    const h = state.size.height
    ;(u.uViewport.value as Vector2).set(w, h)
    u.uScrollY.value = window.scrollY
    ;(u.uPlateA.value as Vector4).set(plates.a.x, plates.a.y, plates.a.w, plates.a.h)
    ;(u.uPlateB.value as Vector4).set(plates.b.x, plates.b.y, plates.b.w, plates.b.h)
    u.uFormA.value = live.formA
    u.uFormB.value = live.formB
    u.uLightX.value = live.lightX
    u.uDrift.value = still ? 0 : live.drift
    u.uIdlePulse.value = still ? 0 : 1
    u.uFade.value = live.fade
    // the quiet band: sleep only once the field has actually faded out
    if (flags.idle && !still && target.fade < 0.001 && live.fade < 0.004) {
      live.fade = 0
      u.uFade.value = 0
      control.setFrameloop('never')
    }
    // a still field keeps its last clock so snow and trace packets do not re-place per scroll
    if (!still) u.uTime.value = now % TIME_WRAP
    u.uDpr.value = gl.getPixelRatio()
    ;(u.uPulse.value as Vector4).set(pulse.x, pulse.y, pulse.t0, still ? 0 : pulse.amp)
    ;(u.uAssert.value as Vector2).set(liveAssert.y, liveAssert.amp)

    frames.current += 1
    if (frames.current === (still ? 1 : 2) && onFirstFrame) onFirstFrame()
  })

  return (
    <points geometry={geometry} frustumCulled={false} matrixAutoUpdate={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        premultipliedAlpha
        depthTest={false}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}
