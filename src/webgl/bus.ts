/**
 * The one shared object between scroll (GSAP ScrollTrigger), pointer events, and the render loop.
 * ScrollTriggers write `target`; the render loop lerps `live` toward it and is the only writer
 * of shader uniforms. Nothing here touches React state.
 */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface FieldTarget {
  /** -0.3 .. 1.3: how much of pose A (hero) is formed */
  formA: number
  /** -0.3 .. 1.3: how much of pose B (contact) is formed */
  formB: number
  /** 0..1 moon position across the viewport */
  lightX: number
  /** global drift amplitude 0..1 */
  drift: number
  /** global field opacity 0..1 (fades through the quiet sections) */
  fade: number
}

export const target: FieldTarget = { formA: -0.3, formB: -0.3, lightX: 0.12, drift: 1, fade: 1 }
export const live: FieldTarget = { formA: -0.3, formB: -0.3, lightX: 0.12, drift: 1, fade: 1 }

/** Page-space rectangles the poses are anchored to (CSS px, page coordinates). */
export const plates = {
  a: { x: 0, y: 0, w: 1, h: 1 } as Rect,
  b: { x: 0, y: 0, w: 1, h: 1 } as Rect,
}

/** Pointer pulse: x, y in page px, start time (seconds on the shader clock), amplitude. */
export const pulse = { x: -1e6, y: -1e6, t0: -1e6, amp: 0 }

/** Trace assert: an Experience row under the pointer brightens the trace beside it. */
export const assert = { y: 0, amp: 0 }

/** Runtime flags the loop reads each frame. */
export const flags = {
  paused: false,
  reducedMotion: false,
  /** true while the page is in the quiet band between Skills and the Contact approach */
  idle: false,
  /** shader-clock time until which the formation lerps slowly (the arrival) */
  introUntil: 0,
}

/** Hooks the Canvas registers so DOM-side code can stop and start the loop. */
export const control = {
  setFrameloop: (_mode: 'always' | 'never' | 'demand') => {},
  invalidate: () => {},
}

/** Page-space y of each authored trace row, so a hovered Experience row can light the nearest one. */
export const traceRows: number[] = []

/**
 * Decide the loop mode from the flags and apply it. Idle is only a request: the render loop puts
 * itself to sleep once the field has actually faded out, so nothing freezes mid-lerp.
 */
export function applyGates() {
  if (flags.paused) {
    control.setFrameloop('never')
  } else if (flags.reducedMotion) {
    control.setFrameloop('demand')
    control.invalidate()
  } else {
    control.setFrameloop('always')
  }
}

/** Frame-rate-independent smoothing factor for a time constant of ~100 ms. */
export function smooth(dt: number): number {
  return 1 - Math.pow(0.001, dt)
}
