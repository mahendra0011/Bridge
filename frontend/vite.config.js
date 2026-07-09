// Change 154
// Change 142
// Change 130
// Change 118
// Change 106
// Change 94
// Change 82
// Change 70
// Change 58
// Change 46
// Change 34
// Change 22
// Change 10
// Update 166
// Update 154
// Update 142
// Update 130
// Update 118
// Update 106
// Update 94
// Update 82
// Update 70
// Update 58
// Update 46
// Update 34
// Update 22
// Update 10
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    // ─── DEV PROXY ──────────────────────────────────────────────────────────
    // Forwards /api and /uploads to the backend so you don't need CORS in dev.
    // Override the backend address with VITE_API_PROXY_TARGET if needed.
    //
    // Production: set VITE_API_URL in frontend/.env to your backend URL.
    //   Example: VITE_API_URL=https://api.yourbackenddomain.com
    //   (The proxy below only applies to `vite dev` — it has no effect in
    //    the production `vite build` output.)
    // ─────────────────────────────────────────────────────────────────────────
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})



























