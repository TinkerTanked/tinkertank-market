import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbJsonLd, FAQJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

const questions = [
  {
    question: 'What ages are TinkerTank programs designed for?',
    answer: 'TinkerTank programs serve children approximately 5-16 years old. The age range for each camp, party or Ignite program is shown on its booking page.'
  },
  {
    question: 'Does my child need coding or robotics experience?',
    answer: 'Many TinkerTank programs welcome beginners, and instructors adapt projects to different ages and skill levels. Check the individual program page for any specific requirements.'
  },
  {
    question: 'What do children do at a TinkerTank program?',
    answer: 'Activities vary by program and can include coding, robotics, 3D design and printing, engineering, animation and other hands-on STEAM projects.'
  },
  {
    question: 'Where are TinkerTank programs held?',
    answer: 'Programs run at our Neutral Bay studio and selected schools and community venues across Sydney. The exact location and address are shown before you book.'
  },
  {
    question: 'What should my child bring to a holiday camp?',
    answer: 'Children should bring lunch and a water bottle. TinkerTank supplies the project materials and equipment unless the program page says otherwise.'
  },
  {
    question: 'Can TinkerTank host a birthday party at our venue?',
    answer: 'Yes. Selected birthday packages can run at TinkerTank Neutral Bay or at your home or venue. Check the package details or contact us to confirm availability.'
  },
  {
    question: 'How do I change or cancel a booking?',
    answer: 'Contact TinkerTank as soon as possible and review the Refund and Cancellation Policy. The options available depend on the program and how much notice is provided.'
  },
  {
    question: 'How can I ask a question before booking?',
    answer: 'Call 0455 400 261, email hello@tinkertank.rocks or use the contact form and our team will help you choose the right program.'
  }
]

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Answers to common questions about TinkerTank camps, coding and robotics programs, birthday parties, locations, ages, bookings and cancellations.',
  alternates: {
    canonical: `${baseUrl}/faq`
  },
  openGraph: {
    type: 'website',
    title: 'TinkerTank Frequently Asked Questions',
    description: 'Find answers about our kids camps, birthday parties and weekly coding and robotics programs.',
    url: `${baseUrl}/faq`
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TinkerTank Frequently Asked Questions',
    description: 'Find answers about our kids camps, birthday parties and weekly coding and robotics programs.',
    images: [`${baseUrl}/images/home-hero.jpg`]
  }
}

export default function FAQPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'FAQ', url: `${baseUrl}/faq` }
        ]}
      />
      <FAQJsonLd questions={questions} />
      <div className='py-16'>
        <div className='container-custom max-w-4xl'>
          <div className='text-center mb-12'>
            <h1 className='text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4'>Frequently Asked Questions</h1>
            <p className='text-xl text-gray-600'>Everything you need to know before choosing a TinkerTank program.</p>
          </div>

          <div className='space-y-6'>
            {questions.map(item => (
              <section key={item.question} className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
                <h2 className='text-xl font-display font-semibold text-gray-900 mb-3'>{item.question}</h2>
                <p className='text-gray-700 leading-relaxed'>{item.answer}</p>
              </section>
            ))}
          </div>

          <div className='mt-12 rounded-2xl bg-primary-50 p-8 text-center'>
            <h2 className='text-2xl font-display font-bold text-gray-900 mb-3'>Still have a question?</h2>
            <p className='text-gray-700 mb-6'>Our team can help you find the right program for your child.</p>
            <Link href='/contact' className='btn-primary'>Contact TinkerTank</Link>
          </div>
        </div>
      </div>
    </>
  )
}
