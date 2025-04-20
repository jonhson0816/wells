import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Different from your backend port
    proxy: {
      '/api': {
        target: 'https://wellsapi.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
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
    // Make sure environment variables are accessible
    'import.meta.env.VITE_API_URL': JSON.stringify('https://wellsapi.onrender.com'),
  },
});