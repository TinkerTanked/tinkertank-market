import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ClockIcon, MapPinIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'Kids STEAM, Coding & Robotics Classes Neutral Bay',
  description:
    'Visit TinkerTank at 50 Yeo Street, Neutral Bay for kids coding, robotics and STEAM programs, school holiday camps and technology birthday parties.',
  alternates: { canonical: `${baseUrl}/locations/neutral-bay` },
  openGraph: {
    title: 'TinkerTank Neutral Bay | Kids STEAM, Coding & Robotics',
    description: 'Weekly programs, school holiday camps and technology birthday parties for children aged 5-16.',
    url: `${baseUrl}/locations/neutral-bay`,
    type: 'website',
    images: [{ url: `${baseUrl}/images/YEO.jpg`, alt: 'TinkerTank Neutral Bay studio' }]
  }
}

const faqs = [
  {
    question: 'Where is TinkerTank Neutral Bay?',
    answer: 'Our studio is at 50 Yeo Street, Neutral Bay NSW 2089.'
  },
  {
    question: 'What programs run at the Neutral Bay studio?',
    answer: 'Neutral Bay hosts weekly Ignite sessions, school holiday camps, school pickup programs and robotics or coding birthday parties.'
  },
  {
    question: 'What ages are TinkerTank programs for?',
    answer: 'Programs are designed for children aged 5-16, with individual activities carrying their own age guidance.'
  }
]

export default function NeutralBayPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: baseUrl },
        { name: 'Neutral Bay', url: `${baseUrl}/locations/neutral-bay` }
      ]} />
      <FAQJsonLd questions={faqs} />

      <section className='program-hero'>
        <div className='container-custom grid lg:grid-cols-2 gap-12 items-center'>
          <div className='space-y-6'>
            <p className='font-semibold text-blue-100 uppercase tracking-wide'>TinkerTank Studio</p>
            <h1 className='text-4xl md:text-5xl font-display font-bold'>Kids&apos; STEAM, Coding &amp; Robotics in Neutral Bay</h1>
            <p className='text-xl text-blue-100'>Hands-on weekly programs, school holiday camps and technology birthday parties for young creators aged 5-16.</p>
            <div className='flex flex-col sm:flex-row gap-4'>
              <Link href='/ignite/drop-off-ignite' className='btn-secondary'>View Weekly Programs</Link>
              <Link href='/camps' className='btn-outline-inverse'>Book a Camp</Link>
            </div>
          </div>
          <div className='rounded-[2rem] border border-white/20 bg-white/10 p-2 shadow-2xl shadow-slate-950/30'>
            <Image src='/images/YEO.jpg' alt='TinkerTank studio at 50 Yeo Street, Neutral Bay' width={900} height={650} className='h-80 w-full rounded-[1.5rem] object-cover' priority />
          </div>
        </div>
      </section>

      <section className='bg-slate-50 py-20'>
        <div className='container-custom grid md:grid-cols-3 gap-8'>
          <div className='feature-card'>
            <MapPinIcon className='w-8 h-8 text-primary-600 mb-4' />
            <h2 className='font-display font-semibold text-xl mb-2'>Studio Address</h2>
            <p className='text-gray-600'>50 Yeo Street<br />Neutral Bay NSW 2089</p>
            <a href='https://www.google.com/maps/search/?api=1&query=50+Yeo+St+Neutral+Bay+NSW+2089' target='_blank' rel='noopener noreferrer' className='inline-block mt-3 text-primary-600 font-semibold hover:underline'>Open in Google Maps</a>
          </div>
          <div className='feature-card'>
            <ClockIcon className='w-8 h-8 text-primary-600 mb-4' />
            <h2 className='font-display font-semibold text-xl mb-2'>Opening Hours</h2>
            <p className='text-gray-600'>Monday-Friday: 9:00 AM-5:00 PM<br />Saturday: 10:00 AM-12:00 PM</p>
          </div>
          <div className='feature-card'>
            <SparklesIcon className='w-8 h-8 text-primary-600 mb-4' />
            <h2 className='font-display font-semibold text-xl mb-2'>Ages 5-16</h2>
            <p className='text-gray-600'>Project-based activities are adapted for different ages, interests and experience levels.</p>
          </div>
        </div>
      </section>

      <section className='py-20'>
        <div className='container-custom'>
          <div className='max-w-3xl mx-auto text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-display font-bold text-gray-900'>Programs at Neutral Bay</h2>
            <p className='text-lg text-gray-600 mt-4'>Build robots, create code, explore 3D design and turn ideas into practical projects with support from experienced facilitators.</p>
          </div>
          <div className='grid md:grid-cols-3 gap-8'>
            <ProgramCard title='Weekly Ignite' description='After-school and Saturday sessions with access to robotics kits, coding tools and 3D printers.' href='/ignite/drop-off-ignite' linkText='Explore Ignite' />
            <ProgramCard title='School Holiday Camps' description='Full days of coding, robotics, engineering and creative technology during selected NSW school holidays.' href='/camps' linkText='Explore Camps' />
            <ProgramCard title='Birthday Parties' description='Choose a robotics or coding party hosted at our studio, with activities led by a TinkerTank facilitator.' href='/birthdays' linkText='Explore Parties' />
          </div>
        </div>
      </section>

      <section className='border-y border-slate-200 bg-slate-50 py-20'>
        <div className='container-custom max-w-4xl'>
          <h2 className='text-3xl font-display font-bold text-gray-900 text-center mb-10'>Neutral Bay FAQs</h2>
          <div className='space-y-5'>
            {faqs.map(faq => (
              <div key={faq.question} className='feature-card'>
                <h3 className='font-display font-semibold text-lg text-gray-900'>{faq.question}</h3>
                <p className='text-gray-600 mt-2'>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-primary-700 py-16 text-white'>
        <div className='container-custom text-center space-y-6'>
          <h2 className='text-3xl font-display font-bold'>Questions About Neutral Bay?</h2>
          <p className='text-blue-100 text-lg'>Ask about the right program, age group or upcoming availability.</p>
          <Link href='/contact' className='btn-secondary'>Contact TinkerTank</Link>
        </div>
      </section>
    </>
  )
}

function ProgramCard({ title, description, href, linkText }: { title: string; description: string; href: string; linkText: string }) {
  return (
    <article className='feature-card'>
      <h3 className='text-2xl font-display font-semibold text-gray-900'>{title}</h3>
      <p className='text-gray-600 mt-3 mb-6'>{description}</p>
      <Link href={href} className='text-primary-600 font-semibold hover:underline'>{linkText} →</Link>
    </article>
  )
}
