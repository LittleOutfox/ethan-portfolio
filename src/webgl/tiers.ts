/**
 * Device tiers decided once, before the WebGL chunk is even requested.
 * Fragment cost scales with (point size × DPR)^2, so DPR is capped harder than the usual 2.
 */
export type Tier = 'high' | 'medium' | 'low' | 'none'

export interface TierSpec {
  tier: Tier
  points: number
  dprCap: number
  pointSize: number
  /** low tier forms the hero only; the contact pose stays a poster */
  gather: boolean
}

const SPECS: Record<Exclude<Tier, 'none'>, TierSpec> = {
  high: { tier: 'high', points: 60_000, dprCap: 1.75, pointSize: 4.2, gather: true },
  medium: { tier: 'medium', points: 34_000, dprCap: 1.5, pointSize: 4.2, gather: true },
  low: { tier: 'low', points: 16_000, dprCap: 1.25, pointSize: 3.8, gather: false },
}

const WEAK_GPU = /Mali-G5|Mali-G7[0-2]|Mali-T|Adreno \(TM\) [45]|PowerVR|Intel\(R\) HD Graphics [45]|SwiftShader|llvmpipe/i

export function probeWebGL2(): { ok: boolean; renderer: string } {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: false })
    if (!gl) return { ok: false, renderer: '' }
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return { ok: true, renderer }
  } catch {
    return { ok: false, renderer: '' }
  }
}

export function detectTier(): TierSpec | null {
  if (typeof window === 'undefined') return null
  const { ok, renderer } = probeWebGL2()
  if (!ok) return null
  const coarse = matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency ?? 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  if (saveData) return null
  // ?tier=high|medium|low|none forces a tier for testing
  const forced = new URLSearchParams(location.search).get('tier')
  if (forced === 'none') return null
  if (forced === 'high' || forced === 'medium' || forced === 'low') return SPECS[forced]
  if (coarse || cores <= 4 || mem < 4 || WEAK_GPU.test(renderer)) return SPECS.low
  if (cores <= 8 || mem < 8 || /Intel/i.test(renderer)) return SPECS.medium
  return SPECS.high
}
