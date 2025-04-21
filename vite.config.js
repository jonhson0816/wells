import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// API URL to use for production or when proxy is not available
const API_URL = 'https://wellsapi.onrender.com';

export default defineConfig(({ command }) => {
  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
        }
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },
    define: {
      // We don't need to explicitly define VITE_IS_DEV as Vite provides MODE
    },
  };
});