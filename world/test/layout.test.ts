import { describe, expect, it } from 'vitest'
import { BLOOM, GREAT_TREES, ROUTE, STREAM, bloomOrbs, cameraSamples, heightAt, placeBlooms, placeTrees, distanceToCurve, streamDistance, streamZ } from '../src/layout'
import { KEYS } from '../src/keys'
import { makeCameraPath, type Pose } from '../src/path'

describe('heightAt', () => {
  it('follows the route: the ground under each route point sits at its elevation', () => {
    for (const [x, y, z] of ROUTE) expect(heightAt(x, z)).toBeCloseTo(y, 1)
  })

  it('is continuous (no cliffs between neighbouring samples)', () => {
    for (let x = -60; x < 120; x += 7.3) {
      for (let z = 60; z > -230; z -= 7.1) {
        expect(Math.abs(heightAt(x, z) - heightAt(x + 0.5, z))).toBeLessThan(1.5)
      }
    }
  })
})

describe('placeTrees', () => {
  const trees = placeTrees(1)

  it('keeps every trunk clear of the camera path', () => {
    const sample = makeCameraPath(KEYS)
    const pose: Pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 }
    const cam: [number, number][] = []
    for (let t = 0; t <= KEYS.length - 1; t += 0.02) {
      sample(t, pose)
      cam.push([pose.pos[0], pose.pos[2]])
    }
    for (const tr of trees) {
      expect(distanceToCurve(tr.x, tr.z, cam)).toBeGreaterThan(tr.radius + 1.2)
    }
  })

  it('is deterministic for a seed', () => {
    expect(placeTrees(1)).toEqual(trees)
  })

  it('draws a subset, not a different forest, at lower density', () => {
    const few = placeTrees(0.4)
    expect(few.length).toBeLessThan(trees.length)
    expect(few).toEqual(trees.slice(0, few.length))
  })
})

describe('the spirit stream', () => {
  it('crosses the path at the forest edge, where the camera walks over it', () => {
    const z = streamZ(0)
    expect(z).toBeGreaterThan(12)
    expect(z).toBeLessThan(26)
  })

  it('lies level: the water keeps to one height along its whole visible length', () => {
    const ys: number[] = []
    for (let x = -60; x <= 60; x += 2) ys.push(heightAt(x, streamZ(x)))
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.3)
  })

  it('measures distance across the water, not just along z', () => {
    expect(streamDistance(10, streamZ(10))).toBeCloseTo(0, 5)
    expect(streamDistance(10, streamZ(10) + 1)).toBeLessThanOrEqual(1)
    expect(streamDistance(10, streamZ(10) + 1)).toBeGreaterThan(0.5)
  })

  it('has no tree standing in it', () => {
    for (const t of placeTrees(1)) {
      expect(streamDistance(t.x, t.z)).toBeGreaterThan(STREAM.width + t.radius * 0.5)
    }
  })
})

describe('the great trees', () => {
  const trees = placeTrees(1)

  it('stand first in the forest, at every density, big trees of the widest kind', () => {
    for (const d of [1, 0.65, 0.4]) expect(placeTrees(d).slice(0, GREAT_TREES.length)).toEqual(trees.slice(0, GREAT_TREES.length))
    GREAT_TREES.forEach((g, i) => {
      expect(trees[i].x).toBe(g.x)
      expect(trees[i].z).toBe(g.z)
      expect(trees[i].scale).toBeGreaterThanOrEqual(1.8)
    })
  })

  it('stand in glades of their own', () => {
    for (const t of trees.slice(GREAT_TREES.length)) {
      for (const g of GREAT_TREES) expect(Math.hypot(t.x - g.x, t.z - g.z)).toBeGreaterThan(g.glade)
    }
  })

  it('one waits at the forest edge, one alone out on the snowfield, and the grandest stands beyond the summit', () => {
    const [edge, snow, grand] = GREAT_TREES
    expect(edge.z).toBeGreaterThan(-5)
    expect(edge.z).toBeLessThan(STREAM.z)
    expect(snow.z).toBeLessThan(-160)
    expect(grand.scale).toBe(Math.max(...GREAT_TREES.map((g) => g.scale)))
    // east of the summit, where the tails chapter looks out
    expect(grand.x).toBeGreaterThan(90)
    expect(grand.z).toBeLessThan(-150)
  })
})

describe('the spirit blooms', () => {
  const blooms = placeBlooms()
  const routeXZ: [number, number][] = ROUTE.map(([x, , z]) => [x, z])

  it('are very rare: a handful along the whole journey', () => {
    expect(blooms.length).toBeGreaterThanOrEqual(4)
    expect(blooms.length).toBeLessThanOrEqual(8)
  })

  it('stand tall: every orb glows more than a metre above the snow', () => {
    for (const b of blooms) expect(BLOOM.orbY * b.scale).toBeGreaterThan(1.1)
  })

  it('grow in the snow beside the journey: off the path and its stair, out of the water', () => {
    for (const b of blooms) {
      expect(b.y).toBeCloseTo(heightAt(b.x, b.z), 5)
      // the stair is 4.6 m wide; the roots reach BLOOM.reach
      expect(distanceToCurve(b.x, b.z, routeXZ)).toBeGreaterThan(2.3 + BLOOM.reach * b.scale + 0.5)
      expect(streamDistance(b.x, b.z)).toBeGreaterThan(STREAM.width + BLOOM.reach * b.scale)
    }
  })

  it('stand clear of the camera, roots and all, the whole way', () => {
    const cam = cameraSamples(0.01)
    for (const b of blooms) {
      const d = Math.min(...cam.map(([x, , z]) => Math.hypot(x - b.x, z - b.z)))
      expect(d).toBeGreaterThan(BLOOM.reach * b.scale + 1.5)
    }
  })

  it('each keep a clearing: no tree grows through one', () => {
    const trees = placeTrees(1)
    for (const b of blooms) {
      for (const t of trees) expect(Math.hypot(t.x - b.x, t.z - b.z)).toBeGreaterThan(t.radius + BLOOM.reach * b.scale)
    }
  })

  it('light the snow from their orbs', () => {
    expect(bloomOrbs()).toEqual(blooms.map((b) => [b.x, b.y + BLOOM.orbY * b.scale, b.z, b.scale]))
  })
})
