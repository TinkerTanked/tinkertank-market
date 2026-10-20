import type { Metadata } from 'next'
import CampLocationPage from '@/components/camps/CampLocationPage'
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/JsonLd'
import { isWeekendCampOfferActive, WEEKEND_CAMP_OFFER } from '@/lib/campPromotion'
import { consecutiveRuns, formatDateList, formatLongDate, formatRun, getCampSeason, getSeasonCampDates, getSeasonClosedDates } from '@/lib/campSeason'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  const season = getCampSeason()
  const when = season ? `${season.name.toLowerCase()} school holiday STEM camps from ${formatRun([season.start], { weekday: false })} to ${formatRun([season.end], { weekday: false })}` : 'school holiday STEM camps'
  return {
    title: 'School Holiday STEM Camps Neutral Bay, Sydney',
    description: `Book ${when} for ages 6-16 at TinkerTank Neutral Bay. Days from $119.99.`,
    alternates: { canonical: `${baseUrl}/camps/neutral-bay` },
    openGraph: {
      title: 'School Holiday STEM Camps in Neutral Bay | TinkerTank',
      description: 'Hands-on coding, robotics and creative technology camps for ages 6-16 at our purpose-built Neutral Bay studio.',
      url: `${baseUrl}/camps/neutral-bay`,
      type: 'website',
      images: [{ url: `${baseUrl}/images/YEO.jpg`, alt: 'TinkerTank Neutral Bay STEM camp studio' }]
    }
  }
}

const standardFaqs = [
  { question: 'Where are Neutral Bay camps held?', answer: 'Camps run at the TinkerTank studio at 50 Yeo Street, Neutral Bay NSW 2089.' },
  { question: 'What times do Neutral Bay camps run?', answer: 'Day Camp runs from 9:00 AM to 3:00 PM. All Day Camp runs from 9:00 AM to 5:00 PM for a later pick-up.' },
  { question: 'How much is a Neutral Bay camp?', answer: 'Day Camp is $119.99 per child per day and All Day Camp is $149.99 per child per day. Eligible three-day bundles are shown during booking.' },
  { question: 'What should my child bring?', answer: 'Please bring lunch, a water bottle and comfortable clothes. TinkerTank provides the technology, equipment and project materials.' }
]

export default function NeutralBayCampPage() {
  const promotionActive = isWeekendCampOfferActive()
  const season = getCampSeason()
  const dates = season ? getSeasonCampDates(season, 'neutral-bay') : []
  const closures = season ? formatDateList(getSeasonClosedDates(season)) : ''
  const seasonLabel = season ? season.name.toLowerCase() : 'school'
  const dateFaq = {
    question: 'Which Neutral Bay camp dates are available?',
    answer: season
      ? `The ${seasonLabel} holiday program runs on weekdays from ${formatLongDate(season.start)} to ${formatLongDate(season.end)}, subject to live availability.${closures ? ` The studio is closed on ${closures}.` : ''}`
      : 'Camps run on weekdays during the NSW school holidays. Open the booking calendar to see live dates.'
  }
  const faqs = [standardFaqs[0], dateFaq, ...standardFaqs.slice(1)].map(faq =>
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
        intro={`${season?.name ?? 'School'} holidays are for building, coding and creating. Choose one day or several at our purpose-built Neutral Bay studio—beginners are very welcome.`}
        dateSummary={season ? `${formatRun([season.start], { weekday: false })} ${season.start.slice(0, 4)}–${formatRun([season.end], { weekday: false })} ${season.end.slice(0, 4)}` : 'NSW school holidays'}
        dates={[...consecutiveRuns(dates).map(run => formatRun(run)), ...(closures ? [`Closed ${closures}`] : []), 'Choose one or more days']}
        schedule='9 AM-3 PM or 9 AM-5 PM'
        options={promotionActive ? 'Weekend special: Day Camp $109 · All Day $149.99' : 'Day Camp $119.99 · All Day $149.99'}
        localDetail='Our Neutral Bay studio gives campers access to the tools and equipment they use throughout the day, with a familiar drop-off and collection point on Yeo Street.'
        relatedHref='/locations/neutral-bay#studio-map'
        relatedLabel='View the studio map and location details'
        faqs={faqs}
        showLocationComparison={false}
        promotion={promotionActive ? {
          price: WEEKEND_CAMP_OFFER.price,
          standardPrice: WEEKEND_CAMP_OFFER.standardPrice,
          deadline: 'Sunday 27 September at 11:59 PM'
        } : undefined}
      />
    </>
  )
}
