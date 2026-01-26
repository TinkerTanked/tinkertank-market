'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ClockIcon, 
  UserGroupIcon, 
  MapPinIcon, 
  CheckIcon,
  CalendarIcon,
  RocketLaunchIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { getProductById } from '@/data/products'
import IgniteBookingWizard from '@/components/booking/IgniteBookingWizard'

export default function IgniteDetailPage() {
  const params = useParams()
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  const product = getProductById(params.id as string)

  if (!product) {
    return (
      <div className='py-20'>
        <div className='container-custom text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Program Not Found</h1>
          <p className='text-gray-600 mb-8'>The Ignite program you're looking for doesn't exist.</p>
          <Link href='/ignite' className='btn-primary'>
            Back to Ignite Programs
          </Link>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  return (
    <div>
      {/* Hero Section */}
      <section className='py-16 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50'>
        <div className='container-custom'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            <div className='space-y-6'>
              <div className='space-y-2'>
                <div className='flex items-center space-x-2 text-green-600 font-medium'>
                  <span className='bg-green-100 px-3 py-1 rounded-full text-sm'>Ignite Program</span>
                  <span>•</span>
                  <span>{product.ageRange}</span>
                </div>
                <h1 className='text-4xl md:text-5xl font-display font-bold text-gray-900 leading-tight'>
                  {product.name}
                </h1>
                <p className='text-xl text-gray-600 leading-relaxed'>
                  {product.description}
                </p>
              </div>

              <div className='grid grid-cols-2 gap-6'>
                <div className='flex items-center space-x-3'>
                  <ClockIcon className='w-6 h-6 text-green-500' />
                  <div>
                    <p className='font-medium text-gray-900'>Session Length</p>
                    <p className='text-gray-600'>{product.duration}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <UserGroupIcon className='w-6 h-6 text-green-500' />
                  <div>
                    <p className='font-medium text-gray-900'>Group Size</p>
                    <p className='text-gray-600'>Max {product.maxCapacity} kids</p>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <MapPinIcon className='w-6 h-6 text-green-500' />
                  <div>
                    <p className='font-medium text-gray-900'>Location</p>
                    <p className='text-gray-600'>{product.location}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <CalendarIcon className='w-6 h-6 text-green-500' />
                  <div>
                    <p className='font-medium text-gray-900'>From</p>
                    <p className='text-gray-600 font-bold text-xl'>{formatPrice(product.price)}/wk</p>
                  </div>
                </div>
              </div>

              <div className='pt-4'>
                <button
                  onClick={() => setIsWizardOpen(true)}
                  className='bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium px-8 py-4 rounded-lg transition-all duration-200 inline-flex items-center justify-center text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                >
                  <RocketLaunchIcon className='w-5 h-5 mr-2' />
                  Subscribe Now
                </button>
              </div>
            </div>

            {/* Image */}
            <div className='relative'>
              <div className='bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl h-96 flex items-center justify-center'>
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className='w-full h-full object-cover rounded-2xl'
                  />
                ) : (
                  <div className='text-8xl'>🚀</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Overview */}
      <section className='py-20'>
        <div className='container-custom'>
          <div className='grid lg:grid-cols-2 gap-16'>
            {/* What Students Learn */}
            <div className='space-y-6'>
              <h2 className='text-3xl font-display font-bold text-gray-900'>
                What Students Learn
              </h2>
              <div className='space-y-4'>
                {product.features?.map((feature, index) => (
                  <div key={index} className='flex items-start space-x-3'>
                    <CheckIcon className='w-6 h-6 text-green-500 mt-0.5 flex-shrink-0' />
                    <span className='text-gray-700'>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Program Structure */}
            <div className='space-y-6'>
              <h2 className='text-3xl font-display font-bold text-gray-900'>
                Program Structure
              </h2>
              <div className='space-y-4'>
                <div className='bg-blue-50 rounded-lg p-4'>
                  <h3 className='font-medium text-blue-900 mb-2 flex items-center'>
                    <AcademicCapIcon className='w-5 h-5 mr-2' />
                    Weekly Sessions
                  </h3>
                  <p className='text-blue-800'>
                    Consistent weekly learning builds momentum and deep understanding of STEAM concepts.
                  </p>
                </div>

                <div className='bg-green-50 rounded-lg p-4'>
                  <h3 className='font-medium text-green-900 mb-2 flex items-center'>
                    <ClockIcon className='w-5 h-5 mr-2' />
                    Flexible Scheduling
                  </h3>
                  <p className='text-green-800'>
                    Multiple time slots available to fit around school and family commitments.
                  </p>
                </div>

                <div className='bg-purple-50 rounded-lg p-4'>
                  <h3 className='font-medium text-purple-900 mb-2 flex items-center'>
                    <UserGroupIcon className='w-5 h-5 mr-2' />
                    Small Groups
                  </h3>
                  <p className='text-purple-800'>
                    Small class sizes ensure personalized attention and meaningful peer interaction.
                  </p>
                </div>

                <div className='bg-yellow-50 rounded-lg p-4'>
                  <h3 className='font-medium text-yellow-900 mb-2 flex items-center'>
                    <RocketLaunchIcon className='w-5 h-5 mr-2' />
                    Progress Tracking
                  </h3>
                  <p className='text-yellow-800'>
                    Regular progress updates help parents see their child's development and achievements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-16 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white'>
        <div className='container-custom text-center'>
          <div className='space-y-6'>
            <h2 className='text-3xl md:text-4xl font-display font-bold'>
              Ready to Get Started?
            </h2>
            <p className='text-xl text-blue-100 max-w-2xl mx-auto'>
              Join {product.name} and watch your child's confidence and abilities grow week after week.
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

      {/* Ignite Booking Wizard */}
      <IgniteBookingWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </div>
  )
}
