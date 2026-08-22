import Image from 'next/image'
import Link from 'next/link'
import { CalendarDaysIcon, CheckIcon, ClockIcon, MapPinIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import BookCampButton from '@/components/ui/BookCampButton'
import TrustProofSection from '@/components/trust/TrustProofSection'
import TrackEventOnMount from '@/components/analytics/TrackEventOnMount'

interface CampLocationPageProps {
  locationId: string
  locationName: string
  areaName: string
  address: string
  image: string
  intro: string
  dates: string[]
  schedule: string
  options: string
  localDetail: string
  relatedHref: string
  relatedLabel: string
  faqs: Array<{ question: string; answer: string }>
}

const campFeatures = [
  'Coding, robotics, engineering, animation and 3D design',
  'All equipment and project materials supplied',
  'Projects adapted for beginners and experienced makers',
  'A 100% WWCC-checked TinkerTank team'
]

export default function CampLocationPage({
  locationId,
  locationName,
  areaName,
  address,
  image,
  intro,
  dates,
  schedule,
  options,
  localDetail,
  relatedHref,
  relatedLabel,
  faqs
}: CampLocationPageProps) {
  return (
    <>
      <TrackEventOnMount
        name='view_item'
        parameters={{
          currency: 'AUD',
          value: 119.99,
          items: [{
            item_id: `camp-${locationId}`,
            item_name: `School Holiday STEM Camps at ${locationName}`,
            item_category: 'camps',
            location_id: locationId,
            price: 119.99,
            quantity: 1
          }]
        }}
      />
      <section className='bg-slate-950 py-14 text-white lg:py-20'>
        <div className='container-custom grid items-center gap-12 lg:grid-cols-2'>
          <div>
            <p className='text-sm font-bold uppercase tracking-[0.18em] text-cyan-300'>{areaName}</p>
            <h1 className='mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl'>School Holiday STEM Camps at {locationName}</h1>
            <p className='mt-5 text-lg leading-8 text-slate-300'>{intro}</p>
            <div className='mt-7 grid gap-3 text-sm font-semibold text-slate-200 sm:grid-cols-2'>
              <span className='flex items-center gap-2'><UserGroupIcon className='h-5 w-5 text-cyan-300' />Ages 6-16</span>
              <span className='flex items-center gap-2'><ClockIcon className='h-5 w-5 text-cyan-300' />{schedule}</span>
              <span className='flex items-center gap-2 sm:col-span-2'><MapPinIcon className='h-5 w-5 text-cyan-300' />{address}</span>
            </div>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:items-center'>
              <BookCampButton
                initialLocationId={locationId}
                label={`Choose ${locationName} dates`}
                size='lg'
                variant='hero'
                trackingSource='camp_location_hero'
              />
              <Link href='/camps' className='px-4 py-3 text-center font-semibold text-slate-200 hover:text-white'>Compare both locations</Link>
            </div>
          </div>
          <Image src={image} alt={`Children enjoying a TinkerTank camp at ${locationName}`} width={1000} height={760} priority className='h-[26rem] w-full rounded-3xl object-cover shadow-2xl' />
        </div>
      </section>

      <TrustProofSection />

      <section className='bg-slate-50 py-16 lg:py-20'>
        <div className='container-custom grid gap-8 lg:grid-cols-[0.9fr_1.1fr]'>
          <div className='rounded-3xl bg-primary-800 p-7 text-white sm:p-9'>
            <CalendarDaysIcon className='h-9 w-9 text-cyan-300' />
            <h2 className='mt-5 font-display text-3xl font-bold'>Available camp dates</h2>
            <div className='mt-6 flex flex-wrap gap-2'>
              {dates.map(date => <span key={date} className='rounded-full bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-white/20'>{date}</span>)}
            </div>
            <p className='mt-6 text-primary-100'>Live availability and sold-out dates are confirmed when you open the booking calendar.</p>
            <div className='mt-7'>
              <BookCampButton initialLocationId={locationId} label='Check live availability' variant='secondary' trackingSource='camp_location_dates' />
            </div>
          </div>

          <div className='rounded-3xl border border-slate-200 bg-white p-7 sm:p-9'>
            <p className='text-sm font-bold uppercase tracking-[0.16em] text-primary-700'>Camp essentials</p>
            <h2 className='mt-3 font-display text-3xl font-bold text-slate-950'>Everything parents need to know</h2>
            <div className='mt-7 grid gap-5 sm:grid-cols-2'>
              <Detail icon={<ClockIcon className='h-6 w-6' />} title='Times' text={schedule} />
              <Detail icon={<CalendarDaysIcon className='h-6 w-6' />} title='Camp options' text={options} />
              <Detail icon={<MapPinIcon className='h-6 w-6' />} title='Venue' text={address} />
              <Detail icon={<ShieldCheckIcon className='h-6 w-6' />} title='Child safety' text='WWCC-checked team and structured sign-in and collection.' />
            </div>
            <p className='mt-7 border-t border-slate-200 pt-6 leading-7 text-slate-600'>{localDetail}</p>
            <Link href={relatedHref} className='mt-4 inline-flex font-semibold text-primary-700 hover:text-primary-900'>{relatedLabel} →</Link>
          </div>
        </div>
      </section>

      <section className='py-16 lg:py-20'>
        <div className='container-custom grid gap-12 lg:grid-cols-2'>
          <div>
            <p className='text-sm font-bold uppercase tracking-[0.16em] text-primary-700'>What&apos;s included</p>
            <h2 className='mt-3 font-display text-3xl font-bold text-slate-950'>A full day of purposeful making</h2>
            <p className='mt-4 text-lg leading-8 text-slate-600'>Children work through guided challenges, choose creative directions and leave with practical skills and projects they can be proud of.</p>
            <ul className='mt-7 space-y-4'>
              {campFeatures.map(feature => (
                <li key={feature} className='flex items-start gap-3 text-slate-700'>
                  <span className='mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-emerald-100 text-emerald-700'><CheckIcon className='h-4 w-4' /></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className='font-display text-3xl font-bold text-slate-950'>{locationName} camp FAQs</h2>
            <div className='mt-6 space-y-4'>
              {faqs.map(faq => (
                <article key={faq.question} className='rounded-2xl border border-slate-200 bg-slate-50 p-6'>
                  <h3 className='font-display text-lg font-bold text-slate-950'>{faq.question}</h3>
                  <p className='mt-2 leading-7 text-slate-600'>{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className='bg-primary-700 py-14 text-white'>
        <div className='container-custom text-center'>
          <h2 className='font-display text-3xl font-bold'>Ready to choose your camp days?</h2>
          <p className='mx-auto mt-3 max-w-2xl text-lg text-primary-100'>Select your dates, compare the available day lengths and review the full price before checkout.</p>
          <div className='mt-7'>
            <BookCampButton initialLocationId={locationId} label='Choose dates' size='lg' variant='secondary' trackingSource='camp_location_bottom' />
          </div>
        </div>
      </section>
    </>
  )
}

function Detail({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className='flex items-start gap-3'>
      <span className='grid h-11 w-11 flex-none place-items-center rounded-xl bg-primary-100 text-primary-700'>{icon}</span>
      <div><h3 className='font-bold text-slate-950'>{title}</h3><p className='mt-1 text-sm leading-6 text-slate-600'>{text}</p></div>
    </div>
  )
}
