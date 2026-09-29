import { describe, expect, it } from 'vitest'
import { GATE_PASS_DEFAULT, gatePasses } from '../src/keys'

describe('the works gates’ pass points', () => {
  it('matches the page’s timeline: gate i passes at (2 + 2.6i + 2.4) / (2 + 2.6n + 1.1)', () => {
    const three = gatePasses(3)
    expect(three).toHaveLength(3)
    ;[0.4037, 0.6422, 0.8807].forEach((v, i) => expect(three[i]).toBeCloseTo(v, 3))
  })

  it('defaults to five gates, evenly spread through the corridor', () => {
    expect(GATE_PASS_DEFAULT).toHaveLength(5)
    ;[0.2733, 0.4348, 0.5963, 0.7578, 0.9193].forEach((v, i) => expect(GATE_PASS_DEFAULT[i]).toBeCloseTo(v, 3))
    for (let i = 1; i < 5; i++) expect(GATE_PASS_DEFAULT[i]).toBeGreaterThan(GATE_PASS_DEFAULT[i - 1])
  })
})
