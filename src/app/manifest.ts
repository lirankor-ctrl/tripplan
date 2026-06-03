import type { MetadataRoute } from 'next';

// PWA manifest. iOS "Add to Home Screen" uses the apple-icon (apple-touch-icon)
// auto-wired from app/apple-icon.png; Android install uses the icons below.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TripPlan — מתכנן הטיולים שלך',
    short_name: 'TripPlan',
    description: 'תכנן את הטיול המושלם שלך',
    start_url: '/',
    display: 'standalone',
    dir: 'rtl',
    lang: 'he',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
