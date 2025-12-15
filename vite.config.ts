import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Allow access from other devices on the network
    strictPort: false // Try next available port if 3000 is taken
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2015', // Support Safari 12 and older browsers
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
      },
    },
  },
  publicDir: 'public',
  esbuild: {
    target: 'es2015', // Transpile to ES2015 for Safari 12 compatibility
  },
})

