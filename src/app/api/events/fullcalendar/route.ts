import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBookingStatusColor, getPaymentStatusColor, PaymentStatus } from '@/types/booking'
import { z } from 'zod'

const FullCalendarQuerySchema = z.object({
  start: z.string().transform(str => new Date(str)),
  end: z.string().transform(str => new Date(str)),
  view: z.enum(['admin', 'public']).default('public')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = FullCalendarQuerySchema.parse({
      start: searchParams.get('start'),
      end: searchParams.get('end'),
      view: searchParams.get('view') || 'public'
    })

    const events = await prisma.event.findMany({
      where: {
        startDateTime: {
          gte: query.start,
          lte: query.end
        },
        status: { not: 'CANCELLED' }
      },
      include: {
        location: true,
        bookings: {
          include: {
            student: true,
            product: true
          }
        },
        recurringTemplate: true
      }
    })

    // Transform to FullCalendar format
    const fullCalendarEvents = events.map(event => {
      const primaryBooking = event.bookings[0] // Get first booking for display
      const studentCount = event.bookings.length
      const availableSpots = event.maxCapacity - event.currentCount

      // Base event data
      const baseEvent = {
        id: event.id,
        title: query.view === 'admin' 
          ? `${event.title} (${studentCount}/${event.maxCapacity})`
          : event.title,
        start: event.startDateTime.toISOString(),
        end: event.endDateTime.toISOString(),
        backgroundColor: getEventStatusColor(event.status),
        borderColor: primaryBooking 
          ? getPaymentStatusColor(primaryBooking.status === 'CONFIRMED' ? PaymentStatus.PAID : PaymentStatus.PENDING)
          : '#6B7280',
        textColor: '#ffffff'
      }

      // Extended properties for admin view
      if (query.view === 'admin') {
        return {
          ...baseEvent,
          extendedProps: {
            eventId: event.id,
            type: event.type,
            status: event.status,
            location: event.location.name,
            capacity: event.maxCapacity,
            currentCount: event.currentCount,
            availableSpots,
            students: event.bookings.map(booking => ({
              id: booking.student.id,
              name: booking.student.name,
              age: calculateAge(booking.student.birthdate),
              allergies: booking.student.allergies,
              bookingStatus: booking.status,
              product: booking.product.name
            })),
            ageRange: event.ageMin && event.ageMax 
              ? `Ages ${event.ageMin}-${event.ageMax}`
              : null,
            description: event.description,
            instructorNotes: event.instructorNotes,
            isRecurring: event.isRecurring
          }
        }
      }

      // Public view - minimal information
      return {
        ...baseEvent,
        extendedProps: {
          type: event.type,
          location: event.location.name,
          availableSpots: availableSpots > 0 ? availableSpots : 0,
          ageRange: event.ageMin && event.ageMax 
            ? `Ages ${event.ageMin}-${event.ageMax}`
            : null
        }
      }
    })

    return NextResponse.json(fullCalendarEvents)

  } catch (error) {
    console.error('Error fetching FullCalendar events:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    )
  }
}

// Utility functions
function getEventStatusColor(status: string): string {
  switch (status) {
    case 'SCHEDULED':
      return '#10B981' // green
    case 'IN_PROGRESS':
      return '#F59E0B' // yellow
    case 'COMPLETED':
      return '#6366F1' // indigo
    case 'CANCELLED':
      return '#EF4444' // red
    case 'NO_SHOW':
      return '#6B7280' // gray
    default:
      return '#6B7280'
  }
}

function calculateAge(birthdate: Date): number {
  const today = new Date()
  const birthDate = new Date(birthdate)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}
