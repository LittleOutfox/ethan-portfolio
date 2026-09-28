import { describe, expect, it } from 'vitest'
import { KEYS } from '../src/keys'
import { fitFov, makeCameraPath, type Pose } from '../src/path'
import { cameraSamples } from '../src/layout'
import { forestFor } from '../src/trees'
import { FOX_BONES, FOX_BOX, foxPose, groundAt, makeFoxPath, makeGait, pawsDown, stepGait, type Gait } from '../src/fox'

/** Where a world point lands on screen (3440×1440 unless told) at world time t (x right, y down, 0..1), and how far it is. */
function onScreen(t: number, x: number, y: number, z: number, aspect = 3440 / 1440) {
  const p: Pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 0 }
  makeCameraPath(KEYS)(t, p)
  const tv = Math.tan((fitFov(p.fov, aspect) * Math.PI) / 360)
  const f = p.look.map((v, k) => v - p.pos[k])
  const fl = Math.hypot(...f)
  f.forEach((v, k) => (f[k] = v / fl))
  const r = [-f[2], 0, f[0]]
  const rl = Math.hypot(...r)
  r.forEach((v, k) => (r[k] = v / rl))
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]]
  const d = [x - p.pos[0], y - p.pos[1], z - p.pos[2]]
  const depth = d[0] * f[0] + d[1] * f[1] + d[2] * f[2]
  const sx = 0.5 + (0.5 * (d[0] * r[0] + d[1] * r[1] + d[2] * r[2])) / depth / (tv * aspect)
  const sy = 0.5 - (0.5 * (d[0] * u[0] + d[1] * u[1] + d[2] * u[2])) / depth / tv
  return { sx, sy, depth }
}

describe('the spirit fox’s path', () => {
  const at = makeFoxPath()
  const spot = { x: 0, y: 0, z: 0, heading: 0 }

  it('keeps to the ground', () => {
    for (let t = 0; t <= 9; t += 0.05) {
      at(t, spot)
      expect(spot.y).toBeCloseTo(groundAt(spot.x, spot.z), 5)
    }
  })

  it('runs clear of every tree', () => {
    const trees = forestFor(1)
    for (let t = 0; t <= 9; t += 0.01) {
      at(t, spot)
      for (const tr of trees) expect(Math.hypot(tr.x - spot.x, tr.z - spot.z)).toBeGreaterThan(tr.radius + 0.5)
    }
  })

  it('never comes within 2.5 m of the camera', () => {
    const cam = cameraSamples(0.01)
    cam.forEach(([x, , z], i) => {
      at(i * 0.01, spot)
      expect(Math.hypot(x - spot.x, z - spot.z)).toBeGreaterThan(2.5)
    })
  })

  it('is in view, low in the frame and a few metres off, at every station but the craned-up tails', () => {
    for (const t of [0, 1, 1.6, 2.3, 2.85, 4.45, 6, 9]) {
      at(t, spot)
      const { sx, sy, depth } = onScreen(t, spot.x, spot.y + 0.2, spot.z)
      expect(depth).toBeGreaterThan(5)
      expect(depth).toBeLessThan(26)
      expect(sx).toBeGreaterThan(0.08)
      expect(sx).toBeLessThan(0.92)
      expect(sy).toBeGreaterThan(0.6)
      expect(sy).toBeLessThan(0.95)
    }
  })

  it('keeps out from behind the works cards: beside the stair, not on it, while they show', () => {
    // the cards' text spans x 0.37–0.62 on the ultrawide and 0.24–0.76 on a laptop, from works 0.3 to 0.75
    for (let t = 4.25; t <= 4.85; t += 0.05) {
      at(t, spot)
      expect(onScreen(t, spot.x, spot.y + 0.3, spot.z).sx).toBeGreaterThan(0.67)
      expect(onScreen(t, spot.x, spot.y + 0.3, spot.z, 1440 / 900).sx).toBeGreaterThan(0.8)
    }
  })

  it('runs on with the story: its path never doubles back', () => {
    const a = { ...spot }
    const b = { ...spot }
    at(0, a)
    let px = 0
    let pz = 0
    for (let t = 0.02; t <= 9; t += 0.02) {
      at(t, b)
      const dx = b.x - a.x
      const dz = b.z - a.z
      if (Math.hypot(dx, dz) > 1e-4 && Math.hypot(px, pz) > 1e-4) expect(dx * px + dz * pz).toBeGreaterThan(-1e-6)
      if (Math.hypot(dx, dz) > 1e-4) {
        px = dx
        pz = dz
      }
      Object.assign(a, b)
    }
  })

  it('faces the way the path runs', () => {
    at(2.5, spot) // the hunt: the path runs east (+x) along the trail
    expect(Math.cos(spot.heading)).toBeGreaterThan(0.8)
  })
})

