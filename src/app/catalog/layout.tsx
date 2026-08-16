import type { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'Kids Coding, Robotics & STEAM Programs in Sydney',
  description:
    'Explore TinkerTank coding, robotics and STEAM programs for children aged 5-16, including school holiday camps, birthday parties and weekly classes in Sydney.',
  alternates: {
    canonical: `${baseUrl}/catalog`
  },
  openGraph: {
    type: 'website',
    title: 'Kids Coding, Robotics & STEAM Programs | TinkerTank',
    description: 'Compare TinkerTank camps, birthday parties and weekly STEAM programs for kids in Sydney.',
    url: `${baseUrl}/catalog`,
    images: [
      {
        url: `${baseUrl}/images/home-hero.jpg`,
        alt: 'TinkerTank coding, robotics and STEAM programs'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kids Coding, Robotics & STEAM Programs | TinkerTank',
    description: 'Compare TinkerTank camps, birthday parties and weekly STEAM programs for kids in Sydney.',
    images: [`${baseUrl}/images/home-hero.jpg`]
  }
}

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'All Programs', url: `${baseUrl}/catalog` }
        ]}
      />
      {children}
    </>
  )
}
