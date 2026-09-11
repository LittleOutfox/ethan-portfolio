// Standalone spike: render the sampled fox poses with the real shader so the look can be judged
// before anything else is built. Query params: ?n=40000&a=sitting&b=bowing&size=4
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { FoxPoints, type FieldBuffers } from '../webgl/FoxPoints'
import { samplePose, type MaskImage } from '../webgl/sample'
import { buildField } from '../webgl/buildField'
import { plates, target, pulse, flags } from '../webgl/bus'

const params = new URLSearchParams(location.search)
const N = Number(params.get('n') ?? 40000)
const POSE_A = params.get('a') ?? 'sitting'
const POSE_B = params.get('b') ?? 'bowing'
const SIZE = Number(params.get('size') ?? 4)
const EPOCH = performance.now() / 1000

async function loadMask(name: string): Promise<{ img: MaskImage; side: { mask: { width: number; height: number } } }> {
  const [bitmap, side] = await Promise.all([
    fetch(`/fox/${name}.png`).then((r) => r.blob()).then((b) => createImageBitmap(b)),
    fetch(`/fox/${name}.json`).then((r) => r.json()),
  ])
  const c = document.createElement('canvas')
  c.width = bitmap.width
  c.height = bitmap.height
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bitmap, 0, 0)
  const data = ctx.getImageData(0, 0, c.width, c.height).data
  return { img: { width: c.width, height: c.height, data }, side }
}

function layoutPlates(aspectA: number, aspectB: number) {
  const W = innerWidth
  const H = innerHeight
  // hero cell: right ~46vw, base at 80% of the viewport height
  const wA = Math.min(W * 0.48, 760)
  const hA = wA / aspectA
  plates.a = { x: W - wA - W * 0.06, y: H * 0.82 - hA, w: wA, h: hA }
  // contact cell: page y = 2.2 viewports down, right side
  const wB = Math.min(W * 0.4, 640)
  const hB = wB / aspectB
  plates.b = { x: W - wB - W * 0.08, y: H * 2.2, w: wB, h: hB }
  for (const [k, r] of [['A', plates.a], ['B', plates.b]] as const) {
    let el = document.querySelector<HTMLDivElement>(`.cell${k}`)
    if (!el) {
      el = document.createElement('div')
      el.className = `cell${k}`
      document.body.append(el)
    }
    Object.assign(el.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` })
    let rule = document.querySelector<HTMLDivElement>(`.rule${k}`)
    if (!rule) {
      rule = document.createElement('div')
      rule.className = `rule rule${k}`
      document.body.append(rule)
    }
    Object.assign(rule.style, { left: `${r.x}px`, top: `${r.y + r.h}px`, width: `${r.w}px` })
  }
}

function App() {
  const [buffers, setBuffers] = useState<FieldBuffers | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [a, b] = await Promise.all([loadMask(POSE_A), loadMask(POSE_B)])
      const t0 = performance.now()
      const pa = samplePose(a.img, N, 1)
      const pb = samplePose(b.img, N, 2)
      const W = innerWidth
      const H = innerHeight
      const field = buildField(pa, pb, {
        width: W,
        height: H,
        fieldTop: H * 0.9,
        fieldHeight: H * 1.2,
        quietX: [[0, W * 0.45]],
        traces: [],
        snowFraction: 0.2,
        traceFraction: 0,
      })
      console.log(`sampled ${N} x2 + built field in ${(performance.now() - t0).toFixed(1)} ms`)
      layoutPlates(a.side.mask.width / a.side.mask.height, b.side.mask.width / b.side.mask.height)
      if (!cancelled) setBuffers(field)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    // form pose A on load
    target.formA = 1.3
    const ui = document.getElementById('ui')!
    ui.innerHTML = `
      <label>form A <input id="fa" type="range" min="-0.3" max="1.3" step="0.01" value="1.3"></label>
      <label>form B <input id="fb" type="range" min="-0.3" max="1.3" step="0.01" value="-0.3"></label>
      <label>light X <input id="lx" type="range" min="0" max="1" step="0.01" value="0.12"></label>
      <label><input id="rm" type="checkbox"> reduced motion</label>
      <span>click anywhere: pulse · n=${N} · size=${SIZE}</span>`
    ui.querySelector<HTMLInputElement>('#fa')!.oninput = (e) => (target.formA = Number((e.target as HTMLInputElement).value))
    ui.querySelector<HTMLInputElement>('#fb')!.oninput = (e) => (target.formB = Number((e.target as HTMLInputElement).value))
    ui.querySelector<HTMLInputElement>('#lx')!.oninput = (e) => (target.lightX = Number((e.target as HTMLInputElement).value))
    ui.querySelector<HTMLInputElement>('#rm')!.onchange = (e) => (flags.reducedMotion = (e.target as HTMLInputElement).checked)
    const onClick = (e: PointerEvent) => {
      pulse.x = e.clientX
      pulse.y = e.clientY + scrollY
      pulse.t0 = performance.now() / 1000 - EPOCH
      pulse.amp = 1
    }
    window.addEventListener('pointerdown', onClick)
    return () => window.removeEventListener('pointerdown', onClick)
  }, [])

  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop="always"
      gl={{ antialias: false, alpha: true, depth: false, stencil: false, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
    >
      {buffers ? (
        <FoxPoints
          buffers={buffers}
          colors={{ body: '#9FD8FF', tip: '#B9A7F0', snow: '#C9D8EA', core: '#F4F7FB' }}
          pointSize={SIZE}
          epoch={EPOCH}
        />
      ) : null}
    </Canvas>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
