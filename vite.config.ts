import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteCompression from 'vite-plugin-compression'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "https://www.cpzxrobot.com/",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.ts': 'ts'
      }
    },
    include: ['@cpzxrobot/sdk']
  },
  plugins: [
    vue(),
    // Gzip 压缩
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // 10kb 以上的文件才压缩
      deleteOriginFile: false,
    }),
    // Brotli 压缩（可选，比Gzip压缩率更高）
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
  build: {
    // 包分割配置
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vue-vendor';
            }
            if (id.includes('element-plus') || id.includes('@element-plus/icons-vue')) {
              return 'element-plus';
            }
            if (id.includes('echarts')) {
              return 'echarts';
            }
            if (id.includes('@cpzxrobot')) {
              return 'cpzxrobot';
            }
          }
        },
      },
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console
        drop_debugger: true, // 生产环境移除 debugger
      },
    },
  },
})
