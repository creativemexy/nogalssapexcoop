import type { Metadata } from 'next'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'NOGALSS National Apex Cooperative Society Ltd',
  description: 'Empowering communities through cooperative excellence',
  keywords: ['cooperative', 'society', 'nigeria', 'finance', 'community', 'development'],
  authors: [{ name: 'Nogalss National Apex Cooperative Society Ltd' }],
  creator: 'Nogalss National Apex Cooperative Society Ltd',
  publisher: 'Nogalss National Apex Cooperative Society Ltd',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://nogalss.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'NOGALSS National Apex Cooperative Society Ltd',
    description: 'Empowering communities through cooperative excellence',
    url: 'https://nogalss.com',
    siteName: 'Nogalss APEX',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Nogalss National Apex Cooperative Society Ltd',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOGALSS National Apex Cooperative Society Ltd',
    description: 'Empowering communities through cooperative excellence',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Nogalss APEX',
    'application-name': 'Nogalss APEX',
    'msapplication-TileColor': '#16a34a',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#16a34a',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
