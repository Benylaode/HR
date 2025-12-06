import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3011',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: '../app/dist',
    emptyOutDir: true,
  },
  publicDir: 'public'
})