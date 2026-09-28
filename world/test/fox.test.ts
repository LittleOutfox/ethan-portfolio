import { describe, expect, it } from 'vitest'
import { KEYS } from '../src/keys'
import { fitFov, makeCameraPath, type Pose } from '../src/path'
import { cameraSamples } from '../src/layout'
import { forestFor } from '../src/trees'
import { FOX_BONES, FOX_BOX, foxPose, groundAt, makeFoxPath, makeGait, pawSpot, pawsDown, stepGait, stepHeading, type Gait } from '../src/fox'

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

  /** the four paws (front left, front right, hind left, hind right): bone and end */
  const PAWS = [10, 12, 15, 18]
  const bones = new Float32Array(FOX_BONES * 8)
  /** Run at `speed` for a while, then watch each paw for `seconds`: where it is on the snow (world x along the path) and when it lands. */
  const watch = (speed: number, seconds = 1.5, dt = 1 / 120) => {
    const g = run(makeGait(), speed, 3, dt)
    let s = 0
    const trail: { s: number; stride: number; paws: { x: number; y: number }[] }[] = []
    for (let k = 0; k < seconds / dt; k++) {
      s += speed * dt
      stepGait(g, speed * dt, dt)
      foxPose(g, k * dt, 0, bones)
      trail.push({ s, stride: g.stride, paws: PAWS.map((i) => ({ x: bones[i * 8 + 4], y: bones[i * 8 + 5] })) })
    }
    return { g, trail }
  }
  /** a paw bearing its weight is on the snow (a swinging paw, however low, is above it) */
  const onSnow = (y: number) => y < 0.02201
  /** the stride fraction at which each paw lands, in order */
  const landings = (trail: ReturnType<typeof watch>['trail']) => {
    const out: { paw: number; at: number }[] = []
    for (let k = 1; k < trail.length; k++) {
      trail[k].paws.forEach((p, i) => {
        if (onSnow(p.y) && !onSnow(trail[k - 1].paws[i].y)) out.push({ paw: i, at: trail[k].stride })
      })
    }
    return out
  }

  it('plants its paws: a paw on the snow stays where it came down while it runs on, at a walk, a trot and a gallop', () => {
    for (const speed of [0.7, 2.5, 7]) {
      const { trail } = watch(speed)
      let planted = 0
      for (let k = 1; k < trail.length; k++) {
        trail[k].paws.forEach((p, i) => {
          const q = trail[k - 1].paws[i]
          if (onSnow(p.y) && onSnow(q.y)) {
            planted++
            expect(Math.abs(trail[k].s + p.x - (trail[k - 1].s + q.x))).toBeLessThan(0.002)
          }
        })
      }
      expect(planted).toBeGreaterThan(10)
    }
  })

  it('walks, trots and gallops as a fox does: each paw in turn at a walk, the diagonal pairs together at a trot, the hind pair then the fore pair at a gallop', () => {
    const order = (speed: number) => landings(watch(speed, 3).trail)
    // a walk: hind left, fore left, hind right, fore right, a quarter stride apart
    const walk = order(0.7)
    const seq = walk.slice(0, 8).map((l) => l.paw).join('')
    expect('20312031203120312031').toContain(seq)
    for (let k = 1; k < 5; k++) expect(walk[k].at - walk[k - 1].at).toBeCloseTo(0.25, 1)
    // a trot: fore left with hind right, fore right with hind left
    const trot = order(2.5)
    for (let k = 0; k + 1 < trot.length; k += 2) {
      const pair = [trot[k].paw, trot[k + 1].paw].sort().join('')
      expect(['03', '12']).toContain(pair)
      expect(Math.abs(trot[k + 1].at - trot[k].at)).toBeLessThan(0.05)
    }
    // a gallop: the hinds land one after the other, then the fores
    const gallop = order(7)
    const hindFirst = gallop.findIndex((l) => l.paw >= 2)
    const next4 = gallop.slice(hindFirst, hindFirst + 4).map((l) => l.paw >= 2)
    expect(next4).toEqual([true, true, false, false])
  })

  it('lengthens its stride as it goes faster, and never cycles its legs faster than a fox can', () => {
    const cadence = (speed: number) => {
      const g = run(makeGait(), speed, 3)
      const before = g.stride
      run(g, speed, 1)
      return g.stride - before
    }
    expect(cadence(0.5)).toBeLessThan(1.2)
    expect(cadence(2.5)).toBeGreaterThan(2)
    expect(cadence(2.5)).toBeLessThan(3.2)
    expect(cadence(8)).toBeLessThan(3.7)
    expect(cadence(60)).toBeLessThan(3.7)
  })

  it('gallops when the scroll runs fast, and walks when it runs slow', () => {
    expect(run(makeGait(), 9, 1).gallop).toBeGreaterThan(0.9)
    const slow = run(makeGait(), 0.6, 2)
    expect(slow.walk).toBeGreaterThan(0.9)
    expect(slow.gallop).toBeLessThan(0.05)
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

  it('settles once the scroll has all but stopped: the last creep of a smoothed scroll is not running', () => {
    const g = run(makeGait(), 4, 1)
    run(g, 0.02, 3)
    expect(g.sit).toBeGreaterThan(0.9)
  })

  it('sits down haunches first, and gets up haunches first', () => {
    const g = run(makeGait(), 3, 1)
    run(g, 0, 1.5)
    // part way down, its hind end is further along than its front
    expect(g.sitRear).toBeGreaterThan(g.sit + 0.1)
    run(g, 0, 3)
    expect(g.sit).toBeGreaterThan(0.9)
    expect(g.sitRear).toBeGreaterThan(0.95)
    // and as it gets up to go, its hind end rises first
    run(g, 3, 0.1)
    expect(g.sitRear).toBeLessThan(g.sit - 0.1)
  })

  it('steps round as it turns in place, and waits to sit until it has turned', () => {
    const g = run(makeGait(), 3, 1)
    run(g, 0, 0.5)
    const before = g.stride
    const dt = 1 / 120
    for (let t = 0; t < 1; t += dt) stepGait(g, 0, dt, 1.5 * dt)
    expect(g.stride - before).toBeGreaterThan(0.4)
    expect(g.run).toBeGreaterThan(0.5)
    expect(g.sit).toBeLessThan(0.1)
  })

  it('turns to face you as a fox turns: slowly at first, then round, and settles without overshooting', () => {
    const h = { heading: 0, vel: 0 }
    const dt = 1 / 120
    let early = 0
    let most = 0
    for (let k = 0; k < 480; k++) {
      stepHeading(h, Math.PI / 2, 3, dt)
      if (k === 11) early = h.heading
      most = Math.max(most, h.heading)
    }
    expect(early).toBeLessThan(0.08)
    expect(Math.abs(h.heading - Math.PI / 2)).toBeLessThan(0.02)
    expect(most).toBeLessThan(Math.PI / 2 + 0.02)
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
  const pose = (g: Partial<Gait>, look = 0, time = 0) => {
    foxPose({ ...makeGait(), sit: 0, sitRear: 0, run: 0, ...g }, time, look, bones)
    const b = (i: number) => ({ a: [bones[i * 8], bones[i * 8 + 1], bones[i * 8 + 2]], ra: bones[i * 8 + 3], b: [bones[i * 8 + 4], bones[i * 8 + 5], bones[i * 8 + 6]], rb: bones[i * 8 + 7] })
    return Array.from({ length: FOX_BONES }, (_, i) => b(i))
  }
  const SIT: Partial<Gait> = { sit: 1, sitRear: 1 }
  /** a walk, a trot, a gallop, and the flying gallop of a fast scroll */
  const GAITS: Partial<Gait>[] = [
    { walk: 1, gallop: 0, speed: 0.7 },
    { walk: 0, gallop: 0, speed: 2.5 },
    { walk: 0, gallop: 1, speed: 8 },
    { walk: 0, gallop: 1, speed: 40 },
  ]
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
    inBox(pose(SIT))
    inBox(pose(SIT, 2))
    inBox(pose(SIT, -2))
    for (let ph = 0; ph < 1; ph += 0.05) {
      for (const g of GAITS) inBox(pose({ run: 1, stride: ph, ...g }))
    }
  })

  it('sits down on its haunches', () => {
    const stand = pose({})
    const sit = pose(SIT)
    const hips = (bs: ReturnType<typeof pose>) => bs[0].b[1]
    expect(hips(sit)).toBeLessThan(hips(stand) - 0.1)
    expect(lowest(sit)).toBeGreaterThan(-0.02)
  })

  it('sits as a fox sits: upright, its chest high over its haunches, forepaws together under its chest', () => {
    const sit = pose(SIT)
    const [chest, hips] = [sit[0].a, sit[0].b]
    // (as the model sits: its chest well over the round mass of its haunches)
    expect(chest[1] - hips[1]).toBeGreaterThan(0.2)
    for (const i of [10, 12]) {
      const paw = sit[i].b
      expect(Math.abs(paw[0] - chest[0])).toBeLessThan(0.07)
      expect(Math.abs(paw[2])).toBeLessThan(0.05)
    }
    // its tail lies on the snow, curled round one side of it toward its forepaws
    for (let i = 19; i < 23; i++) expect(sit[i].b[1]).toBeLessThan(0.12)
    expect(Math.min(...[19, 20, 21, 22].map((i) => sit[i].b[2]))).toBeLessThan(-0.2)
    expect(sit[22].b[0]).toBeGreaterThan(hips[0])
  })

  it("has a fox's proportions, measured from the fox model Ethan chose", () => {
    const sit = pose(SIT)
    const top = Math.max(...sit.flatMap((x) => [x.a[1] + x.ra, x.b[1] + x.rb]))
    // sitting, 0.8 m to its ear tips (the model, scaled to that height)
    expect(top).toBeGreaterThan(0.78)
    expect(top).toBeLessThan(0.83)
    for (const bs of [sit, pose({})]) {
      // a big head: about a third of a metre from the back of its skull to the tip of its muzzle
      expect(bs[4].b[0] + bs[4].rb - (bs[3].a[0] - bs[3].ra)).toBeGreaterThan(0.3)
      // broad ears, set wide: their tips a quarter of a metre apart
      expect(bs[7].b[2] - bs[8].b[2]).toBeGreaterThan(0.22)
      expect(bs[7].ra).toBeGreaterThanOrEqual(0.045)
      // a deep, full body
      expect(bs[0].ra).toBeGreaterThanOrEqual(0.125)
      expect(bs[0].rb).toBeGreaterThanOrEqual(0.12)
    }
    const thickest = (bs: ReturnType<typeof pose>) => Math.max(...[19, 20, 21, 22].map((i) => Math.max(bs[i].ra, bs[i].rb)))
    // a great plume of a tail streaming behind it, and lying on the snow as the model's does when it sits
    expect(thickest(pose({}))).toBeGreaterThanOrEqual(0.09)
    expect(thickest(sit)).toBeGreaterThanOrEqual(0.07)
    // sitting, its muzzle at three quarters of its height
    expect(sit[4].b[1] / top).toBeGreaterThan(0.7)
    expect(sit[4].b[1] / top).toBeLessThan(0.8)
  })

  /** its bones over one stride at a gait */
  const stride = (g: Partial<Gait>, n = 50) => Array.from({ length: n }, (_, k) => pose({ run: 1, stride: k / n, ...g }))
  const GALLOPING = GAITS[2]
  const TROTTING = GAITS[1]
  const range = (xs: number[]) => Math.max(...xs) - Math.min(...xs)

  it('streams its tail straight out behind it as it runs, a little below its back, steady: never waving', () => {
    for (const g of [TROTTING, GALLOPING]) {
      const tips = stride(g).map((bs) => bs[22].b)
      expect(range(tips.map((t) => t[2]))).toBeLessThan(0.01)
      expect(range(tips.map((t) => t[1]))).toBeLessThan(0.08)
      for (const bs of stride(g)) {
        expect(bs[22].b[0]).toBeLessThan(bs[0].b[0] - 0.5)
        expect(bs[22].b[1]).toBeLessThan(bs[19].a[1])
      }
    }
  })

  it('carries its head forward and low as it gallops, and its head moves with its stride', () => {
    const stand = pose({})
    const gallop = stride(GALLOPING).map((bs) => bs[3].b)
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    expect(mean(gallop.map((h) => h[1]))).toBeLessThan(stand[3].b[1] - 0.06)
    expect(mean(gallop.map((h) => h[0]))).toBeGreaterThan(stand[3].b[0])
    expect(range(gallop.map((h) => h[1]))).toBeGreaterThan(0.02)
    expect(range(stride(TROTTING).map((bs) => bs[3].b[1]))).toBeGreaterThan(0.012)
  })

  it('looks about while it waits: its head is never quite still', () => {
    const heads = Array.from({ length: 40 }, (_, k) => pose(SIT, 0, k * 0.25)[3].b)
    expect(range(heads.map((h) => h[0])) + range(heads.map((h) => h[2]))).toBeGreaterThan(0.02)
  })

  it('reaches out in the stretch of a gallop and gathers its legs under it', () => {
    let fore = -1
    let hindBack = 1
    let hindUnder = -1
    for (const bs of stride(GALLOPING)) {
      const [chest, hips] = [bs[0].a, bs[0].b]
      for (const i of [10, 12]) fore = Math.max(fore, bs[i].b[0] - chest[0])
      for (const i of [15, 18]) {
        hindBack = Math.min(hindBack, bs[i].b[0] - hips[0])
        hindUnder = Math.max(hindUnder, bs[i].b[0] - hips[0])
      }
    }
    expect(fore).toBeGreaterThan(0.2)
    expect(hindBack).toBeLessThan(-0.22)
    expect(hindUnder).toBeGreaterThan(0.12)
  })

  it('runs on slender legs, clean of its body', () => {
    for (const bs of [pose({}), ...stride(GALLOPING, 10)]) {
      for (const i of [9, 11]) expect(bs[i].rb).toBeLessThanOrEqual(0.032) // at the elbow
      for (const i of [10, 12]) expect(Math.max(bs[i].ra, bs[i].rb)).toBeLessThanOrEqual(0.028) // the fore leg
      for (const i of [13, 16]) expect(bs[i].rb).toBeLessThanOrEqual(0.042) // at the knee
      for (const i of [14, 15, 17, 18]) expect(Math.max(bs[i].ra, bs[i].rb)).toBeLessThanOrEqual(0.032) // the hind leg
    }
  })

  it('gives every bone a real length, so the shader never divides by zero', () => {
    for (const ph of [0, 0.2, 0.4, 0.6, 0.8]) {
      for (const bs of [pose({}), pose(SIT), ...GAITS.map((g) => pose({ run: 1, stride: ph, ...g }))]) {
        for (const x of bs) {
          const len = Math.hypot(x.b[0] - x.a[0], x.b[1] - x.a[1], x.b[2] - x.a[2])
          expect(len).toBeGreaterThan(Math.abs(x.ra - x.rb) + 0.002)
        }
      }
    }
  })
})

