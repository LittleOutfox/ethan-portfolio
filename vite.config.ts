import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    // no manual chunks: the lazy import of src/webgl/FoxField is the chunk boundary, so three,
    // R3F and gsap land in that async chunk and nothing WebGL is preloaded at startup
  },
  worker: { format: 'es' },
})
