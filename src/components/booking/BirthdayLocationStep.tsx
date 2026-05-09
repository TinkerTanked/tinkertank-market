'use client'

import { useEffect, useState } from 'react'
import { MapPinIcon, CheckIcon, HomeIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline'

export interface BirthdayLocation {
  id: 'neutral-bay' | 'your-venue'
  name: string
  address: string
  /** Optional friendly venue label like "Your home" or "Community hall". */
  venueLabel?: string
}

interface BirthdayLocationStepProps {
  selectedLocation: BirthdayLocation | null
  onLocationSelect: (location: BirthdayLocation | null) => void
}

const NEUTRAL_BAY_LOCATION: BirthdayLocation = {
  id: 'neutral-bay',
  name: 'TinkerTank Neutral Bay',
  address: '50 Yeo St, Neutral Bay NSW 2089'
}

const VENUE_SUGGESTIONS = [
  { label: 'Your home', icon: '🏠' },
  { label: 'Local park', icon: '🌳' },
  { label: 'Community hall', icon: '🏛️' },
  { label: "Friend's house", icon: '🎈' }
]

export default function BirthdayLocationStep({ selectedLocation, onLocationSelect }: BirthdayLocationStepProps) {
  const initialOption: 'neutral-bay' | 'your-venue' | null = selectedLocation?.id ?? null

  const [option, setOption] = useState<'neutral-bay' | 'your-venue' | null>(initialOption)
  const [venueLabel, setVenueLabel] = useState(selectedLocation?.venueLabel ?? '')
  const [venueAddress, setVenueAddress] = useState(
    selectedLocation?.id === 'your-venue' ? selectedLocation.address : ''
  )

  // Re-emit the selection whenever the user updates venue details so the wizard
  // can validate that an address has actually been captured before "Next".
  useEffect(() => {
    if (option === 'neutral-bay') {
      onLocationSelect(NEUTRAL_BAY_LOCATION)
      return
    }
    if (option === 'your-venue') {
      const trimmedAddress = venueAddress.trim()
      const trimmedLabel = venueLabel.trim()
      if (trimmedAddress.length === 0) {
        onLocationSelect(null)
        return
      }
      const displayName = trimmedLabel ? `Your Venue — ${trimmedLabel}` : 'Your Venue'
      onLocationSelect({
        id: 'your-venue',
        name: displayName,
        address: trimmedAddress,
        venueLabel: trimmedLabel || undefined
      })
      return
    }
    onLocationSelect(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option, venueAddress, venueLabel])

  const handleSuggestionClick = (label: string) => {
    setVenueLabel(label)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">Where Is The Party?</h3>
        <p className="text-gray-600">Host at our Neutral Bay studio or have us bring the party to you</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* TinkerTank Neutral Bay */}
        <button
          type="button"
          onClick={() => setOption('neutral-bay')}
          className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
            option === 'neutral-bay'
              ? 'border-purple-500 bg-purple-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              option === 'neutral-bay' ? 'bg-purple-100' : 'bg-gray-100'
            }`}>
              <BuildingOffice2Icon className={`w-6 h-6 ${
                option === 'neutral-bay' ? 'text-purple-600' : 'text-gray-600'
              }`} />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-1">{NEUTRAL_BAY_LOCATION.name}</h4>
              <p className="text-gray-600 text-sm mb-3">{NEUTRAL_BAY_LOCATION.address}</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  ✨ Fully equipped studio
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🅿️ Parking available
                </span>
              </div>
            </div>
            {option === 'neutral-bay' && (
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <CheckIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </button>

        {/* Your Venue */}
        <button
          type="button"
          onClick={() => setOption('your-venue')}
          className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
            option === 'your-venue'
              ? 'border-pink-500 bg-pink-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              option === 'your-venue' ? 'bg-pink-100' : 'bg-gray-100'
            }`}>
              <HomeIcon className={`w-6 h-6 ${
                option === 'your-venue' ? 'text-pink-600' : 'text-gray-600'
              }`} />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Your Venue</h4>
              <p className="text-gray-600 text-sm mb-3">We come to you — your home, a hall, or anywhere you choose</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  🚐 We bring everything
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🎈 Familiar surroundings
                </span>
              </div>
            </div>
            {option === 'your-venue' && (
              <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                <CheckIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </button>
      </div>

      {option === 'your-venue' && (
        <div className="bg-white border-2 border-pink-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5 text-pink-500" />
            <h4 className="text-lg font-semibold text-gray-900">Tell us where to set up</h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue type <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {VENUE_SUGGESTIONS.map((s) => {
                const isActive = venueLabel.toLowerCase() === s.label.toLowerCase()
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => handleSuggestionClick(s.label)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      isActive
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-pink-400 hover:text-pink-600'
                    }`}
                  >
                    <span className="mr-1.5">{s.icon}</span>
                    {s.label}
                  </button>
                )
              })}
            </div>
            <input
              type="text"
              value={venueLabel}
              onChange={(e) => setVenueLabel(e.target.value)}
              placeholder="e.g. Your home, community hall, local park"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="venue-address" className="block text-sm font-medium text-gray-700 mb-2">
              Venue address <span className="text-pink-600">*</span>
            </label>
            <textarea
              id="venue-address"
              rows={2}
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="e.g. 12 Example Street, Manly NSW 2095"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Please include the full street address so our team can arrive on time.
            </p>
          </div>

          <div className="bg-pink-50 border border-pink-100 rounded-lg p-3 text-sm text-pink-900">
            <p className="font-medium mb-1">Bringing the party to you</p>
            <p>Our team arrives 30 minutes before the start time to set up. We just need a clear, indoor space with seating and access to power.</p>
          </div>
        </div>
      )}
    </div>
  )
}
