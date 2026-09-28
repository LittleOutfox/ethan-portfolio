// The one object shared with the page (js/main.js §3 creates it). The page
// owns the scroll and writes; the world reads, and fills in `frame`.
import type { Segment } from './path'

export interface Bus {
  /** one 0..1 progress per story segment */
  p: Record<Segment, number>
  /** works progress at which each DOM gate passes through */
  gates: number[]
  /** tails earned, 0..5 */
  tails: number
  /** damped scroll velocity, -1..1 */
  vel: number
  /** the den's warmth, 0..1 */
  warm: number
  /** 0 → 1 as the hero enters */
  intro: number
  state: 'off' | 'boot' | 'ready' | 'active' | 'failed'
  report(progress: number): void
  fail(why?: unknown): void
  frame: ((time: number) => void) | null
  /** set by the world at boot: the tier it chose (for checks and debugging) */
  tier?: string
}

export function getBus(): Bus | undefined {
  return (window as unknown as { __world?: Bus }).__world
}
