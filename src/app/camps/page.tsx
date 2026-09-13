import { Metadata } from 'next'
import CampsClient from './CampsClient'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'Spring Holiday Camps 2026 | Sydney & Northern Beaches',
  description:
    'Book spring holiday camps from 28 September to 9 October 2026 for ages 6-16 in Neutral Bay and Manly. Coding, robotics, 3D design, animation and engineering.',
  keywords: [
    'kids camps Sydney',
    'STEAM camps',
    'school holiday camps',
    'science camps for kids',
    'technology camps',
    'Neutral Bay camps',
    'day camps Sydney',
  ],
  alternates: {
    canonical: `${baseUrl}/camps`,
  },
  openGraph: {
    title: 'Spring Holiday Camps 2026 | TinkerTank',
    description: 'Hands-on spring holiday camps from 28 September to 9 October for ages 6-16 in Neutral Bay and Manly.',
    url: `${baseUrl}/camps`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/images/camps.jpg`,
        alt: 'TinkerTank STEAM Camps',
      },
    ],
  },
}

export default function CampsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Camps', url: `${baseUrl}/camps` },
        ]}
      />
      <CampsClient />
    </>
  )
}
