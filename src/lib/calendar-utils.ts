import { BookingEvent, CalendarEvent, PaymentStatus } from '@/types/booking'
import { Booking, Product, Student, Location } from '@prisma/client'

// Convert Prisma Booking to BookingEvent interface
export function prismaBookingToBookingEvent(
  booking: Booking & {
    product?: Product | null
    student?: Student | null 
    location?: Location | null
  }
): BookingEvent {
  return {
    id: booking.id,
    productId: booking.productId,
    product: booking.product || undefined,
    studentId: booking.studentId,
    student: booking.student || undefined,
    locationId: booking.locationId,
    location: booking.location || undefined,
    startDateTime: booking.startDate,
    endDateTime: booking.endDate,
    status: booking.status,
    paymentStatus: PaymentStatus.PENDING, // Default since not in Booking model
    totalAmount: Number(booking.totalPrice),
    amountPaid: 0, // Default since not in Booking model
    discountsApplied: [], // Default since not in Booking model
    specialRequests: booking.notes,
    notes: booking.notes,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  }
}

// Convert Prisma Booking to CalendarEvent
export function prismaBookingToCalendarEvent(
  booking: Booking & {
    product?: Product | null
    student?: Student | null 
    location?: Location | null
  }
): CalendarEvent {
  const bookingEvent = prismaBookingToBookingEvent(booking)
  
  return {
    id: booking.id,
    title: booking.product?.name || 'Unknown Product',
    start: booking.startDate,
    end: booking.endDate,
    backgroundColor: getBookingStatusColor(booking.status),
    borderColor: '#3B82F6', // Default blue border
    extendedProps: {
      bookingId: booking.id,
      productType: booking.product?.type || 'UNKNOWN',
      studentName: booking.student?.name,
      location: booking.location?.name || 'Unknown Location',
      status: booking.status,
      paymentStatus: PaymentStatus.PENDING,
      capacity: 20, // Default capacity since Prisma Product model doesn't have this field yet
      currentBookings: 1,
    },
  }
}

// Color mapping for booking status
function getBookingStatusColor(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return '#10B981' // green
    case 'PENDING':
      return '#F59E0B' // yellow
    case 'CANCELLED':
      return '#EF4444' // red
    case 'COMPLETED':
      return '#6366F1' // indigo
    case 'NO_SHOW':
      return '#6B7280' // gray
    default:
      return '#6B7280'
  }
}
