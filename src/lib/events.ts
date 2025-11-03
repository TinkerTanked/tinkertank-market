import { prisma } from '@/lib/prisma'
import { addDays, addWeeks, format, isBefore, setHours, setMinutes } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { isClosureDate, getClosureInfo } from '@/types'

export interface CreateEventParams {
  title: string
  description?: string
  type: 'CAMP' | 'BIRTHDAY' | 'SUBSCRIPTION' | 'RECURRING_SESSION'
  startDateTime: Date
  endDateTime: Date
  locationId: string
  maxCapacity?: number
  ageMin?: number
  ageMax?: number
  isRecurring?: boolean
  recurringTemplateId?: string
  instructorNotes?: string
}

export interface CreateRecurringEventParams {
  name: string
  description?: string
  type: 'CAMP' | 'BIRTHDAY' | 'SUBSCRIPTION' | 'RECURRING_SESSION'
  startTime: string // HH:MM
  endTime: string // HH:MM
  duration: number // minutes
  daysOfWeek: number[] // 0=Sunday, 1=Monday, etc.
  startDate: Date
  endDate?: Date
  maxCapacity?: number
  locationId: string
  ageMin?: number
  ageMax?: number
}

// Business logic constants
const BUSINESS_CONSTANTS = {
  DEFAULT_LOCATION_ID: 'neutral-bay-location',
  LOCATION_TIMEZONE: 'Australia/Sydney',
  CAMP_TIMES: {
    DAY_CAMP: { start: '09:00', end: '15:00' },
    ALL_DAY_CAMP: { start: '09:00', end: '17:00' }
  },
  BIRTHDAY_DURATION: 120, // 2 hours in minutes
  DEFAULT_CAPACITY: 10,
  WEEKDAYS: [1, 2, 3, 4, 5], // Monday to Friday
  IGNITE_WEEKLY_DURATION: 60 // 1 hour sessions
}

export class EventCreationService {
  /**
   * Creates a single calendar event
   */
  async createEvent(params: CreateEventParams) {
    // Validate that the date is not a closure date
    if (isClosureDate(params.startDateTime)) {
      const closureInfo = getClosureInfo(params.startDateTime)
      throw new Error(`Cannot create event on ${closureInfo?.name || 'a business closure date'}`)
    }
    
    // Validate not a weekend for camps
    if (params.type === 'CAMP') {
      const dayOfWeek = params.startDateTime.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        throw new Error('Cannot create camp events on weekends')
      }
    }
    
