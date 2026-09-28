import { describe, expect, it } from 'vitest'
import { SEGMENTS, worldTime, makeCameraPath, fitFov, type Key, type Pose } from '../src/path'

const deg = (r: number) => (r * 180) / Math.PI
const hfov = (vfovDeg: number, aspect: number) =>
  deg(2 * Math.atan(aspect * Math.tan((vfovDeg * Math.PI) / 360)))

describe('worldTime', () => {
  it('is the sum of the segment progresses', () => {
    expect(worldTime({ hero: 1, origin: 0.5 })).toBeCloseTo(1.5)
  })

  it('clamps each segment to 0..1 so a lagging scrub never overshoots', () => {
    expect(worldTime({ hero: 1.2, origin: -0.1, hunt: 0.25 })).toBeCloseTo(1.25)
  })

  it('runs 0 → 9 across the whole story', () => {
    const all = Object.fromEntries(SEGMENTS.map((k) => [k, 1]))
    expect(worldTime({})).toBe(0)
    expect(worldTime(all)).toBe(9)
  })
})

describe('makeCameraPath', () => {
  const keys: Key[] = [
    { pos: [0, 1, 10], look: [0, 1, 0], fov: 40 },
    { pos: [0, 1, 0], look: [0, 1, -10], fov: 44 },
    { pos: [10, 2, -5], look: [10, 2, -20], fov: 50 },
  ]
  const sample = makeCameraPath(keys)
  const pose = (): Pose => ({ pos: [0, 0, 0], look: [0, 0, 0], fov: 0 })

  it('lands exactly on each key at its integer time', () => {
    keys.forEach((k, i) => {
      const p = sample(i, pose())
      k.pos.forEach((v, j) => expect(p.pos[j]).toBeCloseTo(v, 5))
      k.look.forEach((v, j) => expect(p.look[j]).toBeCloseTo(v, 5))
      expect(p.fov).toBeCloseTo(k.fov, 5)
    })
  })

  it('moves continuously through a key (no jump across the boundary)', () => {
    const a = sample(1 - 1e-4, pose())
    const b = sample(1 + 1e-4, pose())
    const d = Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1], a.pos[2] - b.pos[2])
    expect(d).toBeLessThan(0.01)
  })

  it('never overshoots between two keys (each axis stays within its keys)', () => {
    // a sideways run into a key that then heads straight on: the camera must
    // not swing past the second key while leaving it
    const ks: Key[] = [
      { pos: [40, 2, -20], look: [40, 2, -60], fov: 45 },
      { pos: [60, 2, -34], look: [60, 7, -90], fov: 45 },
      { pos: [60, 10, -84], look: [62, 11, -130], fov: 45 },
      { pos: [64, 11, -96], look: [74, 10, -104], fov: 45 },
    ]
    const s = makeCameraPath(ks)
    for (let t = 1; t <= 2; t += 0.01) {
      const p = s(t, pose())
      expect(Math.abs(p.pos[0] - 60)).toBeLessThan(0.05)
    }
  })

  it('holds the end keys outside the authored range', () => {
    const before = sample(-3, pose())
    const after = sample(99, pose())
    expect(before.pos[2]).toBeCloseTo(10, 5)
    expect(after.pos[0]).toBeCloseTo(10, 5)
  })
})

describe('fitFov', () => {
  it('leaves a comfortable 16:10 frame alone', () => {
    expect(fitFov(45, 1.6)).toBeCloseTo(45, 5)
  })

  it('narrows the vertical fov on a 2.39:1 ultrawide so edges never stretch past 75° across', () => {
    const v = fitFov(45, 3440 / 1440)
    expect(hfov(v, 3440 / 1440)).toBeCloseTo(75, 3)
    expect(v).toBeLessThan(45)
  })

  it('widens the vertical fov on a portrait phone so the world is not a keyhole', () => {
    const v = fitFov(45, 390 / 844)
    expect(hfov(v, 390 / 844)).toBeGreaterThanOrEqual(38 - 1e-6)
    expect(v).toBeGreaterThan(45)
    expect(v).toBeLessThanOrEqual(80)
  })
})
