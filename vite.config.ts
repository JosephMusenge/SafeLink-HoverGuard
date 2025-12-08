import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // The popup
        popup: resolve(__dirname, 'index.html'),
        // The background worker
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: '[name].js', // Forces content.js instead of content.hash.js
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        // manualChunks: undefined, 
        // inlineDynamicImports: false,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});