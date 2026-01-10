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

    // Group camp events by day and product type
    const groupedCampEvents = new Map<string, typeof events>();
    const nonCampEvents = events.filter(event => event.type !== 'CAMP');
    
    events.filter(event => event.type === 'CAMP').forEach(event => {
      const dateKey = event.startDateTime.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
      const productName = event.bookings[0]?.product.name || event.title;
      const groupKey = `${dateKey}|${productName}`;
      
      if (!groupedCampEvents.has(groupKey)) {
        groupedCampEvents.set(groupKey, []);
      }
      groupedCampEvents.get(groupKey)!.push(event);
    });

    // Create aggregated camp events
    const aggregatedCampEvents = Array.from(groupedCampEvents.entries()).map(([groupKey, groupEvents]) => {
      const firstEvent = groupEvents[0];
      const totalStudents = groupEvents.reduce((sum, e) => sum + e.bookings.length, 0);
      const totalCapacity = groupEvents.reduce((sum, e) => sum + e.maxCapacity, 0);
      const productName = firstEvent.bookings[0]?.product.name || firstEvent.title.split(' - ')[0];
      const availableSpots = totalCapacity - totalStudents;

      const dateKey = firstEvent.startDateTime.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
      
      const baseEvent = {
        id: `grouped-${groupKey}`,
        title: query.view === 'admin' 
          ? `${productName} (${totalStudents}/${totalCapacity})`
          : productName,
        start: dateKey,
        allDay: true,
        backgroundColor: getEventStatusColor(firstEvent.status),
        borderColor: '#3B82F6',
        textColor: '#ffffff'
      };

      if (query.view === 'admin') {
        return {
          ...baseEvent,
          extendedProps: {
            type: 'CAMP',
            status: firstEvent.status,
            location: firstEvent.location.name,
            capacity: totalCapacity,
            currentCount: totalStudents,
            availableSpots,
            students: groupEvents.flatMap(event => event.bookings.map(booking => ({
              id: booking.student.id,
              name: booking.student.name,
              age: calculateAge(booking.student.birthdate),
              allergies: booking.student.allergies,
              bookingStatus: booking.status,
              product: booking.product.name
            }))),
            ageRange: firstEvent.ageMin && firstEvent.ageMax 
              ? `Ages ${firstEvent.ageMin}-${firstEvent.ageMax}`
              : null,
            description: firstEvent.description,
            isRecurring: firstEvent.isRecurring,
            eventIds: groupEvents.map(e => e.id)
          }
        };
      }

      return {
        ...baseEvent,
        extendedProps: {
          type: 'CAMP',
          location: firstEvent.location.name,
          availableSpots: availableSpots > 0 ? availableSpots : 0,
          ageRange: firstEvent.ageMin && firstEvent.ageMax 
            ? `Ages ${firstEvent.ageMin}-${firstEvent.ageMax}`
            : null
        }
      };
    });

    // Transform non-camp events to FullCalendar format
    const fullCalendarEvents = nonCampEvents.map(event => {
      const primaryBooking = event.bookings[0] // Get first booking for display
      const studentCount = event.bookings.length
      const availableSpots = event.maxCapacity - event.currentCount

      const dateKey = event.startDateTime.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
      const isMultiDay = event.startDateTime.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }) !== 
                         event.endDateTime.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
      
      // Base event data
      const baseEvent = {
        id: event.id,
        title: query.view === 'admin' 
          ? `${event.title} (${studentCount}/${event.maxCapacity})`
          : event.title,
        start: event.type === 'CAMP' || event.type === 'SUBSCRIPTION' ? dateKey : event.startDateTime.toISOString(),
        end: isMultiDay && event.type !== 'BIRTHDAY' ? undefined : (event.type === 'BIRTHDAY' ? event.endDateTime.toISOString() : undefined),
        allDay: event.type === 'CAMP' || event.type === 'SUBSCRIPTION',
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

    return NextResponse.json([...aggregatedCampEvents, ...fullCalendarEvents])

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
