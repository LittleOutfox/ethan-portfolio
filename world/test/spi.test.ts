import { describe, expect, it } from 'vitest'
import {
  copiPolyline, csPolyline, DUTY_REG, dutyFromText, dutyPercent, FRAME_CELLS,
  formatWrite, pwmHigh, pwmPolyline, sampleXs, sclkPolyline, spiWrite,
} from '../../js/spi.js'

function parsePoints(points: string): [number, number][] {
  return points.trim().split(/\s+/).map((p) => p.split(',').map(Number) as [number, number])
}
function verticalEdges(points: string): { x: number; up: boolean }[] {
  const pts = parsePoints(points)
  const out: { x: number; up: boolean }[] = []
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    if (x0 === x1 && y0 !== y1) out.push({ x: x0, up: y1 < y0 })
  }
  return out
}

describe('spiWrite', () => {
  it('frames a write MSB first: W, the 7-bit address, the 8-bit datum', () => {
    const f = spiWrite(DUTY_REG, 0x80)
    expect(f.bits.map((b) => b.name)).toEqual(['W', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'A0', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'])
    expect(f.bits.map((b) => b.value)).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0])
  })

  it('rejects an address outside 0..127, a datum outside 0..255 and fractions', () => {
    expect(() => spiWrite(128, 0)).toThrow(RangeError)
    expect(() => spiWrite(-1, 0)).toThrow(RangeError)
    expect(() => spiWrite(4, 256)).toThrow(RangeError)
    expect(() => spiWrite(4, 1.5)).toThrow(RangeError)
    expect(() => spiWrite(4, Number.NaN)).toThrow(RangeError)
  })
})

describe('the lanes (SPI mode 0, 18 cells: one before the frame, 16 bits, one after)', () => {
  const W = 864
  const c = W / FRAME_CELLS

  it('nCS falls half a cell in, stays low across all 16 bits, and rises half a cell after (the commit)', () => {
    expect(verticalEdges(csPolyline(W, 10, 26))).toEqual([{ x: 0.5 * c, up: false }, { x: 17.5 * c, up: true }])
  })

  it('SCLK idles low and pulses once per bit, rising mid-bit and falling at the bit’s end', () => {
    const edges = verticalEdges(sclkPolyline(W, 38, 54))
    expect(edges).toHaveLength(32)
    for (let k = 1; k <= 16; k++) {
      expect(edges[2 * (k - 1)].x).toBeCloseTo((k + 0.5) * c, 6)
      expect(edges[2 * (k - 1)].up).toBe(true)
      expect(edges[2 * k - 1].x).toBeCloseTo((k + 1) * c, 6)
      expect(edges[2 * k - 1].up).toBe(false)
    }
    const pts = parsePoints(sclkPolyline(W, 38, 54))
    expect(pts[0]).toEqual([0, 54])
    expect(pts[pts.length - 1]).toEqual([W, 54])
  })

  it('samples COPI on every SCLK rising edge, in the middle of its bit', () => {
    const xs = sampleXs(W)
    expect(xs).toHaveLength(16)
    xs.forEach((x, k) => expect(x).toBeCloseTo((k + 1.5) * c, 6))
  })

  it('COPI holds each bit across its cell and changes only on cell boundaries', () => {
    const f = spiWrite(DUTY_REG, 0x80)
    const edges = verticalEdges(copiPolyline(f, W, 66, 82))
    // low → W=1 at cell 1; 1 → A6=0 at cell 2; A2=1 at cell 6, A1=0 at cell 7; D7=1 at cell 9, D6=0 at cell 10
    expect(edges.map((e) => Math.round(e.x / c))).toEqual([1, 2, 6, 7, 9, 10])
    for (const e of edges) expect(Math.abs(e.x / c - Math.round(e.x / c))).toBeLessThan(1e-6)
  })
})

describe('the PWM it sets (pwm_peripheral.v: high while an 8-bit counter < duty; 255 is always high)', () => {
  it('turns the duty byte into the fraction of each period the output is high', () => {
    expect(pwmHigh(0)).toBe(0)
    expect(pwmHigh(1)).toBe(1 / 256)
    expect(pwmHigh(128)).toBe(0.5)
    expect(pwmHigh(254)).toBe(254 / 256)
    expect(pwmHigh(255)).toBe(1)
    expect(dutyPercent(128)).toBe('50.0%')
    expect(dutyPercent(255)).toBe('100.0%')
    expect(dutyPercent(0)).toBe('0.0%')
    expect(() => pwmHigh(256)).toThrow(RangeError)
  })

  it('draws two periods, flat at 0% and 100%', () => {
    expect(parsePoints(pwmPolyline(0, 400, 118, 134))).toEqual([[0, 134], [400, 134]])
    expect(parsePoints(pwmPolyline(255, 400, 118, 134))).toEqual([[0, 118], [400, 118]])
    const edges = verticalEdges(pwmPolyline(128, 400, 118, 134))
    expect(edges.map((e) => [e.x, e.up])).toEqual([[0, true], [100, false], [200, true], [300, false]])
  })
})

describe('the duty box and the readout', () => {
  it('keeps digits, clamps to 0..255, and waits on an empty box', () => {
    expect(dutyFromText('128')).toBe(128)
    expect(dutyFromText('0012')).toBe(12)
    expect(dutyFromText('300')).toBe(255)
    expect(dutyFromText('-5')).toBe(5)
    expect(dutyFromText('a1b2')).toBe(12)
    expect(dutyFromText('')).toBeNull()
    expect(dutyFromText('abc')).toBeNull()
  })

  it('prints the write as address ← datum in hex', () => {
    expect(formatWrite(DUTY_REG, 0x80)).toBe('0x04 ← 0x80')
    expect(formatWrite(DUTY_REG, 5)).toBe('0x04 ← 0x05')
  })
})
