import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // 確保即使有小錯誤也能繼續 build
    chunkSizeWarningLimit: 1600,
  }
})
