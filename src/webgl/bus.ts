/**
 * The one shared object between scroll (GSAP ScrollTrigger), pointer events, and the render loop.
 * ScrollTriggers tween `target`; the render loop lerps `live` toward it and is the only writer
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
}

export const target: FieldTarget = { formA: -0.3, formB: -0.3, lightX: 0.12, drift: 1 }
export const live: FieldTarget = { formA: -0.3, formB: -0.3, lightX: 0.12, drift: 1 }

/** Page-space rectangles the poses are anchored to (CSS px, page coordinates). */
export const plates = {
  a: { x: 0, y: 0, w: 1, h: 1 } as Rect,
  b: { x: 0, y: 0, w: 1, h: 1 } as Rect,
}

/** Pointer pulse: x, y in page px, start time (seconds on the shader clock), amplitude. */
export const pulse = { x: -1e6, y: -1e6, t0: -1e6, amp: 0 }

/** Runtime flags the loop reads each frame. */
export const flags = {
  paused: false,
  reducedMotion: false,
  /** true while the page is between the hero release and the contact gather (loop may idle) */
  idle: false,
}

/** Frame-rate-independent smoothing factor for a time constant of ~100 ms. */
export function smooth(dt: number): number {
  return 1 - Math.pow(0.001, dt)
}
