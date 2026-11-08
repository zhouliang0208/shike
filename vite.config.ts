import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/shike/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['shike-icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: '食刻',
        short_name: '食刻',
        description: '温暖自然的个人饮食管理工具',
        theme_color: '#f8f6ed',
        background_color: '#f8f6ed',
        display: 'standalone',
        start_url: '/shike/',
        scope: '/shike/',
        lang: 'zh-CN',
        orientation: 'portrait-primary',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],
})
