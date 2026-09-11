import { useSyncExternalStore } from 'react'
import { flags } from '../webgl/bus'

const KEY = 'motion'
type Listener = () => void
const listeners = new Set<Listener>()
let paused = false
let hydrated = false

function emit() {
  for (const l of listeners) l()
}

/** Read the stored preference once, after hydration, so server and client markup agree. */
export function hydrateMotionPrefs() {
  if (hydrated) return
  hydrated = true
  try {
    paused = localStorage.getItem(KEY) === 'paused'
  } catch {
    paused = false
  }
  flags.paused = paused
  emit()
}

export function setPaused(next: boolean) {
  paused = next
  flags.paused = next
  try {
    localStorage.setItem(KEY, next ? 'paused' : 'on')
  } catch {
    /* storage may be unavailable; the in-memory flag still applies */
  }
  emit()
}

export function isPaused() {
  return paused
}

export function usePaused(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => paused,
    () => false,
  )
}
