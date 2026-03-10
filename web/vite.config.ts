import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

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
        target: 'https://tv-api.telecomm1.com',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*'
          })
        },
      },
      '/archive-free': {
        target: 'https://tv-api.telecomm1.com',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*'
          })
        },
      },
      '/radio-stream': {
  target: 'https://cdn.streamer.mediabox.ge',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/radio-stream/, ''),
  configure(proxy) {
    proxy.on('proxyRes', (proxyRes) => {
      proxyRes.headers['access-control-allow-origin'] = '*'
    })
  },
},
    },
  },
})