'use client'

import { ClockIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { getAvailableCampTypes, BUNDLE_AVAILABLE_DATES } from '@/data/locationAvailability'

interface CampType {
  id: string
  type: 'day' | 'allday' | 'day-bundle' | 'allday-bundle'
  name: string
  price: number
  duration: string
  time: string
  isBundle?: boolean
  bundleDays?: number
}

interface CampTypeStepProps {
  selectedCampType: CampType | null
  onCampTypeSelect: (campType: CampType) => void
  date: Date | null
  location?: { id: string; name: string; address: string } | null
  selectedDateCount?: number
  selectedDates?: Date[]
}

const CAMP_TYPES: CampType[] = [
  {
    id: 'day-camp',
    type: 'day',
    name: 'Day Camp',
    price: 119.99,
    duration: '6 hours',
    time: '9:00 AM - 3:00 PM'
  },
  {
    id: 'all-day-camp', 
    type: 'allday',
    name: 'All Day Camp',
    price: 149.99,
    duration: '8 hours',
    time: '9:00 AM - 5:00 PM'
  }
]

const BUNDLE_TYPES: CampType[] = [
  {
    id: 'day-camp-3day-bundle',
    type: 'day-bundle',
    name: 'Day Camp 3-Day Bundle',
    price: 299.99,
    duration: '6 hours/day',
    time: '9:00 AM - 3:00 PM',
    isBundle: true,
    bundleDays: 3
  },
  {
    id: 'all-day-camp-3day-bundle',
    type: 'allday-bundle',
    name: 'All Day Camp 3-Day Bundle',
    price: 399.99,
    duration: '8 hours/day',
    time: '9:00 AM - 5:00 PM',
    isBundle: true,
    bundleDays: 3
  }
]

export default function CampTypeStep({ selectedCampType, onCampTypeSelect, date, location, selectedDateCount = 1, selectedDates = [] }: CampTypeStepProps) {
  const availableTypes = location ? getAvailableCampTypes(location.name) : ['day', 'allday']
  
  // Helper to convert Date to YYYY-MM-DD string
  const toDateString = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // Check if all selected dates are bundle-eligible dates (April 20-23)
  const allDatesAreBundleEligible = selectedDates.length === 3 && 
    selectedDates.every(d => BUNDLE_AVAILABLE_DATES.includes(toDateString(d)))
  
  // Neutral Bay with 3 bundle-eligible dates: show bundles only
  // Otherwise: show regular camps
  const isNeutralBay = location?.id === 'neutral-bay'
  const showBundles = isNeutralBay && allDatesAreBundleEligible
  
  const filteredCampTypes = showBundles 
    ? BUNDLE_TYPES
    : CAMP_TYPES.filter(camp => availableTypes.includes(camp.type))
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-slate-950 sm:text-3xl">Choose your camp day</h3>
        <p className="text-slate-600">
          Compare times and pricing for {selectedDateCount > 1 ? `${selectedDateCount} selected dates` : date ? formatDate(date) : 'your selected date'}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredCampTypes.map((campType) => (
          <button
            type="button"
            key={campType.id}
            className={`relative rounded-2xl border p-5 text-left transition-all sm:p-6 ${
              selectedCampType?.id === campType.id
                ? 'border-primary-600 bg-primary-50 shadow-sm ring-1 ring-primary-600'
                : 'border-slate-200 bg-white hover:border-primary-400 hover:shadow-sm'
            }`}
            onClick={() => onCampTypeSelect(campType)}
            aria-pressed={selectedCampType?.id === campType.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                {(campType.type === 'allday' || campType.isBundle) && (
                  <span className={`mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                    campType.isBundle ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    <SparklesIcon className="h-3.5 w-3.5" />
                    {campType.isBundle ? 'Best value' : 'Most flexible'}
                  </span>
                )}
                <h4 className="text-xl font-bold text-slate-950">{campType.name}</h4>
                <p className="mt-1 text-sm text-slate-600">
                  {campType.type === 'day' || campType.type === 'day-bundle'
                    ? 'A complete day of guided projects and making.'
                    : 'Extra project time and a later, easier pick-up.'}
                </p>
              </div>
              <span className={`grid h-6 w-6 flex-none place-items-center rounded-full border ${
                selectedCampType?.id === campType.id ? 'border-primary-700 bg-primary-700' : 'border-slate-300 bg-white'
              }`}>
                {selectedCampType?.id === campType.id && <CheckIcon className="h-4 w-4 text-white" />}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Time</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <ClockIcon className="h-4 w-4 text-primary-700" />
                  {campType.time}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Price</p>
                <p className="mt-1 text-xl font-bold text-primary-800">${campType.price.toFixed(2)}</p>
                <p className="text-xs text-slate-500">{campType.isBundle ? `for ${campType.bundleDays} days` : 'per child, per day'}</p>
              </div>
            </div>

            {campType.isBundle && (
              <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                Save ${((campType.type === 'day-bundle' ? 119.99 : 149.99) * 3 - campType.price).toFixed(2)} across three days
              </p>
            )}
          </button>
        ))}
      </div>

    </div>
  )
}