    return await prisma.event.create({
      data: {
        title: params.title,
        description: params.description,
        type: params.type,
        startDateTime: params.startDateTime,
        endDateTime: params.endDateTime,
        locationId: params.locationId,
        maxCapacity: params.maxCapacity || BUSINESS_CONSTANTS.DEFAULT_CAPACITY,
        ageMin: params.ageMin,
        ageMax: params.ageMax,
        isRecurring: params.isRecurring || false,
        recurringTemplateId: params.recurringTemplateId,
        instructorNotes: params.instructorNotes
      },
      include: {
        location: true,
        bookings: {
          include: {
            student: true,
            product: true
          }
        }
      }
    })
  }

  /**
   * Creates calendar events after successful payment
   */
  async createEventsFromOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
            student: true
          }
        }
      }
    })

    if (!order) throw new Error('Order not found')

    const events = []
    const defaultLocationId = await this.getDefaultLocationId()

    for (const orderItem of order.orderItems) {
      const { product, student } = orderItem
      
      switch (product.type) {
        case 'CAMP':
          const campEvent = await this.createCampEvent({
            orderItem,
            student,
            product,
            locationId: defaultLocationId
          })
          events.push(campEvent)
          break

        case 'BIRTHDAY':
          const birthdayEvent = await this.createBirthdayEvent({
            orderItem,
            student,
            product,
            locationId: defaultLocationId
          })
          events.push(birthdayEvent)
          break

        case 'SUBSCRIPTION':
          const subscriptionEvents = await this.createSubscriptionEvents({
            orderItem,
            student,
            product,
            locationId: defaultLocationId
          })
          events.push(...subscriptionEvents)
          break
      }
    }

    return events
  }

  /**
   * Creates a camp event (single day, 9am-3pm or 9am-5pm)
   */
  private async createCampEvent({ orderItem, student, product, locationId }: {
    orderItem: any
    student: any
    product: any
    locationId: string
  }) {
    const bookingDate = orderItem.bookingDate
    const isAllDay = product.duration && product.duration > 360 // More than 6 hours = all day

    const times = isAllDay 
      ? BUSINESS_CONSTANTS.CAMP_TIMES.ALL_DAY_CAMP
      : BUSINESS_CONSTANTS.CAMP_TIMES.DAY_CAMP

    const startDateTime = this.createDateTimeFromTimeString(bookingDate, times.start)
    const endDateTime = this.createDateTimeFromTimeString(bookingDate, times.end)

    // Validate weekday for camps
    const dayOfWeek = startDateTime.getDay()
    if (!BUSINESS_CONSTANTS.WEEKDAYS.includes(dayOfWeek)) {
      throw new Error('Camps can only be scheduled on weekdays')
    }

    const event = await this.createEvent({
      title: `${product.name} - ${student.name}`,
      description: `Camp session for ${student.name}. ${student.allergies ? `Allergies: ${student.allergies}` : ''}`,
      type: 'CAMP',
      startDateTime,
      endDateTime,
      locationId,
      maxCapacity: 15, // Camps can handle more kids
      ageMin: product.ageMin,
      ageMax: product.ageMax
    })

    // Link the booking to the event
    await this.linkBookingToEvent(orderItem, event.id)

    return event
  }

  /**
   * Creates a birthday party event (2-hour session)
   */
  private async createBirthdayEvent({ orderItem, student, product, locationId }: {
    orderItem: any
    student: any
    product: any
    locationId: string
  }) {
    const bookingDate = orderItem.bookingDate
    const duration = BUSINESS_CONSTANTS.BIRTHDAY_DURATION

    // For birthday parties, assume they start at the booking time
    const startDateTime = bookingDate
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000)

    const event = await this.createEvent({
      title: `🎂 ${student.name}'s Birthday Party`,
      description: `Birthday party for ${student.name}. ${student.allergies ? `Allergies: ${student.allergies}` : ''}`,
      type: 'BIRTHDAY',
      startDateTime,
      endDateTime,
      locationId,
      maxCapacity: 12, // Birthday parties are smaller
      ageMin: product.ageMin,
      ageMax: product.ageMax
    })

    await this.linkBookingToEvent(orderItem, event.id)

    return event
  }

  /**
   * Creates recurring weekly events for Ignite subscriptions
   */
  private async createSubscriptionEvents({ orderItem, student, product, locationId }: {
    orderItem: any
    student: any
    product: any
    locationId: string
  }) {
    const subscriptionMonths = product.duration || 3 // Default 3 months
    const startDate = orderItem.bookingDate
    const endDate = addWeeks(startDate, subscriptionMonths * 4) // Approximately monthly

    // Create recurring template
    const template = await this.createRecurringTemplate({
      name: `${product.name} - ${student.name}`,
      description: `Weekly ${product.name} sessions for ${student.name}`,
      type: 'RECURRING_SESSION',
      startTime: '16:00', // Default after school time
      endTime: '17:00',
      duration: BUSINESS_CONSTANTS.IGNITE_WEEKLY_DURATION,
      daysOfWeek: [3], // Wednesday by default
      startDate,
      endDate,
      maxCapacity: 8, // Smaller groups for ongoing programs
      locationId,
      ageMin: product.ageMin,
      ageMax: product.ageMax
    })

    // Generate individual events from template
    const events = await this.generateRecurringEvents(template.id)

    // Link the first event to the booking for tracking
    if (events.length > 0) {
      await this.linkBookingToEvent(orderItem, events[0].id)
    }

    return events
  }

  /**
   * Creates a recurring event template
   */
  async createRecurringTemplate(params: CreateRecurringEventParams) {
    return await prisma.recurringTemplate.create({
      data: params,
      include: {
        location: true
      }
    })
  }

  /**
   * Generates individual events from a recurring template
   */
  async generateRecurringEvents(templateId: string) {
    const template = await prisma.recurringTemplate.findUnique({
      where: { id: templateId },
      include: { location: true }
    })

    if (!template || !template.isActive) return []

    const events = []
    let currentDate = new Date(template.startDate)
    const endDate = template.endDate || addWeeks(currentDate, 12) // Default 3 months

    while (isBefore(currentDate, endDate)) {
      const dayOfWeek = currentDate.getDay()
      
      if (template.daysOfWeek.includes(dayOfWeek)) {
        const startDateTime = this.createDateTimeFromTimeString(currentDate, template.startTime)
        const endDateTime = this.createDateTimeFromTimeString(currentDate, template.endTime)

        // Check for conflicts before creating
        const hasConflict = await this.checkEventConflict(startDateTime, endDateTime, template.locationId)
        
        if (!hasConflict) {
          const event = await this.createEvent({
            title: template.name,
            description: template.description || undefined,
            type: template.type,
            startDateTime,
            endDateTime,
            locationId: template.locationId,
            maxCapacity: template.maxCapacity,
            ageMin: template.ageMin || undefined,
            ageMax: template.ageMax || undefined,
            isRecurring: true,
            recurringTemplateId: template.id
          })
          events.push(event)
        }
      }

      currentDate = addDays(currentDate, 1)
    }

    return events
  }

  /**
   * Checks for event conflicts (overbooking prevention)
   */
  private async checkEventConflict(startDateTime: Date, endDateTime: Date, locationId: string): Promise<boolean> {
    const conflictingEvents = await prisma.event.findMany({
      where: {
        locationId,
        status: { not: 'CANCELLED' },
        OR: [
          {
            startDateTime: { lte: startDateTime },
            endDateTime: { gt: startDateTime }
          },
          {
            startDateTime: { lt: endDateTime },
            endDateTime: { gte: endDateTime }
          },
          {
            startDateTime: { gte: startDateTime },
            endDateTime: { lte: endDateTime }
          }
        ]
      }
    })

    // Check if total capacity would be exceeded
    const totalCapacity = conflictingEvents.reduce((sum, event) => sum + event.maxCapacity, 0)
    const location = await prisma.location.findUnique({ where: { id: locationId } })
    
    return totalCapacity >= (location?.capacity || 20)
  }

  /**
   * Links a booking to an event for tracking
   */
  private async linkBookingToEvent(orderItem: any, eventId: string) {
    // Find existing booking or create one
    const booking = await prisma.booking.findFirst({
      where: {
        studentId: orderItem.studentId,
        productId: orderItem.productId,
        startDate: orderItem.bookingDate
      }
    })

    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { 
          eventId,
          status: 'CONFIRMED'
        }
      })
    } else {
      // Create booking if it doesn't exist (fallback)
      const defaultLocationId = await this.getDefaultLocationId();
      await prisma.booking.create({
        data: {
          studentId: orderItem.studentId,
          productId: orderItem.productId,
          locationId: defaultLocationId,
          eventId,
          startDate: orderItem.bookingDate,
          endDate: new Date(orderItem.bookingDate.getTime() + (orderItem.product.duration || 60) * 60 * 1000),
          status: 'CONFIRMED',
          totalPrice: orderItem.price,
          notes: `Auto-created from event linking - Order: ${orderItem.orderId}`
        }
      });
    }

    // Update event current count
    await prisma.event.update({
      where: { id: eventId },
      data: {
        currentCount: {
          increment: 1
        }
      }
    })
  }

  /**
   * Utility to get default location
   */
  private async getDefaultLocationId(): Promise<string> {
    let location = await prisma.location.findFirst({
      where: { name: 'Neutral Bay' }
    })

    if (!location) {
      // Create default location if it doesn't exist
      location = await prisma.location.create({
        data: {
          name: 'Neutral Bay',
          address: '123 Neutral Bay Road, Neutral Bay NSW 2089',
          capacity: 20,
          timezone: BUSINESS_CONSTANTS.LOCATION_TIMEZONE
        }
      })
    }

    return location.id
  }

  /**
   * Creates datetime from date and time string
   */
  private createDateTimeFromTimeString(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number)
    return toZonedTime(
      setMinutes(setHours(date, hours), minutes),
      BUSINESS_CONSTANTS.LOCATION_TIMEZONE
    )
  }
}

export const eventService = new EventCreationService()
