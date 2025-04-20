import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Using port 3000 to avoid any conflict with port 5000
    host: true, // Allow connections from network
    proxy: {
      '/api': {
        target: 'https://wellsapi.onrender.com',
        changeOrigin: true,
        secure: false,
        // Remove the /api prefix when forwarding to the target
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Add debugging
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending request to target:', req.method, req.url);
            console.log('Target URL:', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received response from target:', proxyRes.statusCode, req.url);
          });
        },
      }
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  // Force Vite to use the proxy for API requests
  optimizeDeps: {
    exclude: ['axios'],
  },
  // Ensure environment variables are properly injected
  define: {
    'process.env': {},
    '__API_URL__': JSON.stringify('https://wellsapi.onrender.com'),
  },
  build: {
    sourcemap: true, // Enable source maps for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'axios'],
        },
      },
    },
  },
});