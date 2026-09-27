// One uniforms object shared by every material: the Director writes it once
// per frame and every surface reads the same light.
import { Color, Vector2, Vector3 } from 'three'
import { MOON_DIR } from './keys'

export function makeUniforms() {
  return {
    uTime: { value: 0 },
    /** drawing-buffer size in px, for the screen-space vignette and dither */
    uResolution: { value: new Vector2(1, 1) },
    uInk: { value: new Color('#08070d') },
    uSpirit: { value: new Color('#a8b4ec') },
    uMoonColor: { value: new Color('#ece7f4') },
    uEmber: { value: new Color('#e0a05c') },
    uMoonDir: { value: new Vector3(...MOON_DIR) },
    uFogColor: { value: new Color('#131226') },
    uFogDensity: { value: 0.02 },
    uMoon: { value: 1 },
    uCanopy: { value: 0 },
    uSnow: { value: 0 },
    uWarm: { value: 0 },
  }
}

export type Uniforms = ReturnType<typeof makeUniforms>