describe('its pawprints', () => {
  const trot = { ...makeGait(), walk: 0, gallop: 0, speed: 2.5 }
  const gallop = { ...makeGait(), walk: 0, gallop: 1, speed: 8 }

  it('puts each paw down once a stride', () => {
    const down: number[] = []
    for (const g of [trot, gallop]) {
      down.length = 0
      pawsDown(0, 1, g, down)
      expect(down.sort()).toEqual([0, 1, 2, 3])
    }
  })

  it('leaves none while it stands still', () => {
    const down: number[] = []
    pawsDown(0.3, 0.3, trot, down)
    expect(down).toEqual([])
  })

  it('never doubles a paw within a frame, however the stride falls', () => {
    const down: number[] = []
    for (let a = 0; a < 1; a += 0.013) {
      down.length = 0
      pawsDown(a, a + 0.1, trot, down)
      expect(new Set(down).size).toBe(down.length)
    }
  })

  it('leaves each print under the paw that made it', () => {
    const bones = new Float32Array(FOX_BONES * 8)
    const PAWS = [10, 12, 15, 18]
    for (const speed of [0.7, 2.5, 7]) {
      const g = makeGait()
      const dt = 1 / 120
      for (let k = 0; k < 360; k++) stepGait(g, speed * dt, dt)
      let s = 0
      const prints: { paw: number; x: number; z: number }[] = []
      const down: number[] = []
      let checked = 0
      for (let k = 0; k < 240; k++) {
        const before = g.stride
        s += speed * dt
        stepGait(g, speed * dt, dt)
        foxPose(g, 0, 0, bones)
        down.length = 0
        pawsDown(before, g.stride, g, down)
        for (const i of down) {
          const [px, pz] = pawSpot(i, g)
          prints[i] = { paw: i, x: s + px, z: pz }
        }
        // while a paw that left a print is on the snow, it stands on its print
        PAWS.forEach((b, i) => {
          const pr = prints[i]
          if (!pr || bones[b * 8 + 5] > 0.02201) return
          expect(Math.abs(s + bones[b * 8 + 4] - pr.x)).toBeLessThan(0.02)
          expect(Math.abs(bones[b * 8 + 6] - pr.z)).toBeLessThan(0.02)
          checked++
        })
      }
      expect(checked).toBeGreaterThan(20)
    }
  })
})
