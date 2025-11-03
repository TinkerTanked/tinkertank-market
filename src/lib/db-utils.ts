/**
 * Database utility functions for TinkerTank Market
 */

import { PrismaClient } from '@prisma/client'

// Singleton Prisma client for Next.js
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Validation helpers
 */
export const validators = {
  /**
   * Check if student age is appropriate for product
   */
  validateStudentAge: (studentBirthdate: Date, productAgeMin: number, productAgeMax: number): boolean => {
    const today = new Date()
    const age = today.getFullYear() - studentBirthdate.getFullYear()
    const monthDiff = today.getMonth() - studentBirthdate.getMonth()
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < studentBirthdate.getDate()) 
      ? age - 1 
      : age
    
    return actualAge >= productAgeMin && actualAge <= productAgeMax
  },

  /**
   * Check if event has available capacity
   */
  validateEventCapacity: (currentCount: number, maxCapacity: number): boolean => {
    return currentCount < maxCapacity
  },

  /**
   * Validate booking date is in the future
   */
  validateBookingDate: (bookingDate: Date): boolean => {
    return bookingDate > new Date()
  },
}

/**
 * Database query helpers
 */
export const queries = {
  /**
   * Get available events for a date range
   */
  getAvailableEvents: async (startDate: Date, endDate: Date) => {
    return prisma.event.findMany({
      where: {
        startDateTime: {
          gte: startDate,
          lte: endDate,
        },
        status: 'SCHEDULED',
        currentCount: {
          lt: prisma.event.fields.maxCapacity,
        },
      },
      include: {
        location: true,
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: {
        startDateTime: 'asc',
      },
    })
  },

  /**
   * Get student's upcoming bookings
   */
  getStudentUpcomingBookings: async (studentId: string) => {
    return prisma.booking.findMany({
      where: {
        studentId,
        startDate: {
          gte: new Date(),
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      include: {
        product: true,
        location: true,
        event: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    })
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async () => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const [
      totalStudents,
      totalBookings,
      monthlyRevenue,
      upcomingEvents,
      activeSubscriptions,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.booking.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          status: 'PAID',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.event.count({
        where: {
          startDateTime: {
            gte: today,
          },
          status: 'SCHEDULED',
        },
      }),
      prisma.booking.count({
        where: {
          product: {
            type: 'SUBSCRIPTION',
          },
          status: 'CONFIRMED',
        },
      }),
    ])

    return {
      totalStudents,
      monthlyBookings: totalBookings,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      upcomingEvents,
      activeSubscriptions,
    }
  },

  /**
   * Get popular products by booking count
   */
  getPopularProducts: async (limit: number = 5) => {
    return prisma.product.findMany({
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: {
        bookings: {
          _count: 'desc',
        },
      },
      take: limit,
    })
  },
}

/**
 * Database maintenance helpers
 */
export const maintenance = {
  /**
   * Clean up old completed events
   */
  cleanupOldEvents: async (daysOld: number = 90) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    const result = await prisma.event.deleteMany({
      where: {
        status: 'COMPLETED',
        endDateTime: {
          lt: cutoffDate,
        },
      },
    })
    
    return result.count
  },

  /**
   * Update event attendance counts
   */
  updateEventCounts: async () => {
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    })

    for (const event of events) {
      await prisma.event.update({
        where: { id: event.id },
        data: { currentCount: event._count.bookings },
      })
    }

    return events.length
  },
}
