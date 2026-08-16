import { Metadata } from 'next'
import BirthdaysClient from './BirthdaysClient'
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'Robotics, Coding & STEAM Birthday Parties Sydney',
  description:
    'Hands-on robotics and coding birthday parties for kids aged 6+ at our Neutral Bay studio or your venue across Northern Sydney and the Northern Beaches.',
  keywords: [
    'kids birthday parties Sydney',
    'STEAM birthday party',
    'robotics birthday party',
    'coding birthday party',
    'Neutral Bay birthday parties',
    'kids parties Northern Beaches',
    'mobile kids party Sydney'
  ],
  alternates: {
    canonical: `${baseUrl}/birthdays`
  },
  openGraph: {
    title: 'Robotics, Coding & STEAM Birthday Parties | TinkerTank Sydney',
    description: 'Hands-on technology parties at our Neutral Bay studio or your venue across Northern Sydney.',
    url: `${baseUrl}/birthdays`,
    type: 'website',
    images: [
      {
        url: `${baseUrl}/images/birthdays.jpg`,
        alt: 'TinkerTank Birthday Parties'
      }
    ]
  }
}

const birthdayFAQs = [
  {
    question: 'How many children can attend a TinkerTank birthday party?',
    answer:
      'Each party includes 10 children, including the birthday child. Additional children can be added for an extra fee.'
  },
  {
    question: 'Where do TinkerTank birthday parties take place?',
    answer:
      'Choose our fully equipped Neutral Bay studio or your own home or venue. Our mobile parties are available across Northern Sydney, including the Lower North Shore and Northern Beaches, subject to availability.'
  },
  {
    question: 'What ages are suitable for birthday parties?',
    answer:
      "Our robotics and coding parties are designed for ages 6 and up, with activities adapted to the birthday child's age group and interests."
  },
  {
    question: 'How long does a TinkerTank birthday party last?',
    answer: 'Parties run for 2 hours, including hands-on activities plus time for cake and presents.'
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
