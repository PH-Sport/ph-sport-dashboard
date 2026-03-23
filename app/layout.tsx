import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SWRProvider } from '@/components/providers/swr-provider';
import { AuthProvider } from '@/lib/auth/auth-context';

const fontHeading = localFont({
  src: [
    { path: '../public/fonts/sohne-buch.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/sohne-halbfett.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/sohne-dreiviertelfett.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/sohne-extrafett.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-heading',
  display: 'swap',
});

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
    <html lang="es" className={fontHeading.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <SWRProvider>
              {children}
            </SWRProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
