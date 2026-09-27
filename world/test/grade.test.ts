import { describe, expect, it } from 'vitest'
import { Color } from 'three'
import { GRADES } from '../src/keys'
import { gradeAt, makeGrade } from '../src/grade'

describe('gradeAt', () => {
  it('reproduces each authored key exactly at its time', () => {
    const g = makeGrade()
    GRADES.forEach((key, i) => {
      gradeAt(i, g)
      expect(g.density).toBeCloseTo(key.density, 6)
      expect(g.moon).toBeCloseTo(key.moon, 6)
      expect(g.canopy).toBeCloseTo(key.canopy, 6)
      expect(g.snow).toBeCloseTo(key.snow, 6)
      const c = new Color(key.fog)
      expect(g.fog.r).toBeCloseTo(c.r, 6)
      expect(g.fog.b).toBeCloseTo(c.b, 6)
    })
  })

  it('blends between neighbouring keys', () => {
    const g = makeGrade()
    gradeAt(8.5, g)
    expect(g.snow).toBeGreaterThan(GRADES[8].snow)
    expect(g.snow).toBeLessThan(GRADES[9].snow)
  })

  it('holds the first and last keys outside the story', () => {
    const g = makeGrade()
    gradeAt(-2, g)
    expect(g.density).toBeCloseTo(GRADES[0].density, 6)
    gradeAt(40, g)
    expect(g.snow).toBeCloseTo(GRADES[GRADES.length - 1].snow, 6)
  })
})
