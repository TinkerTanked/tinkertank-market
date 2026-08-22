import type { Metadata } from 'next'
import CampLocationPage from '@/components/camps/CampLocationPage'
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/JsonLd'
import { MANLY_LIBRARY_SPRING_2026_DATES } from '@/data/locationAvailability'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'School Holiday STEM Camps Manly & Northern Beaches',
  description: 'Book spring school holiday STEM camps for ages 6-16 at Manly Library. Coding, robotics, engineering, animation and 3D design for $119.99 per day.',
  alternates: { canonical: `${baseUrl}/camps/manly` },
  openGraph: {
    title: 'School Holiday STEM Camps at Manly Library | TinkerTank',
    description: 'Hands-on coding, robotics and creative technology camps for ages 6-16 in Manly on Sydney’s Northern Beaches.',
    url: `${baseUrl}/camps/manly`,
    type: 'website',
    images: [{ url: `${baseUrl}/images/manly-location.jpg`, alt: 'TinkerTank STEM camps at Manly Library' }]
  }
}

const dateFormatter = new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
const dates = MANLY_LIBRARY_SPRING_2026_DATES.map(date => dateFormatter.format(new Date(`${date}T12:00:00+10:00`)))

const faqs = [
  { question: 'Where are Manly camps held?', answer: 'Camps run at Manly Library, Market Place, Manly NSW 2095. Confirm the venue shown in your booking confirmation before attending.' },
  { question: 'Which Manly camp dates are available?', answer: 'The current spring holiday program runs on 29-30 September, 1 October and 6-8 October 2026, subject to live availability.' },
  { question: 'What time does the Manly camp run?', answer: 'Manly Library Day Camp runs from 9:00 AM to 3:00 PM.' },
  { question: 'How much is a Manly camp?', answer: 'Manly Library Day Camp is $119.99 per child per day. You can select multiple available dates in one booking.' }
]

export default function ManlyCampPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: baseUrl },
        { name: 'Camps', url: `${baseUrl}/camps` },
        { name: 'Manly', url: `${baseUrl}/camps/manly` }
      ]} />
      <FAQJsonLd questions={faqs} />
      <CampLocationPage
        locationId='manly-library'
        locationName='Manly Library'
        areaName='Northern Beaches, Sydney'
        address='Market Place, Manly NSW 2095'
        image='/images/manly-day.png'
        intro='School holiday coding, robotics and creative technology in central Manly, with six bookable spring dates for Northern Beaches families.'
        dates={dates}
        schedule='9:00 AM-3:00 PM'
        options='Day Camp · $119.99 per child, per day'
        localDetail='Manly Library is a central community venue close to local transport and amenities. The booking calendar only enables dates scheduled at this location.'
        relatedHref='/areas/northern-beaches'
        relatedLabel='Explore TinkerTank on the Northern Beaches'
        faqs={faqs}
      />
    </>
  )
}
