export interface LocationAvailability {
  locationId: string
  locationName: string
  address: string
  description: string
  image: string
  campPage: string
  availableCampTypes: ('day' | 'allday')[]
  availableDates?: string[]
  unavailableDates?: string[]
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

export const NEUTRAL_BAY_CAMP_UNAVAILABLE_DATES = ['2026-09-23', '2026-09-24', '2026-09-25']

export const LOCATION_AVAILABILITY: LocationAvailability[] = [
  {
    locationId: 'neutral-bay',
    locationName: 'TinkerTank Neutral Bay',
    address: '50 Yeo St, Neutral Bay NSW 2089',
    description: 'Our purpose-built Lower North Shore studio',
    image: '/images/YEO.jpg',
    campPage: '/camps/neutral-bay',
    availableCampTypes: ['day', 'allday'],
    unavailableDates: NEUTRAL_BAY_CAMP_UNAVAILABLE_DATES,
    // Combined daily cap across Day Camp and All Day Camp bookings
    dailyCapacity: DEFAULT_CAMP_DAILY_CAPACITY
  },
  {
    locationId: 'manly-library',
    locationName: 'Manly Library',
    address: 'Market Place, Manly NSW 2095',
    description: 'A convenient Northern Beaches camp location',
    image: '/images/manly-location.jpg',
    campPage: '/camps/manly',
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
  return isDateKeyAvailableForLocation(toLocalDateString(date), locationName)
}

export function isDateKeyAvailableForLocation(date: string, locationName: string): boolean {
  const availability = getLocationAvailability(locationName)

  if (!availability) return false

  if (availability.unavailableDates?.includes(date)) return false
  if (!availability.availableDates) return true

  return availability.availableDates.includes(date)
}

export function getAvailableCampTypes(locationName: string): ('day' | 'allday')[] {
  const availability = getLocationAvailability(locationName)
  return availability?.availableCampTypes || ['day', 'allday']
}

export function getDailyCapacity(locationName: string): number | undefined {
  const availability = getLocationAvailability(locationName)
  return availability ? availability.dailyCapacity ?? DEFAULT_CAMP_DAILY_CAPACITY : undefined
}
