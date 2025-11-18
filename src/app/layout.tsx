import type { Metadata, Viewport } from 'next'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { NotificationProvider } from '@/components/NotificationProvider'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'TinkerTank - STEAM Learning Adventures for Kids',
  description:
    'Join TinkerTank for exciting STEAM camps, birthday parties, and educational programs. Hands-on learning experiences that inspire creativity and innovation in children.',
  keywords: 'STEAM education, kids camps, birthday parties, science activities, technology learning, engineering for kids, math programs',
  authors: [{ name: 'TinkerTank' }],
  creator: 'TinkerTank',
  publisher: 'TinkerTank',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://tinkertank.com.au',
    title: 'TinkerTank - STEAM Learning Adventures for Kids',
    description:
      'Exciting STEAM camps, birthday parties, and educational programs for children. Hands-on learning experiences that inspire creativity.',
    siteName: 'TinkerTank',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TinkerTank - STEAM Learning Adventures for Kids',
    description: 'Exciting STEAM camps, birthday parties, and educational programs for children.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0066cc',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <link rel='icon' href='/favicon.ico' />
        <link rel='apple-touch-icon' sizes='180x180' href='/apple-touch-icon.png' />
        <link rel='icon' type='image/png' sizes='32x32' href='/favicon-32x32.png' />
        <link rel='icon' type='image/png' sizes='16x16' href='/favicon-16x16.png' />
        <link rel='manifest' href='/site.webmanifest' />
        <meta name='msapplication-TileColor' content='#0066cc' />
      </head>
      <body className='font-sans'>
        <ErrorBoundary>
          <NotificationProvider>
            <div className='min-h-screen flex flex-col'>
              <Header />
              <main className='flex-1'>{children}</main>
              <Footer />
            </div>
          </NotificationProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
