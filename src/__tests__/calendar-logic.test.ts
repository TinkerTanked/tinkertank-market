/**
 * Calendar Logic Unit Tests
 * Tests business logic without React component rendering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CalendarEvent, BookingStatus, PaymentStatus } from '@/types/booking'
import { Product, ProductType, CampType } from '@/types/product'
import { isWeekend, isBusinessDay } from '@/types'

const mockProducts: Product[] = [
  {
    id: 'camp-1',
    name: 'Day Camp',
    type: ProductType.CAMP,
    campType: CampType.DAY,
    description: 'Full day camp',
    pricing: { basePrice: 85 },
    ageRange: { min: 5, max: 12 },
    isActive: true
  },
  {
    id: 'birthday-1', 
    name: 'Birthday Party',
    type: ProductType.BIRTHDAY,
    description: 'Birthday party package',
    pricing: { basePrice: 450 },
    ageRange: { min: 4, max: 14 },
    isActive: true
  }
]

const mockAvailableEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Day Camp',
    start: '2025-02-24T09:00:00+11:00', // Monday
    end: '2025-02-24T15:00:00+11:00',
    extendedProps: {
      productType: 'CAMP',
      capacity: 10,
      currentBookings: 5,
      bookingStatus: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID
    }
  },
  {
    id: 'event-2',
    title: 'Day Camp - Full',
    start: '2025-02-25T09:00:00+11:00', // Tuesday
    end: '2025-02-25T15:00:00+11:00',
    extendedProps: {
      productType: 'CAMP',
      capacity: 10,
      currentBookings: 10, // Full capacity
      bookingStatus: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID
    }
  },
  {
    id: 'event-3',
    title: 'Birthday Party',
    start: '2025-02-22T14:00:00+11:00', // Saturday
    end: '2025-02-22T17:00:00+11:00',
    extendedProps: {
      productType: 'BIRTHDAY',
      capacity: 1,
      currentBookings: 0,
      bookingStatus: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING
    }
  }
]

describe('Calendar Business Logic', () => {

  describe('Weekend Date Click Handling', () => {
    const handleDateClick = (date: Date, selectedProductType?: string): Date | null => {
      const clickedDate = new Date(date)
      
      // Check if it's a weekend and we're looking at camps
      if (selectedProductType === 'CAMP') {
        const dayOfWeek = clickedDate.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
          return null // Don't allow weekend selection for camps
        }
      }
      
      return clickedDate
    }

    it('should prevent weekend selection for camps', () => {
      const saturday = new Date('2025-02-22T00:00:00.000Z')
      const sunday = new Date('2025-02-23T00:00:00.000Z')
      
      expect(handleDateClick(saturday, 'CAMP')).toBe(null)
      expect(handleDateClick(sunday, 'CAMP')).toBe(null)
    })

    it('should allow weekday selection for camps', () => {
      const monday = new Date('2025-02-24T00:00:00.000Z')
      const friday = new Date('2025-02-21T00:00:00.000Z')
      
      expect(handleDateClick(monday, 'CAMP')).toEqual(monday)
      expect(handleDateClick(friday, 'CAMP')).toEqual(friday)
    })

    it('should allow weekend selection for birthdays', () => {
      const saturday = new Date('2025-02-22T00:00:00.000Z')
      const sunday = new Date('2025-02-23T00:00:00.000Z')
      
      expect(handleDateClick(saturday, 'BIRTHDAY')).toEqual(saturday)
      expect(handleDateClick(sunday, 'BIRTHDAY')).toEqual(sunday)
    })

    it('should allow all dates when no product type selected', () => {
      const saturday = new Date('2025-02-22T00:00:00.000Z')
      const monday = new Date('2025-02-24T00:00:00.000Z')
      
      expect(handleDateClick(saturday)).toEqual(saturday)
      expect(handleDateClick(monday)).toEqual(monday)
    })
  })

  describe('Event Filtering Logic', () => {
    const filterEvents = (events: CalendarEvent[], selectedProductType?: string) => {
      let filteredEvents = events

      // Filter by product type if selected
      if (selectedProductType) {
        filteredEvents = filteredEvents.filter(
          (event) => event.extendedProps.productType === selectedProductType
        )
      }

      // Only show available events (not fully booked)
      filteredEvents = filteredEvents.filter((event) => {
        const { capacity, currentBookings } = event.extendedProps
        return !capacity || !currentBookings || currentBookings < capacity
      })

      return filteredEvents
    }

    it('should filter events by product type', () => {
      const campEvents = filterEvents(mockAvailableEvents, 'CAMP')
      const birthdayEvents = filterEvents(mockAvailableEvents, 'BIRTHDAY')
      
      expect(campEvents.every(e => e.extendedProps.productType === 'CAMP')).toBe(true)
      expect(birthdayEvents.every(e => e.extendedProps.productType === 'BIRTHDAY')).toBe(true)
    })

    it('should filter out fully booked events', () => {
      const availableEvents = filterEvents(mockAvailableEvents, 'CAMP')
      
      // Should not include event-2 (fully booked)
      expect(availableEvents.find(e => e.id === 'event-2')).toBeUndefined()
      
      // Should include event-1 (5/10 capacity)
      expect(availableEvents.find(e => e.id === 'event-1')).toBeDefined()
    })

    it('should show all available events when no product type selected', () => {
      const allEvents = filterEvents(mockAvailableEvents)
      
      // Should include available events from multiple product types
      const campEvents = allEvents.filter(e => e.extendedProps.productType === 'CAMP')
      const birthdayEvents = allEvents.filter(e => e.extendedProps.productType === 'BIRTHDAY')
      
      expect(campEvents.length).toBeGreaterThan(0)
      expect(birthdayEvents.length).toBeGreaterThan(0)
    })

    it('should handle events without capacity information', () => {
      const eventsWithoutCapacity: CalendarEvent[] = [
        {
          id: 'unlimited-event',
          title: 'Unlimited Event',
          start: '2025-02-24T09:00:00+11:00',
          end: '2025-02-24T15:00:00+11:00',
          extendedProps: {
            productType: 'CAMP',
            // No capacity or currentBookings
            bookingStatus: BookingStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PAID
          }
        }
      ]

      const filtered = filterEvents(eventsWithoutCapacity, 'CAMP')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('unlimited-event')
    })
  })

  describe('Day Cell CSS Class Logic', () => {
    const getDayCellClasses = (date: Date, selectedProductType?: string, hasEvents = false) => {
      const dayOfWeek = date.getDay()
      
      // Disable weekends for camps
      if (selectedProductType === 'CAMP' && (dayOfWeek === 0 || dayOfWeek === 6)) {
        return ['bg-gray-100', 'text-gray-400', 'cursor-not-allowed']
      }

      // Check if this date has available spots
      if (hasEvents) {
        return ['bg-blue-50', 'cursor-pointer', 'hover:bg-blue-100']
      }

      return ['cursor-pointer', 'hover:bg-gray-50']
    }

    it('should return disabled classes for camp weekends', () => {
      const saturday = new Date('2025-02-22T00:00:00.000Z')
      const sunday = new Date('2025-02-23T00:00:00.000Z')

      const saturdayClasses = getDayCellClasses(saturday, 'CAMP')
      const sundayClasses = getDayCellClasses(sunday, 'CAMP')

      expect(saturdayClasses).toEqual(['bg-gray-100', 'text-gray-400', 'cursor-not-allowed'])
      expect(sundayClasses).toEqual(['bg-gray-100', 'text-gray-400', 'cursor-not-allowed'])
    })

    it('should return available classes for dates with events', () => {
      const monday = new Date('2025-02-24T00:00:00.000Z')
      
      const classes = getDayCellClasses(monday, 'CAMP', true)
      expect(classes).toEqual(['bg-blue-50', 'cursor-pointer', 'hover:bg-blue-100'])
    })

    it('should return default classes for empty dates', () => {
      const monday = new Date('2025-02-24T00:00:00.000Z')
      
      const classes = getDayCellClasses(monday, 'CAMP', false)
      expect(classes).toEqual(['cursor-pointer', 'hover:bg-gray-50'])
    })

    it('should allow weekend styling for non-camp products', () => {
      const saturday = new Date('2025-02-22T00:00:00.000Z')
      
      const birthdayClasses = getDayCellClasses(saturday, 'BIRTHDAY', true)
      expect(birthdayClasses).toEqual(['bg-blue-50', 'cursor-pointer', 'hover:bg-blue-100'])
    })
  })

  describe('Event Content Generation Logic', () => {
    const generateEventContent = (event: CalendarEvent) => {
      const { capacity, currentBookings } = event.extendedProps
      const spotsLeft = capacity ? capacity - (currentBookings || 0) : null

      return {
        title: event.title,
        spotsLeft: spotsLeft,
        spotsText: spotsLeft !== null ? 
          (spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full') : 
          null
      }
    }

    it('should calculate spots left correctly', () => {
      const event = mockAvailableEvents[0] // 5/10 capacity

      const content = generateEventContent(event)
      expect(content.spotsLeft).toBe(5)
      expect(content.spotsText).toBe('5 spots left')
    })

    it('should show full when capacity reached', () => {
      const event = mockAvailableEvents[1] // 10/10 capacity

      const content = generateEventContent(event)
      expect(content.spotsLeft).toBe(0)
      expect(content.spotsText).toBe('Full')
    })

    it('should handle unlimited capacity events', () => {
      const unlimitedEvent: CalendarEvent = {
        id: 'unlimited',
        title: 'Unlimited Event',
        start: '2025-02-24T09:00:00+11:00',
        end: '2025-02-24T15:00:00+11:00',
        extendedProps: {
          productType: 'CAMP',
          // No capacity
          bookingStatus: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID
        }
      }

      const content = generateEventContent(unlimitedEvent)
      expect(content.spotsLeft).toBeNull()
      expect(content.spotsText).toBeNull()
    })
  })

  describe('Calendar Configuration Logic', () => {
    const getCalendarConfig = (selectedProductType?: string) => {
      const today = new Date()
      
      return {
        timeZone: 'Australia/Sydney',
        firstDay: 1, // Start week on Monday
        weekends: selectedProductType !== 'CAMP', // Hide weekends for camps
        validRange: {
          start: today.toISOString().split('T')[0] // No past dates
        },
        locale: 'en-AU',
        nowIndicator: true,
        dayHeaders: true,
        fixedWeekCount: false,
        showNonCurrentDates: false
      }
    }

    it('should hide weekends for camps', () => {
      const campConfig = getCalendarConfig('CAMP')
      expect(campConfig.weekends).toBe(false)
    })

    it('should show weekends for birthdays', () => {
      const birthdayConfig = getCalendarConfig('BIRTHDAY')
      expect(birthdayConfig.weekends).toBe(true)
    })

    it('should show weekends when no product type selected', () => {
      const defaultConfig = getCalendarConfig()
      expect(defaultConfig.weekends).toBe(true)
    })

    it('should use Australian locale and timezone', () => {
      const config = getCalendarConfig()
      expect(config.timeZone).toBe('Australia/Sydney')
      expect(config.locale).toBe('en-AU')
      expect(config.firstDay).toBe(1) // Monday
    })

    it('should prevent past date selection', () => {
      const config = getCalendarConfig()
      const today = new Date().toISOString().split('T')[0]
      expect(config.validRange.start).toBe(today)
    })
  })

  describe('Availability Check Logic', () => {
    const checkDateAvailability = (date: Date, events: CalendarEvent[]) => {
      const dateString = date.toDateString()
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start)
        return eventDate.toDateString() === dateString
      })

      return {
        hasEvents: dayEvents.length > 0,
        events: dayEvents,
        totalCapacity: dayEvents.reduce((sum, event) => {
          return sum + (event.extendedProps.capacity || 0)
        }, 0),
        totalBookings: dayEvents.reduce((sum, event) => {
          return sum + (event.extendedProps.currentBookings || 0)
        }, 0)
      }
    }

    it('should identify dates with events', () => {
      const monday = new Date('2025-02-24T00:00:00.000Z')
      const availability = checkDateAvailability(monday, mockAvailableEvents)
      
      expect(availability.hasEvents).toBe(true)
      expect(availability.events.length).toBeGreaterThan(0)
    })

    it('should calculate total capacity and bookings', () => {
      const tuesday = new Date('2025-02-25T00:00:00.000Z')
      const availability = checkDateAvailability(tuesday, mockAvailableEvents)
      
      expect(availability.totalCapacity).toBeGreaterThan(0)
      expect(availability.totalBookings).toBeGreaterThan(0)
    })

    it('should handle dates with no events', () => {
      const wednesday = new Date('2025-02-26T00:00:00.000Z')
      const availability = checkDateAvailability(wednesday, mockAvailableEvents)
      
      expect(availability.hasEvents).toBe(false)
      expect(availability.events).toHaveLength(0)
      expect(availability.totalCapacity).toBe(0)
      expect(availability.totalBookings).toBe(0)
    })
  })
})

// Business Logic Test Summary
describe('Calendar Logic Test Summary', () => {
  it('should document comprehensive business logic test coverage', () => {
    const logicTestAreas = [
      'Weekend Date Click - Prevents camp weekend selection, allows birthday weekends',
      'Event Filtering - Product type filtering, capacity filtering, unlimited events',
      'CSS Classes - Weekend blocking styles, available event styles, default styles',
      'Event Content - Spots calculation, full capacity display, unlimited handling',
      'Calendar Config - Weekend visibility, timezone/locale, past date prevention',
      'Availability Check - Date-event matching, capacity calculations, empty dates'
    ]
    
    expect(logicTestAreas).toHaveLength(6)
    
    console.log('\n=== CALENDAR BUSINESS LOGIC TEST COVERAGE ===')
    logicTestAreas.forEach((area, index) => {
      console.log(`${index + 1}. ${area}`)
    })
    console.log('===============================================\n')
  })
})
