import Image from 'next/image'
import Link from 'next/link'
import { CheckBadgeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

const organisations = [
  { name: 'Balgowlah Heights Public School', image: '/images/who-we-work-with/bhps-logo.png' },
  { name: 'Cameragal Montessori School', image: '/images/who-we-work-with/cms-logo.png' },
  { name: 'German International School Sydney', image: '/images/who-we-work-with/giss-logo.png' },
  { name: 'International Chinese School', image: '/images/who-we-work-with/intcs-logo.png' },
  { name: 'NBSC Balgowlah Boys Campus', image: '/images/who-we-work-with/logo.nbscbalgb-h.schools.nsw.png' },
  { name: 'Royal Far West', image: '/images/rfw-logo.webp' },
  { name: 'St Paul’s Catholic College Manly', image: '/images/who-we-work-with/stp-logo.png' }
]

export default function TrustProofSection({
  showFacts = true,
  showOrganisations = false
}: {
  showFacts?: boolean
  showOrganisations?: boolean
}) {
  return (
    <section className='border-y border-slate-200 bg-white py-12' aria-labelledby={showOrganisations ? 'community-trust-heading' : undefined}>
      <div className='container-custom'>
        {showFacts && (
          <div className='grid gap-6 md:grid-cols-3'>
            <TrustFact value='30,000+' label='children inspired through TinkerTank programs' />
            <TrustFact value='10+ years' label='delivering hands-on STEAM education' />
            <TrustFact value='100% WWCC' label='checked team, with child safety first' />
          </div>
        )}

        {showOrganisations && (
          <div className={showFacts ? 'mt-12 border-t border-slate-200 pt-10' : ''}>
            <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
              <div className='max-w-2xl'>
                <p className='section-kicker'>Trusted in our community</p>
                <h2 id='community-trust-heading' className='mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl'>
                  Schools and organisations we&apos;ve worked with
                </h2>
              </div>
              <Link href='/schools' className='text-sm font-semibold text-primary-700 hover:text-primary-900'>Explore school programs →</Link>
            </div>
            <div className='mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7'>
              {organisations.map(organisation => (
                <div key={organisation.name} className='flex h-24 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4' title={organisation.name}>
                  <Image src={organisation.image} alt={organisation.name} width={160} height={80} className='max-h-14 w-auto max-w-full object-contain mix-blend-multiply' />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function TrustFact({ value, label }: { value: string; label: string }) {
  return (
    <div className='flex items-center gap-4 rounded-2xl bg-slate-50 px-5 py-4'>
      <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100'>
        {value === '100% WWCC' ? <ShieldCheckIcon className='h-6 w-6 text-primary-700' /> : <CheckBadgeIcon className='h-6 w-6 text-primary-700' />}
      </span>
      <div>
        <p className='font-display text-xl font-bold text-slate-950'>{value}</p>
        <p className='text-sm leading-snug text-slate-600'>{label}</p>
      </div>
    </div>
  )
}
