import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { getFeaturedCatalogProducts } from '@/lib/productCatalog'
import ProductCard from '@/components/ui/ProductCard'
import LearningTopicsSection from '@/components/learning/LearningTopicsSection'

const testimonials = [
  {
    quote: 'My daughter comes home excited every day and cannot wait to show us what she has built. The instructors are amazing.',
    name: 'Sarah M.',
    detail: 'Parent of Emma, age 8',
    initials: 'SM'
  },
  {
    quote: 'All 12 kids were engaged the entire party. The team managed everything beautifully and our son felt so special.',
    name: 'James C.',
    detail: 'Parent of Lucas, age 10',
    initials: 'JC'
  },
  {
    quote: 'Ignite has been wonderful for our shy daughter. She has gained confidence and now genuinely loves problem-solving.',
    name: 'Rachel T.',
    detail: 'Parent of Zoe, age 7',
    initials: 'RT'
  }
]

export default function HomePage() {
  const featuredProducts = getFeaturedCatalogProducts(6)

  return (
    <div className='overflow-hidden bg-white'>
      <section className='hero-gradient relative text-white'>
        <div className='absolute inset-0 opacity-[0.08]' aria-hidden='true' style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className='container-custom relative grid gap-12 py-16 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:py-24'>
          <div className='space-y-7'>
            <div className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur-sm'>
              <MapPinIcon className='h-4 w-4 text-orange-300' />
              Neutral Bay studio · Programs across Northern Sydney
            </div>
            <div className='space-y-5'>
              <h1 className='max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl'>
                Where curious kids become <span className='text-orange-300'>confident creators.</span>
              </h1>
              <p className='max-w-2xl text-lg leading-relaxed text-blue-100 sm:text-xl'>
                Hands-on STEAM, coding and robotics programs for ages 5-16—led by supportive facilitators through camps, weekly programs and unforgettable birthday parties.
              </p>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Link href='/catalog' className='btn-secondary px-7 py-3.5 text-base'>
                Explore programs
                <ArrowRightIcon className='ml-2 h-5 w-5' />
              </Link>
              <Link href='/locations/neutral-bay' className='btn-outline-inverse bg-white/10 px-7 py-3.5 text-base'>
                Visit our studio
              </Link>
            </div>
            <div className='flex flex-wrap gap-x-6 gap-y-3 border-t border-white/15 pt-6 text-sm font-medium text-blue-50'>
              <span className='flex items-center gap-2'><ShieldCheckIcon className='h-5 w-5 text-orange-300' /> Child safety first</span>
              <span className='flex items-center gap-2'><UserGroupIcon className='h-5 w-5 text-orange-300' /> Ages 5-16</span>
              <span className='flex items-center gap-2'><SparklesIcon className='h-5 w-5 text-orange-300' /> Hands-on projects</span>
            </div>
          </div>

          <div className='relative mx-auto w-full max-w-2xl lg:ml-auto'>
            <div className='overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-2 shadow-2xl shadow-slate-950/30'>
              <div className='relative aspect-[16/10] overflow-hidden rounded-[1.55rem]'>
                <Image
                  src='/images/home-hero.jpg'
                  alt='TinkerTank students proudly showing projects they built'
                  fill
                  priority
                  sizes='(min-width: 1024px) 46vw, calc(100vw - 2rem)'
                  className='object-cover'
                />
              </div>
            </div>
            <div className='absolute -bottom-5 left-4 right-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl sm:left-8 sm:right-auto sm:max-w-xs'>
              <div className='flex items-center gap-3'>
                <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50'>
                  <CheckBadgeIcon className='h-6 w-6 text-primary-700' />
                </span>
                <div>
                  <p className='font-display font-semibold'>Real projects. Real pride.</p>
                  <p className='text-sm text-slate-600'>Every session is designed for active learning.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='border-b border-slate-200 bg-white' aria-label='TinkerTank at a glance'>
        <div className='container-custom grid grid-cols-2 divide-x divide-slate-200 py-8 md:grid-cols-4'>
          {[
            ['30,000+', 'Kids inspired'],
            ['Ages 5–16', 'Programs for every stage'],
            ['100%', 'WWCC-checked team'],
            ['10+ years', 'Delivering STEAM education']
          ].map(([value, label]) => (
            <div key={label} className='px-3 py-3 text-center sm:px-6'>
              <p className='font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl'>{value}</p>
              <p className='mt-1 text-sm font-medium text-slate-600'>{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='bg-slate-50 py-20 lg:py-24'>
        <div className='container-custom grid gap-12 lg:grid-cols-2 lg:items-center'>
          <div className='relative min-h-[420px]'>
            <div className='absolute left-0 top-0 h-[82%] w-[72%] overflow-hidden rounded-[2rem] border-8 border-white shadow-xl'>
              <Image src='/images/camps1.jpeg' alt='Children building a robotics project at TinkerTank' fill sizes='(min-width: 1024px) 36vw, 70vw' className='object-cover' />
            </div>
            <div className='absolute bottom-0 right-0 h-[58%] w-[55%] overflow-hidden rounded-[1.75rem] border-8 border-slate-50 shadow-xl'>
              <Image src='/images/after-schoolers-3.png' alt='TinkerTank facilitator helping students with coding' fill sizes='(min-width: 1024px) 28vw, 55vw' className='object-cover' />
            </div>
          </div>
          <div className='space-y-7'>
            <div className='space-y-4'>
              <p className='section-kicker'>Learning parents can feel good about</p>
              <h2 className='font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl'>
                Serious learning. Joyfully delivered.
              </h2>
              <p className='text-lg leading-relaxed text-slate-600'>
                TinkerTank gives children the tools, time and encouragement to experiment. They build practical skills while learning to persist, collaborate and trust their own ideas.
              </p>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              {[
                ['Purpose-built studio', 'A dedicated creative technology space at 50 Yeo Street, Neutral Bay.'],
                ['Supportive facilitators', 'Guidance that meets children at their age, interests and experience level.'],
                ['Project-based learning', 'Children learn by designing, testing, improving and making.'],
                ['Programs that fit', 'Weekly Ignite sessions, school holiday camps, parties and school programs.']
              ].map(([title, body]) => (
                <div key={title} className='flex gap-3 rounded-2xl border border-slate-200 bg-white p-4'>
                  <CheckBadgeIcon className='mt-0.5 h-6 w-6 shrink-0 text-primary-700' />
                  <div>
                    <h3 className='font-display font-semibold text-slate-950'>{title}</h3>
                    <p className='mt-1 text-sm leading-relaxed text-slate-600'>{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className='flex flex-wrap gap-3'>
              <Link href='/about' className='btn-primary'>Why TinkerTank</Link>
              <Link href='/child-safety' className='btn-outline'>Our child safety commitment</Link>
            </div>
          </div>
        </div>
      </section>

      <section className='border-y border-slate-200 bg-white py-16'>
        <div className='container-custom'>
          <div className='grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center'>
            <div>
              <p className='section-kicker'>Local and convenient</p>
              <h2 className='mt-3 font-display text-3xl font-bold tracking-tight text-slate-950'>Kids&apos; STEAM programs across Northern Sydney</h2>
              <p className='mt-4 max-w-3xl text-lg leading-relaxed text-slate-600'>
                Join us at our Neutral Bay studio or discover selected camps, weekly sessions and school programs across the Northern Beaches.
              </p>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <Link href='/locations/neutral-bay' className='btn-primary'>Neutral Bay studio</Link>
              <Link href='/areas/northern-beaches' className='btn-outline'>Northern Beaches</Link>
            </div>
          </div>
        </div>
      </section>

      <LearningTopicsSection className='bg-slate-50' />

      <section className='bg-white py-20 lg:py-24'>
        <div className='container-custom'>
          <div className='mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between'>
            <div className='max-w-2xl'>
              <p className='section-kicker'>Find their next favourite thing</p>
              <h2 className='mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl'>Popular programs</h2>
              <p className='mt-4 text-lg text-slate-600'>Choose from hands-on experiences designed to keep young minds moving.</p>
            </div>
            <Link href='/catalog' className='btn-outline'>View all programs <ArrowRightIcon className='ml-2 h-4 w-4' /></Link>
          </div>
          <div className='grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3'>
            {featuredProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      <section className='bg-slate-950 py-20 text-white lg:py-24'>
        <div className='container-custom'>
          <div className='mb-12 max-w-2xl'>
            <p className='text-sm font-bold uppercase tracking-[0.16em] text-orange-300'>Trusted by local families</p>
            <h2 className='mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl'>What parents say about TinkerTank</h2>
          </div>
          <div className='grid gap-6 md:grid-cols-3'>
            {testimonials.map(testimonial => (
              <figure key={testimonial.name} className='flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.06] p-7'>
                <div className='text-lg tracking-widest text-orange-300' aria-label='5 out of 5 stars'>★★★★★</div>
                <blockquote className='mt-5 flex-1 text-base leading-relaxed text-slate-200'>“{testimonial.quote}”</blockquote>
                <figcaption className='mt-7 flex items-center gap-3 border-t border-white/10 pt-5'>
                  <span className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-bold'>{testimonial.initials}</span>
                  <span><strong className='block text-sm text-white'>{testimonial.name}</strong><span className='text-xs text-slate-400'>{testimonial.detail}</span></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-white py-20'>
        <div className='container-custom'>
          <div className='relative overflow-hidden rounded-[2rem] bg-primary-700 px-6 py-12 text-center text-white shadow-xl sm:px-12 lg:py-16'>
            <div className='absolute -right-20 -top-28 h-72 w-72 rounded-full border-[48px] border-white/5' aria-hidden='true' />
            <div className='relative mx-auto max-w-3xl space-y-6'>
              <p className='text-sm font-bold uppercase tracking-[0.16em] text-orange-300'>A great next step starts here</p>
              <h2 className='font-display text-3xl font-bold tracking-tight sm:text-4xl'>Ready to spark your child&apos;s curiosity?</h2>
              <p className='text-lg leading-relaxed text-blue-100'>Explore upcoming programs or talk with our team about the right fit for your child.</p>
              <div className='flex flex-col justify-center gap-3 sm:flex-row'>
                <Link href='/catalog' className='btn-secondary px-8 py-3.5'>Explore programs</Link>
                <Link href='/contact' className='btn-outline-inverse px-8 py-3.5'>Talk to our team</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
