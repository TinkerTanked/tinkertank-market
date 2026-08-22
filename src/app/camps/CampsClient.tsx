'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getProductsByCategory } from '@/data/products'
import ProductCard from '@/components/ui/ProductCard'
import { ArrowRightIcon, CalendarDaysIcon, ClockIcon, MapPinIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import BookCampButton from '@/components/ui/BookCampButton'
import MobileActionBar from '@/components/ui/MobileActionBar'
import TrustProofSection from '@/components/trust/TrustProofSection'
import { trackEvent } from '@/lib/analytics'

export default function CampsClient() {
  const campProducts = useMemo(() => getProductsByCategory('camps'), [])
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'day' | 'extended'>('all')

  useEffect(() => {
    trackEvent('view_item_list', {
      item_list_id: 'school_holiday_camps',
      item_list_name: 'School Holiday Camps',
      items: campProducts.map(product => ({
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price
      }))
    })
  }, [campProducts])

  const filteredProducts = campProducts.filter(product => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'day') return product.duration === '6 hours'
    if (selectedFilter === 'extended') return product.duration === '8 hours'
    return true
  })

  return (
    <div className='pb-20 md:pb-0'>
      <section className='bg-slate-950 py-14 text-white lg:py-20'>
        <div className='container-custom grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14'>
          <div>
            <p className='text-sm font-bold uppercase tracking-[0.18em] text-cyan-300'>Neutral Bay &amp; Manly</p>
            <h1 className='mt-4 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl'>
              School Holiday STEM Camps in Sydney
            </h1>
            <p className='mt-5 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl'>
              Choose a location and book hands-on days of coding, robotics, engineering, animation and 3D design for children aged 6-16.
            </p>
            <div className='mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-200'>
              <span className='flex items-center gap-2'><ClockIcon className='h-5 w-5 text-cyan-300' />9:00 AM starts</span>
              <span className='flex items-center gap-2'><UserGroupIcon className='h-5 w-5 text-cyan-300' />Ages 6-16</span>
              <span className='flex items-center gap-2'><ShieldCheckIcon className='h-5 w-5 text-cyan-300' />100% WWCC-checked team</span>
            </div>
            <div className='mt-8'>
              <BookCampButton size='lg' variant='hero' label='Choose location & dates' trackingSource='camps_hero' />
            </div>
          </div>

          <div className='space-y-4 rounded-3xl bg-white p-4 text-slate-950 shadow-2xl sm:p-6'>
            <p className='px-1 text-sm font-bold uppercase tracking-[0.15em] text-primary-700'>Book your camp</p>
            <CampLocationCard
              name='Neutral Bay Studio'
              detail='Available weekdays · 9 AM-3 PM or 5 PM'
              address='50 Yeo St, Neutral Bay'
              href='/camps/neutral-bay'
              locationId='neutral-bay'
            />
            <CampLocationCard
              name='Manly Library'
              detail='29 Sep-8 Oct 2026 · 9 AM-3 PM'
              address='Market Place, Manly'
              href='/camps/manly'
              locationId='manly-library'
            />
            <p className='px-2 pb-1 text-sm text-slate-600'>From <strong className='text-slate-950'>$119.99 per child, per day</strong>. Select multiple dates in one booking.</p>
          </div>
        </div>
      </section>

      <TrustProofSection />

      {/* What to Expect */}
      <section className='bg-slate-50 py-20'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl font-display font-bold text-gray-900'>
              What to Expect
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              Our camps combine structured learning with creative play, ensuring every child has an amazing experience
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='feature-card text-center'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>🔬</span>
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-3'>
                Hands-on Experiments
              </h3>
              <p className='text-gray-600'>
                Real science experiments that bring textbook concepts to life. Kids get to touch, build, and discover.
              </p>
            </div>

            <div className='feature-card text-center'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>🚀</span>
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-3'>
                Project Learning
              </h3>
              <p className='text-gray-600'>
                Student-driven project-based learning where kids choose, design, and build their own creations.
              </p>
            </div>

            <div className='feature-card text-center'>
              <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>🏆</span>
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-3'>
                Take Home Projects
              </h3>
              <p className='text-gray-600'>
                Every camper creates something awesome to take home and show family and friends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Camp Options */}
      <section className='bg-white py-20'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl md:text-4xl font-display font-bold text-gray-900'>
              Choose Your Adventure
            </h2>
            <p className='text-xl text-gray-600'>
              Pick the perfect camp experience for your child
            </p>
          </div>

          {/* Filter Buttons */}
          <div className='flex flex-col sm:flex-row items-center justify-center gap-4 mb-12'>
            <div className='flex flex-wrap justify-center gap-2 sm:gap-4'>
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-3 sm:px-6 rounded-lg font-medium transition-all duration-200 ${
                selectedFilter === 'all'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-slate-200 hover:border-primary-300'
              }`}
            >
              All Camps
            </button>
            <button
              onClick={() => setSelectedFilter('day')}
              className={`px-4 py-3 sm:px-6 rounded-lg font-medium transition-all duration-200 ${
                selectedFilter === 'day'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-slate-200 hover:border-primary-300'
              }`}
            >
              Day Camps
            </button>
            <button
              onClick={() => setSelectedFilter('extended')}
              className={`px-4 py-3 sm:px-6 rounded-lg font-medium transition-all duration-200 ${
                selectedFilter === 'extended'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-slate-200 hover:border-primary-300'
              }`}
            >
              Extended Day
            </button>
            </div>
            
            {/* Quick Book Button */}
            <div className='sm:ml-8'>
              <BookCampButton size="md" variant="primary" />
            </div>
          </div>

          {/* Products Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} showCategory={false} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className='text-center py-12'>
              <p className='text-gray-500 text-lg'>No camps match your current filter.</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Our Camps */}
      <section className='border-t border-slate-200 bg-slate-50 py-20'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl font-display font-bold text-gray-900'>
              Why Choose TinkerTank Camps?
            </h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            <div className='text-center space-y-4'>
              <div className='w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto'>
                <span className='text-white text-2xl'>👨‍🔬</span>
              </div>
              <h3 className='font-display font-semibold text-lg'>Expert Instructors</h3>
              <p className='text-gray-600 text-sm'>
                STEAM professionals who love teaching and inspiring young minds
              </p>
            </div>

            <div className='text-center space-y-4'>
              <div className='w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto'>
                <span className='text-white text-2xl'>🛡️</span>
              </div>
              <h3 className='font-display font-semibold text-lg'>Safe Environment</h3>
              <p className='text-gray-600 text-sm'>
                COVID-safe facilities with strict safety protocols for all activities
              </p>
            </div>

            <div className='text-center space-y-4'>
              <div className='w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto'>
                <span className='text-white text-2xl'>📚</span>
              </div>
              <h3 className='font-display font-semibold text-lg'>Curriculum Aligned</h3>
              <p className='text-gray-600 text-sm'>
                Activities align with Australian curriculum standards for maximum learning
              </p>
            </div>

            <div className='text-center space-y-4'>
              <div className='w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto'>
                <span className='text-white text-2xl'>🎯</span>
              </div>
              <h3 className='font-display font-semibold text-lg'>Personalized Learning</h3>
              <p className='text-gray-600 text-sm'>
                Adapted to individual interests and learning styles for maximum engagement
              </p>
            </div>
          </div>
        </div>
      </section>

      <MobileActionBar label='School holiday camps'>
        <BookCampButton size='sm' className='shadow-none' />
      </MobileActionBar>
    </div>
  )
}

function CampLocationCard({
  name,
  detail,
  address,
  href,
  locationId
}: {
  name: string
  detail: string
  address: string
  href: string
  locationId: string
}) {
  return (
    <article className='rounded-2xl border border-slate-200 bg-slate-50 p-5'>
      <div className='flex items-start gap-3'>
        <span className='grid h-10 w-10 flex-none place-items-center rounded-xl bg-primary-100 text-primary-700'>
          <MapPinIcon className='h-5 w-5' />
        </span>
        <div className='min-w-0 flex-1'>
          <h2 className='text-lg font-bold text-slate-950'>{name}</h2>
          <p className='mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700'><CalendarDaysIcon className='h-4 w-4' />{detail}</p>
          <p className='mt-1 text-sm text-slate-500'>{address}</p>
        </div>
      </div>
      <div className='mt-4 flex flex-col gap-2 sm:flex-row sm:items-center'>
        <BookCampButton
          initialLocationId={locationId}
          label='Choose dates'
          size='sm'
          trackingSource='camps_location_card'
          className='w-full sm:w-auto'
        />
        <Link href={href} className='inline-flex items-center justify-center px-3 py-2 text-sm font-semibold text-primary-700 hover:text-primary-900'>
          Location details <ArrowRightIcon className='ml-1.5 h-4 w-4' />
        </Link>
      </div>
    </article>
  )
}
