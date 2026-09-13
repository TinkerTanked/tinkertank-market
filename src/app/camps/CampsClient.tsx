'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import BookCampButton from '@/components/ui/BookCampButton'
import MobileActionBar from '@/components/ui/MobileActionBar'
import TrustProofSection from '@/components/trust/TrustProofSection'
import { trackEvent } from '@/lib/analytics'

const campProducts = [
  { item_id: 'day-camp', item_name: 'Day Camp', item_category: 'camps', price: 119.99 },
  { item_id: 'all-day-camp', item_name: 'All Day Camp', item_category: 'camps', price: 149.99 },
]

export default function CampsClient() {
  useEffect(() => {
    trackEvent('view_item_list', {
      item_list_id: 'spring_holiday_camps_2026',
      item_list_name: 'Spring Holiday Camps 2026',
      items: campProducts,
    })
  }, [])

  return (
    <div className='pb-20 md:pb-0'>
      <section className='bg-slate-950 py-12 text-white lg:py-16'>
        <div className='container-custom grid items-start gap-9 lg:grid-cols-[1fr_0.95fr] lg:gap-14'>
          <div className='lg:sticky lg:top-28'>
            <p className='text-sm font-bold uppercase tracking-[0.18em] text-cyan-300'>28 September–9 October 2026</p>
            <h1 className='mt-4 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl'>
              Spring Holiday Camps 2026
            </h1>
            <p className='mt-5 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl'>
              Hands-on coding, robotics, engineering, animation and 3D design for curious kids in Neutral Bay and Manly.
            </p>
            <div className='mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-slate-200'>
              <span className='flex items-center gap-2'>
                <UserGroupIcon className='h-5 w-5 text-cyan-300' />
                Ages 6–16
              </span>
              <span className='flex items-center gap-2'>
                <SparklesIcon className='h-5 w-5 text-cyan-300' />
                No experience needed
              </span>
              <span className='flex items-center gap-2'>
                <ShieldCheckIcon className='h-5 w-5 text-cyan-300' />
                100% WWCC-checked team
              </span>
            </div>
            <div className='mt-8'>
              <BookCampButton size='lg' variant='hero' label='See dates & live availability' trackingSource='camps_hero' />
            </div>
            <p className='mt-4 text-sm text-slate-400'>From $119.99 per child, per day · Secure payment · No account required</p>
          </div>

          <div className='space-y-4 rounded-3xl bg-white p-4 text-slate-950 shadow-2xl sm:p-6'>
            <div className='px-1'>
              <p className='text-sm font-bold uppercase tracking-[0.15em] text-primary-700'>Choose your location</p>
              <p className='mt-1 text-sm text-slate-600'>Select a venue to see its live dates and remaining places.</p>
            </div>
            <CampLocationCard
              name='Neutral Bay Studio'
              detail='28 Sep–9 Oct · Weekdays'
              hours='9 AM–3 PM or 9 AM–5 PM'
              address='50 Yeo St, Neutral Bay'
              href='/camps/neutral-bay'
              locationId='neutral-bay'
            />
            <CampLocationCard
              name='Manly Library'
              detail='29 Sep–1 Oct & 6–8 Oct'
              hours='9 AM–3 PM'
              address='Market Place, Manly'
              href='/camps/manly'
              locationId='manly-library'
            />
          </div>
        </div>
      </section>

      <TrustProofSection />

      <section className='bg-slate-50 py-14 sm:py-16'>
        <div className='container-custom'>
          <div className='mx-auto max-w-3xl text-center'>
            <p className='text-sm font-bold uppercase tracking-[0.16em] text-primary-700'>Flexible camp days</p>
            <h2 className='mt-3 font-display text-3xl font-bold text-slate-950 sm:text-4xl'>Pick the hours that work for your family</h2>
            <p className='mt-4 text-lg leading-8 text-slate-600'>
              Choose one or more available dates. You only enter your family details once.
            </p>
          </div>
          <div className='mx-auto mt-9 grid max-w-4xl gap-4 md:grid-cols-2'>
            <CampFormat name='Day Camp' price='$119.99' hours='9:00 AM–3:00 PM' detail='Available at Neutral Bay and Manly Library.' />
            <CampFormat
              name='All Day Camp'
              price='$149.99'
              hours='9:00 AM–5:00 PM'
              detail='Extended project time and later pickup at Neutral Bay.'
              badge='Most flexible'
            />
          </div>
        </div>
      </section>

      <section className='bg-white py-14 sm:py-16'>
        <div className='container-custom grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]'>
          <div>
            <p className='text-sm font-bold uppercase tracking-[0.16em] text-primary-700'>Made for curious kids</p>
            <h2 className='mt-3 font-display text-3xl font-bold text-slate-950 sm:text-4xl'>Freedom to explore, build and create</h2>
            <p className='mt-4 text-lg leading-8 text-slate-600'>
              Every day blends guided support with room for children to follow their ideas. Beginners and experienced makers are both
              welcome.
            </p>
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            {[
              'Coding and game creation',
              'Robotics and engineering',
              'Animation and visual storytelling',
              '3D design and digital making',
            ].map(activity => (
              <div
                key={activity}
                className='flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 font-semibold text-slate-800'
              >
                <CheckCircleIcon className='h-6 w-6 flex-none text-emerald-600' />
                {activity}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-primary-950 py-14 text-white'>
        <div className='container-custom flex flex-col items-start justify-between gap-7 md:flex-row md:items-center'>
          <div>
            <p className='text-sm font-bold uppercase tracking-[0.16em] text-cyan-300'>Places are limited by location and date</p>
            <h2 className='mt-2 font-display text-3xl font-bold'>Find the right camp day</h2>
            <p className='mt-2 text-primary-100'>Check live availability before entering any family details.</p>
          </div>
          <BookCampButton size='lg' variant='hero' label='See dates & live availability' trackingSource='camps_bottom' />
        </div>
      </section>

      <MobileActionBar label='Spring camps · from $119.99'>
        <BookCampButton size='sm' label='See dates' className='shadow-none' trackingSource='camps_mobile' />
      </MobileActionBar>
    </div>
  )
}

function CampLocationCard({
  name,
  detail,
  hours,
  address,
  href,
  locationId,
}: {
  name: string
  detail: string
  hours: string
  address: string
  href: string
  locationId: string
}) {
  return (
    <article className='rounded-2xl border border-slate-200 bg-slate-50 p-5'>
      <div className='flex items-start gap-3'>
        <span className='grid h-10 w-10 flex-none place-items-center rounded-xl bg-primary-100 text-primary-700'>
          <MapPinIcon className='h-5 w-5' />
        </span>
        <div className='min-w-0 flex-1'>
          <h2 className='text-lg font-bold text-slate-950'>{name}</h2>
          <p className='mt-2 flex items-start gap-2 text-sm font-semibold text-slate-700'>
            <CalendarDaysIcon className='mt-0.5 h-4 w-4 flex-none' />
            {detail}
          </p>
          <p className='mt-1 flex items-start gap-2 text-sm text-slate-600'>
            <ClockIcon className='mt-0.5 h-4 w-4 flex-none' />
            {hours}
          </p>
          <p className='mt-1 text-sm text-slate-500'>{address}</p>
        </div>
      </div>
      <div className='mt-4 flex flex-col gap-2 sm:flex-row sm:items-center'>
        <BookCampButton
          initialLocationId={locationId}
          label='See live dates'
          size='sm'
          trackingSource='camps_location_card'
          className='w-full sm:w-auto'
        />
        <Link
          href={href}
          className='inline-flex items-center justify-center px-3 py-2 text-sm font-semibold text-primary-700 hover:text-primary-900'
        >
          Venue details <ArrowRightIcon className='ml-1.5 h-4 w-4' />
        </Link>
      </div>
    </article>
  )
}

function CampFormat({ name, price, hours, detail, badge }: { name: string; price: string; hours: string; detail: string; badge?: string }) {
  return (
    <article className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          {badge && (
            <span className='mb-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-900'>
              {badge}
            </span>
          )}
          <h3 className='font-display text-2xl font-bold text-slate-950'>{name}</h3>
        </div>
        <p className='text-xl font-bold text-primary-800'>{price}</p>
      </div>
      <p className='mt-4 flex items-center gap-2 font-semibold text-slate-800'>
        <ClockIcon className='h-5 w-5 text-primary-700' />
        {hours}
      </p>
      <p className='mt-2 text-slate-600'>{detail}</p>
    </article>
  )
}
