import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',  // Same host as Flask so cookies are shared
    port: 5173,
    proxy: {
      '/login': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: false,
        secure: false
      },
      '/callback': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: false,
        secure: false
      },
      '/logout': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: false,
        secure: false
      },
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: false,
        secure: false
      }
    }
  },
  define: {
    // Inject backend URL for production (Railway URL)
    __BACKEND_URL__: JSON.stringify(process.env.VITE_BACKEND_URL || '')
  }
});

