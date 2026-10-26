
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
        name: 'Dompet Ceria',
        short_name: 'Dompet Ceria',
        description: 'Teman keuanganmu',
        theme_color: '#fff8ef',
        background_color: '#fff8ef',
        display: 'standalone',
        start_url: '/dompet-ceria/',
        scope: '/dompet-ceria/',
        icons: [
          {
            src: '/dompet-ceria/bibble-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/dompet-ceria/bibble-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
