// Boot: runs once when js/main.js appends this module (its bus already
// exists). Decide a tier, build the world into #world behind the veil,
// compile every shader and draw one warm frame, then tell the gate it's
// ready. From then on the page's GSAP ticker calls bus.frame each tick.
import { Component, type ReactNode } from 'react'
import { advance, createRoot, extend, type RootState } from '@react-three/fiber'
import { Mesh, setConsoleFunction, type Object3D } from 'three'
import { getBus, type Bus } from './bus'
import { detectTier } from './tiers'
import { World } from './scene/World'

// only what the JSX uses — the rest of three stays out of the bundle
extend({ Mesh })

// R3F 9.7 still builds a THREE.Clock, which three r183+ reports as
// deprecated on every load. Harmless and not ours to fix: drop exactly
// that line, pass every other three message through untouched.
setConsoleFunction((level: string, message: string, ...params: unknown[]) => {
  if (message.includes('Clock: This module has been deprecated')) return
  const out = console[level as 'log' | 'warn' | 'error'] ?? console.log
  out(message, ...params)
})

/** A render error anywhere in the world falls back to the 2D atmosphere, never a broken page. */
class Boundary extends Component<{ bus: Bus; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    this.props.bus.fail(error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** Let the veil paint between the heavy steps. */
const nextTask = () => new Promise<void>((r) => setTimeout(r, 0))

/** Draw once with everything visible and nothing culled, so every buffer is on the GPU before the first scroll. */
function warmFrame(state: RootState) {
  const shown: Object3D[] = []
  const unculled: Object3D[] = []
  state.scene.traverse((o) => {
    if (!o.visible) { o.visible = true; shown.push(o) }
    if (o.frustumCulled) { o.frustumCulled = false; unculled.push(o) }
  })
  state.gl.render(state.scene, state.camera)
  shown.forEach((o) => (o.visible = false))
  unculled.forEach((o) => (o.frustumCulled = true))
}

async function boot(bus: Bus) {
  bus.report(0.2)
  const tier = detectTier()
  const host = document.getElementById('world')
  if (!tier || !host) return bus.fail(tier ? 'no #world host' : undefined)
  bus.tier = tier.tier

  const canvas = document.createElement('canvas')
  host.appendChild(canvas)
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    bus.fail('webgl context lost')
  })

  const root = createRoot(canvas)
  let created: (s: RootState) => void = () => {}
  const createdP = new Promise<RootState>((r) => (created = r))
  await root.configure({
    gl: { antialias: tier.antialias, alpha: false, stencil: false, powerPreference: tier.powerPreference },
    dpr: Math.min(window.devicePixelRatio || 1, tier.dpr),
    size: { width: host.clientWidth, height: host.clientHeight, top: 0, left: 0 },
    frameloop: 'never',
    flat: true,
    camera: { fov: 45, near: 0.1, far: 900, position: [0, 1.7, 30] },
    onCreated: (s) => {
      s.gl.setClearColor('#08070d')
      created(s)
    },
  })
  bus.report(0.4)

  const store = root.render(
    <Boundary bus={bus}>
      <World bus={bus} tier={tier} />
    </Boundary>,
  )
  const state = await createdP
  bus.report(0.6)
  await nextTask()

  await state.gl.compileAsync(state.scene, state.camera)
  bus.report(0.85)
  await nextTask()

  warmFrame(store.getState())

  // the host is 100vw × 100lvh, so this fires for real layout changes
  // (a window resize, a phone rotating), not for a collapsing URL bar
  let pending = 0
  window.addEventListener('resize', () => {
    cancelAnimationFrame(pending)
    pending = requestAnimationFrame(() => store.getState().setSize(host.clientWidth, host.clientHeight, 0, 0))
  })

  bus.frame = (time) => {
    if (bus.state === 'active') advance(time, true, store.getState())
  }
  bus.report(1)
}

const bus = getBus()
if (bus && bus.state === 'boot') {
  boot(bus).catch((e) => bus.fail(e))
}
