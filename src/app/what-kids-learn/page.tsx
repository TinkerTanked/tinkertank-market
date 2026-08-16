import { Metadata } from 'next'
import LearningTopicsSection from '@/components/learning/LearningTopicsSection'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'What Kids Learn - STEAM, Robotics, Coding & Design',
  description: 'Explore how TinkerTank children learn STEM and STEAM, robotics, coding, 3D design and printing, and animation through hands-on projects.',
  alternates: { canonical: `${baseUrl}/what-kids-learn` }
}

export default function WhatKidsLearnPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: baseUrl },
        { name: 'What Kids Learn', url: `${baseUrl}/what-kids-learn` }
      ]} />
      <section className='bg-gradient-to-br from-primary-700 to-accent-600 text-white py-16 lg:py-24'>
        <div className='container-custom max-w-4xl text-center space-y-6'>
          <p className='font-semibold text-blue-100 uppercase tracking-wide'>Learning by Making</p>
          <h1 className='text-4xl md:text-5xl font-display font-bold'>What Kids Learn at TinkerTank</h1>
          <p className='text-xl text-blue-100'>Every experience connects coding, robotics, 3D design and printing, animation and broader STEAM thinking through practical projects.</p>
        </div>
      </section>
      <LearningTopicsSection className='bg-white' description='Explore each learning area and see how it connects to camps, Ignite, birthday parties and school programs.' />
    </>
  )
}
