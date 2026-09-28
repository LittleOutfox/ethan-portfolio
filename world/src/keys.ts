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
  { pos: [60, 11.4, -150], look: [42, 10.6, -220], fov: 45 },
]

/**
 * On a portrait phone the page stacks differently (the tails fox sits high
 * and centred, the contact card fills the width), so a few keys look
 * elsewhere there: straight at the moon behind the fox, and down across the
 * snowfield so the moon rides above the card. Blended in by aspect.
 */
const PORTRAIT_LOOK: Partial<Record<number, Vec3>> = {
  7: [60, 11.4, -160],
  8: [60, 12.55, -160],
  9: [60, -3.5, -220],
}
export const KEYS_PORTRAIT: Key[] = KEYS.map((k, i) => (PORTRAIT_LOOK[i] ? { ...k, look: PORTRAIT_LOOK[i]! } : k))

/** The den's hearth, off the path to the right of the stair top. */
export const HEARTH: Vec3 = [74, 9.8, -104]

/** Where the camera stands when all five tails are earned (key t8) — the tail bands rise in front of it. */
export const SUMMIT: Vec3 = [60, 13.4, -116]

/** Works progress of each DOM gate's pass-through, if the page hasn't published its own. */
export const GATE_PASS_DEFAULT = [0.4, 0.64, 0.88]

/** The moon hangs low over the story's far end, straight down −z. */
export const MOON_DIR: Vec3 = (() => {
  const e = (7.6 * Math.PI) / 180
  return [0, Math.sin(e), -Math.cos(e)]
})()

/**
 * How the world is lit at each key (same t as KEYS). Colours are the site's
 * own tokens (ink #08070d, spirit #a8b4ec, ember #e0a05c) and the winter
 * forest's (moon #e9e8fb, frost #b0acff, glow #4aa8ff), all at night strength.
 *   fog      the blue-violet that distance dissolves into
 *   density  fog density per metre
 *   moon     moon disc + halo strength (the canopy hides it inside the forest)
 *   canopy   how much of the upper sky the forest roof darkens
 *   snow     how much snow is falling (always some: it is winter)
 *   haze     light scattered in the fog: a cold glow all along the horizon,
 *            and moonlight toward the moon — the glow at the end of the path
 */
export interface Grade {
  fog: string
  density: number
  moon: number
  canopy: number
  snow: number
  haze: number
}

export const GRADES: Grade[] = [
  { fog: '#140f32', density: 0.02, moon: 0.0, canopy: 0.2, snow: 0.3, haze: 0.017 },
  { fog: '#140f32', density: 0.024, moon: 0.0, canopy: 0.5, snow: 0.3, haze: 0.031 },
  { fog: '#120e2e', density: 0.03, moon: 0.0, canopy: 0.85, snow: 0.3, haze: 0.036 },
  { fog: '#120e2e', density: 0.03, moon: 0.0, canopy: 0.9, snow: 0.3, haze: 0.032 },
  { fog: '#140f32', density: 0.028, moon: 0.0, canopy: 0.8, snow: 0.3, haze: 0.028 },
  { fog: '#150f34', density: 0.026, moon: 0.1, canopy: 0.7, snow: 0.3, haze: 0.026 },
  { fog: '#14101c', density: 0.03, moon: 0.0, canopy: 0.85, snow: 0.2, haze: 0.012 },
  { fog: '#150f35', density: 0.022, moon: 0.7, canopy: 0.3, snow: 0.35, haze: 0.03 },
  { fog: '#171138', density: 0.02, moon: 1.0, canopy: 0.0, snow: 0.5, haze: 0.03 },
  { fog: '#161034', density: 0.012, moon: 0.65, canopy: 0.0, snow: 1.0, haze: 0.015 },
]
