'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'

interface StripeCheckoutButtonProps {
  customerInfo: {
    name: string
    email: string
    phone: string
  }
}

export default function StripeCheckoutButton({ customerInfo }: StripeCheckoutButtonProps) {
  const { items, getSummary } = useEnhancedCartStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const summary = getSummary()

  const handleCheckout = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setError('Please fill in all contact information')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            students: item.students || [],
            selectedDate: item.selectedDate?.toISOString(),
            selectedDates: item.selectedDates?.map(d => d.toISOString()),
          })),
          customerInfo,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total:</span>
          <span>${summary.total.toFixed(2)} AUD</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : 'Proceed to Secure Payment'}
      </button>

      <p className="text-xs text-center text-gray-500">
        Secure payment powered by Stripe
      </p>
    </div>
  )
}
