'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getProductsByCategory } from '@/data/products'
import ProductCard from '@/components/ui/ProductCard'
import IgniteBookingWizard from '@/components/booking/IgniteBookingWizard'
import { 
  RocketLaunchIcon, 
  AcademicCapIcon, 
  ClockIcon, 
  UsersIcon,
  StarIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

export default function IgniteClient() {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const igniteProducts = getProductsByCategory('subscriptions')

  return (
    <div>
      {/* Hero Section */}
      <section className='bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 text-white py-16 lg:py-24'>
        <div className='container-custom'>
          <div className='text-center space-y-6'>
            <div className='flex items-center justify-center space-x-2 mb-4'>
              <RocketLaunchIcon className='w-8 h-8 text-yellow-300' />
              <span className='bg-yellow-300 text-purple-900 px-4 py-2 rounded-full font-bold text-sm'>
                ONGOING PROGRAM
              </span>
            </div>
            <h1 className='text-4xl md:text-5xl font-display font-bold leading-tight text-shadow-sm'>
              Ignite <span className='text-yellow-300'>STEAM</span> Program
            </h1>
            <p className='text-xl md:text-2xl font-light text-blue-100 max-w-3xl mx-auto'>
              Weekly STEAM sessions that build confidence, creativity, and problem-solving skills throughout the school term
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center pt-4'>
              <div className='flex items-center space-x-2 text-blue-100'>
                <AcademicCapIcon className='w-5 h-5' />
                <span>Curriculum Aligned</span>
              </div>
              <div className='flex items-center space-x-2 text-blue-100'>
                <UsersIcon className='w-5 h-5' />
                <span>Small Groups</span>
              </div>
              <div className='flex items-center space-x-2 text-blue-100'>
                <ClockIcon className='w-5 h-5' />
                <span>Weekly Sessions</span>
              </div>
            </div>
            <div className='pt-6'>
              <button
                onClick={() => setIsWizardOpen(true)}
                className='btn-secondary text-lg px-8 py-4 shadow-lg inline-flex items-center'
              >
                <RocketLaunchIcon className='w-5 h-5 mr-2' />
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Ignite Booking Wizard */}
      <IgniteBookingWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />

      {/* Program Benefits */}
      <section className='py-16 bg-gray-50'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl font-display font-bold text-gray-900'>
              Why Kids Love Ignite
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              More than just learning - it's about building confidence and discovering passions
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>🧠</span>
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-3'>
                Build Confidence
              </h3>
              <p className='text-gray-600'>
                Weekly challenges help kids overcome fears and develop problem-solving confidence
              </p>
            </div>

            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>🤝</span>
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-3'>
                Make Friends
              </h3>
              <p className='text-gray-600'>
                Regular sessions create lasting friendships with like-minded peers who share STEAM interests
              </p>
            </div>

            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
              <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>💡</span>
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-3'>
                Discover Passions
              </h3>
              <p className='text-gray-600'>
                Exposure to diverse STEAM fields helps kids identify their natural interests and talents
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Program Options */}
      <section className='py-20'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl md:text-4xl font-display font-bold text-gray-900'>
              Choose Your Ignite Program
            </h2>
            <p className='text-xl text-gray-600'>
              Flexible options to fit your family's schedule and needs
            </p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {igniteProducts.map((product) => (
              <ProductCard key={product.id} product={product} showCategory={false} />
            ))}
          </div>
        </div>
      </section>

      {/* Learning Journey */}
      <section className='py-20 bg-gradient-to-br from-green-50 to-blue-50'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl font-display font-bold text-gray-900'>
              The Learning Journey
            </h2>
            <p className='text-lg text-gray-600'>
              Progressive skill building across multiple STEAM disciplines
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
            <div className='text-center space-y-4'>
              <div className='w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl'>
                1
              </div>
              <h3 className='font-display font-semibold text-lg'>Foundation</h3>
              <p className='text-gray-600 text-sm'>
                Introduction to STEAM concepts through fun, hands-on activities
              </p>
            </div>

            <div className='text-center space-y-4'>
              <div className='w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl'>
                2
              </div>
              <h3 className='font-display font-semibold text-lg'>Exploration</h3>
              <p className='text-gray-600 text-sm'>
                Deeper dive into different STEAM fields to discover interests
              </p>
            </div>

            <div className='text-center space-y-4'>
              <div className='w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl'>
                3
              </div>
              <h3 className='font-display font-semibold text-lg'>Application</h3>
              <p className='text-gray-600 text-sm'>
                Apply skills to create more complex projects and solutions
              </p>
            </div>

            <div className='text-center space-y-4'>
              <div className='w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl'>
                4
              </div>
              <h3 className='font-display font-semibold text-lg'>Innovation</h3>
              <p className='text-gray-600 text-sm'>
                Design and build original projects that showcase learning
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className='py-20 bg-white'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl font-display font-bold text-gray-900'>
              Student Success Stories
            </h2>
            <p className='text-lg text-gray-600'>
              See how Ignite has transformed our students' confidence and abilities
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8'>
              <div className='flex items-start space-x-4'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
                  <span className='font-bold text-blue-600'>AW</span>
                </div>
                <div className='space-y-3'>
                  <div>
                    <h3 className='font-display font-semibold text-lg text-gray-900'>Alex W., Age 9</h3>
                    <div className='flex text-yellow-400 text-sm'>
                      {Array.from({ length: 5 }, (_, i) => (
                        <StarIcon key={i} className='w-4 h-4 fill-current' />
                      ))}
                    </div>
                  </div>
                  <p className='text-gray-700 italic'>
                    "Started shy and nervous about math. Now he's building robots and explaining coding concepts to his classmates. The confidence transformation has been incredible!"
                  </p>
                  <p className='text-sm text-gray-500'>- Sarah W., Parent</p>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8'>
              <div className='flex items-start space-x-4'>
                <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                  <span className='font-bold text-green-600'>ZT</span>
                </div>
                <div className='space-y-3'>
                  <div>
                    <h3 className='font-display font-semibold text-lg text-gray-900'>Zoe T., Age 11</h3>
                    <div className='flex text-yellow-400 text-sm'>
                      {Array.from({ length: 5 }, (_, i) => (
                        <StarIcon key={i} className='w-4 h-4 fill-current' />
                      ))}
                    </div>
                  </div>
                  <p className='text-gray-700 italic'>
                    "Zoe discovered her love for engineering through Ignite. She's now considering engineering for her future career and has become the family's go-to problem solver!"
                  </p>
                  <p className='text-sm text-gray-500'>- Michael T., Parent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className='py-20 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white'>
        <div className='container-custom text-center'>
          <div className='space-y-6'>
            <h2 className='text-3xl md:text-4xl font-display font-bold'>
              Ready to Ignite Your Child's Future?
            </h2>
            <p className='text-xl text-blue-100 max-w-2xl mx-auto'>
              Join our weekly program and watch your child's confidence and abilities grow
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
              <button
                onClick={() => setIsWizardOpen(true)}
                className='btn-secondary text-lg px-8 py-4 shadow-lg inline-flex items-center'
              >
                <RocketLaunchIcon className='w-5 h-5 mr-2' />
                Subscribe Now
              </button>
              <Link href='/contact' className='btn-outline border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4'>
                Ask Questions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
