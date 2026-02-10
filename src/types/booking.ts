import { z } from 'zod'
import { EventInput } from '@fullcalendar/core'
import { Student } from './student'
import { Product } from './product'
import { Location } from './location'

// Booking status enum
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW'
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

// Event/Booking interface
export interface BookingEvent {
  id: string
  productId: string
  product?: Product
  studentId: string
  student?: Student
  locationId: string
  location?: Location
  startDateTime: Date
  endDateTime: Date
  status: BookingStatus
  paymentStatus: PaymentStatus
  totalAmount: number
  amountPaid: number
  discountsApplied: string[]
  specialRequests?: string
  notes?: string
  stripePaymentIntentId?: string
  createdAt: Date
  updatedAt: Date
}

// Recurring event template
export interface RecurringEventTemplate {
  id: string
  productId: string
  locationId: string
  startTime: string // HH:MM
  endTime: string // HH:MM
  daysOfWeek: number[] // 0 = Sunday, 1 = Monday, etc.
  startDate: Date
  endDate?: Date
  maxOccurrences?: number
  isActive: boolean
}

// FullCalendar integration types
export interface CalendarEvent extends EventInput {
  id: string
  title: string
  start: Date
  end: Date
  backgroundColor?: string
  borderColor?: string
  extendedProps: {
    bookingId?: string
    productType: string
    studentName?: string
    location: string
    shortLocation?: string
    status: BookingStatus
    paymentStatus: PaymentStatus
    capacity?: number
    currentBookings?: number
  }
}

// Admin calendar view type
export interface AdminCalendarEvent extends CalendarEvent {
  extendedProps: CalendarEvent['extendedProps'] & {
    product: Product
    bookings: BookingEvent[]
    availableSpots: number
    subscriberCount?: number
    subscriberDelta?: number
    previousWeekCount?: number
  }
}

// Zod schemas
export const BookingEventSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  studentId: z.string().min(1),
  locationId: z.string().min(1),
  startDateTime: z.coerce.date(),
  endDateTime: z.coerce.date(),
  status: z.nativeEnum(BookingStatus),
  paymentStatus: z.nativeEnum(PaymentStatus),
  totalAmount: z.number().min(0),
  amountPaid: z.number().min(0).default(0),
  discountsApplied: z.array(z.string()).default([]),
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
  stripePaymentIntentId: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}).refine(
  (data) => data.endDateTime > data.startDateTime,
  { message: 'End time must be after start time', path: ['endDateTime'] }
).refine(
  (data) => data.amountPaid <= data.totalAmount,
  { message: 'Amount paid cannot exceed total amount', path: ['amountPaid'] }
)

export const RecurringEventTemplateSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  locationId: z.string().min(1),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1, 'At least one day must be selected'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  maxOccurrences: z.number().min(1).optional(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => !data.endDate || data.endDate > data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
)

export const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  extendedProps: z.object({
    bookingId: z.string().optional(),
    productType: z.string(),
    studentName: z.string().optional(),
    location: z.string(),
    status: z.nativeEnum(BookingStatus),
    paymentStatus: z.nativeEnum(PaymentStatus),
    capacity: z.number().optional(),
    currentBookings: z.number().optional(),
  }),
})

// Type guards and utilities
export const isBookingConfirmed = (booking: BookingEvent): boolean => {
  return booking.status === BookingStatus.CONFIRMED
}

export const isBookingPaid = (booking: BookingEvent): boolean => {
  return booking.paymentStatus === PaymentStatus.PAID
}

export const getBookingStatusColor = (status: BookingStatus): string => {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return '#10B981' // green
    case BookingStatus.PENDING:
      return '#F59E0B' // yellow
    case BookingStatus.CANCELLED:
      return '#EF4444' // red
    case BookingStatus.COMPLETED:
      return '#6366F1' // indigo
    case BookingStatus.NO_SHOW:
      return '#6B7280' // gray
    default:
      return '#6B7280'
  }
}

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.PAID:
      return '#10B981' // green
    case PaymentStatus.PARTIALLY_PAID:
      return '#F59E0B' // yellow
    case PaymentStatus.PENDING:
      return '#F59E0B' // yellow
    case PaymentStatus.REFUNDED:
      return '#6366F1' // indigo
    case PaymentStatus.FAILED:
      return '#EF4444' // red
    default:
      return '#6B7280'
  }
}

// Convert booking to calendar event
export const bookingToCalendarEvent = (
  booking: BookingEvent,
  product?: Product,
  student?: Student,
  location?: Location
): CalendarEvent => {
  return {
    id: booking.id,
    title: product?.name || 'Unknown Product',
    start: booking.startDateTime,
    end: booking.endDateTime,
    backgroundColor: getBookingStatusColor(booking.status),
    borderColor: getPaymentStatusColor(booking.paymentStatus),
    extendedProps: {
      bookingId: booking.id,
      productType: product?.type || 'UNKNOWN',
      studentName: student?.name,
      location: location?.name || 'Unknown Location',
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      capacity: product?.capacity,
      currentBookings: 1, // This would be calculated based on other bookings for the same slot
    },
  }
}

// Check if booking can be cancelled
export const canCancelBooking = (booking: BookingEvent, hoursBeforeStart = 24): boolean => {
  if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
    return false
  }

  const hoursUntilStart = (booking.startDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  return hoursUntilStart >= hoursBeforeStart
}

export type BookingInput = z.infer<typeof BookingEventSchema>
export type RecurringEventInput = z.infer<typeof RecurringEventTemplateSchema>
export type CalendarEventInput = z.infer<typeof CalendarEventSchema>
