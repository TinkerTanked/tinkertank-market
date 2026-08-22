import { Metadata } from 'next'
import CampsClient from './CampsClient'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'School Holiday STEM Camps Sydney & Northern Beaches',
  description:
    'Book hands-on school holiday camps for ages 6-16 in Neutral Bay and Manly. Kids explore coding, robotics, 3D design, animation and engineering.',
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
    title: 'School Holiday STEM Camps Sydney & Northern Beaches | TinkerTank',
    description: 'Hands-on school holiday camps for ages 6-16 in Neutral Bay and Manly, with coding, robotics, 3D design, animation and engineering.',
    url: `${baseUrl}/camps`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/images/camps.jpg`,
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
