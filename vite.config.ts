import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// VITE_BASE est réglé par le workflow GitHub Pages (« /PhilosophyMaxing/ »).
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'PhilosophyMaxing',
        short_name: 'PhilosophyMaxing',
        description: 'Mon carnet de recherche sur 87 philosophies : une roue, mes notes.',
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#1C1510',
        theme_color: '#1C1510',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['statues/**'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: `${base}index.html`,
        // Les données vivent dans Supabase : jamais mises en cache par le service worker.
        navigateFallbackDenylist: [/^\/auth\//],
        runtimeCaching: [
          { urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'), handler: 'NetworkOnly' },
          { urlPattern: ({ url }) => url.pathname.includes('/statues/'), handler: 'CacheFirst', options: { cacheName: 'statues', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 365 } } },
        ],
      },
    }),
  ],
  test: { environment: 'node', exclude: ['node_modules', 'dist'] },
})
