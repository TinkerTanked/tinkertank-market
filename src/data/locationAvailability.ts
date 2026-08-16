export interface LocationAvailability {
  locationId: string
  locationName: string
  availableCampTypes: ('day' | 'allday')[]
  availableDates?: string[]
  /** Maximum number of camp bookings per day at this location. */
  dailyCapacity?: number
}

/** Default combined camp capacity per location and date. */
export const DEFAULT_CAMP_DAILY_CAPACITY = 35

// Dates when 3-day bundles are available at Neutral Bay
export const BUNDLE_AVAILABLE_DATES = ['2026-04-20', '2026-04-21', '2026-04-22', '2026-04-23']

// Spring 2026 NSW school holiday camps at Manly Library (day camps only)
export const MANLY_LIBRARY_SPRING_2026_DATES = [
  '2026-09-29',
  '2026-09-30',
  '2026-10-01',
  '2026-10-06',
  '2026-10-07',
  '2026-10-08'
]

export const LOCATION_AVAILABILITY: LocationAvailability[] = [
  {
    locationId: 'neutral-bay',
    locationName: 'TinkerTank Neutral Bay',
    availableCampTypes: ['day', 'allday'],
    // Combined daily cap across Day Camp and All Day Camp bookings
    dailyCapacity: DEFAULT_CAMP_DAILY_CAPACITY
  },
  {
    locationId: 'manly-library',
    locationName: 'Manly Library',
    availableCampTypes: ['day'],
    availableDates: MANLY_LIBRARY_SPRING_2026_DATES,
    dailyCapacity: DEFAULT_CAMP_DAILY_CAPACITY
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
  const availability = getLocationAvailability(locationName)
  return availability ? availability.dailyCapacity ?? DEFAULT_CAMP_DAILY_CAPACITY : undefined
}
