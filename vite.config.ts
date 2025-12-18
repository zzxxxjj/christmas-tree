import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// 1. 修正导入方式：必须是 standard import
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 2. 配置压缩插件 (Gzip) - 只保留一份！
    // @ts-ignore
    viteCompression({
      verbose: true,      // 在控制台输出压缩结果
      disable: false,     // 开启压缩
      threshold: 10240,   // 大于 10kb 的文件才压缩
      algorithm: 'gzip',  // 压缩算法
      ext: '.gz',         // 生成的文件后缀
    }),
  ],
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