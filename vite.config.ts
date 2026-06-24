import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.GITHUB_ACTIONS ? '/Supremetree/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/dumare-supreme-power-tree-blueprint.jpg'],
      manifest: {
        name: 'DUMARE — SUPREME POWER TREE',
        short_name: 'Dumare Tree',
        description: 'Single-page local-first manifestation tracker for Dumare powers.',
        theme_color: '#0b0a08',
        background_color: '#0b0a08',
        display: 'standalone',
        start_url: base,
        icons: [
          {
            src: `${base}app-icon.svg`,
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
