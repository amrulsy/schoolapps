import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'SIAS Portal Siswa',
        short_name: 'SIASku',
        description: 'Sistem Informasi Akademik & Keuangan Sekolah',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate large vendor bundles
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
          'vendor-xlsx': ['xlsx'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.js',
  },
})
