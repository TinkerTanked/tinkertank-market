import { Metadata } from 'next'
import CalendarClient from './CalendarClient'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'Book a Session - Calendar',
  description:
    'View available dates and book your TinkerTank camp, birthday party, or Ignite session. Real-time availability calendar for all programs.',
  alternates: {
    canonical: `${baseUrl}/calendar`
  },
  openGraph: {
    title: 'Book a Session | TinkerTank Calendar',
    description: 'View available dates and book your TinkerTank session. Real-time availability for all programs.',
    url: `${baseUrl}/calendar`,
    type: 'website'
  }
}

export default function CalendarPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Calendar', url: `${baseUrl}/calendar` }
        ]}
      />
      <CalendarClient />
    </>
  )
}
