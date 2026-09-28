import { describe, expect, it } from 'vitest'
import { Matrix4, Vector3 } from 'three'
import { ARCHETYPES, buildArchetype, forestFor, treeMatrix } from '../src/trees'
import { GREAT_TREES, cameraSamples, placeTrees } from '../src/layout'

describe('the forest the world draws', () => {
  it('never puts a trunk, limb or leaf clump within 2 m of the camera', () => {
    const cam = cameraSamples(0.01)
    const trees = forestFor(1)
    const m = new Matrix4()
    const v = new Vector3()
    let worst = Infinity
    for (const t of trees) {
      treeMatrix(t, m)
      for (const s of buildArchetype(t.kind).skeleton) {
        v.set(s.x, s.y, s.z).applyMatrix4(m)
        const r = s.r * t.scale
        for (const c of cam) {
          const d = Math.hypot(v.x - c[0], v.y - c[1], v.z - c[2]) - r
          if (d < worst) worst = d
        }
      }
    }
    expect(worst).toBeGreaterThan(2)
  })

  it('keeps most of the seeded forest (the clearance rule trims, it does not clear-cut)', () => {
    expect(forestFor(1).length).toBeGreaterThan(placeTrees(1).length * 0.85)
  })

  it('keeps the great trees: their limbs and curtains clear the camera too', () => {
    const n = GREAT_TREES.length
    expect(forestFor(1).slice(0, n)).toEqual(placeTrees(1).slice(0, n))
  })

  it('is still a prefix at lower density', () => {
    const all = forestFor(1)
    const few = forestFor(0.4)
    expect(few).toEqual(all.slice(0, few.length))
  })
})

describe('buildArchetype', () => {
  const trees = ARCHETYPES.map((_, i) => buildArchetype(i))

  it('builds one tree per archetype, each a real mesh', () => {
    expect(trees.length).toBeGreaterThanOrEqual(4)
    for (const t of trees) expect(t.bark.attributes.position.count).toBeGreaterThan(500)
  })

  it('gives bark well-formed geometry: matching attributes, indices in range, unit normals', () => {
    for (const { bark: g } of trees) {
      const n = g.attributes.position.count
      expect(g.attributes.normal.count).toBe(n)
      expect(g.attributes.aUp.count).toBe(n)
      const idx = g.index!.array
      let max = 0
      for (let i = 0; i < idx.length; i++) if (idx[i] > max) max = idx[i]
      expect(max).toBeLessThan(n)
      const nor = g.attributes.normal
      for (let i = 0; i < n; i += 97) {
        expect(Math.hypot(nor.getX(i), nor.getY(i), nor.getZ(i))).toBeCloseTo(1, 3)
      }
    }
  })

  it('faces its tubes outward (normals agree with triangle winding)', () => {
    const g = trees[0].bark
    const p = g.attributes.position, nor = g.attributes.normal, idx = g.index!.array
    let agree = 0
    for (let t = 0; t < 60; t++) {
      const [a, b, c] = [idx[t * 3], idx[t * 3 + 1], idx[t * 3 + 2]]
      const ux = p.getX(b) - p.getX(a), uy = p.getY(b) - p.getY(a), uz = p.getZ(b) - p.getZ(a)
      const vx = p.getX(c) - p.getX(a), vy = p.getY(c) - p.getY(a), vz = p.getZ(c) - p.getZ(a)
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx
      if (cx * nor.getX(a) + cy * nor.getY(a) + cz * nor.getZ(a) > 0) agree++
    }
    expect(agree).toBe(60)
  })

  it('grows a crown and willow curtains (uv quads) on the leafy archetypes; bare trees have neither', () => {
    ARCHETYPES.forEach((a, i) => {
      const { crown, drapes } = trees[i]
      if (a.leaves === 0) {
        expect(crown).toBeNull()
        expect(drapes).toBeNull()
      } else {
        for (const g of [crown!, drapes!]) {
          expect(g).not.toBeNull()
          expect(g.attributes.uv.count).toBe(g.attributes.position.count)
          expect(g.attributes.position.count % 4).toBe(0) // whole quads
        }
      }
    })
  })

  it('hangs the curtains from the branches: every strand starts high and falls straight down', () => {
    const g = trees[0].drapes!
    const p = g.attributes.position, uv = g.attributes.uv
    for (let q = 0; q < p.count; q += 4) {
      // quad corners: 0,1 bottom (v = 0), 2,3 top (v = 1)
      expect(uv.getY(q)).toBe(0)
      expect(uv.getY(q + 3)).toBe(1)
      expect(p.getY(q + 3)).toBeGreaterThan(p.getY(q))
      expect(p.getX(q + 3)).toBeCloseTo(p.getX(q), 5)
      expect(p.getY(q)).toBeGreaterThan(3) // the curtain never sweeps the ground
    }
  })

  it('is deterministic', () => {
    const again = buildArchetype(0)
    expect(Array.from(again.bark.attributes.position.array.slice(0, 60))).toEqual(
      Array.from(trees[0].bark.attributes.position.array.slice(0, 60)),
    )
  })
})
