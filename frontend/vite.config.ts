import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true, // 允许外部访问
      // 始终配置proxy作为fallback（MSW失效时使用）
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          // 如果启用了Mock，proxy会被MSW拦截
          // 如果MSW不可用（如IP访问），proxy会生效
        },
      },
    },
  };
});
