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
  ShoppingCartIcon,
  RocketLaunchIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { getProductById } from '@/data/products'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'

export default function IgniteDetailPage() {
  const params = useParams()
  const { addItem } = useEnhancedCartStore()
  const [isEnrolling, setIsEnrolling] = useState(false)

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

  const handleEnroll = () => {
    addItem(product, {
      quantity: 1
    })
    setIsEnrolling(false)
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
                    <p className='font-medium text-gray-900'>Weekly Price</p>
                    <p className='text-gray-600 font-bold text-xl'>{formatPrice(product.price)}</p>
                  </div>
                </div>
              </div>

              <div className='pt-4'>
                <button
                  onClick={() => setIsEnrolling(true)}
                  className='bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium px-8 py-4 rounded-lg transition-all duration-200 inline-flex items-center justify-center text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                >
                  <RocketLaunchIcon className='w-5 h-5 mr-2' />
                  Enroll Now
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
                    Maximum 8 students per session ensures personalized attention and meaningful peer interaction.
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

      {/* Enrollment Modal */}
      {isEnrolling && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl max-w-2xl w-full p-8'>
            <div className='text-center space-y-6'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
                <RocketLaunchIcon className='w-8 h-8 text-green-600' />
              </div>
              
              <h2 className='text-2xl font-display font-bold text-gray-900'>
                Enroll in {product.name}
              </h2>
              
              <div className='bg-gray-50 rounded-xl p-6 text-left'>
                <h3 className='font-medium text-gray-900 mb-4'>Enrollment Summary</h3>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span>Program:</span>
                    <span className='font-medium'>{product.name}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Duration:</span>
                    <span className='font-medium'>{product.duration} per session</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Location:</span>
                    <span className='font-medium'>{product.location}</span>
                  </div>
                  <div className='flex justify-between font-bold text-lg pt-2 border-t'>
                    <span>Weekly Price:</span>
                    <span>{formatPrice(product.price)}</span>
                  </div>
                </div>
              </div>

              <p className='text-gray-600'>
                After enrollment, we'll contact you to schedule your child's sessions and discuss their interests.
              </p>

              <div className='flex gap-4'>
                <button
                  onClick={() => setIsEnrolling(false)}
                  className='btn-outline flex-1'
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnroll}
                  className='bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 inline-flex items-center justify-center flex-1'
                >
                  <ShoppingCartIcon className='w-5 h-5 mr-2' />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
