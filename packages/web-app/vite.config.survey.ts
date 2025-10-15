import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import type { Plugin } from 'vite';

/**
 * Custom plugin to remove type="module" from script tags for file:// protocol compatibility
 * This runs after vite-plugin-singlefile to ensure the module type is removed from the final output
 */
function removeModuleType(): Plugin {
  return {
    name: 'remove-module-type',
    enforce: 'post',
    generateBundle(options, bundle) {
      // Find the HTML file in the bundle
      for (const fileName in bundle) {
        const file = bundle[fileName];
        if (file.type === 'asset' && fileName.endsWith('.html')) {
          // Remove type="module" and crossorigin attributes from script tags
          file.source = (file.source as string)
            .replace(/<script type="module" crossorigin>/g, '<script>')
            .replace(/<script type="module">/g, '<script>');
        }
      }
    },
  };
}

/**
 * Custom plugin to rename .html output to .htmlx for Metro bundler
 * Metro will treat .htmlx as an asset that can be imported and included in the JS bundle
 */
function renameToHtmlx(): Plugin {
  return {
    name: 'rename-to-htmlx',
    enforce: 'post',
    generateBundle(options, bundle) {
      // Find and rename index.html to index.htmlx
      for (const fileName in bundle) {
        if (fileName === 'index.html') {
          const file = bundle[fileName];
          // Update the fileName property on the asset itself
          if (file.type === 'asset') {
            (file as any).fileName = 'index.htmlx';
          }
          delete bundle[fileName];
          bundle['index.htmlx'] = file;
          console.log('[vite] Renamed index.html → index.htmlx for Metro bundler');
        }
      }
    },
  };
}

/**
 * Vite configuration for building Universal Survey Bundle
 *
 * Output: Single HTML file with ALL assets inlined
 * Target: iOS WebView (iPad)
 * Includes: React, SurveyJS, FDS renderers, ALL brand CSS, ALL question types
 *
 * Brand selection happens at runtime based on SURVEY_INIT message from React Native
 */
export default defineConfig({
  root: path.resolve(__dirname, 'src/survey-spa'),

  plugins: [
    react(),
    // Bundle everything into a single HTML file
    viteSingleFile({
      removeViteModuleLoader: true,
    }),
    // Remove type="module" from output for file:// protocol compatibility
    removeModuleType(),
    // Rename .html to .htmlx for Metro bundler
    renameToHtmlx(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@meridian-event-tech/shared': path.resolve(__dirname, '../shared/src'),
      '@ui/ford-ui-components': path.resolve(__dirname, '../ford-ui/packages/@ui/ford-ui-components/src'),
    },
  },

  build: {
    // Output to native app assets directory
    outDir: path.resolve(__dirname, '../native-app/assets/survey'),
    emptyOutDir: false,

    // Single entry point
    rollupOptions: {
      input: path.resolve(__dirname, 'src/survey-spa/index.html'),
      output: {
        // These won't be used since everything is inlined, but required by Rollup
        entryFileNames: 'survey-[name].[hash].js',
        chunkFileNames: 'survey-[name].[hash].js',
        assetFileNames: 'survey-[name].[hash][extname]',
        // CRITICAL: Use IIFE format for file:// protocol compatibility
        format: 'iife',
      },
    },

    // Inline ALL assets
    assetsInlineLimit: 100000000, // 100MB - inline everything

    // Target iOS WebView (Safari 11.1+)
    target: ['safari11.1', 'ios11'],

    // Minification for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
      },
    },

    // Source maps for debugging
    sourcemap: false, // Disable for production to reduce bundle size
  },

  // Critical: Use relative paths for file:// protocol
  base: './',

  // Disable PostCSS/Tailwind (not needed for survey bundles)
  css: {
    postcss: {
      plugins: [],
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'survey-core',
      'survey-react-ui',
      'showdown',
      'uuid',
    ],
  },

  // Define global constants
  define: {
    __DEV__: 'false',
    __WEBVIEW__: 'true',
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
