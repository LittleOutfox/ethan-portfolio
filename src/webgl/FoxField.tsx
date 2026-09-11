// The lazy WebGL chunk: the only module tree that imports three, @react-three/fiber and gsap.
import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { FoxPoints, type FieldBuffers } from './FoxPoints'
import { buildField, type ScatterLayout } from './buildField'
import { samplePoses } from './sampleMain'
import { applyGates, assert, control, flags, live, plates, pulse, target, traceRows } from './bus'
import type { TierSpec } from './tiers'
import { setupScroll } from './scroll'

const POSES: [string, string] = ['sitting', 'bowing']
const EPOCH = performance.now() / 1000
const COLORS = { body: '#9FD8FF', tip: '#B9A7F0', snow: '#C9D8EA', core: '#F4F7FB' }

function readCssColor(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function measurePlates() {
  const a = document.querySelector<HTMLElement>('[data-plate="a"]')
  const b = document.querySelector<HTMLElement>('[data-plate="b"]')
  const sy = window.scrollY
  if (a) {
    const r = a.getBoundingClientRect()
    plates.a = { x: r.left, y: r.top + sy, w: r.width, h: r.height }
  }
  if (b) {
    const r = b.getBoundingClientRect()
    plates.b = { x: r.left, y: r.top + sy, w: r.width, h: r.height }
  }
}

function pageTop(id: string): number {
  const el = document.getElementById(id)
  return el ? el.getBoundingClientRect().top + window.scrollY : 0
}

/** Author the dispersed state from the page's own geometry: traces beside the ledgers, snow in the margins. */
function makeLayout(spec: TierSpec): ScatterLayout {
  const W = window.innerWidth
  const H = window.innerHeight
  const aboutTop = pageTop('about')
  const projectsTop = pageTop('projects')
  const wide = W >= 960
  // released points settle as a loose haze around and just below the hero, never a viewport away
  const bandTop = plates.a.y + plates.a.h * 0.35
  const bandBottom = Math.min(projectsTop - H * 0.1, plates.a.y + plates.a.h + H * 0.9)
  void aboutTop
  const traces: ScatterLayout['traces'] = []
  if (wide && spec.tier !== 'low') {
    const rows = [0.12, 0.31, 0.47, 0.68, 0.86]
    const lens = [0.34, 0.26, 0.4, 0.22, 0.31]
    rows.forEach((f, i) => {
      const x0 = W * 0.6 + (i % 2) * W * 0.03
      traces.push({ y: bandTop + f * (bandBottom - bandTop), x0, x1: Math.min(W - 24, x0 + lens[i] * W) })
    })
  }
  return {
    width: W,
    height: H,
    fieldTop: bandTop,
    fieldHeight: Math.max(H * 0.6, bandBottom - bandTop),
    quietX: wide ? [[0, W * 0.58]] : [[0, W]],
    // when the whole width is text (phones), released points stay inside the hero figure's box
    fallbackX: wide ? [W * 0.58, W] : [plates.a.x, plates.a.x + plates.a.w],
    traces,
    snowFraction: 0.2,
    traceFraction: traces.length ? 0.3 : 0,
  }
}

function FrameGate() {
  const setFrameloop = useThree((s) => s.setFrameloop)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    control.setFrameloop = setFrameloop
    control.invalidate = invalidate
    applyGates()
    return () => {
      control.setFrameloop = () => {}
      control.invalidate = () => {}
    }
  }, [setFrameloop, invalidate])
  return null
}

