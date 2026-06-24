import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/dumare-skill-tree.jpg'],
      manifest: {
        name: 'Dumare: Power Realization Tracker',
        short_name: 'Dumare Tracker',
        description: 'Local-first campaign progression tracker for Dumare power realization.',
        theme_color: '#0b0a08',
        background_color: '#0b0a08',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/app-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['node_modules', 'dist', 'tests/e2e/**'],
  },
})
