// One uniforms object shared by every material: the Director writes it once
// per frame and every surface reads the same light.
import { Color, Vector2, Vector3, Vector4 } from 'three'
import { HEARTH, MOON_DIR } from './keys'
import { STREAM, bloomOrbs } from './layout'

export function makeUniforms() {
  return {
    uTime: { value: 0 },
    /** drawing-buffer size in px, for the screen-space vignette and dither */
    uResolution: { value: new Vector2(1, 1) },
    uInk: { value: new Color('#08070d') },
    uSpirit: { value: new Color('#a8b4ec') },
    uMoonColor: { value: new Color('#e9e8fb') },
    uEmber: { value: new Color('#e0a05c') },
    /** frost: the periwinkle in the mist, the trees' glow, the glints in the snow */
    uFrost: { value: new Color('#b0acff') },
    /** spirit light: the blue among the motes in the air and in the moonlit mist */
    uGlow: { value: new Color('#4aa8ff') },
    /** the spirit stream's own light: blue-violet, of a piece with the mist */
    uWater: { value: new Color('#7166ff') },
    /** aqua: the spirit blooms' orbs, and the light they throw */
    uAqua: { value: new Color('#5ce8ff') },
    uMoonDir: { value: new Vector3(...MOON_DIR) },
    uFogColor: { value: new Color('#131226') },
    uFogDensity: { value: 0.02 },
    uMoon: { value: 1 },
    uCanopy: { value: 0 },
    uSnow: { value: 0 },
    uWarm: { value: 0 },
    uHaze: { value: 0.04 },
    uHearth: { value: new Vector3(...HEARTH) },
    /** tails earned, eased (0..5) */
    uTails: { value: 0 },
    /** how awake the foxfire is: dormant at the forest edge, lit from the path on */
    uWake: { value: 0 },
    /** pointer in NDC (xy) and how hard it is stirring (z) */
    uPointer: { value: new Vector3(0, 0, 0) },
    /** px per metre at unit distance: drawing-buffer height / (2·tan(fov/2)) */
    uScale: { value: 800 },
    /** the stream's centreline and half-width (layout.ts STREAM) */
    uStreamA: { value: new Vector4(STREAM.z, STREAM.a1, STREAM.f1, STREAM.p1) },
    uStreamB: { value: new Vector4(STREAM.a2, STREAM.f2, STREAM.p2, STREAM.width) },
    /** each spirit bloom's orb (xyz) and scale (w), for the light it throws on the snow */
    uBlooms: { value: bloomOrbs().map(([x, y, z, s]) => new Vector4(x, y, z, s)) },
  }
}

export type Uniforms = ReturnType<typeof makeUniforms>
