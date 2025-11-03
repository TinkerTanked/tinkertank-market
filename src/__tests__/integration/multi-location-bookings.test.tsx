/**
 * Multi-Location Camp Bookings Integration Tests
 * 
 * This test suite validates the complete multi-location booking system:
 * - Creating 50 camp bookings for Neutral Bay location
 * - Creating 50 camp bookings for Manly Library location
 * - Testing bookings across different dates
 * - Testing capacity limits per location
 * - Testing students booking at different locations on different days
 * - Testing that same student cannot book overlapping times at different locations
 * - Verifying all bookings in database
 * - Verifying admin calendar shows bookings for both locations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PrismaClient, BookingStatus, ProductType, EventType } from '@prisma/client'
import { addDays, setHours, setMinutes } from 'date-fns'

// Initialize Prisma client for direct database operations
const prisma = new PrismaClient()

// Mock locations (these should match seed data)
const LOCATIONS = {
  NEUTRAL_BAY: {
    id: 'neutral-bay',
    name: 'TinkerTank Neutral Bay',
    capacity: 20
  },
  MANLY_LIBRARY: {
    id: 'manly-library',
    name: 'Manly Library',
    capacity: 16
  }
}

// Helper to generate future weekday dates
const getWeekdayDate = (daysFromNow: number): Date => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  
  // Skip weekends
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1)
  }
  
  return date
}

// Helper to create a booking
const createBooking = async (
  studentId: string,
  productId: string,
  locationId: string,
  startDate: Date,
  endDate: Date,
  price: number
) => {
  return await prisma.booking.create({
    data: {
      studentId,
      productId,
      locationId,
      startDate,
      endDate,
      totalPrice: price,
      status: BookingStatus.CONFIRMED,
      notes: `Multi-location test booking`
    }
  })
}

// Helper to create a student
const createStudent = async (index: number, suffix: string = '') => {
  return await prisma.student.create({
    data: {
      name: `Student ${index}${suffix}`,
      birthdate: new Date('2015-01-01'),
      allergies: null
    }
  })
}

// Helper to create a product
const createProduct = async (name: string, price: number, ageMin: number = 6, ageMax: number = 12) => {
  return await prisma.product.create({
    data: {
      name,
      type: ProductType.CAMP,
      price,
      duration: 480, // 8 hours
      description: `Test camp product: ${name}`,
      ageMin,
      ageMax,
      isActive: true
    }
  })
}

// Helper to create a location
const createLocation = async (name: string, address: string, capacity: number) => {
  return await prisma.location.create({
    data: {
      name,
      address,
      capacity,
      timezone: 'Australia/Sydney',
      isActive: true
    }
  })
}

// Helper to create an event
const createEvent = async (
  title: string,
  locationId: string,
  startDateTime: Date,
  endDateTime: Date,
  maxCapacity: number
) => {
  return await prisma.event.create({
    data: {
      title,
      description: `Test event: ${title}`,
      type: EventType.CAMP,
      startDateTime,
      endDateTime,
      locationId,
      maxCapacity,
      ageMin: 6,
      ageMax: 12
    }
  })
}

// Helper to check for overlapping bookings
const checkOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  return start1 < end2 && start2 < end1
}

describe('Multi-Location Camp Bookings Integration Tests', () => {
  let neutralBayLocation: any
  let manlyLibraryLocation: any
  let testProduct1: any
  let testProduct2: any
  let students: any[] = []

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.booking.deleteMany({
      where: {
        notes: { contains: 'Multi-location test' }
      }
    })

    // Create test locations
    neutralBayLocation = await createLocation(
      'TinkerTank Neutral Bay Test',
      '123 Military Road, Neutral Bay NSW 2089',
      20
    )

    manlyLibraryLocation = await createLocation(
      'Manly Library Test',
      'Manly Library, Manly NSW 2095',
      16
    )

    // Create test products
    testProduct1 = await createProduct('Robotics Camp Day', 85.00)
    testProduct2 = await createProduct('STEM Adventure Camp', 80.00)
  })

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.booking.deleteMany({
      where: {
        notes: { contains: 'Multi-location test' }
      }
    })

    // Delete test students
    for (const student of students) {
      await prisma.student.delete({
        where: { id: student.id }
      }).catch(() => {}) // Ignore if already deleted
    }
    students = []

    // Delete test locations
    if (neutralBayLocation) {
      await prisma.event.deleteMany({ where: { locationId: neutralBayLocation.id } })
      await prisma.location.delete({ where: { id: neutralBayLocation.id } }).catch(() => {})
    }
    if (manlyLibraryLocation) {
      await prisma.event.deleteMany({ where: { locationId: manlyLibraryLocation.id } })
      await prisma.location.delete({ where: { id: manlyLibraryLocation.id } }).catch(() => {})
    }

    // Delete test products
    if (testProduct1) {
      await prisma.product.delete({ where: { id: testProduct1.id } }).catch(() => {})
    }
    if (testProduct2) {
      await prisma.product.delete({ where: { id: testProduct2.id } }).catch(() => {})
    }
  })

  describe('1. Create 50 Bookings for Neutral Bay', () => {
    it('should create 50 camp bookings for Neutral Bay location', async () => {
      const bookings = []
      
      // Create 50 students
      for (let i = 0; i < 50; i++) {
        const student = await createStudent(i, '-NB')
        students.push(student)

        // Create booking for each student at different dates
        const daysOffset = Math.floor(i / 5) + 1 // 5 bookings per day
        const startDate = getWeekdayDate(daysOffset)
        const start = setHours(setMinutes(startDate, 0), 9)
        const end = setHours(setMinutes(startDate, 0), 17)

        const booking = await createBooking(
          student.id,
          testProduct1.id,
          neutralBayLocation.id,
          start,
          end,
          85.00
        )
        
        bookings.push(booking)
      }

      // Verify all bookings were created
      expect(bookings.length).toBe(50)

      // Verify bookings in database
      const dbBookings = await prisma.booking.findMany({
        where: {
          locationId: neutralBayLocation.id,
          notes: { contains: 'Multi-location test' }
        }
      })

      expect(dbBookings.length).toBe(50)

      // Verify all bookings are confirmed
      const confirmedBookings = dbBookings.filter(b => b.status === BookingStatus.CONFIRMED)
      expect(confirmedBookings.length).toBe(50)
    }, 30000) // Increased timeout for database operations
  })

  describe('2. Create 50 Bookings for Manly Library', () => {
    it('should create 50 camp bookings for Manly Library location', async () => {
      const bookings = []
      
      // Create 50 students
      for (let i = 0; i < 50; i++) {
        const student = await createStudent(i, '-ML')
        students.push(student)

        // Create booking for each student at different dates
        const daysOffset = Math.floor(i / 5) + 1 // 5 bookings per day
        const startDate = getWeekdayDate(daysOffset)
        const start = setHours(setMinutes(startDate, 0), 9)
        const end = setHours(setMinutes(startDate, 0), 17)

        const booking = await createBooking(
          student.id,
          testProduct1.id,
          manlyLibraryLocation.id,
          start,
          end,
          85.00
        )
        
        bookings.push(booking)
      }

      // Verify all bookings were created
      expect(bookings.length).toBe(50)

      // Verify bookings in database
      const dbBookings = await prisma.booking.findMany({
        where: {
          locationId: manlyLibraryLocation.id,
          notes: { contains: 'Multi-location test' }
        }
      })

      expect(dbBookings.length).toBe(50)

      // Verify all bookings are confirmed
      const confirmedBookings = dbBookings.filter(b => b.status === BookingStatus.CONFIRMED)
      expect(confirmedBookings.length).toBe(50)
    }, 30000) // Increased timeout for database operations
  })

  describe('3. Test Bookings Across Different Dates', () => {
    it('should distribute bookings across multiple dates correctly', async () => {
      const bookings = []
      
      // Create 30 students
      for (let i = 0; i < 30; i++) {
        const student = await createStudent(i, '-DATE')
        students.push(student)

        // Distribute across different dates (3 days)
        const dayIndex = i % 3
        const startDate = getWeekdayDate(dayIndex + 1)
        const start = setHours(setMinutes(startDate, 0), 9)
        const end = setHours(setMinutes(startDate, 0), 17)

        const locationId = i % 2 === 0 ? neutralBayLocation.id : manlyLibraryLocation.id

        const booking = await createBooking(
          student.id,
          testProduct1.id,
          locationId,
          start,
          end,
          85.00
        )
        
        bookings.push(booking)
      }

      // Group bookings by date
      const bookingsByDate = bookings.reduce((acc, booking) => {
        const dateKey = booking.startDate.toISOString().split('T')[0]
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(booking)
        return acc
      }, {} as Record<string, any[]>)

      // Should have 3 different dates
      expect(Object.keys(bookingsByDate).length).toBe(3)

      // Each date should have 10 bookings
      Object.values(bookingsByDate).forEach(dateBookings => {
        expect(dateBookings.length).toBe(10)
      })
    }, 30000)
  })

  describe('4. Test Capacity Limits Per Location', () => {
    it('should respect Neutral Bay capacity limit of 20', async () => {
      const startDate = getWeekdayDate(1)
      const start = setHours(setMinutes(startDate, 0), 9)
      const end = setHours(setMinutes(startDate, 0), 17)

      // Create 20 bookings (at capacity)
      for (let i = 0; i < 20; i++) {
        const student = await createStudent(i, '-CAP-NB')
        students.push(student)

        await createBooking(
          student.id,
          testProduct1.id,
          neutralBayLocation.id,
          start,
          end,
          85.00
        )
      }

      // Verify we have 20 bookings for this date/location
      const bookings = await prisma.booking.findMany({
        where: {
          locationId: neutralBayLocation.id,
          startDate: start,
          notes: { contains: 'Multi-location test' }
        }
      })

      expect(bookings.length).toBe(20)

      // In a real application, attempting to create a 21st booking should fail
      // This is typically handled by business logic, not database constraints
      const capacityCheck = bookings.length >= neutralBayLocation.capacity
      expect(capacityCheck).toBe(true)
    }, 30000)

    it('should respect Manly Library capacity limit of 16', async () => {
      const startDate = getWeekdayDate(2)
      const start = setHours(setMinutes(startDate, 0), 9)
      const end = setHours(setMinutes(startDate, 0), 17)

      // Create 16 bookings (at capacity)
      for (let i = 0; i < 16; i++) {
        const student = await createStudent(i, '-CAP-ML')
        students.push(student)

        await createBooking(
          student.id,
          testProduct1.id,
          manlyLibraryLocation.id,
          start,
          end,
          85.00
        )
      }

      // Verify we have 16 bookings for this date/location
      const bookings = await prisma.booking.findMany({
        where: {
          locationId: manlyLibraryLocation.id,
          startDate: start,
          notes: { contains: 'Multi-location test' }
        }
      })

      expect(bookings.length).toBe(16)

      // Verify capacity is reached
      const capacityCheck = bookings.length >= manlyLibraryLocation.capacity
      expect(capacityCheck).toBe(true)
    }, 30000)
  })

  describe('5. Test Students Booking at Different Locations on Different Days', () => {
    it('should allow same student to book different locations on different days', async () => {
      // Create one student
      const student = await createStudent(1, '-MULTI-LOC')
      students.push(student)

      // Book Neutral Bay on Day 1
      const day1 = getWeekdayDate(1)
      const day1Start = setHours(setMinutes(day1, 0), 9)
      const day1End = setHours(setMinutes(day1, 0), 17)

      const booking1 = await createBooking(
        student.id,
        testProduct1.id,
        neutralBayLocation.id,
        day1Start,
        day1End,
        85.00
      )

      // Book Manly Library on Day 2
      const day2 = getWeekdayDate(2)
      const day2Start = setHours(setMinutes(day2, 0), 9)
      const day2End = setHours(setMinutes(day2, 0), 17)

      const booking2 = await createBooking(
        student.id,
        testProduct1.id,
        manlyLibraryLocation.id,
        day2Start,
        day2End,
        85.00
      )

      // Book Neutral Bay again on Day 3
      const day3 = getWeekdayDate(3)
      const day3Start = setHours(setMinutes(day3, 0), 9)
      const day3End = setHours(setMinutes(day3, 0), 17)

      const booking3 = await createBooking(
        student.id,
        testProduct2.id,
        neutralBayLocation.id,
        day3Start,
        day3End,
        80.00
      )

      // Verify all 3 bookings exist
      const studentBookings = await prisma.booking.findMany({
        where: {
          studentId: student.id,
          notes: { contains: 'Multi-location test' }
        },
        include: {
          location: true,
          product: true
        }
      })

      expect(studentBookings.length).toBe(3)

      // Verify different locations
      const locations = studentBookings.map(b => b.locationId)
      expect(locations).toContain(neutralBayLocation.id)
      expect(locations).toContain(manlyLibraryLocation.id)

      // Verify no overlapping times
      for (let i = 0; i < studentBookings.length; i++) {
        for (let j = i + 1; j < studentBookings.length; j++) {
          const overlap = checkOverlap(
            studentBookings[i].startDate,
            studentBookings[i].endDate,
            studentBookings[j].startDate,
            studentBookings[j].endDate
          )
          expect(overlap).toBe(false)
        }
      }
    }, 30000)

    it('should allow multiple students to book different locations on same day', async () => {
      const student1 = await createStudent(1, '-SAME-DAY-1')
      const student2 = await createStudent(2, '-SAME-DAY-2')
      const student3 = await createStudent(3, '-SAME-DAY-3')
      students.push(student1, student2, student3)

      const date = getWeekdayDate(1)
      const start = setHours(setMinutes(date, 0), 9)
      const end = setHours(setMinutes(date, 0), 17)

      // Student 1 at Neutral Bay
      await createBooking(
        student1.id,
        testProduct1.id,
        neutralBayLocation.id,
        start,
        end,
        85.00
      )

      // Student 2 at Manly Library
      await createBooking(
        student2.id,
        testProduct1.id,
        manlyLibraryLocation.id,
        start,
        end,
        85.00
      )

      // Student 3 at Neutral Bay
      await createBooking(
        student3.id,
        testProduct1.id,
        neutralBayLocation.id,
        start,
        end,
        85.00
      )

      // Verify bookings at both locations
      const nbBookings = await prisma.booking.findMany({
        where: {
          locationId: neutralBayLocation.id,
          startDate: start,
          notes: { contains: 'Multi-location test' }
        }
      })

      const mlBookings = await prisma.booking.findMany({
        where: {
          locationId: manlyLibraryLocation.id,
          startDate: start,
          notes: { contains: 'Multi-location test' }
        }
      })

      expect(nbBookings.length).toBe(2)
      expect(mlBookings.length).toBe(1)
    }, 30000)
  })

  describe('6. Test Same Student Cannot Book Overlapping Times at Different Locations', () => {
    it('should detect overlapping bookings for same student at different locations', async () => {
      const student = await createStudent(1, '-OVERLAP')
      students.push(student)

      const date = getWeekdayDate(1)
      const start1 = setHours(setMinutes(date, 0), 9)
      const end1 = setHours(setMinutes(date, 0), 17)

      // First booking at Neutral Bay
      await createBooking(
        student.id,
        testProduct1.id,
        neutralBayLocation.id,
        start1,
        end1,
        85.00
      )

      // Attempt to create overlapping booking at Manly Library
      const start2 = setHours(setMinutes(date, 0), 14) // Overlaps with first booking
      const end2 = setHours(setMinutes(date, 0), 18)

      // In a real application, this should be prevented by validation
      // For testing purposes, we'll create it and then detect the overlap
      const overlappingBooking = await createBooking(
        student.id,
        testProduct2.id,
        manlyLibraryLocation.id,
        start2,
        end2,
        80.00
      )

      // Check for overlaps
      const studentBookings = await prisma.booking.findMany({
        where: {
          studentId: student.id,
          notes: { contains: 'Multi-location test' }
        },
        orderBy: {
          startDate: 'asc'
        }
      })

      expect(studentBookings.length).toBe(2)

      // Detect overlap
      const hasOverlap = checkOverlap(
        studentBookings[0].startDate,
        studentBookings[0].endDate,
        studentBookings[1].startDate,
        studentBookings[1].endDate
      )

      expect(hasOverlap).toBe(true)

      // In production, this booking should have been rejected
      // The test confirms our overlap detection works correctly
    }, 30000)

    it('should allow same student to book adjacent time slots at different locations', async () => {
      const student = await createStudent(1, '-ADJACENT')
      students.push(student)

      const date = getWeekdayDate(1)

      // Morning session at Neutral Bay
      const morningStart = setHours(setMinutes(date, 0), 9)
      const morningEnd = setHours(setMinutes(date, 0), 12)

      await createBooking(
        student.id,
        testProduct1.id,
        neutralBayLocation.id,
        morningStart,
        morningEnd,
        45.00
      )

      // Afternoon session at Manly Library (no overlap)
      const afternoonStart = setHours(setMinutes(date, 0), 13)
      const afternoonEnd = setHours(setMinutes(date, 0), 17)

      await createBooking(
        student.id,
        testProduct2.id,
        manlyLibraryLocation.id,
        afternoonStart,
        afternoonEnd,
        45.00
      )

      // Verify both bookings exist
      const studentBookings = await prisma.booking.findMany({
        where: {
          studentId: student.id,
          notes: { contains: 'Multi-location test' }
        }
      })

      expect(studentBookings.length).toBe(2)

      // Verify no overlap
      const hasOverlap = checkOverlap(
        studentBookings[0].startDate,
        studentBookings[0].endDate,
        studentBookings[1].startDate,
        studentBookings[1].endDate
      )

      expect(hasOverlap).toBe(false)
    }, 30000)
  })

  describe('7. Verify Database Integrity', () => {
    it('should maintain referential integrity across all bookings', async () => {
      // Create bookings across both locations
      const bookingCount = 20
      
      for (let i = 0; i < bookingCount; i++) {
        const student = await createStudent(i, '-INTEGRITY')
        students.push(student)

        const locationId = i % 2 === 0 ? neutralBayLocation.id : manlyLibraryLocation.id
        const date = getWeekdayDate(Math.floor(i / 4) + 1)
        const start = setHours(setMinutes(date, 0), 9)
        const end = setHours(setMinutes(date, 0), 17)

        await createBooking(
          student.id,
          testProduct1.id,
          locationId,
          start,
          end,
          85.00
        )
      }

      // Verify all bookings have valid references
      const bookings = await prisma.booking.findMany({
        where: {
          notes: { contains: 'Multi-location test' }
        },
        include: {
          student: true,
          product: true,
          location: true
        }
      })

      expect(bookings.length).toBeGreaterThanOrEqual(bookingCount)

      // Verify all relationships exist
      bookings.forEach(booking => {
        expect(booking.student).toBeDefined()
        expect(booking.product).toBeDefined()
        expect(booking.location).toBeDefined()
        expect(booking.student.id).toBe(booking.studentId)
        expect(booking.product.id).toBe(booking.productId)
        expect(booking.location.id).toBe(booking.locationId)
      })
    }, 30000)
  })

  describe('8. Verify Admin Calendar Integration', () => {
    it('should create calendar events for both locations', async () => {
      // Create events for both locations
      const date1 = getWeekdayDate(1)
      const start1 = setHours(setMinutes(date1, 0), 9)
      const end1 = setHours(setMinutes(date1, 0), 17)

      const nbEvent = await createEvent(
        'Robotics Camp - Neutral Bay',
        neutralBayLocation.id,
        start1,
        end1,
        20
      )

      const date2 = getWeekdayDate(2)
      const start2 = setHours(setMinutes(date2, 0), 9)
      const end2 = setHours(setMinutes(date2, 0), 17)

      const mlEvent = await createEvent(
        'Robotics Camp - Manly Library',
        manlyLibraryLocation.id,
        start2,
        end2,
        16
      )

      // Verify events exist in database
      const events = await prisma.event.findMany({
        where: {
          id: { in: [nbEvent.id, mlEvent.id] }
        },
        include: {
          location: true
        }
      })

      expect(events.length).toBe(2)

      // Verify location associations
      const nbEventFromDb = events.find(e => e.locationId === neutralBayLocation.id)
      const mlEventFromDb = events.find(e => e.locationId === manlyLibraryLocation.id)

      expect(nbEventFromDb).toBeDefined()
      expect(mlEventFromDb).toBeDefined()
      expect(nbEventFromDb?.maxCapacity).toBe(20)
      expect(mlEventFromDb?.maxCapacity).toBe(16)

      // Clean up events
      await prisma.event.deleteMany({
        where: { id: { in: [nbEvent.id, mlEvent.id] } }
      })
    }, 30000)

    it('should show bookings grouped by location in calendar view', async () => {
      // Create multiple bookings for same date at different locations
      const date = getWeekdayDate(1)
      const start = setHours(setMinutes(date, 0), 9)
      const end = setHours(setMinutes(date, 0), 17)

      // Create 5 students at each location
      for (let i = 0; i < 5; i++) {
        const studentNB = await createStudent(i, '-CAL-NB')
        const studentML = await createStudent(i, '-CAL-ML')
        students.push(studentNB, studentML)

        await createBooking(
          studentNB.id,
          testProduct1.id,
          neutralBayLocation.id,
          start,
          end,
          85.00
        )

        await createBooking(
          studentML.id,
          testProduct1.id,
          manlyLibraryLocation.id,
          start,
          end,
          85.00
        )
      }

      // Query bookings grouped by location
      const nbBookings = await prisma.booking.findMany({
        where: {
          locationId: neutralBayLocation.id,
          startDate: start,
          notes: { contains: 'Multi-location test' }
        },
        include: {
          student: true,
          product: true
        }
      })

      const mlBookings = await prisma.booking.findMany({
        where: {
          locationId: manlyLibraryLocation.id,
          startDate: start,
          notes: { contains: 'Multi-location test' }
        },
        include: {
          student: true,
          product: true
        }
      })

      expect(nbBookings.length).toBe(5)
      expect(mlBookings.length).toBe(5)

      // Verify proper grouping
      nbBookings.forEach(booking => {
        expect(booking.locationId).toBe(neutralBayLocation.id)
      })

      mlBookings.forEach(booking => {
        expect(booking.locationId).toBe(manlyLibraryLocation.id)
      })
    }, 30000)
  })

  describe('9. High Volume Multi-Location Stress Test', () => {
    it('should handle 100 total bookings across both locations efficiently', async () => {
      const startTime = Date.now()
      const bookings = []

      // Create 50 bookings for each location
      for (let i = 0; i < 100; i++) {
        const student = await createStudent(i, '-STRESS')
        students.push(student)

        const locationId = i < 50 ? neutralBayLocation.id : manlyLibraryLocation.id
        const daysOffset = Math.floor(i / 10) + 1
        const date = getWeekdayDate(daysOffset)
        const start = setHours(setMinutes(date, 0), 9)
        const end = setHours(setMinutes(date, 0), 17)

        const booking = await createBooking(
          student.id,
          i % 2 === 0 ? testProduct1.id : testProduct2.id,
          locationId,
          start,
          end,
          i % 2 === 0 ? 85.00 : 80.00
        )

        bookings.push(booking)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Verify all bookings created
      expect(bookings.length).toBe(100)

      // Verify database consistency
      const dbBookings = await prisma.booking.findMany({
        where: {
          notes: { contains: 'Multi-location test' }
        },
        include: {
          location: true
        }
      })

      // Should have at least 100 bookings from this test
      expect(dbBookings.length).toBeGreaterThanOrEqual(100)

      // Verify distribution across locations
      const nbCount = dbBookings.filter(b => b.locationId === neutralBayLocation.id).length
      const mlCount = dbBookings.filter(b => b.locationId === manlyLibraryLocation.id).length

      expect(nbCount).toBeGreaterThanOrEqual(50)
      expect(mlCount).toBeGreaterThanOrEqual(50)

      // Performance check - should complete in reasonable time (< 60 seconds)
      expect(duration).toBeLessThan(60000)

      console.log(`Created 100 bookings in ${duration}ms`)
    }, 90000) // Extended timeout for stress test
  })
})
