import { z } from 'zod'
import { Event, EventType, EventStatus, RecurringTemplate, Location, Booking } from '@prisma/client'

// Extended event types that include relations
export interface ExtendedEvent extends Event {
  location: Location
  bookings: (Booking & {
    student: {
      id: string
      name: string
      birthdate: Date
      allergies: string | null
    }
    product: {
      id: string
      name: string
      type: string
      ageMin: number
      ageMax: number
    }
  })[]
  recurringTemplate?: RecurringTemplate | null
}

// Event summary for admin dashboard
export interface EventSummary {
  id: string
  title: string
  type: EventType
  status: EventStatus
  startDateTime: Date
  endDateTime: Date
  currentCount: number
  maxCapacity: number
  location: {
    name: string
  }
  studentsInfo: {
    name: string
    age: number
    allergies?: string
  }[]
}

// Calendar event for FullCalendar integration
export interface CalendarEvent {
  id: string
  title: string
  start: string // ISO string
  end: string // ISO string
  backgroundColor: string
  borderColor: string
  textColor?: string
  extendedProps: {
    eventId: string
    type: EventType
    status: EventStatus
    location: string
    capacity: number
    currentCount: number
    availableSpots: number
    ageRange?: string
    description?: string
    instructorNotes?: string
    isRecurring: boolean
    students?: {
      id: string
      name: string
      age: number
      allergies?: string
      bookingStatus: string
      product: string
    }[]
  }
}

// Daily schedule view
export interface DailySchedule {
  date: string
  events: {
    id: string
    title: string
    startTime: string
    endTime: string
    type: EventType
    studentCount: number
    capacity: number
    location: string
    status: EventStatus
    students: {
      name: string
      age: number
      allergies?: string
    }[]
  }[]
  totalStudents: number
  totalCapacity: number
  utilizationRate: number
}

// Capacity analytics
export interface CapacityAnalytics {
  date: string
  events: number
  totalCapacity: number
  totalBookings: number
  utilizationRate: number
  revenueGenerated: number
  avgStudentsPerEvent: number
  peakHour: string
  eventTypeBreakdown: {
    [key in EventType]: {
      count: number
      students: number
      revenue: number
    }
  }
}

// Event conflict detection
export interface EventConflict {
  conflictType: 'CAPACITY_EXCEEDED' | 'STAFF_DOUBLE_BOOKED' | 'LOCATION_UNAVAILABLE'
  message: string
  conflictingEvents: {
    id: string
    title: string
    startTime: Date
    endTime: Date
  }[]
  suggestedActions: string[]
}

// Validation schemas
export const CreateEventRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['CAMP', 'BIRTHDAY', 'SUBSCRIPTION', 'RECURRING_SESSION']),
  startDateTime: z.coerce.date(),
  endDateTime: z.coerce.date(),
  locationId: z.string().min(1, 'Location is required'),
  maxCapacity: z.number().min(1).max(50).default(10),
  ageMin: z.number().min(3).max(18).optional(),
  ageMax: z.number().min(3).max(18).optional(),
  isRecurring: z.boolean().default(false),
  recurringTemplateId: z.string().optional(),
  instructorNotes: z.string().optional()
}).refine(data => data.endDateTime > data.startDateTime, {
  message: 'End time must be after start time'
}).refine(data => {
  if (data.ageMin && data.ageMax) {
    return data.ageMax >= data.ageMin
  }
  return true
}, {
  message: 'Maximum age must be greater than or equal to minimum age'
})

export const UpdateEventRequestSchema = CreateEventRequestSchema.partial().omit({
  type: true, // Prevent changing event type after creation
  isRecurring: true, // Prevent changing recurring status
  recurringTemplateId: true // Prevent changing template association
})

export const EventFilterSchema = z.object({
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  type: z.enum(['CAMP', 'BIRTHDAY', 'SUBSCRIPTION', 'RECURRING_SESSION']).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  locationId: z.string().optional(),
  includeBookings: z.boolean().default(false)
})

// Type exports for use throughout the application
export type {
  Event,
  EventType,
  EventStatus,
  RecurringTemplate
} from '@prisma/client'

export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>
export type UpdateEventRequest = z.infer<typeof UpdateEventRequestSchema>
export type EventFilter = z.infer<typeof EventFilterSchema>

// Utility functions
export function getEventStatusColor(status: EventStatus): string {
  switch (status) {
    case 'SCHEDULED':
      return '#10B981' // green-500
    case 'IN_PROGRESS':
      return '#F59E0B' // amber-500
    case 'COMPLETED':
      return '#6366F1' // indigo-500
    case 'CANCELLED':
      return '#EF4444' // red-500
    case 'NO_SHOW':
      return '#6B7280' // gray-500
    default:
      return '#6B7280'
  }
}

export function getEventTypeIcon(type: EventType): string {
  switch (type) {
    case 'CAMP':
      return '🏕️'
    case 'BIRTHDAY':
      return '🎂'
    case 'SUBSCRIPTION':
      return '📅'
    case 'RECURRING_SESSION':
      return '🔄'
    default:
      return '📋'
  }
}

export function calculateUtilizationRate(currentCount: number, maxCapacity: number): number {
  return maxCapacity > 0 ? Math.round((currentCount / maxCapacity) * 100) : 0
}

export function formatEventTimeRange(start: Date, end: Date): string {
  const startTime = start.toLocaleTimeString('en-AU', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })
  const endTime = end.toLocaleTimeString('en-AU', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  })
  return `${startTime} - ${endTime}`
}

export function isEventEditable(event: ExtendedEvent): boolean {
  const now = new Date()
  return event.startDateTime > now && 
         event.status === 'SCHEDULED' && 
         event.bookings.length === 0
}

export function canCancelEvent(event: ExtendedEvent, hoursBeforeStart = 24): boolean {
  if (event.status === 'COMPLETED' || event.status === 'CANCELLED') {
    return false
  }
  
  const hoursUntilStart = (event.startDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  return hoursUntilStart >= hoursBeforeStart
}
