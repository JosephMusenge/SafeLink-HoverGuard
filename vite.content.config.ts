import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}, 
  },
  build: {
    // Output to the same dist folder
    outDir: 'dist', 
    // don't clear the folder, or you delete the popup/background!
    emptyOutDir: false, 
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.tsx'),
      },
      output: {
        format: 'iife', 
        entryFileNames: 'content.js',
        name: 'ContentScript',
        inlineDynamicImports: true, 
        assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'content.css'; 
            }
            return '[name].[ext]';
        },
      },
    },
  },
});