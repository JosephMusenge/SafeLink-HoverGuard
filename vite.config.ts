import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        content: 'src/content.js',
        background: 'background.js',
        tooltip: 'src/tooltip.ts'
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content' || chunkInfo.name === 'tooltip') {
            return 'static/js/[name].js';
          }
          return '[name].js'; // For main and background
        },
        chunkFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: 'static/css/[name]-[hash].[ext]',
      }
    }
  }
});
