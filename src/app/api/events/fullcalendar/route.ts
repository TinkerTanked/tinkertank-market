import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBookingStatusColor, getPaymentStatusColor, PaymentStatus } from '@/types/booking'
import { z } from 'zod'
import { IGNITE_SESSIONS } from '@/config/igniteProducts'
import { format } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'

const SYDNEY_TZ = 'Australia/Sydney'

const IGNITE_COLORS = {
  'in-school': { bg: '#22C55E', border: '#166534' },
  'drop-off': { bg: '#3B82F6', border: '#1E40AF' },
  'school-pickup': { bg: '#F97316', border: '#C2410C' },
}

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
}

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

    // Fetch database events (non-Ignite)
    const events = await prisma.event.findMany({
      where: {
        startDateTime: {
          gte: query.start,
          lte: query.end
        },
        status: { not: 'CANCELLED' },
        type: { notIn: ['RECURRING_SESSION', 'SUBSCRIPTION'] }
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

    // Build Ignite session subscriber map from IgniteSubscription records
    const subscriberMap = new Map<string, Array<{ id: string; name: string }>>()
    
    const activeSubscriptions = await prisma.igniteSubscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'TRIALING'] },
        igniteSessionId: { not: null }
      },
      include: {
        students: {
          include: { student: { select: { id: true, name: true } } }
        }
      }
    })

    activeSubscriptions.forEach((subscription) => {
      const session = IGNITE_SESSIONS.find(s => s.id === subscription.igniteSessionId)
      if (!session) return

      const students = subscription.students.map(link => ({
        id: link.student.id,
        name: link.student.name
      }))

      // Parse legacy studentNames if no linked students
      if (students.length === 0 && subscription.studentNames) {
        const names = subscription.studentNames as Array<{ firstName?: string; lastName?: string; name?: string }>
        names.forEach((n, idx) => {
          const name = n.name || `${n.firstName || ''} ${n.lastName || ''}`.trim()
          if (name) {
            students.push({ id: `legacy-${subscription.id}-${idx}`, name })
          }
        })
      }

      if (students.length === 0) return

      // Add students to each session day in range
      const current = new Date(query.start)
      while (current <= query.end) {
        const dayOfWeek = current.getDay()
        const dayName = Object.keys(DAY_NAME_TO_NUMBER).find(
          name => DAY_NAME_TO_NUMBER[name] === dayOfWeek
        )

        if (dayName && session.dayOfWeek.includes(dayName)) {
          const dateKey = format(current, 'yyyy-MM-dd')
          const key = `${session.id}-${dateKey}`

          if (!subscriberMap.has(key)) {
            subscriberMap.set(key, [])
          }
          const existing = subscriberMap.get(key)!
          students.forEach(student => {
            if (!existing.find(s => s.id === student.id)) {
              existing.push(student)
            }
          })
        }
        current.setDate(current.getDate() + 1)
      }
    })

    // Generate Ignite session events
    const igniteEvents: any[] = []
    const current = new Date(query.start)
    
    while (current <= query.end) {
      const dayOfWeek = current.getDay()
      const dayName = Object.keys(DAY_NAME_TO_NUMBER).find(
        name => DAY_NAME_TO_NUMBER[name] === dayOfWeek
      )

      if (dayName) {
        IGNITE_SESSIONS.forEach((session) => {
          if (!session.dayOfWeek.includes(dayName)) return

          // Create Sydney-local time strings and convert to UTC
          const dateStr = format(current, 'yyyy-MM-dd')
          const startTimeStr = `${dateStr}T${session.startTime}:00`
          const endTimeStr = `${dateStr}T${session.endTime}:00`

          const eventStart = fromZonedTime(startTimeStr, SYDNEY_TZ)
          const eventEnd = fromZonedTime(endTimeStr, SYDNEY_TZ)

          const dateKey = format(current, 'yyyy-MM-dd')
          const key = `${session.id}-${dateKey}`
          const students = subscriberMap.get(key) || []
          const colors = IGNITE_COLORS[session.programType]

          const baseEvent = {
            id: `ignite-${session.id}-${dateKey}`,
            title: query.view === 'admin'
              ? `${session.location} (${students.length}/20)`
              : session.location,
            start: eventStart.toISOString(),
            end: eventEnd.toISOString(),
            backgroundColor: colors.bg,
            borderColor: colors.border,
            textColor: '#ffffff'
          }

          if (query.view === 'admin') {
            igniteEvents.push({
              ...baseEvent,
              extendedProps: {
                eventId: baseEvent.id,
                type: 'IGNITE',
                status: 'SCHEDULED',
                location: session.location,
                capacity: 20,
                currentCount: students.length,
                availableSpots: 20 - students.length,
                students: students.map(s => ({
                  id: s.id,
                  name: s.name,
                  bookingStatus: 'CONFIRMED',
                  product: session.name
                })),
                description: session.name,
                programType: session.programType,
                isRecurring: true
              }
            })
          } else {
            igniteEvents.push({
              ...baseEvent,
              extendedProps: {
                type: 'IGNITE',
                location: session.location,
                availableSpots: Math.max(0, 20 - students.length)
              }
            })
          }
        })
      }
      current.setDate(current.getDate() + 1)
    }

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

    // Combine database events with generated Ignite events
    return NextResponse.json([...fullCalendarEvents, ...igniteEvents])

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
