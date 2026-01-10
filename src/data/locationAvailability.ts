export interface LocationAvailability {
  locationId: string
  locationName: string
  availableCampTypes: ('day' | 'allday')[]
  availableDates?: Date[]
}

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
    availableDates: [
      new Date('2026-01-13T00:00:00+11:00'),
      new Date('2026-01-14T00:00:00+11:00'),
      new Date('2026-01-15T00:00:00+11:00'),
      new Date('2026-01-20T00:00:00+11:00'),
      new Date('2026-01-21T00:00:00+11:00'),
      new Date('2026-01-22T00:00:00+11:00'),
    ]
  }
]

export function getLocationAvailability(locationName: string): LocationAvailability | undefined {
  return LOCATION_AVAILABILITY.find(loc => 
    loc.locationName === locationName || 
    locationName.includes(loc.locationName) ||
    loc.locationName.includes(locationName)
  )
}

export function isDateAvailableForLocation(date: Date, locationName: string): boolean {
  const availability = getLocationAvailability(locationName)
  
  if (!availability) return false
  
  if (!availability.availableDates) return true
  
  const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
  return availability.availableDates.some(availDate => 
    availDate.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }) === dateStr
  )
}

export function getAvailableCampTypes(locationName: string): ('day' | 'allday')[] {
  const availability = getLocationAvailability(locationName)
  return availability?.availableCampTypes || ['day', 'allday']
}
