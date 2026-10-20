import { Metadata } from 'next'
import CampsClient from './CampsClient'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { consecutiveRuns, formatDateList, formatLongDate, formatRun, getCampSeason, getSeasonCampDates } from '@/lib/campSeason'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

// Re-render hourly so dates and the season roll over without a deploy.
export const revalidate = 3600

export function generateMetadata(): Metadata {
  const season = getCampSeason()
  const title = season?.title ?? 'School Holiday Camps'
  const when = season ? ` from ${formatLongDate(season.start)} to ${formatLongDate(season.end)}` : ''
  const description = `Book ${season ? `${season.name.toLowerCase()} ` : ''}holiday camps${when} for ages 6-16 in Neutral Bay and Manly. Coding, robotics, 3D design, animation and engineering.`

  return {
    title: `${title} | Sydney & Northern Beaches`,
    description,
    keywords: [
      'kids camps Sydney',
      'STEAM camps',
      'school holiday camps',
      'science camps for kids',
      'technology camps',
      'Neutral Bay camps',
      'day camps Sydney',
    ],
    alternates: {
      canonical: `${baseUrl}/camps`,
    },
    openGraph: {
      title: `${title} | TinkerTank`,
      description,
      url: `${baseUrl}/camps`,
      type: 'website',
      images: [
        {
          url: `${baseUrl}/images/camps.jpg`,
          alt: 'TinkerTank STEAM Camps',
        },
      ],
    },
  }
}

export default function CampsPage() {
  const season = getCampSeason()
  const neutralBayDates = season ? getSeasonCampDates(season, 'neutral-bay') : []
  const manlyDates = season ? getSeasonCampDates(season, 'manly-library') : []
  const neutralBayRuns = consecutiveRuns(neutralBayDates)

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Camps', url: `${baseUrl}/camps` },
        ]}
      />
      <CampsClient
        seasonName={season?.name ?? 'Holiday'}
        title={season?.title ?? 'School Holiday Camps'}
        dateRange={season ? `${formatLongDate(season.start)}–${formatLongDate(season.end)}` : 'School holidays'}
        neutralBayDetail={
          neutralBayRuns.length
            ? `${formatRun([neutralBayRuns[0][0], neutralBayRuns[neutralBayRuns.length - 1].slice(-1)[0]], { weekday: false })} · Weekdays`
            : 'Dates coming soon'
        }
        manlyDetail={manlyDates.length ? formatDateList(manlyDates) : 'Dates coming soon'}
      />
    </>
  )
}
