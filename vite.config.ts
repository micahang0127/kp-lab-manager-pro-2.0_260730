import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: './',
  define: {
    'global': 'globalThis',
    'process': JSON.stringify({ env: {} }),
  },
  plugins: [tanstackRouter(), react()],
  optimizeDeps: {
    // Ketcher는 KetcherLoader를 통해 지연 로드되지만, esbuild 스캐너가 동적 import를
    // 따라가 사전번들링 대상에 포함시켜 dev 서버 최초 기동이 느려짐 — 제외 처리
    exclude: ['ketcher-react', 'ketcher-standalone'],
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'ketcher-lib': ['ketcher-react', 'ketcher-standalone'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    reporters: ['default', 'allure-vitest/reporter'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/routeTree.gen.ts', 'src/main.tsx'],
    },
  },
})
