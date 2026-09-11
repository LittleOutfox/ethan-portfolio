import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import { App } from './App'

/** Renders the whole page to static HTML at build time (scripts/prerender.mjs). */
export async function render(): Promise<string> {
  const { prelude } = await prerender(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  const reader = prelude.getReader()
  const decoder = new TextDecoder()
  let html = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    html += decoder.decode(value, { stream: true })
  }
  return html + decoder.decode()
}
