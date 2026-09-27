// Device tiers, decided once before the scene is built (adapted from the v2
// branch's src/webgl/tiers.ts). The world is a soft, foggy backdrop, so the
// levers are resolution, antialiasing and how much of the forest we draw.
export type Tier = 'high' | 'medium' | 'low'

export interface TierSpec {
  tier: Tier
  /** max device-pixel ratio the canvas renders at */
  dpr: number
  antialias: boolean
  /** 0..1 share of the seeded forest, foxfire and snow this tier draws */
  density: number
  powerPreference: 'high-performance' | 'default'
}

const SPECS: Record<Tier, TierSpec> = {
  high: { tier: 'high', dpr: 1.5, antialias: true, density: 1, powerPreference: 'high-performance' },
  medium: { tier: 'medium', dpr: 1.25, antialias: false, density: 0.65, powerPreference: 'default' },
  low: { tier: 'low', dpr: 1, antialias: false, density: 0.4, powerPreference: 'default' },
}

const WEAK_GPU = /Mali-G5|Mali-G7[0-2]|Mali-T|Adreno \(TM\) [45]|PowerVR|Intel\(R\) HD Graphics [45]/i
/** integrated GPUs on machines whose core count would otherwise read as high */
const MID_GPU = /Radeon\(TM\) Graphics|Radeon Vega|Apple GPU|Apple M1(?!\s*(Pro|Max|Ultra))/i
/** a software rasterizer (a VM, remote desktop, a broken driver) never runs the world */
const SOFTWARE = /SwiftShader|llvmpipe|Microsoft Basic Render|Software Rasterizer/i

export interface Device {
  renderer: string
  coarse: boolean
  cores: number
  memory: number
  saveData: boolean
  /** ?tier=high|medium|low|none, for testing */
  forced: string | null
}

export function tierFor(d: Device): TierSpec | null {
  if (d.saveData || d.forced === 'none') return null
  if (d.forced === 'high' || d.forced === 'medium' || d.forced === 'low') return SPECS[d.forced]
  if (SOFTWARE.test(d.renderer)) return null
  if (d.coarse || d.cores <= 4 || d.memory < 4 || WEAK_GPU.test(d.renderer)) return SPECS.low
  if (d.cores <= 8 || d.memory < 8 || /Intel/i.test(d.renderer) || MID_GPU.test(d.renderer)) return SPECS.medium
  return SPECS.high
}

/** Probe for WebGL2 and read the renderer string, then release the context. */
export function probeWebGL2(): { ok: boolean; renderer: string } {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: true })
    if (!gl) return { ok: false, renderer: '' }
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return { ok: true, renderer }
  } catch {
    return { ok: false, renderer: '' }
  }
}

/** The tier for this browser, or null when the world should not run. */
export function detectTier(): TierSpec | null {
  const { ok, renderer } = probeWebGL2()
  if (!ok) return null
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  return tierFor({
    renderer,
    coarse: matchMedia('(pointer: coarse)').matches,
    cores: nav.hardwareConcurrency ?? 4,
    memory: nav.deviceMemory ?? 8,
    saveData: !!nav.connection?.saveData,
    forced: new URLSearchParams(location.search).get('tier'),
  })
}
