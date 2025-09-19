import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore certain warnings
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
        if (warning.code === 'UNRESOLVED_IMPORT') return
        warn(warning)
      },
      external: (id) => {
        // Ignore framer-motion build issues
        if (id.includes('globalThis-config.mjs')) return true
        return false
      }
    }
  },
  esbuild: {
    logOverride: {
      'this-is-undefined-in-esm': 'silent'
    }
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['framer-motion']
  }
})
