import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://frontend-production-9824.up.railway.app/api',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});