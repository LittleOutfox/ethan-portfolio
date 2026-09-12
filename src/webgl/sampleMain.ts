import { samplePose, type MaskImage, type SampledPose } from './sample'

async function loadMask(name: string): Promise<MaskImage> {
  const res = await fetch(`/fox/${name}.png`)
  if (!res.ok) throw new Error(`mask ${name}: ${res.status}`)
  // data channels: no colour management, no premultiplication
  const bitmap = await createImageBitmap(await res.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('no 2d context')
  ctx.drawImage(bitmap, 0, 0)
  const width = bitmap.width
  const height = bitmap.height
  const data = ctx.getImageData(0, 0, width, height).data
  bitmap.close() // closing zeroes the bitmap's dimensions, so read them first
  return { width, height, data }
}

const cache = new Map<string, Promise<{ a: SampledPose; b: SampledPose }>>()

/** Sample both poses, in a worker when possible, else on the main thread. Results are cached per key. */
export function samplePoses(poses: [string, string], count: number): Promise<{ a: SampledPose; b: SampledPose }> {
  const key = `${poses.join('+')}:${count}`
  let p = cache.get(key)
  if (p) return p
  p = (async () => {
    if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
      try {
        return await sampleInWorker(poses, count)
      } catch {
        /* fall through to the main thread */
      }
    }
    const [ma, mb] = await Promise.all(poses.map(loadMask))
    return { a: samplePose(ma, count, 1), b: samplePose(mb, count, 2) }
  })()
  cache.set(key, p)
  p.catch(() => cache.delete(key)) // a failed fetch is retried by the next build, not cached
  return p
}

function sampleInWorker(poses: [string, string], count: number): Promise<{ a: SampledPose; b: SampledPose }> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./sample.worker.ts', import.meta.url), { type: 'module' })
    const done = () => worker.terminate()
    worker.onmessage = (e: MessageEvent<{ a: SampledPose; b: SampledPose } | { error: string }>) => {
      done()
      if ('error' in e.data) reject(new Error(e.data.error))
      else resolve(e.data)
    }
    worker.onerror = (e) => {
      done()
      reject(e.error ?? new Error('worker failed'))
    }
    worker.postMessage({ poses, count })
  })
}
