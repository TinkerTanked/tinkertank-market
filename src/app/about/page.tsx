import { Metadata } from 'next'
import Link from 'next/link'
import { 
  AcademicCapIcon, 
  HeartIcon, 
  LightBulbIcon, 
  UsersIcon,
  RocketLaunchIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tinkertank.rocks'

export const metadata: Metadata = {
  title: 'About TinkerTank - Our Story & Mission',
  description:
    "Learn about TinkerTank, Sydney's premier STEAM education provider. Our mission is to inspire creativity and innovation in children through hands-on learning experiences.",
  alternates: {
    canonical: `${baseUrl}/about`
  },
  openGraph: {
    title: 'About TinkerTank | STEAM Education Sydney',
    description: 'Our mission is to inspire creativity and innovation in children through hands-on STEAM learning.',
    url: `${baseUrl}/about`,
    type: 'website'
  }
}

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className='py-16 bg-gradient-to-br from-primary-50 to-accent-50'>
        <div className='container-custom'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            <div className='space-y-6'>
              <h1 className='text-4xl md:text-5xl font-display font-bold text-gray-900 leading-tight'>
                Inspiring the Next Generation of <span className='text-primary-600'>Innovators</span>
              </h1>
              <p className='text-xl text-gray-600 leading-relaxed'>
                TinkerTank was founded with a simple belief: every child has the potential to be a creator, problem-solver, and innovator. We make STEAM learning accessible, engaging, and fun.
              </p>
              <Link href='/camps' className='btn-primary text-lg px-8 py-4 inline-flex items-center'>
                <RocketLaunchIcon className='w-5 h-5 mr-2' />
                Join Our Mission
              </Link>
            </div>

            <div className='relative'>
              <div className='bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl h-96 flex items-center justify-center'>
                <div className='text-center space-y-4'>
                  <div className='text-6xl'>🌟</div>
                  <p className='text-lg font-medium text-gray-700'>Building Future Leaders</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className='py-20'>
        <div className='container-custom max-w-4xl'>
          <div className='text-center space-y-6 mb-16'>
            <h2 className='text-3xl md:text-4xl font-display font-bold text-gray-900'>
              Our Story
            </h2>
            <p className='text-xl text-gray-600'>
              From a simple question to inspiring the next generation of creators
            </p>
          </div>

          <div className='space-y-12'>
            <div className='max-w-none text-lg leading-relaxed text-gray-700 space-y-6'>
              <p>
                TinkerTank began with a simple question: What if learning could be as engaging, creative, and
                inspiring as the future our children are growing into?
              </p>

              <p>
                Our founder, Julija McDowell, has spent her career at the intersection of creativity, technology,
                and education. Before founding TinkerTank, Julija worked in the film and animation industry,
                contributing to major productions and developing a deep understanding of the power of storytelling,
                technology, and innovation.
              </p>

              <p>
                When her own children were young, Julija became increasingly interested in alternative approaches to
                education. She began homeschooling, exploring how children learn best when they are engaged, curious,
                and given the freedom to pursue their interests. This experience led her to develop an early home
                education platform and learning app, designed to help families create more personalised learning
                experiences.
              </p>

              <p>What started as a personal journey soon became a much bigger mission.</p>

              <p>In 2015, TinkerTank was born.</p>

              <p>
                The vision was simple: create a place where students could learn by doing. A place where robotics,
                coding, engineering, animation, design, creativity, and problem-solving came together in a hands-on
                environment that encouraged curiosity, collaboration, resilience, and innovation.
              </p>

              <p>
                Over the past decade, TinkerTank has worked with more than 15,000 students across Sydney through
                after-school programs, holiday camps, school incursions, libraries, community programs, and special
                events. Along the way, we have seen thousands of students discover new passions, build confidence,
                develop future-ready skills, and experience those magical &ldquo;A-Ha!&rdquo; moments that happen when
                learning becomes meaningful.
              </p>

              <p>Today, our mission continues to evolve.</p>

              <p>
                As the world changes, the skills students need are changing too. Technical skills matter, but so do
                creativity, critical thinking, emotional intelligence, resilience, communication, and adaptability.
              </p>

              <p>
                That&apos;s why TinkerTank combines STEAM education with project-based learning, real-world
                challenges, and a strong focus on human skills.
              </p>

              <p>
                Today, we are proud to partner with schools, libraries, councils, and community organisations to bring
                engaging, future-focused learning experiences to even more students. Through workshops, incursions,
                professional development, holiday programs, and innovative learning pathways, we continue to inspire
                the next generation of creators, inventors, engineers, storytellers, and problem solvers.
              </p>

              <p>Because at TinkerTank, we believe every student has incredible potential.</p>

              <p>Sometimes they just need the right environment to discover it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className='py-20 bg-gray-50'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-16'>
            <h2 className='text-3xl md:text-4xl font-display font-bold text-gray-900'>
              What We Believe
            </h2>
            <p className='text-xl text-gray-600'>
              The principles that guide everything we do
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <LightBulbIcon className='w-8 h-8 text-blue-600' />
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-4'>
                Curiosity First
              </h3>
              <p className='text-gray-600'>
                We believe learning happens best when children are genuinely curious and excited to explore.
              </p>
            </div>

            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <HeartIcon className='w-8 h-8 text-green-600' />
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-4'>
                Inclusive Learning
              </h3>
              <p className='text-gray-600'>
                Every child deserves to feel welcome, supported, and capable of achieving great things.
              </p>
            </div>

            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
              <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <SparklesIcon className='w-8 h-8 text-purple-600' />
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-4'>
                Hands-On Learning
              </h3>
              <p className='text-gray-600'>
                Real understanding comes from doing, building, experimenting, and sometimes failing and trying again.
              </p>
            </div>

            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
              <div className='w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <AcademicCapIcon className='w-8 h-8 text-yellow-600' />
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-4'>
                Expert Instruction
              </h3>
              <p className='text-gray-600'>
                Our instructors are passionate STEAM professionals who know how to make complex concepts accessible.
              </p>
            </div>

            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <UsersIcon className='w-8 h-8 text-red-600' />
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-4'>
                Community Focused
              </h3>
              <p className='text-gray-600'>
                We're part of the Neutral Bay community and committed to making STEAM education accessible to all families.
              </p>
            </div>

            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
              <div className='w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <RocketLaunchIcon className='w-8 h-8 text-indigo-600' />
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-4'>
                Future Ready
              </h3>
              <p className='text-gray-600'>
                We prepare kids for a future where creativity, critical thinking, and adaptability are essential.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* CTA */}
      <section className='py-20 bg-gradient-to-r from-primary-500 to-primary-600 text-white'>
        <div className='container-custom text-center'>
          <div className='space-y-6'>
            <h2 className='text-3xl md:text-4xl font-display font-bold'>
              Ready to Join Our Community?
            </h2>
            <p className='text-xl text-blue-100 max-w-2xl mx-auto'>
              Become part of a community that's passionate about nurturing young innovators
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
              <Link href='/camps' className='btn-secondary text-lg px-8 py-4'>
                Book a Program
              </Link>
              <Link href='/contact' className='btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4'>
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
