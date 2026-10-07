import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 部署到 GitHub Pages 时，需要在这里补上 base: '/仓库名/'；当前保持默认根路径。
export default defineConfig({
  plugins: [react()],
})
