import { describe, expect, it } from 'vitest'
import { decimate, hilbertIndex, mulberry32, samplePose, type MaskImage } from './sample'

function mask(width: number, height: number, fill: (x: number, y: number) => [number, number]): MaskImage {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g] = fill(x, y)
      const i = (y * width + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = r > 0 ? 255 : 0
      data[i + 3] = 255
    }
  }
  return { width, height, data }
}

describe('mulberry32', () => {
  it('is deterministic and in [0, 1)', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 1000; i++) {
      const v = a()
      expect(v).toBe(b())
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('hilbertIndex', () => {
  it('is a bijection on a small grid', () => {
    const seen = new Set<number>()
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) seen.add(hilbertIndex(3, x, y))
    expect(seen.size).toBe(64)
  })
  it('keeps neighbours in the curve spatially adjacent', () => {
    const inv = new Map<number, [number, number]>()
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) inv.set(hilbertIndex(4, x, y), [x, y])
    for (let d = 1; d < 256; d++) {
      const [x0, y0] = inv.get(d - 1)!
      const [x1, y1] = inv.get(d)!
      expect(Math.abs(x0 - x1) + Math.abs(y0 - y1)).toBe(1)
    }
  })
})

describe('samplePose', () => {
  it('only places points where the density channel is non-zero', () => {
    // density only in the right half
    const m = mask(64, 32, (x) => [x >= 32 ? 200 : 0, x >= 32 ? 128 : 0])
    const pose = samplePose(m, 2000, 3)
    expect(pose.count).toBe(2000)
    for (let i = 0; i < pose.count; i++) {
      expect(pose.xy[i * 2]).toBeGreaterThanOrEqual(0.5)
      expect(pose.xy[i * 2]).toBeLessThan(1)
      expect(pose.geo[i]).toBeCloseTo(128 / 255, 5)
    }
  })

  it('distributes points in proportion to density', () => {
    // left quarter weight 30, right quarter weight 90, nothing between
    const m = mask(100, 10, (x) => [x < 25 ? 30 : x >= 75 ? 90 : 0, 0])
    const pose = samplePose(m, 4000, 11)
    let left = 0
    for (let i = 0; i < pose.count; i++) if (pose.xy[i * 2] < 0.5) left++
    expect(left / pose.count).toBeGreaterThan(0.21)
    expect(left / pose.count).toBeLessThan(0.29)
  })

  it('is Hilbert-sorted so neighbouring indices are near each other', () => {
    const m = mask(64, 64, () => [255, 0])
    const pose = samplePose(m, 4096, 5)
    let far = 0
    for (let i = 1; i < pose.count; i++) {
      const dx = pose.xy[i * 2] - pose.xy[i * 2 - 2]
      const dy = pose.xy[i * 2 + 1] - pose.xy[i * 2 - 1]
      if (Math.hypot(dx, dy) > 0.25) far++
    }
    expect(far / pose.count).toBeLessThan(0.02)
  })

  it('throws on an empty mask', () => {
    const m = mask(8, 8, () => [0, 0])
    expect(() => samplePose(m, 10)).toThrow()
  })
})

describe('decimate', () => {
  it('keeps an even spread when striding', () => {
    const m = mask(64, 64, () => [255, 0])
    const full = samplePose(m, 4000, 9)
    const small = decimate(full, 400)
    expect(small.count).toBe(400)
    // first and last of the decimated set span the original ordering
    expect(small.xy[0]).toBe(full.xy[0])
    const quadrants = new Set<string>()
    for (let i = 0; i < small.count; i++) quadrants.add(`${small.xy[i * 2] < 0.5}${small.xy[i * 2 + 1] < 0.5}`)
    expect(quadrants.size).toBe(4)
  })
})
