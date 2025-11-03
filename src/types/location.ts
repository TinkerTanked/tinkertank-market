import { z } from 'zod'

// Location interface for Neutral Bay (initially single location)
export interface Location {
  id: string
  name: string
  address: {
    street: string
    suburb: string
    state: string
    postcode: string
    country: string
  }
  coordinates: {
    latitude: number
    longitude: number
  }
  contact: {
    phone: string
    email: string
  }
  facilities: string[]
  capacity: number
  operatingHours: {
    [key: string]: {
      open: string
      close: string
      isClosed?: boolean
    }
  }
  parking: {
    available: boolean
    type: 'FREE' | 'PAID' | 'STREET'
    description?: string
  }
  accessibility: {
    wheelchairAccessible: boolean
    features: string[]
  }
  imageUrls: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Operating hours for a specific day
export interface DayOperatingHours {
  open: string
  close: string
  isClosed?: boolean
}

// Zod schemas
export const AddressSchema = z.object({
  street: z.string().min(5, 'Street address must be at least 5 characters'),
  suburb: z.string().min(2, 'Suburb must be at least 2 characters'),
  state: z.string().length(2, 'State must be 2 characters (e.g., NSW)').or(z.string().length(3, 'State must be 2-3 characters')),
  postcode: z.string().regex(/^\d{4}$/, 'Australian postcode must be 4 digits'),
  country: z.string().default('Australia'),
})

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
})

export const ContactSchema = z.object({
  phone: z.string().regex(/^(\+61|0)[2-9]\d{8}$/, 'Invalid Australian phone number'),
  email: z.string().email('Invalid email format'),
})

export const DayOperatingHoursSchema = z.object({
  open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  isClosed: z.boolean().optional(),
}).refine(
  (data) => data.isClosed || data.open < data.close,
  { message: 'Close time must be after open time', path: ['close'] }
)

export const OperatingHoursSchema = z.object({
  monday: DayOperatingHoursSchema,
  tuesday: DayOperatingHoursSchema,
  wednesday: DayOperatingHoursSchema,
  thursday: DayOperatingHoursSchema,
  friday: DayOperatingHoursSchema,
  saturday: DayOperatingHoursSchema,
  sunday: DayOperatingHoursSchema,
})

export const ParkingSchema = z.object({
  available: z.boolean(),
  type: z.enum(['FREE', 'PAID', 'STREET']),
  description: z.string().optional(),
})

export const AccessibilitySchema = z.object({
  wheelchairAccessible: z.boolean(),
  features: z.array(z.string()),
})

export const LocationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, 'Location name must be at least 2 characters'),
  address: AddressSchema,
  coordinates: CoordinatesSchema,
  contact: ContactSchema,
  facilities: z.array(z.string()).min(1, 'At least one facility must be listed'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  operatingHours: OperatingHoursSchema,
  parking: ParkingSchema,
  accessibility: AccessibilitySchema,
  imageUrls: z.array(z.string().url()).optional().default([]),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

// Predefined Neutral Bay location
export const NEUTRAL_BAY_LOCATION: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'TinkerTank Neutral Bay',
  address: {
    street: '123 Military Road', // Placeholder - would need actual address
    suburb: 'Neutral Bay',
    state: 'NSW',
    postcode: '2089',
    country: 'Australia',
  },
  coordinates: {
    latitude: -33.8317,
    longitude: 151.2243,
  },
  contact: {
    phone: '02 9999 0000', // Placeholder
    email: 'neutralbay@tinkertank.com.au', // Placeholder
  },
  facilities: [
    'STEM Learning Lab',
    'Robotics Workshop Area',
    'Arts & Crafts Station',
    'Birthday Party Room',
    'Kitchen Facilities',
    'Outdoor Play Area',
    'Parent Waiting Area',
    'Toilets',
    'Storage Facilities',
  ],
  capacity: 30,
  operatingHours: {
    monday: { open: '08:00', close: '17:00' },
    tuesday: { open: '08:00', close: '17:00' },
    wednesday: { open: '08:00', close: '17:00' },
    thursday: { open: '08:00', close: '17:00' },
    friday: { open: '08:00', close: '17:00' },
    saturday: { open: '09:00', close: '16:00' },
    sunday: { open: '09:00', close: '16:00' },
  },
  parking: {
    available: true,
    type: 'STREET',
    description: 'Street parking available on Military Road and surrounding streets. Some time restrictions apply during weekdays.',
  },
  accessibility: {
    wheelchairAccessible: true,
    features: [
      'Wheelchair accessible entrance',
      'Accessible toilets',
      'Wide doorways',
      'Ground floor facilities',
    ],
  },
  imageUrls: [],
  isActive: true,
}

// Utility functions
export const isLocationOpen = (location: Location, day: string, time?: string): boolean => {
  const dayHours = location.operatingHours[day.toLowerCase()]
  
  if (!dayHours || dayHours.isClosed) {
    return false
  }
  
  if (!time) {
    return true // Just check if location is open that day
  }
  
  return time >= dayHours.open && time <= dayHours.close
}

export const formatAddress = (address: Location['address']): string => {
  return `${address.street}, ${address.suburb} ${address.state} ${address.postcode}`
}

export const formatOperatingHours = (hours: DayOperatingHours): string => {
  if (hours.isClosed) {
    return 'Closed'
  }
  
  const formatTime = (time: string): string => {
    const [hour, minute] = time.split(':').map(Number)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
  }
  
  return `${formatTime(hours.open)} - ${formatTime(hours.close)}`
}

export const getLocationOperatingHours = (location: Location, day: string): string => {
  const dayHours = location.operatingHours[day.toLowerCase()]
  return dayHours ? formatOperatingHours(dayHours) : 'Closed'
}

export const calculateDistanceFromCoords = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in kilometers
}

// Type guards
export const isValidLocation = (location: unknown): location is Location => {
  return LocationSchema.safeParse(location).success
}

// Google Maps integration helpers
export const getGoogleMapsUrl = (location: Location): string => {
  const address = formatAddress(location.address)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

export const getGoogleMapsEmbedUrl = (location: Location): string => {
  const address = formatAddress(location.address)
  return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(address)}`
}

export type LocationInput = z.infer<typeof LocationSchema>
export type AddressInput = z.infer<typeof AddressSchema>
export type OperatingHoursInput = z.infer<typeof OperatingHoursSchema>
