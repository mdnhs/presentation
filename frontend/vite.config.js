import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  resolve: {
    // shadcn-svelte components import from $lib/…
    alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) },
  },
  server: {
    // Dev: forward API + admin UI to the local PocketBase.
    proxy: {
      '/api': 'http://127.0.0.1:8090',
      '/_': 'http://127.0.0.1:8090',
    },
  },
  build: {
    // Production build goes straight into PocketBase's static dir.
    outDir: '../backend/pb_public',
    emptyOutDir: true,
    // ApexCharts 8 core is ~240 KB gzip even tree-shaken; it lives in the
    // lazily loaded Overview chunk, so the login/board bundles stay small.
    chunkSizeWarningLimit: 900,
  },
})
