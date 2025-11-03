'use client'

import { CalendarIcon, MapPinIcon, ClockIcon, CurrencyDollarIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface Location {
  id: string
  name: string
  address: string
}

interface CampType {
  id: string
  type: 'day' | 'allday'
  name: string
  price: number
  duration: string
  time: string
}

interface BookingData {
  location: Location | null
  date: Date | null
  campType: CampType | null
}

interface ConfirmationStepProps {
  bookingData: BookingData
  onAddToCart: () => void
}

export default function ConfirmationStep({ bookingData, onAddToCart }: ConfirmationStepProps) {
  const { location, date, campType } = bookingData

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!location || !date || !campType) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Missing booking information. Please go back and complete all steps.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">Confirm Your Booking</h3>
        <p className="text-gray-600">Review your camp details before adding to cart</p>
      </div>

      {/* Booking Summary Card */}
      <div className="bg-white border-2 border-primary-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">STEM Adventure Camp</h4>
            <div className="flex items-center space-x-2 text-primary-600">
              <SparklesIcon className="w-5 h-5" />
              <span className="font-medium">Ready for an amazing learning adventure!</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary-600">${campType.price}</div>
            <div className="text-sm text-gray-500">per child</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Location */}
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <MapPinIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Location</div>
              <div className="text-gray-600">TinkerTank {location.name}</div>
              <div className="text-sm text-gray-500">{location.address}</div>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Date</div>
              <div className="text-gray-600">{formatDate(date)}</div>
            </div>
          </div>

          {/* Camp Type */}
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Camp Type</div>
              <div className="text-gray-600">{campType.name}</div>
              <div className="text-sm text-gray-500">{campType.time}</div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Total Cost</div>
              <div className="text-gray-600">${campType.price}</div>
              <div className="text-sm text-gray-500">Includes all materials</div>
            </div>
          </div>
        </div>
      </div>

      {/* What's Included */}
      <div className="bg-green-50 rounded-lg p-6">
        <h4 className="font-medium text-green-900 mb-3 flex items-center space-x-2">
          <span className="text-green-600 text-lg">✅</span>
          <span>What's Included in Your {campType.name}</span>
        </h4>
        <div className="grid gap-2 md:grid-cols-2 text-sm text-green-800">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Hands-on STEM experiments</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Take-home project</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>All materials provided</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Expert instructor guidance</span>
          </div>
          {campType.type === 'day' ? (
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span>Morning tea included</span>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Lunch & snacks included</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Extended learning time</span>
              </div>
            </>
          )}
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Progress photos</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Certificate of completion</span>
          </div>
        </div>
      </div>

      {/* Important Information */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-lg">ℹ️</span>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Before You Book</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Suitable for ages 5-16 years</li>
              <li>• Maximum 12 children per camp</li>
              <li>• Free cancellation up to 48 hours before</li>
              <li>• Student details required at checkout</li>
              <li>• Photo permission forms included</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-4">
          Ready to secure your spot? Add this camp to your cart and proceed to checkout.
        </p>
        <button
          onClick={onAddToCart}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Add ${campType.price} Camp to Cart 🚀
        </button>
        <p className="text-sm text-gray-500 mt-2">
          You'll be able to add student details and complete payment in the next step
        </p>
      </div>
    </div>
  )
}
