import Image from 'next/image'
import Link from 'next/link'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/JsonLd'
import type { LearningTopic } from '@/data/learningTopics'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export default function TopicLandingPage({ topic }: { topic: LearningTopic }) {
  const url = `${baseUrl}/${topic.slug}`

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: baseUrl },
        { name: 'What Kids Learn', url: `${baseUrl}/what-kids-learn` },
        { name: topic.navLabel, url }
      ]} />
      <FAQJsonLd questions={topic.faqs} />

      <section className='bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 text-white py-16 lg:py-24'>
        <div className='container-custom grid lg:grid-cols-2 gap-12 items-center'>
          <div className='space-y-6'>
            <p className='font-semibold text-blue-100 uppercase tracking-wide'>What Kids Learn</p>
            <h1 className='text-4xl md:text-5xl font-display font-bold'>{topic.title}</h1>
            <p className='text-xl text-blue-100 leading-relaxed'>{topic.description}</p>
            <div className='flex flex-col sm:flex-row gap-4'>
              <Link href='/camps' className='btn-secondary'>Explore Holiday Camps</Link>
              <Link href='/ignite' className='btn-outline-inverse'>Explore Weekly Programs</Link>
            </div>
          </div>
          <Image src={topic.image} alt={topic.imageAlt} width={900} height={650} className='rounded-2xl shadow-2xl w-full h-80 object-cover' priority />
        </div>
      </section>

      <section className='py-20'>
        <div className='container-custom grid lg:grid-cols-2 gap-16'>
          <div>
            <h2 className='text-3xl font-display font-bold text-gray-900 mb-6'>Projects Children Can Explore</h2>
            <div className='space-y-4'>
              {topic.projects.map(project => (
                <div key={project} className='flex items-start gap-3'>
                  <CheckCircleIcon className='w-6 h-6 text-primary-600 mt-0.5 flex-shrink-0' />
                  <p className='text-lg text-gray-700'>{project}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className='text-3xl font-display font-bold text-gray-900 mb-6'>Skills Developed Along the Way</h2>
            <div className='grid sm:grid-cols-2 gap-4'>
              {topic.skills.map(skill => (
                <div key={skill} className='bg-primary-50 rounded-xl p-5 font-semibold text-primary-900'>{skill}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className='py-20 bg-gray-50'>
        <div className='container-custom'>
          <div className='max-w-3xl mx-auto text-center space-y-4 mb-12'>
            <h2 className='text-3xl md:text-4xl font-display font-bold text-gray-900'>Explore {topic.navLabel} in Every Program</h2>
            <p className='text-lg text-gray-600'>Choose the format that works for your child, family or school.</p>
          </div>
          <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            <ProgramLink title='Holiday Camps' description='Full days of collaborative making during selected NSW school holidays.' href='/camps' />
            <ProgramLink title='Weekly Ignite' description='Ongoing projects that build skills and confidence from week to week.' href='/ignite' />
            <ProgramLink title='Birthday Parties' description='A social, hands-on technology experience for a memorable celebration.' href='/birthdays' />
            <ProgramLink title='School Programs' description='Project-based STEAM learning delivered with participating schools.' href='/schools' />
          </div>
        </div>
      </section>

      <section className='py-16 bg-white'>
        <div className='container-custom max-w-4xl'>
          <h2 className='text-3xl font-display font-bold text-gray-900 text-center mb-10'>{topic.navLabel} FAQs</h2>
          <div className='space-y-5'>
            {topic.faqs.map(faq => (
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
          <h2 className='text-3xl font-display font-bold'>Find the Right TinkerTank Experience</h2>
          <p className='text-lg text-blue-100'>Ask our team which current program best matches your child&apos;s age and interests.</p>
          <Link href='/contact' className='btn-secondary'>Contact TinkerTank</Link>
        </div>
      </section>
    </>
  )
}

function ProgramLink({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary-300 transition-all'>
      <h3 className='text-xl font-display font-semibold text-gray-900'>{title}</h3>
      <p className='text-gray-600 mt-3'>{description}</p>
      <span className='inline-block text-primary-600 font-semibold mt-5'>Explore {title} →</span>
    </Link>
  )
}
