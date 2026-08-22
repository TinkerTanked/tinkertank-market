import type { Metadata } from 'next'
import CampLocationPage from '@/components/camps/CampLocationPage'
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'School Holiday STEM Camps Neutral Bay, Sydney',
  description: 'Book school holiday STEM camps for ages 6-16 at TinkerTank Neutral Bay. Coding, robotics, engineering, animation and 3D design from $119.99.',
  alternates: { canonical: `${baseUrl}/camps/neutral-bay` },
  openGraph: {
    title: 'School Holiday STEM Camps in Neutral Bay | TinkerTank',
    description: 'Hands-on coding, robotics and creative technology camps for ages 6-16 at our purpose-built Neutral Bay studio.',
    url: `${baseUrl}/camps/neutral-bay`,
    type: 'website',
    images: [{ url: `${baseUrl}/images/YEO.jpg`, alt: 'TinkerTank Neutral Bay STEM camp studio' }]
  }
}

const faqs = [
  { question: 'Where are Neutral Bay camps held?', answer: 'Camps run at the TinkerTank studio at 50 Yeo Street, Neutral Bay NSW 2089.' },
  { question: 'What times do Neutral Bay camps run?', answer: 'Day Camp runs from 9:00 AM to 3:00 PM. All Day Camp runs from 9:00 AM to 5:00 PM for a later pick-up.' },
  { question: 'How much is a Neutral Bay camp?', answer: 'Day Camp is $119.99 per child per day and All Day Camp is $149.99 per child per day. Eligible three-day bundles are shown during booking.' },
  { question: 'What should my child bring?', answer: 'Please bring lunch, a water bottle and comfortable clothes. TinkerTank provides the technology, equipment and project materials.' }
]

export default function NeutralBayCampPage() {
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
        intro='A practical day of coding, robotics and creative technology in our purpose-built studio, with day and extended-day options for easier family scheduling.'
        dates={['Available weekdays', 'Choose one or more days', 'Live dates in booking calendar']}
        schedule='9 AM-3 PM or 9 AM-5 PM'
        options='Day Camp $119.99 · All Day $149.99'
        localDetail='Our Neutral Bay studio gives campers access to the tools and equipment they use throughout the day, with a familiar drop-off and collection point on Yeo Street.'
        relatedHref='/locations/neutral-bay#studio-map'
        relatedLabel='View the studio map and location details'
        faqs={faqs}
      />
    </>
  )
}
