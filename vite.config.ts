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
      }
    }
  },
  esbuild: {
    logOverride: {
      'this-is-undefined-in-esm': 'silent'
    }
  },
  define: {
    // Não definir global em produção - causa problemas com framer-motion
    ...(process.env.NODE_ENV === 'development' ? { global: 'globalThis' } : {}),
  },
  optimizeDeps: {
    // Force Vite to pre-bundle framer-motion para evitar problemas de ESM
    include: ['framer-motion'],
    esbuildOptions: {
      // Garantir compatibilidade com globalThis
      target: 'es2020'
    }
  }
})
