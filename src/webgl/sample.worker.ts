/// <reference lib="webworker" />
// Samples both pose masks off the main thread and returns transferable buffers.
import { samplePose, type MaskImage, type SampledPose } from './sample'

export interface SampleRequest {
  poses: [string, string]
  count: number
}

export interface SampleResponse {
  a: SampledPose
  b: SampledPose
}

async function loadMask(name: string): Promise<MaskImage> {
  const res = await fetch(`/fox/${name}.png`)
  if (!res.ok) throw new Error(`mask ${name}: ${res.status}`)
  const bitmap = await createImageBitmap(await res.blob())
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('no 2d context in worker')
  ctx.drawImage(bitmap, 0, 0)
  const width = bitmap.width
  const height = bitmap.height
  const data = ctx.getImageData(0, 0, width, height).data
  bitmap.close() // closing zeroes the bitmap's dimensions, so read them first
  return { width, height, data }
}

self.onmessage = async (e: MessageEvent<SampleRequest>) => {
  try {
    const { poses, count } = e.data
    const [ma, mb] = await Promise.all(poses.map(loadMask))
    const a = samplePose(ma, count, 1)
    const b = samplePose(mb, count, 2)
    const msg: SampleResponse = { a, b }
    ;(self as unknown as Worker).postMessage(msg, [a.xy.buffer, a.geo.buffer, b.xy.buffer, b.geo.buffer])
  } catch (err) {
    ;(self as unknown as Worker).postMessage({ error: String(err) })
  }
}
