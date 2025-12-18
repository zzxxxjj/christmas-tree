import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 消除打包大小警告 (默认500kb，我们调大到2000kb)
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // 简单的分包策略：把第三方库单独打包，利用浏览器缓存
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})