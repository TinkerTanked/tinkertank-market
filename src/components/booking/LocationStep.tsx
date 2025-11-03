'use client'

import { MapPinIcon, CheckIcon } from '@heroicons/react/24/outline'

interface Location {
  id: string
  name: string
  address: string
}

interface LocationStepProps {
  selectedLocation: Location | null
  onLocationSelect: (location: Location) => void
}

const LOCATIONS: Location[] = [
  {
    id: 'neutral-bay',
    name: 'Neutral Bay',
    address: '123 Miller Street, Neutral Bay NSW 2089'
  }
  // Future locations can be added here
]

export default function LocationStep({ selectedLocation, onLocationSelect }: LocationStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">Choose Your Location</h3>
        <p className="text-gray-600">Select the TinkerTank location that works best for you</p>
      </div>

      <div className="grid gap-4">
        {LOCATIONS.map((location) => (
          <div
            key={location.id}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              selectedLocation?.id === location.id
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
            }`}
            onClick={() => onLocationSelect(location)}
          >
            <div className="flex items-start space-x-4">
              {/* Location Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedLocation?.id === location.id
                  ? 'bg-primary-100'
                  : 'bg-gray-100'
              }`}>
                <MapPinIcon className={`w-6 h-6 ${
                  selectedLocation?.id === location.id
                    ? 'text-primary-600'
                    : 'text-gray-600'
                }`} />
              </div>

              {/* Location Details */}
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                  TinkerTank {location.name}
                </h4>
                <p className="text-gray-600 text-sm mb-3">
                  {location.address}
                </p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    🅿️ Parking Available
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    🚌 Public Transport
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    ♿ Accessible
                  </span>
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedLocation?.id === location.id && (
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Coming Soon Badge for Future Locations */}
            {location.id !== 'neutral-bay' && (
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Coming Soon
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-lg">ℹ️</span>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">More Locations Coming Soon!</h4>
            <p className="text-blue-800 text-sm">
              We're expanding across Sydney to bring STEM learning closer to you. 
              Follow us for updates on new locations opening in 2024.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
