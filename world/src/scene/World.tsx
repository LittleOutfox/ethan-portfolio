import { useMemo } from 'react'
import type { Bus } from '../bus'
import { GATE_PASS_DEFAULT } from '../keys'
import type { TierSpec } from '../tiers'
import { forestFor } from '../trees'
import { makeUniforms } from '../uniforms'
import { Air } from './Air'
import { Blooms } from './Blooms'
import { Director } from './Director'
import { Forest } from './Forest'
import { Foxfire } from './Foxfire'
import { Shrine } from './Shrine'
import { Sky } from './Sky'
import { Terrain } from './Terrain'

/** The whole world. Everything is built during render (never in effects) so the boot's compile pass sees it all. */
export function World({ bus, tier }: { bus: Bus; tier: TierSpec }) {
  const U = useMemo(makeUniforms, [])
  const trees = useMemo(() => forestFor(tier.density), [tier])
  // where the page's own torii pass through (works progress); fixed once the page has built them
  const gates = useMemo(
    () => (bus.gates.length === 3 && bus.gates.every((g) => g > 0 && g < 1) ? bus.gates.slice() : GATE_PASS_DEFAULT),
    [bus],
  )
  return (
    <>
      <Director bus={bus} U={U} />
      <Terrain U={U} />
      <Blooms U={U} />
      <Forest U={U} trees={trees} msaa={tier.antialias} />
      <Shrine U={U} gates={gates} />
      <Sky U={U} />
      <Foxfire U={U} density={tier.density} gates={gates} />
      <Air U={U} density={tier.density} />
    </>
  )
}
