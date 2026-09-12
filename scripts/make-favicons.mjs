// Cuts the favicon from the sitting fox's head in the author's own drawing: white ink on the
// page ground, at 32, 64 and 180 px. Run: node scripts/make-favicons.mjs
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const svg = readFileSync(resolve(ROOT, 'art/kitsune/sitting.svg'))
const meta = await sharp(svg).metadata()
const SCALE = 4
const W = meta.width * SCALE
const H = meta.height * SCALE

// head region of the sitting drawing, as fractions of the viewBox (nose at ~0.217, 0.199)
const crop = { left: 0.14, top: 0.1, width: 0.25, height: 0.25 }
const region = {
  left: Math.round(crop.left * W),
  top: Math.round(crop.top * H),
  width: Math.round(crop.width * W),
  height: Math.round(crop.height * H),
}

// rasterize, crop the head, then turn black ink into white on the ground colour
const { data, info } = await sharp(svg, { density: 72 * SCALE })
  .resize(W, H, { fit: 'fill' })
  .ensureAlpha()
  .extract(region)
  .raw()
  .toBuffer({ resolveWithObject: true })
const out = Buffer.alloc(info.width * info.height * 4)
const bg = [7, 11, 20]
const ink = [232, 238, 247]
for (let i = 0; i < info.width * info.height; i++) {
  const a = data[i * 4 + 3] / 255
  const lum = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / (3 * 255)
  const t = a * (1 - lum) // ink coverage
  for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.round(bg[c] + (ink[c] - bg[c]) * t)
  out[i * 4 + 3] = 255
}
const base = sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })

// square canvas with a little air, then the sizes
const side = Math.max(info.width, info.height)
const square = await base
  .extend({
    top: Math.round((side - info.height) / 2) + Math.round(side * 0.08),
    bottom: Math.round((side - info.height) / 2) + Math.round(side * 0.08),
    left: Math.round((side - info.width) / 2) + Math.round(side * 0.08),
    right: Math.round((side - info.width) / 2) + Math.round(side * 0.08),
    background: { r: 7, g: 11, b: 20, alpha: 1 },
  })
  .png()
  .toBuffer()

for (const [name, size] of [
  ['favicon-32.png', 32],
  ['favicon-64.png', 64],
  ['apple-touch-icon.png', 180],
]) {
  await sharp(square).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(resolve(ROOT, 'public', name))
}
// an SVG wrapper around the 64px raster keeps the browser's preferred format
const b64 = (await sharp(square).resize(64, 64, { kernel: 'lanczos3' }).png().toBuffer()).toString('base64')
writeFileSync(
  resolve(ROOT, 'public/favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><image href="data:image/png;base64,${b64}" width="64" height="64"/></svg>\n`,
)
console.log(`favicons written from region ${JSON.stringify(region)} of ${W}x${H}`)
