import { Metadata } from 'next'
import CampsClient from './CampsClient'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'STEAM Adventure Camps for Kids',
  description:
    'Join TinkerTank STEAM camps in Sydney! Day camps and extended programs for ages 5-16. Hands-on science, technology, engineering, and math activities. School holiday programs available.',
  keywords: [
    'kids camps Sydney',
    'STEAM camps',
    'school holiday camps',
    'science camps for kids',
    'technology camps',
    'Neutral Bay camps',
    'day camps Sydney'
  ],
  alternates: {
    canonical: `${baseUrl}/camps`
  },
  openGraph: {
    title: 'STEAM Adventure Camps for Kids | TinkerTank Sydney',
    description: 'Hands-on STEAM camps for ages 5-16. Day camps and extended programs during school holidays.',
    url: `${baseUrl}/camps`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/images/camps-og.jpg`,
        width: 1200,
        height: 630,
        alt: 'TinkerTank STEAM Camps'
      }
    ]
  }
}

export default function CampsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Camps', url: `${baseUrl}/camps` }
        ]}
      />
      <CampsClient />
    </>
  )
}
