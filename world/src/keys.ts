// The authored journey: one camera key per story-segment boundary (t = 0..9)
// and the world's look at each of those moments. Tuned by eye against
// screenshots — world units are metres, +y up, the story heads toward −z.
//
//   t0 meadow before the forest edge (hero)      t5 top of the torii stair
//   t1 at the forest edge (hero zoom-through)    t6 the den hollow, hearth to the right
//   t2 on the path inside the forest (hunt)      t7 summit clearing (tails)
//   t3 end of the trail truck (hunt)             t8 craned up, moon behind the fox
//   t4 foot of the torii stair (works)           t9 out on the snowfield (contact)
import type { Key, Vec3 } from './path'

export const KEYS: Key[] = [
  { pos: [0, 1.7, 30], look: [0, 5, -60], fov: 45 },
  { pos: [0, 1.6, 12], look: [0, 3.6, -60], fov: 45 },
  { pos: [2, 1.7, -14], look: [4, 2.8, -60], fov: 46 },
  { pos: [40, 1.8, -20], look: [40, 2.8, -70], fov: 46 },
  { pos: [60, 2.0, -34], look: [60, 7.5, -90], fov: 44 },
  { pos: [60, 10.4, -84], look: [62, 11.4, -130], fov: 44 },
  { pos: [64, 10.8, -96], look: [74, 10.2, -104], fov: 46 },
  { pos: [60, 12.2, -112], look: [70, 17, -160], fov: 44 },
  { pos: [60, 13.4, -116], look: [70, 22, -160], fov: 42 },
  { pos: [60, 11.4, -150], look: [60, 10.6, -220], fov: 45 },
]

/** The moon hangs low over the story's far end, straight down −z. */
export const MOON_DIR: Vec3 = (() => {
  const e = (7.6 * Math.PI) / 180
  return [0, Math.sin(e), -Math.cos(e)]
})()

/**
 * How the world is lit at each key (same t as KEYS). Colours are the site's
 * own tokens: ink #08070d, spirit #a8b4ec, moon #ece7f4, ember #e0a05c.
 *   fog      the colour distance dissolves into
 *   density  fog density per metre
 *   moon     moon disc + halo strength (the canopy hides it inside the forest)
 *   canopy   how much of the upper sky the forest roof darkens
 *   snow     falling snow amount
 */
export interface Grade {
  fog: string
  density: number
  moon: number
  canopy: number
  snow: number
}

export const GRADES: Grade[] = [
  { fog: '#15142a', density: 0.018, moon: 1.0, canopy: 0.0, snow: 0.0 },
  { fog: '#131226', density: 0.022, moon: 0.8, canopy: 0.3, snow: 0.0 },
  { fog: '#111024', density: 0.03, moon: 0.35, canopy: 0.8, snow: 0.0 },
  { fog: '#111024', density: 0.03, moon: 0.25, canopy: 0.85, snow: 0.0 },
  { fog: '#121126', density: 0.028, moon: 0.4, canopy: 0.7, snow: 0.0 },
  { fog: '#131227', density: 0.026, moon: 0.4, canopy: 0.6, snow: 0.0 },
  { fog: '#171219', density: 0.03, moon: 0.2, canopy: 0.8, snow: 0.0 },
  { fog: '#15142a', density: 0.02, moon: 0.9, canopy: 0.2, snow: 0.05 },
  { fog: '#17162d', density: 0.018, moon: 1.25, canopy: 0.0, snow: 0.25 },
  { fog: '#1a1a30', density: 0.016, moon: 1.0, canopy: 0.0, snow: 1.0 },
]
