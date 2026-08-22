'use client'

import { BuildingOffice2Icon, CheckIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { DEFAULT_CAMP_DAILY_CAPACITY, LOCATION_AVAILABILITY } from '@/data/locationAvailability'

interface Location {
  id: string
  name: string
  address: string
  description?: string
  capacity: number
}

interface LocationStepProps {
  selectedLocation: Location | null
  onLocationSelect: (location: Location) => void
}

export default function LocationStep({ selectedLocation, onLocationSelect }: LocationStepProps) {
  const locations: Location[] = LOCATION_AVAILABILITY.map(loc => ({
    id: loc.locationId,
    name: loc.locationName,
    address: loc.address,
    description: loc.description,
    capacity: loc.dailyCapacity ?? DEFAULT_CAMP_DAILY_CAPACITY
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-slate-950 sm:text-3xl">Where would you like to join us?</h3>
        <p className="text-slate-600">Choose a location to see its available camp dates.</p>
      </div>

      <div className="grid gap-3">
        {locations.map((location) => (
          <button
            type="button"
            key={location.id}
            className={`group relative w-full rounded-2xl border p-5 text-left transition-all sm:p-6 ${
              selectedLocation?.id === location.id
                ? 'border-primary-600 bg-primary-50 shadow-sm ring-1 ring-primary-600'
                : 'border-slate-200 bg-white hover:border-primary-400 hover:shadow-sm'
            }`}
            onClick={() => onLocationSelect(location)}
            aria-pressed={selectedLocation?.id === location.id}
          >
            <div className="flex items-start gap-4">
              <div className={`grid h-12 w-12 flex-none place-items-center rounded-xl ${
                selectedLocation?.id === location.id
                  ? 'bg-primary-700 text-white'
                  : 'bg-slate-100 text-slate-600 group-hover:bg-primary-50 group-hover:text-primary-700'
              }`}>
                {location.id === 'neutral-bay' ? <BuildingOffice2Icon className="h-6 w-6" /> : <MapPinIcon className="h-6 w-6" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-lg font-bold text-slate-950">{location.name}</h4>
                  <span className={`grid h-6 w-6 flex-none place-items-center rounded-full border ${
                    selectedLocation?.id === location.id ? 'border-primary-700 bg-primary-700' : 'border-slate-300 bg-white'
                  }`}>
                    {selectedLocation?.id === location.id && <CheckIcon className="h-4 w-4 text-white" />}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-600">{location.description}</p>
                <p className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                  <MapPinIcon className="mt-0.5 h-4 w-4 flex-none" />
                  <span>{location.address}</span>
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