export default function FoxField({ spec }: { spec: TierSpec }) {
  const [buffers, setBuffers] = useState<FieldBuffers | null>(null)
  const [generation, setGeneration] = useState(0)
  const [lost, setLost] = useState(false)
  const restores = useRef(0)
  const built = useRef(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // sample once (cached), build the field from the page geometry, rebuild on real width changes
  useEffect(() => {
    let cancelled = false
    let lastW = window.innerWidth
    const build = async () => {
      const { a, b } = await samplePoses(POSES, spec.points)
      if (cancelled) return
      await document.fonts?.ready
      measurePlates()
      const layout = makeLayout(spec)
      const field = buildField(a, b, layout)
      if (cancelled) return
      traceRows.length = 0
      for (const t of layout.traces) traceRows.push(t.y)
      if (import.meta.env.DEV) (window as unknown as { __field: unknown }).__field = { layout, field, bus: { target, live, flags, plates } }
      if (flags.reducedMotion) {
        // one still frame of the formed fox: nothing to settle
        live.formA = target.formA = 1.3
        live.fade = target.fade = 1
      } else if (!built.current) {
        // the arrival happens once per visit, not on every rebuild
        live.formA = -0.3
        flags.introUntil = performance.now() / 1000 - EPOCH + 1.8
      }
      built.current = true
      setBuffers(field)
    }
    void build()
    let t = 0
    let lastTop = pageTop('projects')
    const onResize = () => {
      measurePlates()
      const w = window.innerWidth
      const top = pageTop('projects')
      // rebuild when the layout moved, not on every viewport tick (svh keeps phones stable)
      if (Math.abs(w - lastW) / lastW > 0.12 || Math.abs(top - lastTop) > 24) {
        lastW = w
        lastTop = top
        clearTimeout(t)
        t = window.setTimeout(() => void build(), 250)
      }
    }
    const ro = new ResizeObserver(() => measurePlates())
    document.querySelectorAll<HTMLElement>('[data-plate]').forEach((el) => ro.observe(el))
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      cancelled = true
      clearTimeout(t)
      ro.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [spec])

  // scroll choreography, pointer pulse, row asserts
  useEffect(() => {
    if (!buffers) return
    const teardownScroll = setupScroll(spec)

    let lastPulse = -1
    const cells = Array.from(document.querySelectorAll<HTMLElement>('[data-plate]'))
    const over = (e: PointerEvent) =>
      cells.some((c) => {
        const r = c.getBoundingClientRect()
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      })
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !over(e)) return
      const now = performance.now() / 1000 - EPOCH
      if (now - lastPulse < 0.4) return
      lastPulse = now
      pulse.x = e.clientX
      pulse.y = e.clientY + window.scrollY
      pulse.t0 = now
      pulse.amp = 1
    }
    const onDown = (e: PointerEvent) => {
      if (!over(e)) return
      pulse.x = e.clientX
      pulse.y = e.clientY + window.scrollY
      pulse.t0 = performance.now() / 1000 - EPOCH
      pulse.amp = 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })

    const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-row]'))
    const enter = (e: Event) => {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const y = r.top + window.scrollY + r.height / 2
      // light the authored trace nearest the row
      let best = traceRows.length ? traceRows[0] : y
      for (const t of traceRows) if (Math.abs(t - y) < Math.abs(best - y)) best = t
      assert.y = best
      assert.amp = 1
    }
    const leave = () => {
      assert.amp = 0
    }
    rows.forEach((row) => {
      row.addEventListener('pointerenter', enter)
      row.addEventListener('pointerleave', leave)
      row.addEventListener('focusin', enter)
      row.addEventListener('focusout', leave)
    })
    return () => {
      teardownScroll()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      rows.forEach((row) => {
        row.removeEventListener('pointerenter', enter)
        row.removeEventListener('pointerleave', leave)
        row.removeEventListener('focusin', enter)
        row.removeEventListener('focusout', leave)
      })
    }
  }, [buffers, spec])

  const onFirstFrame = () => {
    document.querySelectorAll<HTMLElement>('[data-plate]').forEach((el) => el.setAttribute('data-live', ''))
  }

  const colors = {
    body: readCssColor('--ice', COLORS.body),
    tip: readCssColor('--violet', COLORS.tip),
    snow: COLORS.snow,
    core: readCssColor('--moon', COLORS.core),
  }

  return (
    <div ref={wrapRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        flat
        dpr={[1, spec.dprCap]}
        frameloop="always"
        performance={{ min: 0.35, max: 1, debounce: 180 }}
        gl={{ antialias: false, alpha: true, depth: false, stencil: false, powerPreference: 'high-performance' }}
        camera={{ fov: 35, near: 0.1, far: 12 }}
        onCreated={({ gl }) => {
          const el = gl.domElement
          el.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            setLost(true)
            document.querySelectorAll<HTMLElement>('[data-plate]').forEach((p) => p.removeAttribute('data-live'))
          })
          el.addEventListener('webglcontextrestored', () => {
            restores.current += 1
            if (restores.current > 2) {
              control.setFrameloop('never') // the poster stays; no loop renders an empty scene
              return
            }
            setLost(false)
            setGeneration((g) => g + 1)
          })
        }}
      >
        <FrameGate />
        {buffers && !lost ? (
          <FoxPoints key={generation} buffers={buffers} colors={colors} pointSize={spec.pointSize} epoch={EPOCH} onFirstFrame={onFirstFrame} />
        ) : null}
      </Canvas>
    </div>
  )
}
