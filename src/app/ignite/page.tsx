import { Metadata } from 'next'
import IgniteClient from './IgniteClient'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'After-School Coding & Robotics Classes Sydney',
  description:
    'Weekly after-school coding, robotics and STEAM classes for ages 5-16. Choose studio drop-off, school pickup or in-school programs across Northern Sydney.',
  keywords: [
    'weekly STEAM program Sydney',
    'after school STEAM',
    'kids coding classes',
    'ongoing STEAM education',
    'term programs for kids',
    'STEM subscription Sydney'
  ],
  alternates: {
    canonical: `${baseUrl}/ignite`
  },
  openGraph: {
    title: 'After-School Coding & Robotics Classes | TinkerTank Sydney',
    description: 'Weekly coding, robotics and STEAM programs for ages 5-16 across Northern Sydney.',
    url: `${baseUrl}/ignite`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/images/memberships.jpg`,
        alt: 'TinkerTank Ignite Program'
      }
    ]
  }
}

export default function IgnitePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Ignite Program', url: `${baseUrl}/ignite` }
        ]}
      />
      <IgniteClient />
    </>
  )
}
