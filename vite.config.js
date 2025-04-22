import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// API URL to use for production or when proxy is not available
const API_URL = 'https://wellsapi.onrender.com';

export default defineConfig(({ command, mode }) => {
  console.log(`Building for ${mode} mode`);
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'https://wellsapi.onrender.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },
    define: {
      // Make API_BASE_URL available in client code
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        mode === 'development' ? '/api' : `${API_URL}/api`
      ),
    },
  };
});