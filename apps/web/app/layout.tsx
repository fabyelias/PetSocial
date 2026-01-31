import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PetSocial - La red social de mascotas',
    template: '%s | PetSocial',
  },
  description:
    'Conecta con otras mascotas, comparte fotos y videos, y descubre una comunidad de amantes de los animales.',
  keywords: ['mascotas', 'red social', 'perros', 'gatos', 'animales', 'fotos', 'videos'],
  authors: [{ name: 'PetSocial Team' }],
  creator: 'PetSocial',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://petsocial.app',
    siteName: 'PetSocial',
    title: 'PetSocial - La red social de mascotas',
    description: 'Conecta con otras mascotas y comparte momentos especiales.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PetSocial',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PetSocial',
    description: 'La red social de mascotas',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#18181b',
                color: '#fff',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
