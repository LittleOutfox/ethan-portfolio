/**
 * Pure frame generator for one 8N1 UART character (one start bit, eight data bits LSB first,
 * one stop bit, no parity) as seen by a receiver that oversamples the line N times per bit.
 * No DOM, no state: every function is a plain mapping from a frame to numbers or strings,
 * so the figure can be drawn on the server and re-drawn on every keystroke.
 */

export interface UartBit {
  /** 'idle', 'start', 'd0'..'d7' or 'stop' */
  name: string
  /** line level held for the whole cell */
  value: 0 | 1
  /** first tick of the cell (inclusive) */
  startTick: number
  /** one past the last tick of the cell (exclusive) */
  endTick: number
}

export interface UartFrame {
  byte: number
  oversample: number
  ticksPerBit: number
  /** idle, start, d0..d7, stop, idle: twelve contiguous cells */
  bits: UartBit[]
  totalTicks: number
}

/** cells per frame: idle + start + 8 data + stop + idle */
export const FRAME_CELLS = 12

/**
 * Builds the tick-level layout of one frame. Each cell spans `oversample` ticks, so the
 * receiver's 16x clock has exactly `oversample` periods per bit.
 * Throws RangeError for a byte outside 0..255, a fractional byte, or an oversample below 1.
 */
export function uartFrame(byte: number, oversample = 16): UartFrame {
  if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
    throw new RangeError(`uartFrame: byte must be an integer in 0..255, received ${byte}`)
  }
  if (!Number.isInteger(oversample) || oversample < 1) {
    throw new RangeError(`uartFrame: oversample must be an integer of at least 1, received ${oversample}`)
  }

  const cells: Array<[string, 0 | 1]> = [
    ['idle', 1],
    ['start', 0],
  ]
  for (let i = 0; i < 8; i++) cells.push([`d${i}`, ((byte >> i) & 1) as 0 | 1])
  cells.push(['stop', 1], ['idle', 1])

  const bits = cells.map<UartBit>(([name, value], i) => ({
    name,
    value,
    startTick: i * oversample,
    endTick: (i + 1) * oversample,
  }))

  return { byte, oversample, ticksPerBit: oversample, bits, totalTicks: cells.length * oversample }
}

/** The tx line level at every tick of the frame (length totalTicks). */
export function txLevels(frame: UartFrame): Uint8Array {
  const out = new Uint8Array(frame.totalTicks)
  for (const b of frame.bits) out.fill(b.value, b.startTick, b.endTick)
  return out
}

/** Formats a coordinate for a points string without float noise. */
function num(n: number): string {
  return String(Number(n.toFixed(3)))
}

function pt(x: number, y: number): string {
  return `${num(x)},${num(y)}`
}

/**
 * SVG polyline `points` for the tx waveform across [0, width]. y is `high` for a 1 and `low`
 * for a 0. Where the level changes, the boundary x is emitted twice (once at each level) so
 * the edge is a true vertical segment; where it does not change no point is emitted.
 */
export function txPolyline(frame: UartFrame, width: number, high: number, low: number): string {
  const { bits, totalTicks } = frame
  if (bits.length === 0) return ''
  const sx = width / totalTicks
  const y = (v: 0 | 1) => (v ? high : low)

  const pts: string[] = [pt(0, y(bits[0].value))]
  for (let i = 1; i < bits.length; i++) {
    const prev = bits[i - 1]
    const next = bits[i]
    if (prev.value === next.value) continue
    const x = next.startTick * sx
    pts.push(pt(x, y(prev.value)), pt(x, y(next.value)))
  }
  pts.push(pt(width, y(bits[bits.length - 1].value)))
  return pts.join(' ')
}

/**
 * SVG polyline `points` for the oversampling clock: a 50% duty square wave with one period
 * per tick, rising at the start of every tick and falling half way through it.
 */
export function clockPolyline(frame: UartFrame, width: number, high: number, low: number): string {
  const sx = width / frame.totalTicks
  const pts: string[] = []
  for (let t = 0; t < frame.totalTicks; t++) {
    const x0 = t * sx
    const xm = (t + 0.5) * sx
    pts.push(pt(x0, low), pt(x0, high), pt(xm, high), pt(xm, low))
  }
  pts.push(pt(width, low))
  return pts.join(' ')
}

/**
 * x positions (across [0, width]) of the centre-bit sample points: the middle tick of START,
 * D0..D7 and STOP. The two idle cells are never sampled.
 */
export function centreSampleXs(frame: UartFrame, width: number): number[] {
  const sx = width / frame.totalTicks
  const half = frame.oversample / 2
  return frame.bits.filter((b) => b.name !== 'idle').map((b) => (b.startTick + half) * sx)
}

/** The frame's sampled cells (start, d0..d7, stop) in transmission order. */
export function sampledBits(frame: UartFrame): UartBit[] {
  return frame.bits.filter((b) => b.name !== 'idle')
}

/** Code point of the first character, clamped to one byte. An empty string means 'E'. */
export function byteFromChar(ch: string): number {
  const cp = ch.codePointAt(0)
  if (cp === undefined) return 0x45
  return Math.min(255, Math.max(0, cp))
}

/** The byte as hex and binary for the readout, e.g. `0x45 · 0b01000101`. */
export function formatByte(byte: number): string {
  const hex = byte.toString(16).toUpperCase().padStart(2, '0')
  const bin = byte.toString(2).padStart(8, '0')
  return `0x${hex} · 0b${bin}`
}
