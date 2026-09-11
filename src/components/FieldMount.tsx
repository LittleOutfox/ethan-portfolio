import { lazy, Suspense, useEffect, useState } from 'react'
import { detectTier, type TierSpec } from '../webgl/tiers'
import { applyGates, flags } from '../webgl/bus'
import { isPaused } from '../motion/motionPrefs'

// the lazy boundary sits above the Canvas: nothing eager imports three
const FoxField = lazy(() => import('../webgl/FoxField'))

/** Mounts the point field after first paint, only on devices that can afford it. */
export function FieldMount() {
  const [spec, setSpec] = useState<TierSpec | null>(null)

  useEffect(() => {
    const s = detectTier()
    if (!s) return
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    flags.reducedMotion = mq.matches
    flags.paused = isPaused()
    const onChange = () => {
      flags.reducedMotion = mq.matches
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
    <Suspense fallback={null}>
      <FoxField spec={spec} />
    </Suspense>
  )
}
