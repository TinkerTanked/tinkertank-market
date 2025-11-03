'use client'

import { useEnhancedCartStore } from '@/stores/enhancedCartStore'

export default function OrderSummary() {
  const { items, getSummary } = useEnhancedCartStore()
  const { subtotal, tax, total, itemCount } = getSummary()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-display font-bold text-gray-900'>
        Order Summary
      </h2>

      {/* Items */}
      <div className='space-y-4'>
        {items.map((item) => (
          <div key={item.id} className='flex items-start justify-between'>
            <div className='flex-1'>
              <h3 className='font-medium text-gray-900'>{item.product.name}</h3>
              <p className='text-sm text-gray-600'>Qty: {item.quantity}</p>
              {item.selectedDate && (
                <p className='text-xs text-gray-500'>
                  {item.selectedDate.toLocaleDateString()} • {item.selectedTimeSlot ? (typeof item.selectedTimeSlot === 'string' ? item.selectedTimeSlot : `${item.selectedTimeSlot.start} - ${item.selectedTimeSlot.end}`) : ''}
                </p>
              )}
            </div>
            <span className='font-medium text-gray-900'>
              {formatPrice(item.totalPrice)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className='border-t border-gray-200 pt-4 space-y-2'>
        <div className='flex justify-between text-gray-700'>
          <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        
        <div className='flex justify-between text-gray-700'>
          <span>GST (10%)</span>
          <span>{formatPrice(tax)}</span>
        </div>
        
        <div className='flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200'>
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className='pt-6 border-t border-gray-200 space-y-3'>
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
  )
}
