// Restored from main-effects (4a5424b, tools/uart.test.js): the generator is pure, so these are the same assertions.
import { describe, expect, it } from 'vitest'
import {
  byteFromChar,
  centreSampleXs,
  clockPolyline,
  FRAME_CELLS,
  formatByte,
  sampledBits,
  txLevels,
  txPolyline,
  uartFrame,
} from '../../js/uart.js'

/** parses an SVG points string into [x, y] pairs */
function parsePoints(points: string): [number, number][] {
  return points
    .trim()
    .split(/\s+/)
    .map((p) => {
      const [x, y] = p.split(',').map(Number)
      return [x, y] as [number, number]
    })
}

/** x of every vertical segment (consecutive points sharing x at different y) */
function verticalEdgeXs(points: string): number[] {
  const pts = parsePoints(points)
  const xs: number[] = []
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    if (x0 === x1 && y0 !== y1) xs.push(x0)
  }
  return xs
}

describe('uartFrame', () => {
  const frame = uartFrame(0x45)

  it('lays out idle, start, d0..d7, stop, idle for 0x45 with the data LSB first', () => {
    expect(frame.bits.map((b) => b.name)).toEqual(['idle', 'start', 'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'stop', 'idle'])
    // 0x45 = 0b01000101, so d0..d7 = 1,0,1,0,0,0,1,0
    expect(frame.bits.slice(2, 10).map((b) => b.value)).toEqual([1, 0, 1, 0, 0, 0, 1, 0])
    expect(frame.bits[0].value).toBe(1)
    expect(frame.bits[1].value).toBe(0)
    expect(frame.bits[10].value).toBe(1)
    expect(frame.bits[11].value).toBe(1)
    expect(frame.byte).toBe(0x45)
    expect(frame.oversample).toBe(16)
    expect(frame.ticksPerBit).toBe(16)
  })

  it('spans 192 ticks at 16x, one contiguous cell of 16 ticks per bit', () => {
    expect(frame.bits).toHaveLength(FRAME_CELLS)
    expect(frame.totalTicks).toBe(192)
    expect(frame.bits[0].startTick).toBe(0)
    for (let i = 0; i < frame.bits.length; i++) {
      const b = frame.bits[i]
      expect(b.endTick - b.startTick).toBe(16)
      if (i > 0) expect(b.startTick).toBe(frame.bits[i - 1].endTick)
    }
    expect(frame.bits[frame.bits.length - 1].endTick).toBe(frame.totalTicks)
  })

  it('honours a different oversampling ratio', () => {
    const f8 = uartFrame(0x45, 8)
    expect(f8.totalTicks).toBe(96)
    expect(f8.ticksPerBit).toBe(8)
    for (const b of f8.bits) expect(b.endTick - b.startTick).toBe(8)
    const f1 = uartFrame(0x45, 1)
    expect(f1.totalTicks).toBe(12)
  })

  it('handles the all-zero and all-one bytes', () => {
    const zero = uartFrame(0x00)
    expect(zero.bits.slice(2, 10).map((b) => b.value)).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
    expect(zero.bits[1].value).toBe(0)
    expect(zero.bits[10].value).toBe(1)
    const ones = uartFrame(0xff)
    expect(ones.bits.slice(2, 10).map((b) => b.value)).toEqual([1, 1, 1, 1, 1, 1, 1, 1])
    expect(ones.bits[1].value).toBe(0)
    expect(ones.bits[10].value).toBe(1)
  })

  it('rejects bytes outside 0..255, fractional bytes and an oversample below 1', () => {
    expect(() => uartFrame(256)).toThrow(RangeError)
    expect(() => uartFrame(-1)).toThrow(RangeError)
    expect(() => uartFrame(1.5)).toThrow(RangeError)
    expect(() => uartFrame(Number.NaN)).toThrow(RangeError)
    expect(() => uartFrame(0x45, 0)).toThrow(RangeError)
    expect(() => uartFrame(0x45, -16)).toThrow(RangeError)
  })
})

describe('txLevels', () => {
  it('starts high, drops for the start bit and ends high', () => {
    const frame = uartFrame(0x45)
    const levels = txLevels(frame)
    expect(levels).toHaveLength(192)
    expect(levels[0]).toBe(1)
    expect(Array.from(levels.subarray(0, 16))).toEqual(new Array(16).fill(1))
    expect(Array.from(levels.subarray(16, 32))).toEqual(new Array(16).fill(0))
    expect(Array.from(levels.subarray(160, 192))).toEqual(new Array(32).fill(1))
    expect(levels[levels.length - 1]).toBe(1)
  })

  it('holds each cell at its bit value for every tick', () => {
    const frame = uartFrame(0xa5)
    const levels = txLevels(frame)
    for (const b of frame.bits) {
      for (let t = b.startTick; t < b.endTick; t++) expect(levels[t]).toBe(b.value)
    }
  })
})

describe('txPolyline', () => {
  const frame = uartFrame(0x45)
  const width = 864
  const high = 72
  const low = 108
  const points = txPolyline(frame, width, high, low)

  it('runs from x = 0 to x = width, high at both ends', () => {
    const pts = parsePoints(points)
    expect(pts[0]).toEqual([0, high])
    expect(pts[pts.length - 1]).toEqual([width, high])
    for (const [, y] of pts) expect([high, low]).toContain(y)
  })

  it('has vertical edges exactly where the level changes between cells', () => {
    const sx = width / frame.totalTicks
    const expected: number[] = []
    for (let i = 1; i < frame.bits.length; i++) {
      if (frame.bits[i].value !== frame.bits[i - 1].value) expected.push(frame.bits[i].startTick * sx)
    }
    // idle->start, start->d0, d0->d1, d1->d2, d2->d3, d5->d6, d6->d7, d7->stop
    expect(expected).toHaveLength(8)
    const edges = verticalEdgeXs(points)
    expect(edges).toHaveLength(expected.length)
    edges.forEach((x, i) => expect(x).toBeCloseTo(expected[i], 3))
  })

  it('has a single edge pair for a byte with no internal transitions', () => {
    // 0xFF: only idle->start (falls) and start->d0 (rises)
    const edges = verticalEdgeXs(txPolyline(uartFrame(0xff), 192, 0, 10))
    expect(edges).toEqual([16, 32])
  })
})

describe('clockPolyline', () => {
  it('rises at every tick start and falls half way through, 50% duty', () => {
    const frame = uartFrame(0x45)
    const width = 192 * 4
    const points = clockPolyline(frame, width, 20, 44)
    const pts = parsePoints(points)
    expect(pts).toHaveLength(4 * 192 + 1)
    for (let t = 0; t < 192; t++) {
      expect(pts[4 * t]).toEqual([t * 4, 44])
      expect(pts[4 * t + 1]).toEqual([t * 4, 20])
      expect(pts[4 * t + 2]).toEqual([t * 4 + 2, 20])
      expect(pts[4 * t + 3]).toEqual([t * 4 + 2, 44])
    }
    expect(pts[pts.length - 1]).toEqual([width, 44])
  })
})

describe('centreSampleXs', () => {
  it('returns ten monotonically increasing centre-bit positions, skipping the idle cells', () => {
    const frame = uartFrame(0x45)
    const xs = centreSampleXs(frame, 864)
    expect(xs).toHaveLength(10)
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1])
    const sx = 864 / 192
    expect(xs[0]).toBeCloseTo((16 + 8) * sx, 6)
    expect(xs[9]).toBeCloseTo((160 + 8) * sx, 6)
    expect(sampledBits(frame).map((b) => b.name)).toEqual(['start', 'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'stop'])
  })
})

describe('byteFromChar', () => {
  it('maps a character to its code point and an empty string to E', () => {
    expect(byteFromChar('E')).toBe(0x45)
    expect(byteFromChar('')).toBe(0x45)
    expect(byteFromChar('A')).toBe(0x41)
    expect(byteFromChar(' ')).toBe(0x20)
    expect(byteFromChar('\u0000')).toBe(0)
  })

  it('uses the first character and clamps to one byte', () => {
    expect(byteFromChar('AB')).toBe(0x41)
    expect(byteFromChar('ÿ')).toBe(0xff)
    expect(byteFromChar('€')).toBe(0xff)
  })
})

describe('formatByte', () => {
  it('prints hex and binary with fixed widths', () => {
    expect(formatByte(0x45)).toBe('0x45 · 0b01000101')
    expect(formatByte(0)).toBe('0x00 · 0b00000000')
    expect(formatByte(0xff)).toBe('0xFF · 0b11111111')
  })
})
