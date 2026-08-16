import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import LearningTopicsSection from '@/components/learning/LearningTopicsSection'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'STEAM, Coding & Robotics Programs for Sydney Schools',
  description:
    'Bring practical STEAM education to your Sydney school with TinkerTank coding, robotics, engineering and creative technology programs for students aged 5-16.',
  alternates: { canonical: `${baseUrl}/schools` },
  openGraph: {
    title: 'TinkerTank Programs for Sydney Schools',
    description: 'Project-based STEAM programs delivered in participating Sydney schools.',
    url: `${baseUrl}/schools`,
    type: 'website',
    images: [{ url: `${baseUrl}/images/schools-1.png`, alt: 'TinkerTank school STEAM program' }]
  }
}

export default function SchoolsPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: baseUrl },
        { name: 'School Programs', url: `${baseUrl}/schools` }
      ]} />

      <section className='bg-gradient-to-br from-green-600 to-primary-700 text-white py-16 lg:py-24'>
        <div className='container-custom grid lg:grid-cols-2 gap-12 items-center'>
          <div className='space-y-6'>
            <p className='font-semibold text-green-100 uppercase tracking-wide'>Programs for Sydney Schools</p>
            <h1 className='text-4xl md:text-5xl font-display font-bold'>Hands-On STEAM, Coding &amp; Robotics at Your School</h1>
            <p className='text-xl text-green-100'>Project-based sessions that help students create, collaborate and solve problems with technology.</p>
            <Link href='/contact' className='btn-secondary inline-flex'>Discuss a School Program</Link>
          </div>
          <Image src='/images/schools-1.png' alt='Students taking part in a TinkerTank school program' width={900} height={650} className='rounded-2xl shadow-2xl w-full h-80 object-cover' priority />
        </div>
      </section>

      <section className='py-20'>
        <div className='container-custom'>
          <div className='max-w-3xl mx-auto text-center space-y-4 mb-12'>
            <h2 className='text-3xl md:text-4xl font-display font-bold text-gray-900'>Flexible Programs Built Around Your Students</h2>
            <p className='text-lg text-gray-600'>TinkerTank facilitators bring structured projects and equipment into participating schools, with activities adapted to age, experience and available session time.</p>
          </div>
          <div className='grid md:grid-cols-3 gap-8'>
            <SchoolCard title='Coding & Robotics' description='Students design, build, program and test projects while developing computational thinking.' />
            <SchoolCard title='Engineering & Design' description='Practical challenges encourage prototyping, iteration, teamwork and creative problem-solving.' />
            <SchoolCard title='In-School Ignite' description='Recurring sessions give students time to build skills and progress through increasingly ambitious projects.' />
          </div>
        </div>
      </section>

      <LearningTopicsSection
        heading='STEAM Learning Areas for Schools'
        description='Programs can connect coding, robotics, 3D design and printing, animation and interdisciplinary STEAM projects.'
      />

      <section className='py-16 bg-gray-50'>
        <div className='container-custom max-w-4xl text-center space-y-6'>
          <h2 className='text-3xl font-display font-bold text-gray-900'>Serving Northern Sydney Schools</h2>
          <p className='text-lg text-gray-600'>We work with participating schools across the Lower North Shore and Northern Beaches. Contact us to discuss your location, student ages, timetable and learning goals.</p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link href='/ignite/in-school-ignite' className='btn-primary'>Explore In-School Ignite</Link>
            <Link href='/contact' className='btn-outline'>Contact Our Team</Link>
          </div>
        </div>
      </section>
    </>
  )
}

function SchoolCard({ title, description }: { title: string; description: string }) {
  return (
    <article className='bg-white border border-gray-200 rounded-xl p-8 shadow-sm'>
      <h3 className='text-2xl font-display font-semibold text-gray-900'>{title}</h3>
      <p className='text-gray-600 mt-3'>{description}</p>
    </article>
  )
}
