import type { Metadata, Viewport } from 'next'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { NotificationProvider } from '@/components/NotificationProvider'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { OrganizationJsonLd, LocalBusinessJsonLd } from '@/components/seo/JsonLd'
import './globals.css'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'TinkerTank - STEAM Learning Adventures for Kids | Sydney',
    template: '%s | TinkerTank'
  },
  description:
    'Join TinkerTank for exciting STEAM camps, birthday parties, and educational programs in Sydney. Hands-on learning experiences that inspire creativity and innovation in children aged 5-16.',
  keywords: [
    'STEAM education Sydney',
    'kids camps Neutral Bay',
    'birthday parties Sydney',
    'science activities for kids',
    'technology learning',
    'engineering for kids',
    'school holiday camps Sydney',
    'STEM programs Australia'
  ],
  authors: [{ name: 'TinkerTank' }],
  creator: 'TinkerTank',
  publisher: 'TinkerTank',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: baseUrl
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: baseUrl,
    title: 'TinkerTank - STEAM Learning Adventures for Kids',
    description:
      'Exciting STEAM camps, birthday parties, and educational programs for children in Sydney. Hands-on learning experiences that inspire creativity.',
    siteName: 'TinkerTank',
    images: [
      {
        url: `${baseUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'TinkerTank - STEAM Learning Adventures'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TinkerTank - STEAM Learning Adventures for Kids',
    description: 'Exciting STEAM camps, birthday parties, and educational programs for children.',
    images: [`${baseUrl}/og-image.jpg`]
  },
  verification: {
    google: 'your-google-verification-code'
  }
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
        <OrganizationJsonLd />
        <LocalBusinessJsonLd />
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
