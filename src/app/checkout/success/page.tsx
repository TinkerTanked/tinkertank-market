'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon, CalendarIcon, EnvelopeIcon, PhoneIcon, HomeIcon } from '@heroicons/react/24/outline'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import { trackEvent } from '@/lib/analytics'

interface OrderDetails {
  orderId: string
  paymentIntentId: string
  items: Array<{
    product: {
      id: string
      name: string
      shortDescription: string
      category: string
    }
    selectedDate?: string
    selectedTimeSlot?: string | { start: string; end: string }
    location?: string
    quantity: number
    totalPrice: number
  }>
  customerInfo: {
    name?: string
    email?: string
  }
  total: number
  status: string
}

const trackedPurchaseKey = (orderId: string) => `tinkertank_purchase_${orderId}`

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const { clearCart } = useEnhancedCartStore()
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const orderId = searchParams.get('order_id')

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setIsLoading(false)
        return
      }

      try {
        let data: OrderDetails | null = null
        for (let attempt = 0; attempt < 10; attempt += 1) {
          const response = await fetch(`/api/orders/${orderId}`)
          if (response.ok) {
            data = await response.json()
            if (data?.status === 'PAID') break
          }
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        if (data) {
          setOrderDetails(data)
          if (data.status === 'PAID' && !localStorage.getItem(trackedPurchaseKey(data.orderId))) {
            const items = data.items.map(item => ({
              item_id: item.product?.id,
              item_name: item.product?.name,
              item_category: item.product?.category,
              location_id: item.location,
              price: item.totalPrice,
              quantity: item.quantity,
            }))
            trackEvent(
              'purchase',
              {
                transaction_id: data.orderId,
                value: data.total,
                currency: 'AUD',
                items,
              },
              { metaEventId: data.orderId }
            )
            localStorage.setItem(trackedPurchaseKey(data.orderId), 'true')
          }
          if (data.status === 'PAID') {
            clearCart()
            await fetch('/api/booking-draft', { method: 'DELETE' }).catch(() => undefined)
          }
        }
      } catch (error) {
        console.error('Failed to fetch order details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId, clearCart])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className='py-20'>
        <div className='container-custom text-center'>
          <div className='animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading your order confirmation...</p>
        </div>
      </div>
    )
  }

  if (!orderDetails) {
    return (
      <div className='py-20'>
        <div className='container-custom text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Order Not Found</h1>
          <p className='text-gray-600 mb-8'>We couldn't find your order details.</p>
          <Link href='/camps' className='btn-primary'>
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  if (orderDetails.status !== 'PAID') {
    const refunded = orderDetails.status === 'REFUNDED'
    return (
      <div className='py-20'>
        <div className='container-custom max-w-2xl text-center'>
          {!refunded && (
            <div className='mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-700' />
          )}
          <h1 className='font-display text-3xl font-bold text-gray-900'>
            {refunded ? 'Payment refunded' : 'We’re confirming your booking'}
          </h1>
          <p className='mx-auto mt-4 max-w-xl text-lg leading-7 text-gray-600'>
            {refunded
              ? 'Your selected place became unavailable and the payment was automatically refunded. No booking was created.'
              : 'We have your order and are waiting for payment confirmation. Please do not pay again. Refresh this page in a moment if it does not update.'}
          </p>
          <p className='mt-5 text-sm font-semibold text-gray-500'>Order #{orderDetails.orderId}</p>
          <div className='mt-8 flex flex-wrap justify-center gap-3'>
            <button type='button' onClick={() => window.location.reload()} className='btn-primary'>
              Check again
            </button>
            <a href='tel:+61455400261' className='btn-outline'>
              Call 0455 400 261
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='py-20'>
      <div className='container-custom max-w-4xl'>
        {/* Success Header */}
        <div className='text-center space-y-6 mb-12'>
          <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
            <CheckCircleIcon className='w-10 h-10 text-green-600' />
          </div>
          <div className='space-y-2'>
            <h1 className='text-4xl font-display font-bold text-gray-900'>Booking Confirmed!</h1>
            <p className='text-xl text-gray-600'>Your STEAM adventure is all set. We can't wait to see you there!</p>
          </div>
        </div>

        {/* Order Details */}
        <div className='bg-white rounded-2xl shadow-lg p-8 mb-8'>
          <div className='border-b border-gray-200 pb-6 mb-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-2xl font-display font-bold text-gray-900'>Order #{orderDetails.orderId}</h2>
                <p className='text-gray-600'>Confirmation sent to {orderDetails.customerInfo?.email}</p>
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-green-600'>{formatPrice(orderDetails.total)}</div>
                <div className='text-sm text-gray-500'>Payment Successful</div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className='space-y-6'>
            <h3 className='text-lg font-display font-semibold text-gray-900'>Your Bookings</h3>

            {orderDetails.items?.map((item, index) => (
              <div key={index} className='flex items-start space-x-4 p-4 bg-gray-50 rounded-lg'>
                <div className='w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <span className='text-2xl'>
                    {item.product?.category === 'camps' && '🔬'}
                    {item.product?.category === 'birthdays' && '🎉'}
                    {item.product?.category === 'subscriptions' && '🚀'}
                  </span>
                </div>
                <div className='flex-1'>
                  <h4 className='font-display font-semibold text-lg text-gray-900'>{item.product?.name}</h4>
                  <p className='text-gray-600'>{item.product?.shortDescription}</p>
                  {item.selectedDate && (
                    <div className='flex items-center space-x-4 mt-2 text-sm text-gray-500'>
                      <span>📅 {new Date(item.selectedDate).toLocaleDateString()}</span>
                      {item.selectedTimeSlot && (
                        <span>
                          🕒{' '}
                          {typeof item.selectedTimeSlot === 'string'
                            ? item.selectedTimeSlot
                            : `${item.selectedTimeSlot.start} - ${item.selectedTimeSlot.end}`}
                        </span>
                      )}
                    </div>
                  )}
                  <div className='mt-2'>
                    <span className='text-sm text-gray-500'>Quantity: {item.quantity}</span>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='font-bold text-lg text-gray-900'>{formatPrice(item.totalPrice)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className='bg-blue-50 rounded-2xl p-8 mb-8'>
          <h3 className='text-xl font-display font-bold text-gray-900 mb-6'>What Happens Next?</h3>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center space-y-3'>
              <div className='w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto text-white font-bold'>1</div>
              <h4 className='font-medium text-gray-900'>Confirmation Email</h4>
              <p className='text-sm text-gray-600'>You'll receive a detailed confirmation email within 5 minutes</p>
            </div>

            <div className='text-center space-y-3'>
              <div className='w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto text-white font-bold'>2</div>
              <h4 className='font-medium text-gray-900'>Preparation Call</h4>
              <p className='text-sm text-gray-600'>We'll call you 24-48 hours before to confirm details and answer any questions</p>
            </div>

            <div className='text-center space-y-3'>
              <div className='w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto text-white font-bold'>3</div>
              <h4 className='font-medium text-gray-900'>Enjoy the Experience</h4>
              <p className='text-sm text-gray-600'>Arrive at the specified time and watch your child's face light up!</p>
            </div>
          </div>
        </div>

        {/* Contact & Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {/* Contact Info */}
          <div className='bg-white rounded-xl shadow-lg p-6'>
            <h3 className='text-lg font-display font-semibold text-gray-900 mb-4'>Questions or Changes?</h3>
            <div className='space-y-3'>
              <div className='flex items-center space-x-3'>
                <PhoneIcon className='w-5 h-5 text-primary-500' />
                <a href='tel:+61455400261' className='text-primary-600 hover:text-primary-700'>
                  0455 400 261
                </a>
              </div>
              <div className='flex items-center space-x-3'>
                <EnvelopeIcon className='w-5 h-5 text-primary-500' />
                <a href='mailto:hello@tinkertank.rocks' className='text-primary-600 hover:text-primary-700'>
                  hello@tinkertank.rocks
                </a>
              </div>
            </div>
            <p className='text-sm text-gray-600 mt-4'>Please reference order #{orderDetails.orderId} when contacting us.</p>
          </div>

          {/* Actions */}
          <div className='bg-white rounded-xl shadow-lg p-6'>
            <h3 className='text-lg font-display font-semibold text-gray-900 mb-4'>What's Next?</h3>
            <div className='space-y-3'>
              <Link href='/camps' className='btn-primary w-full text-center'>
                <CalendarIcon className='w-4 h-4 mr-2' />
                Book Another Program
              </Link>
              <Link href='/' className='btn-outline w-full text-center'>
                <HomeIcon className='w-4 h-4 mr-2' />
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className='mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6'>
          <h3 className='font-medium text-yellow-900 mb-3'>Important Reminders:</h3>
          <ul className='space-y-2 text-sm text-yellow-800'>
            <li>• Please arrive 15 minutes before your scheduled time</li>
            <li>• Bring a water bottle and lunch (for full-day programs)</li>
            <li>• All materials and equipment will be provided</li>

            <li>• Contact us immediately if you have any dietary restrictions or medical concerns</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className='py-20'>
          <div className='container-custom text-center'>
            <div className='animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  )
}
