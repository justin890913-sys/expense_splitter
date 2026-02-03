import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 如果你有設定路徑別名（如 @ 代表 src），也會寫在這裡
})
