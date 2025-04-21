import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// API URL to use consistently throughout the app
const API_URL = 'https://wellsapi.onrender.com';

export default defineConfig(({ command }) => {
  // Determine if we're in development mode
  const isDev = command === 'serve';
  
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
      // Make environment variables available
      'import.meta.env.VITE_API_URL': JSON.stringify(API_URL),
      'import.meta.env.VITE_IS_DEV': JSON.stringify(isDev),
    },
  };
});