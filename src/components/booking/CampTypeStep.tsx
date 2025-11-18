'use client'

import { ClockIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface CampType {
  id: string
  type: 'day' | 'allday'
  name: string
  price: number
  duration: string
  time: string
}

interface CampTypeStepProps {
  selectedCampType: CampType | null
  onCampTypeSelect: (campType: CampType) => void
  date: Date | null
}

const CAMP_TYPES: CampType[] = [
  {
    id: 'day-camp',
    type: 'day',
    name: 'Day Camp',
    price: 109.99,
    duration: '6 hours',
    time: '9:00 AM - 3:00 PM'
  },
  {
    id: 'allday-camp', 
    type: 'allday',
    name: 'All Day Camp',
    price: 149.99,
    duration: '8 hours',
    time: '9:00 AM - 5:00 PM'
  }
]

export default function CampTypeStep({ selectedCampType, onCampTypeSelect, date }: CampTypeStepProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">Choose Your Camp Type</h3>
        <p className="text-gray-600">
          Select the perfect camp duration for {date ? formatDate(date) : 'your chosen date'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {CAMP_TYPES.map((campType) => (
          <div
            key={campType.id}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              selectedCampType?.id === campType.id
                ? 'border-primary-500 bg-primary-50 shadow-lg transform scale-105'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
            }`}
            onClick={() => onCampTypeSelect(campType)}
          >
            {/* Selection Indicator */}
            {selectedCampType?.id === campType.id && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                <CheckIcon className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Popular Badge for All Day */}
            {campType.type === 'allday' && (
              <div className="absolute -top-2 left-6">
                <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                  <SparklesIcon className="w-3 h-3" />
                  <span>POPULAR</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Header */}
              <div className="text-center">
                <h4 className="text-xl font-bold text-gray-900 mb-2">{campType.name}</h4>
                <div className="text-3xl font-bold text-primary-600">${campType.price}</div>
                <div className="text-sm text-gray-500">per child</div>
              </div>

              {/* Time Info */}
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <ClockIcon className="w-5 h-5" />
                <span className="font-medium">{campType.time}</span>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Hands-on STEM experiments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Take-home project</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Small group (max 12 kids)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Expert instructor guidance</span>
                  </div>
                  {campType.type === 'day' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Morning tea included</span>
                    </div>
                  )}
                  {campType.type === 'allday' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Lunch & snacks included</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Extended project time</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Free play & outdoor time</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Best For */}
              <div className="pt-3 border-t border-gray-200">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Best For
                </div>
                {campType.type === 'day' ? (
                  <p className="text-sm text-gray-600">
                    Perfect for first-time campers or kids who prefer shorter programs
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Ideal for working parents and kids who love extended learning and play
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4 text-center">Quick Comparison</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div></div>
          <div className="text-center font-medium text-gray-700">Day Camp</div>
          <div className="text-center font-medium text-gray-700">All Day Camp</div>
          
          <div className="text-gray-600">Duration</div>
          <div className="text-center text-gray-900">6 hours</div>
          <div className="text-center text-gray-900">8 hours</div>
          
          <div className="text-gray-600">Meals</div>
          <div className="text-center text-gray-900">Morning tea</div>
          <div className="text-center text-gray-900">Lunch + snacks</div>
          
          <div className="text-gray-600">Price</div>
          <div className="text-center text-green-600 font-bold">$89</div>
          <div className="text-center text-green-600 font-bold">$119</div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-lg">💡</span>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">What's Included</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• All materials and equipment provided</li>
              <li>• Age-appropriate activities (5-16 years)</li>
              <li>• Progress photos shared with parents</li>
              <li>• Certificate of completion</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
