'use client'

import { useState } from 'react'
import { getProductsByCategory } from '@/data/products'
import ProductCard from '@/components/ui/ProductCard'
import { ClockIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline'
import BookCampButton from '@/components/ui/BookCampButton'

export default function CampsClient() {
  const campProducts = getProductsByCategory('camps')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'day' | 'extended'>('all')

  const filteredProducts = campProducts.filter(product => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'day') return product.duration === '6 hours'
    if (selectedFilter === 'extended') return product.duration === '8 hours'
    return true
  })

  return (
    <div>
      {/* Hero Section */}
      <section className='hero-gradient text-white py-16 lg:py-24'>
        <div className='container-custom'>
          <div className='text-center space-y-6'>
            <h1 className='text-4xl md:text-5xl font-display font-bold leading-tight text-shadow-sm'>
              STEAM <span className='text-yellow-300'>Adventure</span> Camps
            </h1>
            <p className='text-xl md:text-2xl font-light text-blue-100 max-w-3xl mx-auto'>
              Hands-on learning experiences where kids explore science, technology, engineering, and math through exciting projects and experiments
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center pt-4'>
              <div className='flex items-center space-x-2 text-blue-100'>
                <ClockIcon className='w-5 h-5' />
                <span>Daily & Extended Options</span>
              </div>
              <div className='flex items-center space-x-2 text-blue-100'>
                <UserGroupIcon className='w-5 h-5' />
                <span>Ages 5-16</span>
              </div>
              <div className='flex items-center space-x-2 text-blue-100'>
                <SparklesIcon className='w-5 h-5' />
                <span>All Skill Levels</span>
              </div>
            </div>
            
            {/* Hero CTA */}
            <div className='pt-8'>
              <BookCampButton size="lg" variant="hero" className="mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className='py-16 bg-gray-50'>
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
            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
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

            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-3xl'>👥</span>
              </div>
              <h3 className='font-display font-semibold text-xl text-gray-900 mb-3'>
                Small Groups
              </h3>
              <p className='text-gray-600'>
                Maximum 12 kids per camp ensures personalized attention and meaningful interactions with instructors.
              </p>
            </div>

            <div className='bg-white rounded-xl p-8 text-center shadow-lg'>
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
      <section className='py-20'>
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
            <div className='flex space-x-4'>
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedFilter === 'all'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
              }`}
            >
              All Camps
            </button>
            <button
              onClick={() => setSelectedFilter('day')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedFilter === 'day'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
              }`}
            >
              Day Camps
            </button>
            <button
              onClick={() => setSelectedFilter('extended')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedFilter === 'extended'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
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
      <section className='py-20 bg-gradient-to-br from-accent-50 to-primary-50'>
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
    </div>
  )
}
