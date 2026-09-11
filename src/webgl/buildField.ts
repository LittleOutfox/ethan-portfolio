import type { SampledPose } from './sample'
import type { FieldBuffers } from './FoxPoints'
import { mulberry32 } from './sample'

export interface ScatterLayout {
  /** viewport size in CSS px */
  width: number
  height: number
  /** page-space band (top, height) where released points may drift; traces live here */
  fieldTop: number
  fieldHeight: number
  /** columns (x ranges in CSS px) kept free of drifting points, e.g. text columns */
  quietX: Array<[number, number]>
  /** where a point goes when no free x is found in a few tries */
  fallbackX: [number, number]
  /** horizontal trace rows: page y and x extent, derived from the tail groups */
  traces: Array<{ y: number; x0: number; x1: number }>
  /** fraction of points that become viewport-anchored snow */
  snowFraction: number
  /** fraction of points that ride the traces */
  traceFraction: number
}

const CLASS_SNOW = 0
const CLASS_TRACE = 128
const CLASS_VOLUME = 255

/** an x outside every quiet column, or inside the fallback range when the page is all text */
function freeX(rng: () => number, width: number, quiet: Array<[number, number]>, fallback: [number, number]): number {
  for (let t = 0; t < 12; t++) {
    const x = rng() * width
    if (!quiet.some(([a, b]) => x > a && x < b)) return x
  }
  return fallback[0] + rng() * (fallback[1] - fallback[0])
}

/**
 * Packs two Hilbert-ordered poses of equal count plus an authored scatter pose into the
 * attribute buffers the shader expects. The scatter is deterministic (seeded) so it is stable
 * across resizes; the trace population is only allocated when traces are given.
 */
export function buildField(a: SampledPose, b: SampledPose, layout: ScatterLayout, seed = 7): FieldBuffers {
  const count = Math.min(a.count, b.count)
  const rng = mulberry32(seed)
  const position = new Float32Array(count * 3)
  const foxA = new Uint16Array(count * 2)
  const foxB = new Uint16Array(count * 2)
  const seedAttr = new Uint8Array(count * 4)
  const geo = new Uint8Array(count * 2)

  const hasTraces = layout.traces.length > 0
  const snowN = Math.floor(count * layout.snowFraction)
  const traceN = hasTraces ? Math.floor(count * layout.traceFraction) : 0

  for (let i = 0; i < count; i++) {
    foxA[i * 2] = Math.round(a.xy[i * 2] * 65535)
    foxA[i * 2 + 1] = Math.round(a.xy[i * 2 + 1] * 65535)
    foxB[i * 2] = Math.round(b.xy[i * 2] * 65535)
    foxB[i * 2 + 1] = Math.round(b.xy[i * 2 + 1] * 65535)
    geo[i * 2] = Math.round(a.geo[i] * 255)
    geo[i * 2 + 1] = Math.round(b.geo[i] * 255)

    // spread classes evenly through the Hilbert order so every stroke sheds a mix
    const slot = (i * 7919) % count
    let cls = CLASS_VOLUME
    if (slot < snowN) cls = CLASS_SNOW
    else if (slot < snowN + traceN) cls = CLASS_TRACE

    let x: number
    let y: number
    if (cls === CLASS_SNOW) {
      x = freeX(rng, layout.width, layout.quietX, layout.fallbackX)
      y = rng() * layout.height
    } else if (cls === CLASS_TRACE) {
      const t = layout.traces[(slot - snowN) % layout.traces.length]
      x = t.x0 + rng() * (t.x1 - t.x0)
      y = t.y + (rng() - 0.5) * 3
    } else {
      // volume: the field band, never a quiet column
      x = freeX(rng, layout.width, layout.quietX, layout.fallbackX)
      y = layout.fieldTop + rng() * layout.fieldHeight
    }
    position[i * 3] = x
    position[i * 3 + 1] = y
    position[i * 3 + 2] = rng() * 2 - 1

    seedAttr[i * 4] = Math.floor(rng() * 256) // phase
    seedAttr[i * 4 + 1] = Math.floor(rng() * 256) // size multiplier
    seedAttr[i * 4 + 2] = Math.floor(rng() * 256) // drift amplitude
    seedAttr[i * 4 + 3] = cls
  }
  return { count, position, foxA, foxB, seed: seedAttr, geo }
}
