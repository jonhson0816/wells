import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// API URL to use consistently throughout the app
const API_URL = 'https://wellsapi.onrender.com';

export default defineConfig({
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
    // Make environment variables available with the same value for production and development
    'import.meta.env.VITE_API_URL': JSON.stringify(API_URL),
  },
});