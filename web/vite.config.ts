import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Proxy live HLS streams
      '/stream-free': {
        target: 'http://159.89.20.100',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyRes', (proxyRes) => {
            // Overwrite the duplicate `Access-Control-Allow-Origin: *, *`
            // header that the media server returns — browsers reject duplicates.
            proxyRes.headers['access-control-allow-origin'] = '*'
          })
        },
      },
      // Proxy archive HLS streams
      '/archive-free': {
        target: 'http://159.89.20.100',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*'
          })
        },
      },
    },
  },
})