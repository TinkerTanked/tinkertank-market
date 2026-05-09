export interface LocationAvailability {
  locationId: string
  locationName: string
  availableCampTypes: ('day' | 'allday')[]
  availableDates?: string[]
  /** Maximum number of camp bookings per day at this location. */
  dailyCapacity?: number
}

// Dates when 3-day bundles are available at Neutral Bay
export const BUNDLE_AVAILABLE_DATES = ['2026-04-20', '2026-04-21', '2026-04-22', '2026-04-23']

// July 2026 NSW school holiday camps at Manly Library (day camps only)
export const MANLY_LIBRARY_JULY_2026_DATES = [
  '2026-07-07',
  '2026-07-08',
  '2026-07-09',
  '2026-07-14',
  '2026-07-15',
  '2026-07-16'
]

export const LOCATION_AVAILABILITY: LocationAvailability[] = [
  {
    locationId: 'neutral-bay',
    locationName: 'TinkerTank Neutral Bay',
    availableCampTypes: ['day', 'allday'],
  },
  {
    locationId: 'manly-library',
    locationName: 'Manly Library',
    availableCampTypes: ['day'],
    availableDates: MANLY_LIBRARY_JULY_2026_DATES,
    dailyCapacity: 25
  }
]

function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getLocationAvailability(locationName: string): LocationAvailability | undefined {
  return LOCATION_AVAILABILITY.find(loc => 
    loc.locationName === locationName || 
    locationName.includes(loc.locationName) ||
    loc.locationName.includes(locationName)
  )
}

export function getLocationAvailabilityById(locationId: string): LocationAvailability | undefined {
  return LOCATION_AVAILABILITY.find(loc => loc.locationId === locationId)
}

export function isDateAvailableForLocation(date: Date, locationName: string): boolean {
  const availability = getLocationAvailability(locationName)
  
  if (!availability) return false
  
  if (!availability.availableDates) return true
  
  const dateStr = toLocalDateString(date)
  return availability.availableDates.includes(dateStr)
}

export function getAvailableCampTypes(locationName: string): ('day' | 'allday')[] {
  const availability = getLocationAvailability(locationName)
  return availability?.availableCampTypes || ['day', 'allday']
}

export function getDailyCapacity(locationName: string): number | undefined {
  return getLocationAvailability(locationName)?.dailyCapacity
}
