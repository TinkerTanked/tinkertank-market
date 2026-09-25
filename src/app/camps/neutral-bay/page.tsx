import type { Metadata } from 'next'
import CampLocationPage from '@/components/camps/CampLocationPage'
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/JsonLd'
import { isNeutralBayWeekendOfferActive, NEUTRAL_BAY_WEEKEND_OFFER } from '@/lib/campPromotion'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'School Holiday STEM Camps Neutral Bay, Sydney',
  description: 'Book spring school holiday STEM camps from 28 September to 9 October for ages 6-16 at TinkerTank Neutral Bay. Days from $119.99.',
  alternates: { canonical: `${baseUrl}/camps/neutral-bay` },
  openGraph: {
    title: 'School Holiday STEM Camps in Neutral Bay | TinkerTank',
    description: 'Hands-on coding, robotics and creative technology camps for ages 6-16 at our purpose-built Neutral Bay studio.',
    url: `${baseUrl}/camps/neutral-bay`,
    type: 'website',
    images: [{ url: `${baseUrl}/images/YEO.jpg`, alt: 'TinkerTank Neutral Bay STEM camp studio' }]
  }
}

const standardFaqs = [
  { question: 'Where are Neutral Bay camps held?', answer: 'Camps run at the TinkerTank studio at 50 Yeo Street, Neutral Bay NSW 2089.' },
  { question: 'What times do Neutral Bay camps run?', answer: 'Day Camp runs from 9:00 AM to 3:00 PM. All Day Camp runs from 9:00 AM to 5:00 PM for a later pick-up.' },
  { question: 'How much is a Neutral Bay camp?', answer: 'Day Camp is $119.99 per child per day and All Day Camp is $149.99 per child per day. Eligible three-day bundles are shown during booking.' },
  { question: 'What should my child bring?', answer: 'Please bring lunch, a water bottle and comfortable clothes. TinkerTank provides the technology, equipment and project materials.' }
]

export default function NeutralBayCampPage() {
  const promotionActive = isNeutralBayWeekendOfferActive()
  const faqs = standardFaqs.map(faq =>
    faq.question === 'How much is a Neutral Bay camp?' && promotionActive
      ? { ...faq, answer: 'This weekend, Day Camp is $109 per child per day when booked by Sunday 27 September at 11:59 PM. All Day Camp remains $149.99 per child per day.' }
      : faq
  )

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: baseUrl },
        { name: 'Camps', url: `${baseUrl}/camps` },
        { name: 'Neutral Bay', url: `${baseUrl}/camps/neutral-bay` }
      ]} />
      <FAQJsonLd questions={faqs} />
      <CampLocationPage
        locationId='neutral-bay'
        locationName='Neutral Bay'
        areaName='Lower North Shore, Sydney'
        address='50 Yeo St, Neutral Bay NSW 2089'
        image='/images/camps2.jpeg'
        intro='Spring holidays are for building, coding and creating. Choose one day or several across two weeks at our purpose-built Neutral Bay studio—beginners are very welcome.'
        dateSummary='28 Sep–9 Oct 2026'
        dates={['Mon 28 Sep–Fri 2 Oct', 'Mon 5–Fri 9 Oct', 'Choose one or more days']}
        schedule='9 AM-3 PM or 9 AM-5 PM'
        options={promotionActive ? 'Weekend special: Day Camp $109 · All Day $149.99' : 'Day Camp $119.99 · All Day $149.99'}
        localDetail='Our Neutral Bay studio gives campers access to the tools and equipment they use throughout the day, with a familiar drop-off and collection point on Yeo Street.'
        relatedHref='/locations/neutral-bay#studio-map'
        relatedLabel='View the studio map and location details'
        faqs={faqs}
        showLocationComparison={false}
        promotion={promotionActive ? {
          price: NEUTRAL_BAY_WEEKEND_OFFER.price,
          standardPrice: NEUTRAL_BAY_WEEKEND_OFFER.standardPrice,
          deadline: 'Sunday 27 September at 11:59 PM'
        } : undefined}
      />
    </>
  )
}
