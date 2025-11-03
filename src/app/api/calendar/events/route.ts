import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CalendarEvent, AdminCalendarEvent } from '@/types/booking'
import { prismaBookingToCalendarEvent } from '@/lib/calendar-utils'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'

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

      bookings.forEach((booking) => {
        const key = `${booking.productId}-${booking.startDate.getTime()}`
        
        if (!eventsMap.has(key)) {
          const calendarEvent = prismaBookingToCalendarEvent(booking)
          
          eventsMap.set(key, {
            ...calendarEvent,
            extendedProps: {
              ...calendarEvent.extendedProps,
              product: booking.product as any,
              bookings: [booking as any],
              availableSpots: 20 - 1, // Default capacity since Prisma Product model doesn't have this field yet
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
    
    // Create new booking/event
    const booking = await prisma.booking.create({
      data: {
        studentId: data.studentId,
        productId: data.productId,
        locationId: data.locationId,
        startDate: new Date(data.startDateTime),
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
