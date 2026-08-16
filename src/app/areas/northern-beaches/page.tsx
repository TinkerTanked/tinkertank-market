import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'Kids STEAM, Coding & Robotics Northern Beaches',
  description:
    'Find TinkerTank coding, robotics and STEAM programs for kids across Sydney’s Northern Beaches, including Manly, Brookvale and Balgowlah.',
  alternates: { canonical: `${baseUrl}/areas/northern-beaches` },
  openGraph: {
    title: 'Kids STEAM Programs on Sydney’s Northern Beaches',
    description: 'Weekly programs, school holiday activities and mobile technology birthday parties across the Northern Beaches.',
    url: `${baseUrl}/areas/northern-beaches`,
    type: 'website',
    images: [{ url: `${baseUrl}/images/manly-location.jpg`, alt: 'TinkerTank programs in Manly' }]
  }
}

const faqs = [
  {
    question: 'Where does TinkerTank run programs on the Northern Beaches?',
    answer: 'Programs currently include selected sessions in Manly, Brookvale and Balgowlah. Venues and availability vary by school term and holiday period, so check the program booking page for current options.'
  },
  {
    question: 'Does TinkerTank run Northern Beaches school holiday activities?',
    answer: 'Yes. Selected school holiday camps run at Northern Beaches venues such as Manly Library, with dates shown in the camp booking flow when available.'
  },
  {
    question: 'Can TinkerTank bring a birthday party to a Northern Beaches venue?',
    answer: 'Yes. Robotics and coding parties can come to your home or chosen venue across the Northern Beaches, subject to date and travel availability.'
  }
]

export default function NorthernBeachesPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: baseUrl },
        { name: 'Northern Beaches', url: `${baseUrl}/areas/northern-beaches` }
      ]} />
      <FAQJsonLd questions={faqs} />

      <section className='bg-gradient-to-br from-cyan-600 to-primary-700 text-white py-16 lg:py-24'>
        <div className='container-custom grid lg:grid-cols-2 gap-12 items-center'>
          <div className='space-y-6'>
            <p className='font-semibold text-cyan-100 uppercase tracking-wide'>Sydney&apos;s Northern Beaches</p>
            <h1 className='text-4xl md:text-5xl font-display font-bold'>Kids&apos; STEAM, Coding &amp; Robotics Programs</h1>
            <p className='text-xl text-cyan-100'>Hands-on school holiday activities, weekly programs and technology birthday parties in Manly, Brookvale, Balgowlah and surrounding suburbs.</p>
            <div className='flex flex-col sm:flex-row gap-4'>
              <Link href='/camps' className='btn-secondary'>Find Holiday Camps</Link>
              <Link href='/ignite' className='btn-outline border-white text-white hover:bg-white hover:text-primary-600'>View Weekly Programs</Link>
            </div>
          </div>
          <Image src='/images/manly-location.jpg' alt='TinkerTank STEAM programs in Manly on the Northern Beaches' width={900} height={650} className='rounded-2xl shadow-2xl w-full h-80 object-cover' priority />
        </div>
      </section>

      <section className='py-20'>
        <div className='container-custom'>
          <div className='max-w-3xl mx-auto text-center space-y-4 mb-12'>
            <h2 className='text-3xl md:text-4xl font-display font-bold text-gray-900'>Northern Beaches Programs</h2>
            <p className='text-lg text-gray-600'>TinkerTank works from genuine community and school venues. The location displayed during booking is the location your child will attend.</p>
          </div>
          <div className='grid md:grid-cols-3 gap-8'>
            <AreaCard title='Manly' image='/images/manly-day.png' description='Selected Ignite sessions, school pickup programs and school holiday camps at Manly venues.' href='/ignite' />
            <AreaCard title='Brookvale' image='/images/brookvale-location.jpg' description='Weekly community sessions and school pickup options during participating school terms.' href='/ignite' />
            <AreaCard title='Balgowlah' image='/images/schools-1.png' description='In-school Ignite programs that bring project-based STEAM learning into participating schools.' href='/ignite/in-school-ignite' />
          </div>
        </div>
      </section>

      <section className='py-20 bg-gray-50'>
        <div className='container-custom grid lg:grid-cols-2 gap-12'>
          <div className='space-y-5'>
            <h2 className='text-3xl font-display font-bold text-gray-900'>School Holiday Activities</h2>
            <p className='text-lg text-gray-600'>Selected Northern Beaches camps combine coding, robotics, engineering and 3D design in a practical day of making. Current dates and venues appear in the camp booking flow.</p>
            <Link href='/camps' className='btn-primary inline-flex'>See Upcoming Camps</Link>
          </div>
          <div className='space-y-5'>
            <h2 className='text-3xl font-display font-bold text-gray-900'>Mobile Birthday Parties</h2>
            <p className='text-lg text-gray-600'>Choose a robotics or coding party and TinkerTank can bring the activity to your Northern Beaches home, hall or chosen venue, subject to availability.</p>
            <Link href='/birthdays' className='btn-primary inline-flex'>Explore Birthday Parties</Link>
          </div>
        </div>
      </section>

      <section className='py-16 bg-white'>
        <div className='container-custom max-w-4xl'>
          <h2 className='text-3xl font-display font-bold text-gray-900 text-center mb-10'>Northern Beaches FAQs</h2>
          <div className='space-y-5'>
            {faqs.map(faq => (
              <div key={faq.question} className='bg-gray-50 rounded-xl p-6'>
                <h3 className='font-display font-semibold text-lg text-gray-900'>{faq.question}</h3>
                <p className='text-gray-600 mt-2'>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='py-16 bg-primary-600 text-white'>
        <div className='container-custom text-center space-y-6'>
          <h2 className='text-3xl font-display font-bold'>Find the Right Northern Beaches Program</h2>
          <p className='text-blue-100 text-lg'>Ask our team about current venues, school partnerships and upcoming holiday dates.</p>
          <Link href='/contact' className='btn-secondary'>Contact TinkerTank</Link>
        </div>
      </section>
    </>
  )
}

function AreaCard({ title, image, description, href }: { title: string; image: string; description: string; href: string }) {
  return (
    <article className='bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm'>
      <Image src={image} alt={`TinkerTank ${title} programs`} width={700} height={420} className='w-full h-48 object-cover' />
      <div className='p-6'>
        <h3 className='text-2xl font-display font-semibold text-gray-900'>{title}</h3>
        <p className='text-gray-600 mt-3 mb-5'>{description}</p>
        <Link href={href} className='text-primary-600 font-semibold hover:underline'>View programs →</Link>
      </div>
    </article>
  )
}
