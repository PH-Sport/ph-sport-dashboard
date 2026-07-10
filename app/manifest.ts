import type { MetadataRoute } from 'next';

/**
 * Web App Manifest (servido por Next en /manifest.webmanifest).
 *
 * Base de la instalabilidad PWA (Fase A): con esto + iconos 192/512 + el service
 * worker registrado, Chrome/Android/escritorio ofrecen «Instalar» e iOS respeta
 * el modo standalone al «Añadir a inicio».
 *
 * background_color/theme_color = charcoal #121317 (superficie real de la app, la
 * app arranca en oscuro) para minimizar el flash splash→app. El ICONO sí va sobre
 * negro puro #000000 por decisión de marca; se ve contra el launcher, no el splash.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PHSPORT Dashboard',
    short_name: 'PHSPORT',
    description: 'Plataforma de gestión para el equipo de diseño de PHSPORT',
    start_url: '/inicio',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#121317',
    theme_color: '#121317',
    lang: 'es',
    dir: 'ltr',
    categories: ['productivity', 'business'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
