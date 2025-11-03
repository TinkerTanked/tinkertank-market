'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  TrashIcon, 
  PlusIcon, 
  MinusIcon, 
  ShoppingCartIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSummary, clearCart } = useEnhancedCartStore()
  const { subtotal, tax, total, itemCount } = getSummary()
  const [isClearing, setIsClearing] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  if (items.length === 0) {
    return (
      <div className='py-20'>
        <div className='container-custom'>
          <div className='text-center space-y-8'>
            <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto'>
              <ShoppingCartIcon className='w-12 h-12 text-gray-400' />
            </div>
            <div className='space-y-4'>
              <h1 className='text-3xl font-display font-bold text-gray-900'>
                Your Cart is Empty
              </h1>
              <p className='text-lg text-gray-600 max-w-md mx-auto'>
                Discover our amazing STEM programs and start building your child's future
              </p>
            </div>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link href='/camps' className='btn-primary text-lg px-8 py-4'>
                Browse Camps
              </Link>
              <Link href='/birthdays' className='btn-outline text-lg px-8 py-4'>
                Birthday Parties
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='py-12'>
      <div className='container-custom'>
        <div className='grid lg:grid-cols-3 gap-12'>
          {/* Cart Items */}
          <div className='lg:col-span-2 space-y-6'>
            <div className='flex items-center justify-between'>
              <h1 className='text-3xl font-display font-bold text-gray-900'>
                Your Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </h1>
              {items.length > 0 && (
                <button
                  onClick={() => setIsClearing(true)}
                  className='text-gray-500 hover:text-red-600 transition-colors duration-200'
                >
                  Clear All
                </button>
              )}
            </div>

            <div className='space-y-4'>
              {items.map((item) => (
                <div key={item.id} className='card p-6'>
                  <div className='flex flex-col md:flex-row gap-6'>
                    {/* Product Image */}
                    <div className='w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                      {item.product.images && item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className='w-full h-full object-cover rounded-lg'
                        />
                      ) : (
                        <span className='text-3xl'>
                          {item.product.category === 'camps' && '🔬'}
                          {item.product.category === 'birthdays' && '🎉'}
                          {item.product.category === 'subscriptions' && '🚀'}
                        </span>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className='flex-1 space-y-3'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <h3 className='font-display font-semibold text-lg text-gray-900'>
                            {item.product.name}
                          </h3>
                          <p className='text-gray-600'>{item.product.shortDescription}</p>
                          
                          {/* Date and Time */}
                          {item.selectedDate && (
                            <div className='flex items-center space-x-4 mt-2 text-sm text-gray-500'>
                              <span>📅 {item.selectedDate.toLocaleDateString()}</span>
                              {item.selectedTimeSlot && <span>🕒 {typeof item.selectedTimeSlot === 'string' ? item.selectedTimeSlot : `${item.selectedTimeSlot.start} - ${item.selectedTimeSlot.end}`}</span>}
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => removeItem(item.id)}
                          className='text-gray-400 hover:text-red-600 transition-colors duration-200 p-1'
                        >
                          <TrashIcon className='w-5 h-5' />
                        </button>
                      </div>

                      {/* Quantity and Price */}
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          <span className='text-gray-700 font-medium'>Quantity:</span>
                          <div className='flex items-center space-x-2'>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className='w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200'
                            >
                              <MinusIcon className='w-4 h-4' />
                            </button>
                            <span className='w-8 text-center font-medium'>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className='w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200'
                            >
                              <PlusIcon className='w-4 h-4' />
                            </button>
                          </div>
                        </div>
                        
                        <div className='text-right'>
                          <div className='font-bold text-xl text-gray-900'>
                            {formatPrice(item.totalPrice)}
                          </div>
                          {item.quantity > 1 && (
                            <div className='text-sm text-gray-500'>
                              {formatPrice(item.pricePerItem)} each
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Student Assignment Notice */}
                      {(item.product.category === 'camps' || item.product.category === 'birthdays') && 
                       item.students.length < item.quantity && (
                        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                          <p className='text-yellow-800 text-sm'>
                            ⚠️ Student information required for {item.quantity - item.students.length} more {item.quantity - item.students.length === 1 ? 'participant' : 'participants'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <div className='card p-6 sticky top-24'>
              <h2 className='text-xl font-display font-bold text-gray-900 mb-6'>
                Order Summary
              </h2>
              
              <div className='space-y-4'>
                <div className='flex justify-between text-gray-700'>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                <div className='flex justify-between text-gray-700'>
                  <span>GST (10%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                
                <div className='border-t border-gray-200 pt-4'>
                  <div className='flex justify-between text-lg font-bold text-gray-900'>
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <div className='mt-8 space-y-4'>
                <Link
                  href='/checkout'
                  className='btn-primary w-full text-lg py-4'
                >
                  <span className='flex items-center justify-center'>
                    Proceed to Checkout
                    <ArrowRightIcon className='w-5 h-5 ml-2' />
                  </span>
                </Link>
                
                <Link
                  href='/camps'
                  className='btn-outline w-full text-center'
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className='mt-8 pt-6 border-t border-gray-200 space-y-3'>
                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                  <span className='text-green-500'>✓</span>
                  <span>Secure payment processing</span>
                </div>
                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                  <span className='text-green-500'>✓</span>
                  <span>48-hour cancellation policy</span>
                </div>
                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                  <span className='text-green-500'>✓</span>
                  <span>100% satisfaction guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Cart Confirmation */}
        {isClearing && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-2xl max-w-md w-full p-8 text-center'>
              <h3 className='text-xl font-display font-bold text-gray-900 mb-4'>
                Clear Cart?
              </h3>
              <p className='text-gray-600 mb-6'>
                Are you sure you want to remove all items from your cart? This action cannot be undone.
              </p>
              <div className='flex gap-4'>
                <button
                  onClick={() => setIsClearing(false)}
                  className='btn-outline flex-1'
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    clearCart()
                    setIsClearing(false)
                  }}
                  className='bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex-1'
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
