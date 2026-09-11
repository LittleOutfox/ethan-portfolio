import { setPaused, usePaused } from '../motion/motionPrefs'

interface Props {
  className?: string
}

/**
 * WCAG 2.2.2: the continuous background field can be paused by anyone, and the choice persists.
 * The label carries the state (Pause / Resume), so there is no aria-pressed to contradict it.
 */
export function PauseMotion({ className }: Props) {
  const paused = usePaused()
  return (
    <button
      type="button"
      className={className}
      data-paused={paused || undefined}
      onClick={() => setPaused(!paused)}
    >
      {paused ? 'Resume motion' : 'Pause motion'}
    </button>
  )
}
