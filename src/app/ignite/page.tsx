import { Metadata } from 'next'
import IgniteClient from './IgniteClient'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'Ignite STEAM Program - Weekly Learning',
  description:
    'Build confidence and creativity with TinkerTank Ignite! Weekly STEAM sessions throughout the school term. Curriculum-aligned programs for ages 5-16 in Sydney.',
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
    title: 'Ignite STEAM Program | TinkerTank Sydney',
    description: 'Weekly STEAM sessions that build confidence and creativity. Curriculum-aligned programs for ages 5-16.',
    url: `${baseUrl}/ignite`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/images/ignite-og.jpg`,
        width: 1200,
        height: 630,
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
