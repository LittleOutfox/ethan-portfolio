// Every surface is a small ShaderMaterial on the shared uniforms, with the
// common chunk (palette, fog, vignette, dither) ahead of its own shader.
import { ShaderMaterial, type ShaderMaterialParameters } from 'three'
import common from '../shaders/common.glsl?raw'
import type { Uniforms } from '../uniforms'

export function worldMaterial(
  U: Uniforms,
  vertexShader: string,
  fragmentShader: string,
  extra: Omit<ShaderMaterialParameters, 'uniforms' | 'vertexShader' | 'fragmentShader'> & {
    uniforms?: Record<string, { value: unknown }>
  } = {},
): ShaderMaterial {
  const { uniforms, ...rest } = extra
  return new ShaderMaterial({
    uniforms: uniforms ? { ...U, ...uniforms } : U,
    vertexShader,
    fragmentShader: common + '\n' + fragmentShader,
    ...rest,
  })
}
