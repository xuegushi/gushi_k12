import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __TAURI__: !!process.env.TAURI_ENV_PLATFORM,
  },
  server: {
    port: 5177,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom')) return 'vendor-react-dom'
          if (id.includes('node_modules/react') && !id.includes('react-router')) return 'vendor-react'
          if (id.includes('node_modules/react-router')) return 'vendor-router'
          if (id.includes('node_modules/zustand')) return 'vendor-zustand'
          if (id.includes('node_modules/dexie')) return 'vendor-dexie'
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons'
          if (id.includes('node_modules/cnchar')) return 'vendor-cnchar'
          if (id.includes('node_modules/pinyin-pro')) return 'vendor-pinyin'
        },
      },
    },
  },
})
