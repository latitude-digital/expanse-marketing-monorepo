import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

// Vite configuration for building offline survey bundle
export default defineConfig({
  root: path.resolve(__dirname, 'src/survey-spa'),
  
  build: {
    outDir: path.resolve(__dirname, '../../packages/native-app/assets/survey'),
    emptyOutDir: true,
    
    // Build as a single entry point
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'src/survey-spa/offline-survey.html'),
      },
    },
    
    // Inline all assets
    assetsInlineLimit: 100000000, // 100MB - inline everything
    
    // Optimize for size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
      },
    },
  },
  
  plugins: [
    // Bundle everything into a single HTML file
    viteSingleFile({
      removeViteModuleLoader: true,
    }),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@expanse/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  
  // No external dependencies - everything must be bundled
  optimizeDeps: {
    include: [
      'survey-core',
      'showdown',
    ],
  },
});