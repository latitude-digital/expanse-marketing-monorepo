import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    
    // Build configuration to match CRA output structure
    build: {
      outDir: 'build',
      sourcemap: true, // For Sentry integration
      chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            survey: ['survey-core', 'survey-react-ui', 'survey-analytics'],
            kendo: ['@progress/kendo-react-buttons', '@progress/kendo-react-common', '@progress/kendo-react-inputs', '@progress/kendo-react-indicators'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
            utils: ['lodash', 'moment', 'uuid']
          }
        }
      }
    },
    
    // Define environment variables for compatibility
    define: {
      // Map VITE_ env vars to REACT_APP_ for backward compatibility during transition
      'process.env.REACT_APP_ENV': JSON.stringify(env.VITE_ENV || env.REACT_APP_ENV || 'development'),
      'process.env.NODE_ENV': JSON.stringify(mode),
      // Ensure process.env is available for other libraries that expect it
      global: 'globalThis',
    },
    
    // Server configuration
    server: {
      port: 8001, // Match the original CRA port
      open: false,
      host: true
    },
    
    // Preview server (for production builds)
    preview: {
      port: 8001
    },
    
    // CSS configuration
    css: {
      preprocessorOptions: {
        scss: {
          // Only add variables if the file exists
          // additionalData: `@import "src/styles/variables.scss";`
        }
      }
    },
    
    // Resolve configuration
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@ui/ford-ui-components': path.resolve(__dirname, '../ford-ui/packages/@ui/ford-ui-components'),
        '@ui/atoms': path.resolve(__dirname, '../ford-ui/packages/@ui/atoms/src/lib'),
        '@ui/icons': path.resolve(__dirname, '../ford-ui/packages/@ui/icons/src/lib'),
        '@common/helpers': path.resolve(__dirname, '../ford-ui/packages/@common/helpers/src/lib'),
        '@common/interfaces': path.resolve(__dirname, '../ford-ui/packages/@common/interfaces/src/lib'),
        '@common/utils': path.resolve(__dirname, '../ford-ui/packages/@common/utils/src/lib'),
        // Add any other aliases that were used in the original app
      }
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'lodash',
        'moment',
        'survey-core',
        'survey-react-ui'
      ],
      exclude: [
        'firebase'
      ]
    }
  }
})