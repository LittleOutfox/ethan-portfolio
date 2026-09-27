import { describe, expect, it } from 'vitest'
import { tierFor } from '../src/tiers'

const desktop = { renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 5060 Ti Direct3D11 vs_5_0 ps_5_0)', coarse: false, cores: 28, memory: 8, saveData: false, forced: null }

describe('tierFor', () => {
  it('gives a discrete desktop GPU the high tier', () => {
    expect(tierFor(desktop)?.tier).toBe('high')
  })

  it('gives integrated GPUs the medium tier', () => {
    expect(tierFor({ ...desktop, renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11)', cores: 8 })?.tier).toBe('medium')
    expect(tierFor({ ...desktop, renderer: 'Apple GPU', cores: 8 })?.tier).toBe('medium')
  })

  it('gives touch devices the low tier', () => {
    expect(tierFor({ ...desktop, renderer: 'Apple GPU', coarse: true, cores: 6 })?.tier).toBe('low')
    expect(tierFor({ ...desktop, renderer: 'Adreno (TM) 740', coarse: true, cores: 8 })?.tier).toBe('low')
  })

  it('refuses software renderers and data saver outright', () => {
    expect(tierFor({ ...desktop, renderer: 'Google SwiftShader' })).toBeNull()
    expect(tierFor({ ...desktop, saveData: true })).toBeNull()
  })

  it('honours a ?tier= override for testing', () => {
    expect(tierFor({ ...desktop, forced: 'low' })?.tier).toBe('low')
    expect(tierFor({ ...desktop, forced: 'none' })).toBeNull()
  })
})
