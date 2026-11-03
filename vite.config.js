
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/dompet-ceria/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['bibble.jpg'],
      manifest: {
        name: 'Pockiboo',
        short_name: 'Pockiboo',
        description: 'Your Little Money Buddy',
        theme_color: '#fff8ef',
        background_color: '#fff8ef',
        display: 'standalone',
        start_url: '/dompet-ceria/',
        scope: '/dompet-ceria/',
        icons: [
          {
            src: '/dompet-ceria/pockiboo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/dompet-ceria/pockiboo-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
