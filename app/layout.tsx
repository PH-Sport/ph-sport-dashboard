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
import { AuthProvider } from '@/lib/auth/auth-context';

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
