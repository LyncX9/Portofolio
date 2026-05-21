import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    // Only load Vue DevTools in development — keeps the production bundle lean
    mode === 'development' && vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Output directory for the compiled frontend (served by Express in production)
    outDir: 'dist',
    // Generate source maps for production error tracking (set to false to reduce bundle size)
    sourcemap: false,
    // Warn when individual chunks exceed 500 kB
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Split vendor libraries into a separate chunk for better caching
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
  server: {
    // Dev server port (Vite frontend)
    port: 5173,
    // Proxy API calls to the Express backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    // Port used by `vite preview` (production preview)
    port: 4173,
  },
}))
