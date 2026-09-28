import { describe, expect, it } from 'vitest'
import { Vector3, type BufferGeometry } from 'three'
import { buildBloom } from '../src/bloom'
import { BLOOM } from '../src/layout'

function wellFormed(g: BufferGeometry) {
  const n = g.attributes.position.count
  expect(n).toBeGreaterThan(50)
  expect(g.attributes.normal.count).toBe(n)
  const idx = g.index!.array
  let max = 0
  for (let i = 0; i < idx.length; i++) if (idx[i] > max) max = idx[i]
  expect(max).toBeLessThan(n)
  const nor = g.attributes.normal
  for (let i = 0; i < n; i++) expect(Math.hypot(nor.getX(i), nor.getY(i), nor.getZ(i))).toBeCloseTo(1, 3)
}

describe('buildBloom', () => {
  const { bark, leaves } = buildBloom()
  const orb = new Vector3(0, BLOOM.orbY, 0)
  const v = new Vector3()

  it('is well-formed: matching attributes, indices in range, unit normals', () => {
    wellFormed(bark)
    wellFormed(leaves)
    expect(leaves.attributes.uv.count).toBe(leaves.attributes.position.count)
  })

  it('cradles its orb: the stalk rises to just beneath it, and nothing pierces it', () => {
    const p = bark.attributes.position
    let nearest = Infinity
    for (let i = 0; i < p.count; i++) {
      const d = v.fromBufferAttribute(p, i).distanceTo(orb)
      expect(d).toBeGreaterThan(BLOOM.orbR * 0.98)
      nearest = Math.min(nearest, d)
    }
    expect(nearest).toBeLessThan(BLOOM.orbR * 1.1)
  })

  it('splays its roots out into the snow, within its reach', () => {
    const p = bark.attributes.position
    let spread = 0
    for (let i = 0; i < p.count; i++) {
      const r = Math.hypot(p.getX(i), p.getZ(i))
      expect(r).toBeLessThanOrEqual(BLOOM.reach)
      if (p.getY(i) < 0.3) spread = Math.max(spread, r)
    }
    expect(spread).toBeGreaterThan(BLOOM.reach * 0.7)
  })

  it('keeps its leaves about its foot, below the orb', () => {
    const p = leaves.attributes.position
    for (let i = 0; i < p.count; i++) {
      expect(p.getY(i)).toBeLessThan(BLOOM.orbY - BLOOM.orbR)
      expect(Math.hypot(p.getX(i), p.getZ(i))).toBeLessThanOrEqual(BLOOM.reach)
    }
  })

  it('grows every stem in one smooth line: no step doubles back on the last', () => {
    const a = new Vector3()
    const b = new Vector3()
    for (const pts of buildBloom().stems) {
      for (let i = 2; i < pts.length; i++) {
        a.subVectors(pts[i - 1], pts[i - 2]).normalize()
        b.subVectors(pts[i], pts[i - 1]).normalize()
        expect(a.dot(b)).toBeGreaterThan(0)
      }
    }
  })

  it('keeps its glow above the snow', () => {
    expect(BLOOM.orbY - BLOOM.glowR).toBeGreaterThan(0.1)
  })
})
