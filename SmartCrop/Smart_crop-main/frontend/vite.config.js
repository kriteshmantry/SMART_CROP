import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'bg-greenery.jpg'],
      manifest: {
        name: 'SmartCrop Farmer Assistant',
        short_name: 'SmartCrop',
        description: 'AI-powered Agricultural Advisory and Distress Intervention System',
        theme_color: '#16a34a', // green-600 to match theme
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
