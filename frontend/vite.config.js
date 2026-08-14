import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createReadStream } from 'node:fs'
import { fileURLToPath } from 'node:url'

const mediapipeWasmRoot = fileURLToPath(new URL('./public/models/try-on/mediapipe-wasm/', import.meta.url))
const allowedMediaPipeLoaders = new Set([
  'vision_wasm_internal.js',
  'vision_wasm_module_internal.js',
  'vision_wasm_nosimd_internal.js',
])

function serveMediaPipeLoaderInDevelopment() {
  return {
    name: 'serve-mediapipe-loader-in-development',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/models/try-on/mediapipe-wasm/', (request, response, next) => {
        const filename = request.url?.split('?')[0].replace(/^\//, '')
        if (!allowedMediaPipeLoaders.has(filename)) return next()
        response.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        response.setHeader('Cache-Control', 'no-cache')
        createReadStream(`${mediapipeWasmRoot}${filename}`).pipe(response)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [serveMediaPipeLoaderInDevelopment(), react(), tailwindcss()],
})
