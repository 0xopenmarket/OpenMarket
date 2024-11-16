import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HashPredict: AI Prediction Market',
    short_name: 'HashPredict',
    description: 'Pump.fun of Prefiction Markets',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icons/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/android-chrome-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}