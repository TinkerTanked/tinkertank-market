import { Metadata } from 'next'
import BirthdaysClient from './BirthdaysClient'
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'STEAM Birthday Parties for Kids',
  description:
    'Unforgettable STEAM birthday parties in Sydney! All-inclusive packages with themed activities, expert hosts, and take-home gifts. Perfect for ages 5-16.',
  keywords: [
    'kids birthday parties Sydney',
    'STEAM birthday party',
    'science birthday party',
    'themed birthday parties',
    'Neutral Bay birthday parties',
    'kids party venue Sydney'
  ],
  alternates: {
    canonical: `${baseUrl}/birthdays`
  },
  openGraph: {
    title: 'STEAM Birthday Parties for Kids | TinkerTank Sydney',
    description: 'Unforgettable STEAM birthday parties with themed activities and expert hosts. All-inclusive packages.',
    url: `${baseUrl}/birthdays`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/images/birthdays-og.jpg`,
        width: 1200,
        height: 630,
        alt: 'TinkerTank Birthday Parties'
      }
    ]
  }
}

const birthdayFAQs = [
  {
    question: 'How many children can attend a TinkerTank birthday party?',
    answer:
      'Our birthday parties accommodate up to 12 children. This ensures everyone gets personalized attention and has a great time.'
  },
  {
    question: 'Do you provide decorations and cake?',
    answer:
      "We provide themed decorations that match your selected package. You're welcome to bring your own cake, or we can arrange one for an additional fee."
  },
  {
    question: 'What ages are suitable for birthday parties?',
    answer:
      "Our parties are designed for ages 5-16, with activities adapted to the birthday child's age group and interests."
  },
  {
    question: 'How long does a TinkerTank birthday party last?',
    answer: 'Standard parties run for 2 hours, which includes 1.5 hours of activities plus time for cake and presents.'
  }
]

export default function BirthdaysPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Birthday Parties', url: `${baseUrl}/birthdays` }
        ]}
      />
      <FAQJsonLd questions={birthdayFAQs} />
      <BirthdaysClient />
    </>
  )
}
