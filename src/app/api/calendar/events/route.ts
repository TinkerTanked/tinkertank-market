import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CalendarEvent, AdminCalendarEvent } from '@/types/booking'
import { prismaBookingToCalendarEvent } from '@/lib/calendar-utils'
import { startOfMonth, endOfMonth, parseISO, subWeeks, addDays, format } from 'date-fns'
import { isClosureDate, getClosureInfo } from '@/types'
import { IGNITE_SESSIONS, type IgniteSessionConfig } from '@/config/igniteProducts'

// Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

// Colors for Ignite program types
const IGNITE_COLORS = {
  'in-school': { bg: '#F0FDF4', border: '#22C55E', text: '#166534' },
  'drop-off': { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
  'school-pickup': { bg: '#FFF7ED', border: '#F97316', text: '#C2410C' },
}

// Short location names for cleaner display
const LOCATION_SHORT_NAMES: Record<string, string> = {
  'Balgowlah Heights Public': 'Balgowlah',
  'International Chinese School': 'ICS',
  'Neutral Bay Studio': 'NB Studio',
  'Brookvale Community Centre': 'Brookvale CC',
  'Manly Creative Library': 'Manly Library',
  'Brookvale Public School': 'Brookvale PS',
  'Manly Village Public School': 'Manly Village',
  'Neutral Bay Public School': 'NB Public',
  'Redlands School': 'Redlands',
  'St Marys Catholic School': 'St Marys',
}

// Generate Ignite session events for a date range
function generateIgniteEvents(
  start: Date,
  end: Date,
  subscriberCounts: Map<string, number>,
  subscriberDetails?: Map<string, Array<{ studentName: string; studentId: string }>>
): AdminCalendarEvent[] {
  const events: AdminCalendarEvent[] = []
  const current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    const dayName = Object.keys(DAY_NAME_TO_NUMBER).find(
      name => DAY_NAME_TO_NUMBER[name] === dayOfWeek
    )

    if (!dayName) {
      current.setDate(current.getDate() + 1)
      continue
    }

    // Find all Ignite sessions that run on this day
    IGNITE_SESSIONS.forEach((session) => {
      if (session.dayOfWeek.includes(dayName)) {
        // Skip public holiday closure dates, but show during school holidays
        // (admin needs to see all potential sessions)
        if (isClosureDate(current)) {
          return
        }

        const [startHour, startMin] = session.startTime.split(':').map(Number)
        const [endHour, endMin] = session.endTime.split(':').map(Number)

        const eventStart = new Date(current)
        eventStart.setHours(startHour, startMin, 0, 0)

        const eventEnd = new Date(current)
        eventEnd.setHours(endHour, endMin, 0, 0)

        const dateKey = format(current, 'yyyy-MM-dd')
        const subscriberKey = `${session.id}-${dateKey}`
        const subscriberCount = subscriberCounts.get(subscriberKey) || 0
        const students = subscriberDetails?.get(subscriberKey) || []

        const colors = IGNITE_COLORS[session.programType]
        const shortLocation = LOCATION_SHORT_NAMES[session.location] || session.location

        events.push({
          id: `ignite-${session.id}-${dateKey}`,
          title: subscriberCount > 0 ? `${shortLocation} (${subscriberCount})` : shortLocation,
          start: eventStart,
          end: eventEnd,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          extendedProps: {
            productType: 'IGNITE',
            location: session.location,
            shortLocation,
            status: 'SCHEDULED' as any,
            paymentStatus: 'PAID' as any,
            capacity: 20,
            currentBookings: subscriberCount,
            product: {
              id: session.id,
              name: session.name,
              type: 'IGNITE',
              programType: session.programType,
              priceWeekly: session.priceWeekly,
            } as any,
            bookings: students.map(s => ({
              studentName: s.studentName,
              studentId: s.studentId
            })) as any,
            availableSpots: 20 - subscriberCount,
            subscriberCount,
            subscriberDelta: 0,
            previousWeekCount: 0,
          } as any,
        })
      }
    })

    current.setDate(current.getDate() + 1)
  }

  return events
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startParam = searchParams.get('start')
    const endParam = searchParams.get('end')
    const viewType = searchParams.get('view') // 'customer' | 'admin'
    const productType = searchParams.get('productType')
    const locationId = searchParams.get('locationId')

    // Default to current month if no date range provided
    const now = new Date()
    const start = startParam ? parseISO(startParam) : startOfMonth(now)
    const end = endParam ? parseISO(endParam) : endOfMonth(now)

    // Build where clause
    const whereClause: any = {
      startDate: {
        gte: start,
        lte: end,
      },
    }

    if (productType) {
      whereClause.product = {
        type: productType.toUpperCase(),
      }
    }

    if (locationId) {
      whereClause.locationId = locationId
    }

    // Fetch bookings with related data
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        product: true,
        student: true,
        location: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    if (viewType === 'admin') {
      // Group bookings by product/time slot for admin view
      const eventsMap = new Map<string, AdminCalendarEvent>()

      // For Ignite sessions, we want to show ALL configured sessions
      // First, build a map of subscriber counts from actual bookings
      const subscriberCounts = new Map<string, number>()
      const subscriberDetails = new Map<string, Array<{ studentName: string; studentId: string }>>()

      // Query bookings for SUBSCRIPTION products to get real subscriber counts
      const subscriptionBookings = await prisma.booking.findMany({
        where: {
          startDate: { gte: start, lte: end },
          product: { type: 'SUBSCRIPTION' },
          status: { in: ['CONFIRMED', 'PENDING'] }
        },
        include: {
          student: { select: { id: true, name: true } },
          location: true
        }
      })

      // Build subscriber counts keyed by session and date
      subscriptionBookings.forEach((booking) => {
        const dateKey = format(booking.startDate, 'yyyy-MM-dd')
        const locationName = booking.location?.name || ''

        // Find matching Ignite session by location and time
        IGNITE_SESSIONS.forEach((session) => {
          const shortLoc = LOCATION_SHORT_NAMES[session.location] || session.location
          if (locationName.includes(session.location.split(' ')[0]) || locationName.includes(shortLoc)) {
            const [startHour, startMin] = session.startTime.split(':').map(Number)
            const bookingHour = booking.startDate.getHours()
            const bookingMin = booking.startDate.getMinutes()

            if (bookingHour === startHour && Math.abs(bookingMin - startMin) < 30) {
              const key = `${session.id}-${dateKey}`
              subscriberCounts.set(key, (subscriberCounts.get(key) || 0) + 1)

              if (!subscriberDetails.has(key)) {
                subscriberDetails.set(key, [])
              }
              subscriberDetails.get(key)!.push({
                studentName: booking.student?.name || 'Unknown',
                studentId: booking.student?.id || ''
              })
            }
          }
        })
      })

      console.log('Subscriber counts for calendar:', Object.fromEntries(subscriberCounts))

      // Generate Ignite events for all configured sessions (even without subscribers)
      if (!productType || productType.toUpperCase() === 'IGNITE' || productType.toUpperCase() === 'SUBSCRIPTION') {
        const igniteEvents = generateIgniteEvents(start, end, subscriberCounts, subscriberDetails)
        igniteEvents.forEach(event => {
          eventsMap.set(event.id, event)
        })
      }

      // Also fetch non-Ignite events from the events table
      const dbEvents = await prisma.event.findMany({
        where: {
          startDateTime: {
            gte: start,
            lte: end,
          },
          // Exclude Ignite types since we generate those from config
          type: {
            notIn: ['RECURRING_SESSION', 'SUBSCRIPTION'],
          },
          ...(productType && productType.toUpperCase() !== 'IGNITE' && productType.toUpperCase() !== 'SUBSCRIPTION' 
            ? { type: productType.toUpperCase() as any } 
            : {}),
          ...(locationId ? { locationId } : {}),
        },
        include: {
          location: true,
          recurringTemplate: true,
        },
        orderBy: {
          startDateTime: 'asc',
        },
      })

      // Add non-Ignite events from the events table
      dbEvents.forEach((event) => {
        const key = `event-${event.id}`
        
        const adminEvent: AdminCalendarEvent = {
          id: event.id,
          title: event.title,
          start: event.startDateTime,
          end: event.endDateTime,
          backgroundColor: '#E5F3FF',
          borderColor: '#3B82F6',
          textColor: '#1E40AF',
          extendedProps: {
            productType: event.type,
            location: event.location?.name || 'Unknown',
            status: event.status as any,
            paymentStatus: 'PAID' as any,
            capacity: event.maxCapacity,
            currentBookings: event.currentCount,
            product: { id: event.id, name: event.title, type: event.type } as any,
            bookings: [] as any,
            availableSpots: event.maxCapacity - event.currentCount,
          },
        }
        eventsMap.set(key, adminEvent)
      })

      // Process bookings (camps, birthdays, etc.)
      bookings.forEach((booking) => {
        // Skip subscription bookings - those are handled via Ignite events
        if (booking.product?.type === 'SUBSCRIPTION') {
          return
        }
        
        const key = `${booking.productId}-${booking.startDate.getTime()}`
        
        if (!eventsMap.has(key)) {
          const calendarEvent = prismaBookingToCalendarEvent(booking)
          
          eventsMap.set(key, {
            ...calendarEvent,
            extendedProps: {
              ...calendarEvent.extendedProps,
              product: booking.product as any,
              bookings: [booking as any],
              availableSpots: 20 - 1,
              currentBookings: 1,
            },
          } as AdminCalendarEvent)
        } else {
          const event = eventsMap.get(key)!
          event.extendedProps.bookings.push(booking as any)
          event.extendedProps.currentBookings = (event.extendedProps.currentBookings || 0) + 1
          event.extendedProps.availableSpots = 20 - event.extendedProps.currentBookings
        }
      })

      return NextResponse.json({
        success: true,
        events: Array.from(eventsMap.values()),
      })
    } else {
      // Customer view - show individual available slots
      const events: CalendarEvent[] = bookings.map((booking) =>
        prismaBookingToCalendarEvent(booking)
      )

      // Add available time slots (this would typically come from a separate table)
      // For now, we'll generate some sample available slots
      const availableSlots = await generateAvailableSlots(start, end, productType)
      
      return NextResponse.json({
        success: true,
        events: [...events, ...availableSlots],
      })
    }
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const startDate = new Date(data.startDateTime)
    
    // Validate that the date is not a closure date
    if (isClosureDate(startDate)) {
      const closureInfo = getClosureInfo(startDate)
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot create booking on ${closureInfo?.name || 'a business closure date'}. Please select a different date.` 
        },
        { status: 400 }
      )
    }
    
    // Validate not a weekend
    const dayOfWeek = startDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json(
        { success: false, error: 'Cannot create bookings on weekends' },
        { status: 400 }
      )
    }
    
    // Create new booking/event
    const booking = await prisma.booking.create({
      data: {
        studentId: data.studentId,
        productId: data.productId,
        locationId: data.locationId,
        startDate,
        endDate: new Date(data.endDateTime),
        status: data.status || 'PENDING',
        totalPrice: data.totalAmount,
        notes: data.specialRequests || data.notes,
      },
      include: {
        product: true,
        student: true,
        location: true,
      },
    })

    const calendarEvent = prismaBookingToCalendarEvent(booking)

    return NextResponse.json({
      success: true,
      event: calendarEvent,
      booking,
    })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}

// Helper function to generate available time slots
// In a real app, this would query a separate availability table
async function generateAvailableSlots(
  start: Date,
  end: Date,
  productType?: string | null
): Promise<CalendarEvent[]> {
  const slots: CalendarEvent[] = []
  
  // Sample available slots for demonstration
  const sampleProducts = await prisma.product.findMany({
    where: productType ? { type: productType.toUpperCase() as any } : {},
    take: 5,
  })

  const locations = await prisma.location.findMany()
  
  // Generate slots for each weekday between start and end
  const current = new Date(start)
  while (current <= end) {
    const dayOfWeek = current.getDay()
    
    // Skip weekends for camps
    if (productType === 'CAMP' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      current.setDate(current.getDate() + 1)
      continue
    }

    // Generate morning and afternoon slots
    const timeSlots = productType === 'CAMP' 
      ? [{ start: '09:00', end: '15:00' }] // Full day camps
      : [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '16:00' }] // Half day sessions

    sampleProducts.forEach((product) => {
      timeSlots.forEach((timeSlot, index) => {
        const slotStart = new Date(current)
        const [startHour, startMin] = timeSlot.start.split(':').map(Number)
        slotStart.setHours(startHour, startMin, 0, 0)
        
        const slotEnd = new Date(current)
        const [endHour, endMin] = timeSlot.end.split(':').map(Number)
        slotEnd.setHours(endHour, endMin, 0, 0)

        slots.push({
          id: `available-${product.id}-${current.toISOString().split('T')[0]}-${index}`,
          title: `${product.name} - Available`,
          start: slotStart,
          end: slotEnd,
          backgroundColor: '#E5F3FF',
          borderColor: '#3B82F6',
          extendedProps: {
            productType: product.type,
            location: locations[0]?.name || 'Neutral Bay',
            status: 'AVAILABLE' as any,
            paymentStatus: 'PENDING' as any,
            capacity: 20, // Default capacity since Prisma Product model doesn't have this field yet
            currentBookings: 0,
          },
        })
      })
    })

    current.setDate(current.getDate() + 1)
  }

  return slots
}