describe('its gait', () => {
  const run = (g: Gait, speed: number, seconds: number, dt = 1 / 120) => {
    for (let s = 0; s < seconds; s += dt) stepGait(g, speed * dt, dt)
    return g
  }

  it('strides by the distance run, not the time: the same ground covered slowly or briskly is the same number of strides', () => {
    const slow = run(makeGait(), 1.5, 4) // 6 m at a walk-trot
    const brisk = run(makeGait(), 3, 2) // 6 m at a trot
    expect(slow.stride).toBeGreaterThan(2)
    expect(Math.abs(slow.stride - brisk.stride)).toBeLessThan(0.35 * slow.stride)
  })

  it('never blurs its legs: however fast the scroll, its stride rate has a ceiling', () => {
    const g = run(makeGait(), 60, 1)
    expect(g.stride).toBeLessThan(4.2)
  })

  it('gallops when the scroll is fast and trots when it is slow', () => {
    expect(run(makeGait(), 12, 1).gallop).toBeGreaterThan(0.8)
    expect(run(makeGait(), 2, 1).gallop).toBeLessThan(0.2)
  })

  it('stops when the scroll stops, looks back, then sits and waits', () => {
    const g = run(makeGait(), 4, 1)
    expect(g.run).toBeGreaterThan(0.8)
    run(g, 0, 1)
    expect(g.run).toBeLessThan(0.1)
    expect(g.look).toBeGreaterThan(0.5)
    run(g, 0, 3)
    expect(g.sit).toBeGreaterThan(0.9)
    run(g, 4, 0.6)
    expect(g.sit).toBeLessThan(0.2)
  })

  it('turns around when you scroll back', () => {
    const g = run(makeGait(), 3, 1)
    expect(g.dir).toBe(1)
    run(g, -3, 0.5)
    expect(g.dir).toBe(-1)
  })

  it('sits and waits before you have scrolled at all', () => {
    expect(makeGait().sit).toBe(1)
  })
})

