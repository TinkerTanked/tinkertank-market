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
    availableCampTypes: ['day', 'allday'],
    availableDates: [
      new Date('2026-04-14'),
      new Date('2026-04-15'),
      new Date('2026-04-16'),
    ]
  },
  {
    locationId: 'reddam-house',
    locationName: 'Reddam House',
    availableCampTypes: ['day', 'allday'],
    availableDates: [
      new Date('2026-04-20'),
      new Date('2026-04-21'),
      new Date('2026-04-22'),
      new Date('2026-04-23'),
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
  
  const dateStr = date.toISOString().split('T')[0]
  return availability.availableDates.some(availDate => 
    availDate.toISOString().split('T')[0] === dateStr
  )
}

export function getAvailableCampTypes(locationName: string): ('day' | 'allday')[] {
  const availability = getLocationAvailability(locationName)
  return availability?.availableCampTypes || ['day', 'allday']
}
