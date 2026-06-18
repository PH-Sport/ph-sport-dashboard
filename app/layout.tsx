import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-base',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SWRProvider } from '@/components/providers/swr-provider';
import { MotionProvider } from '@/components/providers/motion-provider';
import { AccentSync } from '@/components/providers/accent-sync';
import { AuthProvider } from '@/lib/auth/auth-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  accentThemeCss,
  accentInitScript,
  ACCENT_STORAGE_KEY,
} from '@/lib/theme/accent-colors';

export const metadata: Metadata = {
  title: 'PH Sport Dashboard',
  description: 'Plataforma de gestión para el equipo de diseño de PH Sport',
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
    apple: '/images/apple-touch-icon.png?v=3',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TooltipProvider delayDuration={200}>
            <MotionProvider>
              <AuthProvider>
                <AccentSync />
                <SWRProvider>
                  {children}
                </SWRProvider>
              </AuthProvider>
            </MotionProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
