import { useMemo } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, InstancedMesh, Matrix4, Points, ShaderMaterial, SphereGeometry } from 'three'
import vert from '../shaders/bloom.vert.glsl?raw'
import frag from '../shaders/bloom.frag.glsl?raw'
import orbVert from '../shaders/orb.vert.glsl?raw'
import orbFrag from '../shaders/orb.frag.glsl?raw'
import glowFrag from '../shaders/glow.frag.glsl?raw'
import moteVert from '../shaders/mote.vert.glsl?raw'
import lightFrag from '../shaders/foxfire.frag.glsl?raw'
import { bloomMatrix, buildBloom } from '../bloom'
import { BLOOM, bloomOrbs, mulberry32, placeBlooms } from '../layout'
import type { Uniforms } from '../uniforms'
import { worldMaterial } from './materials'

const float = (v: number) => v.toFixed(4)
const DEFINES = { ORB_Y: float(BLOOM.orbY), ORB_R: float(BLOOM.orbR), GLOW_R: float(BLOOM.glowR) }

/**
 * The spirit blooms: one instanced draw per part for all of them — roots,
 * stalk and tendrils; leaves; orbs; the glow about each orb — and one for the
 * motes of light drifting round the orbs.
 */
export function Blooms({ U }: { U: Uniforms }) {
  const objects = useMemo(() => {
    const blooms = placeBlooms()
    const { bark, leaves } = buildBloom()
    const orb = new SphereGeometry(BLOOM.orbR, 40, 24).translate(0, BLOOM.orbY, 0)
    const shell = new SphereGeometry(BLOOM.glowR, 32, 18).translate(0, BLOOM.orbY, 0)
    const parts: [BufferGeometry, ShaderMaterial][] = [
      [bark, worldMaterial(U, vert, frag, { defines: DEFINES })],
      [leaves, worldMaterial(U, vert, frag, { defines: { ...DEFINES, LEAF: '' }, side: DoubleSide })],
      [orb, worldMaterial(U, orbVert, orbFrag, { defines: DEFINES })],
      [shell, worldMaterial(U, orbVert, glowFrag, { defines: DEFINES, transparent: true, depthWrite: false, blending: AdditiveBlending })],
    ]
    const m = new Matrix4()
    const out: (InstancedMesh | Points)[] = parts.map(([g, mat]) => {
      const mesh = new InstancedMesh(g, mat, blooms.length)
      blooms.forEach((b, i) => mesh.setMatrixAt(i, bloomMatrix(b, m)))
      mesh.computeBoundingSphere()
      return mesh
    })
    out[3].renderOrder = 18

    // motes of light drifting round each orb
    const rng = mulberry32(5)
    const pos: number[] = []
    const mote: number[] = []
    for (const [x, y, z, s] of bloomOrbs()) {
      const r = BLOOM.orbR * s
      for (let k = 0; k < 7; k++) {
        pos.push(x, y, z)
        mote.push(rng(), r * (1.6 + rng() * 1.8), 0.25 + rng() * 0.45, r * (rng() - 0.35) * 2.6)
      }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
    g.setAttribute('aMote', new BufferAttribute(new Float32Array(mote), 4))
    g.computeBoundingSphere()
    const motes = new Points(
      g,
      new ShaderMaterial({ uniforms: U, vertexShader: moteVert, fragmentShader: lightFrag, transparent: true, depthWrite: false, blending: AdditiveBlending }),
    )
    motes.frustumCulled = false
    motes.renderOrder = 19
    out.push(motes)
    return out
  }, [U])
  return (
    <>
      {objects.map((o, i) => (
        <primitive key={i} object={o} />
      ))}
    </>
  )
}
