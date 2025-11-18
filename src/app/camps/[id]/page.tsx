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
  ShoppingCartIcon
} from '@heroicons/react/24/outline'
import { getProductById } from '@/data/products'
import CampBookingWizard from '@/components/booking/CampBookingWizard'

export default function CampDetailPage() {
  const params = useParams()
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  const product = getProductById(params.id as string)

  if (!product) {
    return (
      <div className='py-20'>
        <div className='container-custom text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Camp Not Found</h1>
          <p className='text-gray-600 mb-8'>The camp you're looking for doesn't exist.</p>
          <Link href='/camps' className='btn-primary'>
            Back to Camps
          </Link>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div>
      {/* Hero Section */}
      <section className='py-16 bg-gradient-to-br from-primary-50 to-accent-50'>
        <div className='container-custom'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            <div className='space-y-6'>
              <div className='space-y-2'>
                <div className='flex items-center space-x-2 text-primary-600 font-medium'>
                  <span className='bg-primary-100 px-3 py-1 rounded-full text-sm'>STEM Camp</span>
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
                  <ClockIcon className='w-6 h-6 text-primary-500' />
                  <div>
                    <p className='font-medium text-gray-900'>Duration</p>
                    <p className='text-gray-600'>{product.duration}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <UserGroupIcon className='w-6 h-6 text-primary-500' />
                  <div>
                    <p className='font-medium text-gray-900'>Group Size</p>
                    <p className='text-gray-600'>Max {product.maxCapacity} kids</p>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <MapPinIcon className='w-6 h-6 text-primary-500' />
                  <div>
                    <p className='font-medium text-gray-900'>Location</p>
                    <p className='text-gray-600'>{product.location}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <CalendarIcon className='w-6 h-6 text-primary-500' />
                  <div>
                    <p className='font-medium text-gray-900'>Price</p>
                    <p className='text-gray-600 font-bold text-xl'>{formatPrice(product.price)}</p>
                  </div>
                </div>
              </div>

              <div className='pt-4'>
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className='btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300'
                >
                  <CalendarIcon className='w-5 h-5 mr-2' />
                  Select Date & Time
                </button>
              </div>
            </div>

            {/* Image */}
            <div className='relative'>
              <div className='bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl h-96 flex items-center justify-center'>
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className='w-full h-full object-cover rounded-2xl'
                  />
                ) : (
                  <div className='text-8xl'>🔬</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features & What's Included */}
      <section className='py-20'>
        <div className='container-custom'>
          <div className='grid lg:grid-cols-2 gap-16'>
            {/* What's Included */}
            <div className='space-y-6'>
              <h2 className='text-3xl font-display font-bold text-gray-900'>
                What's Included
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

            {/* Additional Info */}
            <div className='space-y-6'>
              <h2 className='text-3xl font-display font-bold text-gray-900'>
                Good to Know
              </h2>
              <div className='space-y-4'>
                <div className='bg-blue-50 rounded-lg p-4'>
                  <h3 className='font-medium text-blue-900 mb-2'>Drop-off & Pick-up</h3>
                  <p className='text-blue-800'>
                    Drop-off starts 15 minutes before camp begins. Pick-up is available 15 minutes after camp ends.
                  </p>
                </div>
                <div className='bg-green-50 rounded-lg p-4'>
                  <h3 className='font-medium text-green-900 mb-2'>What to Bring</h3>
                  <p className='text-green-800'>
                    Just bring lunch, water bottle, and enthusiasm! All materials and equipment provided.
                  </p>
                </div>
                <div className='bg-yellow-50 rounded-lg p-4'>
                  <h3 className='font-medium text-yellow-900 mb-2'>Cancellation Policy</h3>
                  <p className='text-yellow-800'>
                    Full refund available up to 48 hours before camp starts. See our policy for details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <CampBookingWizard 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  )
}
