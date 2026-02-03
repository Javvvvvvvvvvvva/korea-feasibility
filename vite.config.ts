import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // KOREA ONLY - No US adapters
    'import.meta.env.VITE_COUNTRY': JSON.stringify('KOREA'),
    'import.meta.env.VITE_CITY': JSON.stringify('SEOUL'),
    'import.meta.env.VITE_VERSION': JSON.stringify('v1'),
  },
})
