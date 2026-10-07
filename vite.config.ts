import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 使用相对 base：产物中的资源以 ./ 引用，因此可部署在任意子路径
// （例如 GitHub Pages 的 /仓库名/），配置中无需写死仓库名。
export default defineConfig({
  plugins: [react()],
  base: './',
})
