import { Metadata } from 'next'
import ContactClient from './ContactClient'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    "Get in touch with TinkerTank! Questions about camps, birthday parties, or the Ignite program? We're here to help. Located in Neutral Bay, Sydney.",
  alternates: {
    canonical: `${baseUrl}/contact`
  },
  openGraph: {
    title: 'Contact TinkerTank | Sydney STEAM Education',
    description: 'Questions about camps, birthday parties, or programs? Get in touch with our team.',
    url: `${baseUrl}/contact`,
    type: 'website'
  }
}

export default function ContactPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Contact', url: `${baseUrl}/contact` }
        ]}
      />
      <ContactClient />
    </>
  )
}
