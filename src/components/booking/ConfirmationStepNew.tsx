'use client'

import { CalendarIcon, MapPinIcon, ClockIcon, UserGroupIcon, CheckIcon } from '@heroicons/react/24/outline'

interface CampType {
  id: string
  type: 'day' | 'allday'
  name: string
  price: number
  duration: string
  time: string
}

interface ConfirmationStepProps {
  location: { id: string; name: string; address: string }
  dates: Date[]
  campType: CampType
  onAddToCart: () => void
}

export default function ConfirmationStepNew({ location, dates, campType, onAddToCart }: ConfirmationStepProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!location || dates.length === 0 || !campType) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Missing booking information. Please go back and complete all steps.</p>
      </div>
    )
  }

  const totalPrice = Number((campType.price * dates.length).toFixed(2))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Your Booking</h3>
        <p className="text-gray-600">Check the details before adding to cart</p>
      </div>

      {/* Compact Summary */}
      <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xl font-bold text-gray-900">{campType.name}</h4>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">${totalPrice.toFixed(2)}</div>
            {dates.length > 1 && (
              <div className="text-xs text-gray-600">{dates.length} days × ${campType.price.toFixed(2)}</div>
            )}
          </div>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-4 h-4 text-primary-600" />
            <span className="text-gray-700">{location.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-primary-600" />
            <span className="text-gray-700">{campType.time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-primary-600" />
            <span className="text-gray-700">
              {dates.length === 1 ? formatDate(dates[0]) : `${dates.length} dates`}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="w-4 h-4 text-primary-600" />
            <span className="text-gray-700">Small Groups</span>
          </div>
        </div>

        {/* Selected Dates (if multiple) */}
        {dates.length > 1 && (
          <div className="mt-4 pt-4 border-t border-primary-100">
            <div className="text-xs font-medium text-gray-600 mb-2">Selected Dates:</div>
            <div className="flex flex-wrap gap-2">
              {dates.map((date, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-700">
                  {formatDate(date)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* What's Included */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start space-x-2">
            <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span className="text-blue-900">All materials provided</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span className="text-blue-900">Small group learning</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span className="text-blue-900">Take-home projects</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span className="text-blue-900">Expert instruction</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onAddToCart}
        className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        Add to Cart
      </button>

      <p className="text-xs text-center text-gray-500">
        Student details will be collected at checkout
      </p>
    </div>
  )
}
