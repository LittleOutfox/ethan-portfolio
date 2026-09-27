// The world's light at world time t: a smooth blend between the authored
// GRADES (one per camera key). Colours mix in linear space.
import { Color } from 'three'
import { GRADES } from './keys'

export interface GradeState {
  fog: Color
  density: number
  moon: number
  canopy: number
  snow: number
}

const FOGS = GRADES.map((g) => new Color(g.fog))

export function makeGrade(): GradeState {
  return { fog: new Color(), density: 0, moon: 0, canopy: 0, snow: 0 }
}

export function gradeAt(t: number, out: GradeState): GradeState {
  const n = GRADES.length
  const tc = t < 0 ? 0 : t > n - 1 ? n - 1 : t
  const i = Math.min(n - 2, Math.floor(tc))
  const f = tc - i
  const s = f * f * (3 - 2 * f)
  const a = GRADES[i]
  const b = GRADES[i + 1]
  out.fog.copy(FOGS[i]).lerp(FOGS[i + 1], s)
  out.density = a.density + (b.density - a.density) * s
  out.moon = a.moon + (b.moon - a.moon) * s
  out.canopy = a.canopy + (b.canopy - a.canopy) * s
  out.snow = a.snow + (b.snow - a.snow) * s
  return out
}
