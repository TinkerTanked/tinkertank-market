import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'

describe('Database Performance Tests', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = new PrismaClient()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should handle large product queries under 200ms', async () => {
    performance.mark('product-query-start')
    
    const products = await prisma.product.findMany({
      take: 100,
      include: {
        bookings: true,
        _count: {
          select: { bookings: true }
        }
      }
    })
    
    performance.mark('product-query-end')
    performance.measure('product-query', 'product-query-start', 'product-query-end')
    
    const measure = performance.getEntriesByName('product-query')[0]
    expect(measure.duration).toBeLessThan(200)
  })

  it('should handle concurrent booking queries efficiently', async () => {
    const concurrentQueries = 10
    performance.mark('concurrent-start')
    
    const queries = Array.from({ length: concurrentQueries }, () =>
      prisma.booking.findMany({
        where: {
          date: {
            gte: new Date('2024-12-01'),
            lte: new Date('2024-12-31')
          }
        },
        include: {
          product: true
        }
      })
    )
    
    const results = await Promise.all(queries)
    
    performance.mark('concurrent-end')
    performance.measure('concurrent-queries', 'concurrent-start', 'concurrent-end')
    
    const measure = performance.getEntriesByName('concurrent-queries')[0]
    expect(measure.duration).toBeLessThan(500)
    expect(results).toHaveLength(concurrentQueries)
  })

  it('should optimize availability checks for calendar', async () => {
    const startDate = new Date('2024-12-01')
    const endDate = new Date('2024-12-31')
    
    performance.mark('availability-start')
    
    // Complex availability query
    const availability = await prisma.$queryRaw`
      SELECT 
        DATE(date) as booking_date,
        COUNT(*) as booking_count,
        product_type
      FROM "Booking"
      WHERE date >= ${startDate} AND date <= ${endDate}
      GROUP BY DATE(date), product_type
      ORDER BY booking_date
    `
    
    performance.mark('availability-end')
    performance.measure('availability-query', 'availability-start', 'availability-end')
    
    const measure = performance.getEntriesByName('availability-query')[0]
    expect(measure.duration).toBeLessThan(150)
  })

  it('should handle bulk booking creation efficiently', async () => {
    const bookings = Array.from({ length: 50 }, (_, i) => ({
      productId: 'test-product',
      customerEmail: `test${i}@example.com`,
      customerName: `Test User ${i}`,
      date: new Date(`2024-12-${(i % 30) + 1}`),
      participants: Math.floor(Math.random() * 10) + 1,
      status: 'confirmed' as const,
      totalAmount: 100
    }))
    
    performance.mark('bulk-create-start')
    
    try {
      await prisma.booking.createMany({
        data: bookings,
        skipDuplicates: true
      })
      
      performance.mark('bulk-create-end')
      performance.measure('bulk-create', 'bulk-create-start', 'bulk-create-end')
      
      const measure = performance.getEntriesByName('bulk-create')[0]
      expect(measure.duration).toBeLessThan(300)
      
    } finally {
      // Cleanup test data
      await prisma.booking.deleteMany({
        where: {
          customerEmail: {
            startsWith: 'test'
          }
        }
      })
    }
  })

  it('should maintain connection pool performance', async () => {
    const connectionTests = Array.from({ length: 20 }, async (_, i) => {
      performance.mark(`connection-${i}-start`)
      
      const result = await prisma.product.count()
      
      performance.mark(`connection-${i}-end`)
      performance.measure(`connection-${i}`, `connection-${i}-start`, `connection-${i}-end`)
      
      return result
    })
    
    const results = await Promise.all(connectionTests)
    
    // All connection tests should complete under 100ms each
    for (let i = 0; i < connectionTests.length; i++) {
      const measure = performance.getEntriesByName(`connection-${i}`)[0]
      expect(measure.duration).toBeLessThan(100)
    }
  })

  it('should handle complex aggregation queries', async () => {
    performance.mark('aggregation-start')
    
    const stats = await prisma.booking.groupBy({
      by: ['status', 'productType'],
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      },
      _avg: {
        participants: true
      },
      where: {
        date: {
          gte: new Date('2024-01-01'),
          lte: new Date('2024-12-31')
        }
      }
    })
    
    performance.mark('aggregation-end')
    performance.measure('aggregation-query', 'aggregation-start', 'aggregation-end')
    
    const measure = performance.getEntriesByName('aggregation-query')[0]
    expect(measure.duration).toBeLessThan(250)
  })
})

// Database stress test
describe('Database Stress Tests', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = new PrismaClient()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should handle database under sustained load', async () => {
    const iterations = 100
    const results: number[] = []
    
    for (let i = 0; i < iterations; i++) {
      performance.mark(`stress-${i}-start`)
      
      await prisma.product.findMany({
        take: 10,
        skip: i % 50
      })
      
      performance.mark(`stress-${i}-end`)
      performance.measure(`stress-${i}`, `stress-${i}-start`, `stress-${i}-end`)
      
      const measure = performance.getEntriesByName(`stress-${i}`)[0]
      results.push(measure.duration)
    }
    
    const avgDuration = results.reduce((sum, duration) => sum + duration, 0) / results.length
    const maxDuration = Math.max(...results)
    
    expect(avgDuration).toBeLessThan(100)
    expect(maxDuration).toBeLessThan(500)
  })
})
