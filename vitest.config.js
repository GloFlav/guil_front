// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    allowedHosts: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
  host: '0.0.0.0',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // force vite/esbuild à pointer vers le bundle concret
      'framer-motion': 'framer-motion/dist/framer-motion'
    },
  },
  optimizeDeps: {
    // forcer le pré-bundling en dev pour éviter les résolutions de .mjs internes
    include: ['framer-motion']
  },
  ssr: {
    // empêcher l'externalisation SSR qui casse parfois la résolution des .mjs
    noExternal: ['framer-motion']
  }
});
