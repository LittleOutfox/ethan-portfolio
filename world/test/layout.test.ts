import { describe, expect, it } from 'vitest'
import { ROUTE, heightAt, placeTrees, distanceToCurve } from '../src/layout'
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
