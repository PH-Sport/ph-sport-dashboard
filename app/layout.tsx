import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { Azeret_Mono } from 'next/font/google';
import './globals.css';

const fontMono = Azeret_Mono({
  subsets: ['latin'],
  variable: '--font-mono-base',
  display: 'swap',
});
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SWRProvider } from '@/components/providers/swr-provider';
import { MotionProvider } from '@/components/providers/motion-provider';
import { AccentSync } from '@/components/providers/accent-sync';
import { AuthProvider } from '@/lib/auth/auth-context';
import { getServerAuth } from '@/lib/auth/get-server-auth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import {
  accentThemeCss,
  accentInitScript,
  ACCENT_STORAGE_KEY,
} from '@/lib/theme/accent-colors';

// viewport-fit=cover: la app dibuja bajo el notch/home-indicator (las safe-areas
// se compensan con env(safe-area-inset-*) en shell y overlays). Base del porteo PWA.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9f8f5' }, // --background light (cream)
    { media: '(prefers-color-scheme: dark)', color: '#121317' },  // --background dark (charcoal)
  ],
};

export const metadata: Metadata = {
  title: 'PHSPORT Dashboard',
  description: 'Plataforma de gestión para el equipo de diseño de PHSPORT',
  // Modo standalone limpio al «Añadir a inicio» en iOS (Fase A del porteo PWA).
  appleWebApp: {
    capable: true,
    title: 'PHSPORT',
    statusBarStyle: 'default',
  },
  // Next 15 emite el estándar moderno `mobile-web-app-capable`; añadimos la meta
  // clásica de Apple como seguro para iOS antiguos (el manifest ya cubre 16.4+).
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: [
      {
        url: '/images/logo-ph-sport-gold.svg?v=3',
        type: 'image/svg+xml',
      },
      {
        url: '/images/logo-ph-sport-gold-32.png?v=3',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    // v=4: nuevo arte white-on-black (antes el logo dorado).
    apple: '/images/apple-touch-icon.png?v=4',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth resuelta en servidor: el AuthProvider arranca ya autenticado (sin spinner).
  const { user, profile } = await getServerAuth();

  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Acentos personalizables: reglas por [data-accent] (claro/oscuro). */}
        <style
          id="ph-accent-theme"
          dangerouslySetInnerHTML={{ __html: accentThemeCss() }}
        />
        {/* Aplica el acento cacheado antes del primer pintado (anti-flash). */}
        <script
          dangerouslySetInnerHTML={{ __html: accentInitScript(ACCENT_STORAGE_KEY) }}
        />
      </head>
      <body className="font-sans antialiased">
        {/* Por defecto manda el dispositivo; quien quiera fijarlo lo elige en
            el menú de perfil o en Ajustes → Apariencia. */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider delayDuration={200}>
            <MotionProvider>
              <AuthProvider initialUser={user} initialProfile={profile}>
                <AccentSync />
                <ServiceWorkerRegister />
                <SWRProvider>
                  {children}
                </SWRProvider>
                <InstallPrompt />
              </AuthProvider>
            </MotionProvider>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
