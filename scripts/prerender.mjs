// Injects the prerendered app HTML into dist/index.html so the page is
// readable before hydration and with JavaScript disabled.
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const root = resolve(process.cwd())
const template = readFileSync(resolve(root, 'dist/index.html'), 'utf8')
const { render } = await import(pathToFileURL(resolve(root, 'dist-ssr/entry-server.js')).href)
const html = await render()
if (!template.includes('<!--app-html-->')) throw new Error('dist/index.html lacks the <!--app-html--> marker')
writeFileSync(resolve(root, 'dist/index.html'), template.replace('<!--app-html-->', html))
rmSync(resolve(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`prerendered ${html.length} bytes into dist/index.html`)
