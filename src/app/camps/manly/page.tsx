import type { Metadata } from 'next'
import CampLocationPage from '@/components/camps/CampLocationPage'
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/JsonLd'
import { MANLY_LIBRARY_SPRING_2026_DATES } from '@/data/locationAvailability'
import { isWeekendCampOfferActive, WEEKEND_CAMP_OFFER } from '@/lib/campPromotion'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const dynamic = 'force-dynamic'

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

const standardFaqs = [
  { question: 'Where are Manly camps held?', answer: 'Camps run at Manly Library, Market Place, Manly NSW 2095. Confirm the venue shown in your booking confirmation before attending.' },
  { question: 'Which Manly camp dates are available?', answer: 'The current spring holiday program runs on 29-30 September, 1 October and 6-8 October 2026, subject to live availability.' },
  { question: 'What time does the Manly camp run?', answer: 'Manly Library Day Camp runs from 9:00 AM to 3:00 PM.' },
  { question: 'How much is a Manly camp?', answer: 'Manly Library Day Camp is $119.99 per child per day. You can select multiple available dates in one booking.' }
]

export default function ManlyCampPage() {
  const promotionActive = isWeekendCampOfferActive()
  const faqs = standardFaqs.map(faq =>
    faq.question === 'How much is a Manly camp?' && promotionActive
      ? { ...faq, answer: 'This weekend, Manly Library Day Camp is $109 per child per day when booked by Sunday 27 September at 11:59 PM.' }
      : faq
  )

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
        dateSummary='29 Sep–8 Oct 2026'
        dates={dates}
        schedule='9:00 AM-3:00 PM'
        options={promotionActive ? 'Weekend special: Day Camp · $109 per child, per day' : 'Day Camp · $119.99 per child, per day'}
        localDetail='Manly Library is a central community venue close to local transport and amenities. The booking calendar only enables dates scheduled at this location.'
        relatedHref='/areas/northern-beaches'
        relatedLabel='Explore TinkerTank on the Northern Beaches'
        faqs={faqs}
        promotion={promotionActive ? {
          price: WEEKEND_CAMP_OFFER.price,
          standardPrice: WEEKEND_CAMP_OFFER.standardPrice,
          deadline: 'Sunday 27 September at 11:59 PM'
        } : undefined}
      />
    </>
  )
}
