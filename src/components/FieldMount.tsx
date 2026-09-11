import { Component, lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { detectTier, type TierSpec } from '../webgl/tiers'
import { applyGates, flags } from '../webgl/bus'
import { isPaused } from '../motion/motionPrefs'

// the lazy boundary sits above the Canvas: nothing eager imports three. A chunk that fails to
// load (offline after first paint, a blocked CDN, a stale hash after a redeploy) renders nothing.
type FieldComponent = ComponentType<{ spec: TierSpec }>
const FoxField = lazy<FieldComponent>(() =>
  import('../webgl/FoxField')
    .then((m) => ({ default: m.default as FieldComponent }))
    .catch(() => ({ default: (() => null) as FieldComponent })),
)

/** A Canvas that throws (no WebGL renderer, driver refusal) must not take the page down with it. */
class FieldBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** Mounts the point field after first paint, only on devices that can afford it. */
export function FieldMount() {
  const [spec, setSpec] = useState<TierSpec | null>(null)

  useEffect(() => {
    const s = detectTier()
    if (!s) return
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    // ?motion=reduce forces the reduced-motion path for testing
    const forced = new URLSearchParams(location.search).get('motion') === 'reduce'
    flags.reducedMotion = mq.matches || forced
    flags.paused = isPaused()
    const onChange = () => {
      flags.reducedMotion = mq.matches || forced
      applyGates()
    }
    mq.addEventListener('change', onChange)

    const hasIdle = typeof window.requestIdleCallback === 'function'
    let idle = 0
    const raf = requestAnimationFrame(() => {
      idle = hasIdle
        ? window.requestIdleCallback(() => setSpec(s), { timeout: 1500 })
        : window.setTimeout(() => setSpec(s), 300)
    })
    return () => {
      cancelAnimationFrame(raf)
      if (hasIdle) window.cancelIdleCallback(idle)
      else clearTimeout(idle)
      mq.removeEventListener('change', onChange)
    }
  }, [])

  if (!spec) return null
  return (
    <FieldBoundary>
      <Suspense fallback={null}>
        <FoxField spec={spec} />
      </Suspense>
    </FieldBoundary>
  )
}