describe('its shape', () => {
  const bones = new Float32Array(FOX_BONES * 8)
  const eyes = new Float32Array(8)
  const pose = (g: Partial<Gait>, look = 0) => {
    foxPose({ ...makeGait(), sit: 0, run: 0, ...g }, 0, look, bones, eyes)
    const b = (i: number) => ({ a: [bones[i * 8], bones[i * 8 + 1], bones[i * 8 + 2]], ra: bones[i * 8 + 3], b: [bones[i * 8 + 4], bones[i * 8 + 5], bones[i * 8 + 6]], rb: bones[i * 8 + 7] })
    return Array.from({ length: FOX_BONES }, (_, i) => b(i))
  }
  const lowest = (bs: ReturnType<typeof pose>) => Math.min(...bs.flatMap((x) => [x.a[1] - x.ra, x.b[1] - x.rb]))

  it('stands on its paws: its lowest point is the ground', () => {
    expect(lowest(pose({}))).toBeCloseTo(0, 2)
  })

  it('has a snout in front, a tail behind, and tall ears on top of its head', () => {
    const bs = pose({})
    const xs = bs.flatMap((x) => [x.a[0] + x.ra, x.b[0] + x.rb])
    const xb = bs.flatMap((x) => [x.a[0] - x.ra, x.b[0] - x.rb])
    expect(Math.max(...xs)).toBeGreaterThan(0.42)
    expect(Math.min(...xb)).toBeLessThan(-0.7)
    const top = Math.max(...bs.flatMap((x) => [x.a[1] + x.ra, x.b[1] + x.rb]))
    expect(top).toBeGreaterThan(0.64)
  })

  it('fits its box in every pose: standing, running at every phase, sitting, looking back', () => {
    const inBox = (bs: ReturnType<typeof pose>) => {
      for (const x of bs) {
        for (const [p, r] of [[x.a, x.ra], [x.b, x.rb]] as const) {
          for (let k = 0; k < 3; k++) {
            expect(p[k] - r).toBeGreaterThan(FOX_BOX.min[k])
            expect(p[k] + r).toBeLessThan(FOX_BOX.max[k])
          }
        }
      }
    }
    inBox(pose({}))
    inBox(pose({ sit: 1 }))
    inBox(pose({ sit: 1 }, 2))
    inBox(pose({ sit: 1 }, -2))
    for (let ph = 0; ph < 1; ph += 0.05) {
      inBox(pose({ run: 1, stride: ph, gallop: 0 }))
      inBox(pose({ run: 1, stride: ph, gallop: 1 }))
    }
  })

  it('sits down on its haunches', () => {
    const stand = pose({})
    const sit = pose({ sit: 1 })
    const hips = (bs: ReturnType<typeof pose>) => bs[0].b[1]
    expect(hips(sit)).toBeLessThan(hips(stand) - 0.1)
    expect(lowest(sit)).toBeGreaterThan(-0.02)
  })

  it('sits as a fox sits: upright, its chest high over its haunches, forepaws together under its chest', () => {
    const sit = pose({ sit: 1 })
    const [chest, hips] = [sit[0].a, sit[0].b]
    expect(chest[1] - hips[1]).toBeGreaterThan(0.24)
    for (const i of [10, 12]) {
      const paw = sit[i].b
      expect(Math.abs(paw[0] - chest[0])).toBeLessThan(0.07)
      expect(Math.abs(paw[2])).toBeLessThan(0.05)
    }
    // its tail lies on the snow behind it
    for (let i = 19; i < 23; i++) {
      expect(sit[i].b[0]).toBeLessThan(hips[0])
      expect(sit[i].b[1]).toBeLessThan(0.12)
    }
  })

  it('gives every bone a real length, so the shader never divides by zero', () => {
    for (const ph of [0, 0.25, 0.5, 0.75]) {
      for (const bs of [pose({}), pose({ sit: 1 }), pose({ run: 1, stride: ph, gallop: 1 })]) {
        for (const x of bs) {
          const len = Math.hypot(x.b[0] - x.a[0], x.b[1] - x.a[1], x.b[2] - x.a[2])
          expect(len).toBeGreaterThan(Math.abs(x.ra - x.rb) + 0.002)
        }
      }
    }
  })
})

describe('its pawprints', () => {
  it('puts each paw down once a stride, where the stride carries it', () => {
    const down: number[] = []
    for (const g of [0, 1]) {
      down.length = 0
      pawsDown(0, 1, g, down)
      expect(down.sort()).toEqual([0, 1, 2, 3])
    }
  })

  it('leaves none while it stands still', () => {
    const down: number[] = []
    pawsDown(0.3, 0.3, 0, down)
    expect(down).toEqual([])
  })

  it('never doubles a paw within a frame, however the stride falls', () => {
    const down: number[] = []
    for (let a = 0; a < 1; a += 0.013) {
      down.length = 0
      pawsDown(a, a + 0.1, 0.5, down)
      expect(new Set(down).size).toBe(down.length)
    }
  })
})
