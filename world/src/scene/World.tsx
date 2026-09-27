import { useMemo } from 'react'
import type { Bus } from '../bus'
import { placeTrees } from '../layout'
import type { TierSpec } from '../tiers'
import { makeUniforms } from '../uniforms'
import { Director } from './Director'
import { Forest } from './Forest'
import { Sky } from './Sky'
import { Terrain } from './Terrain'

/** The whole world. Everything is built during render (never in effects) so the boot's compile pass sees it all. */
export function World({ bus, tier }: { bus: Bus; tier: TierSpec }) {
  const U = useMemo(makeUniforms, [])
  const trees = useMemo(() => placeTrees(tier.density), [tier])
  return (
    <>
      <Director bus={bus} U={U} />
      <Terrain U={U} />
      <Forest U={U} trees={trees} />
      <Sky U={U} />
    </>
  )
}
