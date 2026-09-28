import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// An app build with a JS entry (not library mode, which would leave React's
// process.env.NODE_ENV checks in place) that writes ONE file the static site
// loads as a module: js/world/scene.js. No HTML, no public dir, no chunks.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: '../js/world',
    emptyOutDir: true,
    target: 'es2020',
    modulePreload: false,
    sourcemap: false,
    // one self-contained module (React + R3F + three + the scene) is the point
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      input: 'src/main.tsx',
      output: { entryFileNames: 'scene.js', format: 'es' },
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
})
