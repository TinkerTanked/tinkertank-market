'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ClockIcon, 
  UserGroupIcon, 
  MapPinIcon, 
  CheckIcon,
  CalendarIcon,
  GiftIcon
} from '@heroicons/react/24/outline'
import { getProductById } from '@/data/products'
import BirthdayBookingWizard from '@/components/booking/BirthdayBookingWizard'

export default function BirthdayDetailPage() {
  const params = useParams()
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  const product = getProductById(params.id as string)

  if (!product) {
    return (
      <div className='py-20'>
        <div className='container-custom text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Party Package Not Found</h1>
          <p className='text-gray-600 mb-8'>The party package you&apos;re looking for doesn&apos;t exist.</p>
          <Link href='/birthdays' className='btn-primary'>
            Back to Birthday Parties
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
      <section className='py-16 bg-gradient-to-br from-purple-50 via-pink-50 to-accent-50'>
        <div className='container-custom'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            <div className='space-y-6'>
              <div className='space-y-2'>
                <div className='flex items-center space-x-2 text-purple-600 font-medium'>
                  <span className='bg-purple-100 px-3 py-1 rounded-full text-sm'>Birthday Party</span>
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
                  <ClockIcon className='w-6 h-6 text-purple-500' />
                  <div>
                    <p className='font-medium text-gray-900'>Duration</p>
                    <p className='text-gray-600'>{product.duration}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <UserGroupIcon className='w-6 h-6 text-purple-500' />
                  <div>
                    <p className='font-medium text-gray-900'>Max Guests</p>
                    <p className='text-gray-600'>{product.maxCapacity} kids</p>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <MapPinIcon className='w-6 h-6 text-purple-500' />
                  <div>
                    <p className='font-medium text-gray-900'>Location</p>
                    <p className='text-gray-600'>{product.location}</p>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <GiftIcon className='w-6 h-6 text-purple-500' />
                  <div>
                    <p className='font-medium text-gray-900'>Price</p>
                    <p className='text-gray-600 font-bold text-xl'>{formatPrice(product.price)}</p>
                  </div>
                </div>
              </div>

              <div className='pt-4'>
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className='bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-8 py-4 rounded-lg transition-all duration-200 inline-flex items-center justify-center text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                >
                  <CalendarIcon className='w-5 h-5 mr-2' />
                  Book This Party
                </button>
              </div>
            </div>

            <div className='relative'>
              <div className='bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl h-96 flex items-center justify-center overflow-hidden'>
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className='object-cover rounded-2xl'
                  />
                ) : (
                  <div className='text-8xl'>🎉</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='py-20'>
        <div className='container-custom'>
          <div className='grid lg:grid-cols-2 gap-16'>
            <div className='space-y-6'>
              <h2 className='text-3xl font-display font-bold text-gray-900'>
                What&apos;s Included
              </h2>
              <div className='space-y-4'>
                {product.features?.map((feature, index) => (
                  <div key={index} className='flex items-start space-x-3'>
                    <CheckIcon className='w-6 h-6 text-green-500 mt-0.5 flex-shrink-0' />
                    <span className='text-gray-700'>{feature}</span>
                  </div>
                ))}
              </div>

              {product.addOns && product.addOns.length > 0 && (
                <div className='space-y-4 pt-6 border-t border-gray-200'>
                  <h3 className='text-xl font-display font-semibold text-gray-900'>
                    Optional Add-ons
                  </h3>
                  <div className='space-y-3'>
                    {product.addOns.map((addon, index) => (
                      <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                        <div className='flex items-center space-x-3'>
                          <span className='text-2xl'>🎁</span>
                          <div>
                            <p className='font-medium text-gray-900'>{addon.name}</p>
                            <p className='text-sm text-gray-600'>{addon.description}</p>
                          </div>
                        </div>
                        <span className='font-bold text-primary-600'>
                          +{formatPrice(addon.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className='space-y-6'>
              <h2 className='text-3xl font-display font-bold text-gray-900'>
                Party Timeline
              </h2>
              <div className='space-y-6'>
                <div className='flex items-start space-x-4'>
                  <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0'>
                    1
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>Setup (15 mins)</h3>
                    <p className='text-gray-600 text-sm'>Our team arrives early to set up all activities and decorations</p>
                  </div>
                </div>

                <div className='flex items-start space-x-4'>
                  <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0'>
                    2
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>Welcome & Intro (15 mins)</h3>
                    <p className='text-gray-600 text-sm'>Kids are welcomed and introduced to the party theme and activities</p>
                  </div>
                </div>

                <div className='flex items-start space-x-4'>
                  <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0'>
                    3
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>Main Activities (60 mins)</h3>
                    <p className='text-gray-600 text-sm'>Hands-on STEAM activities, building projects, and themed experiments</p>
                  </div>
                </div>

                <div className='flex items-start space-x-4'>
                  <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0'>
                    4
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>Cake & Celebration (15 mins)</h3>
                    <p className='text-gray-600 text-sm'>Time for cake, singing, and showing off their creations</p>
                  </div>
                </div>

                <div className='flex items-start space-x-4'>
                  <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0'>
                    5
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>Take-Home & Cleanup (15 mins)</h3>
                    <p className='text-gray-600 text-sm'>Kids pack up their projects while we handle all the cleanup</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BirthdayBookingWizard 
        product={product}
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
      />
    </div>
  )
}
