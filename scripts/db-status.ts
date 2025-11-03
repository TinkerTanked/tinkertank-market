#!/usr/bin/env tsx

/**
 * Database status and health check utility
 */

import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns'

const prisma = new PrismaClient()

async function checkDatabaseHealth() {
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Get counts for all tables
    const [
      locationCount,
      productCount,
      studentCount,
      eventCount,
      bookingCount,
      orderCount,
      orderItemCount,
      recurringTemplateCount,
    ] = await Promise.all([
      prisma.location.count(),
      prisma.product.count(),
      prisma.student.count(),
      prisma.event.count(),
      prisma.booking.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.recurringTemplate.count(),
    ])

    console.log('\n📊 Database Statistics')
    console.log('='.repeat(30))
    console.log(`Locations: ${locationCount}`)
    console.log(`Products: ${productCount}`)
    console.log(`Students: ${studentCount}`)
    console.log(`Events: ${eventCount}`)
    console.log(`Bookings: ${bookingCount}`)
    console.log(`Orders: ${orderCount}`)
    console.log(`Order Items: ${orderItemCount}`)
    console.log(`Recurring Templates: ${recurringTemplateCount}`)

    // Check for upcoming events
    const upcomingEvents = await prisma.event.count({
      where: {
        startDateTime: {
          gte: new Date(),
        },
        status: 'SCHEDULED',
      },
    })

    console.log(`\n📅 Upcoming Events: ${upcomingEvents}`)

    // Check product distribution
    const productsByType = await prisma.product.groupBy({
      by: ['type'],
      _count: { id: true },
    })

    console.log('\n🎯 Products by Type:')
    productsByType.forEach(({ type, _count }) => {
      console.log(`  ${type}: ${_count.id}`)
    })

    // Check booking statuses
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    console.log('\n📋 Bookings by Status:')
    bookingsByStatus.forEach(({ status, _count }) => {
      console.log(`  ${status}: ${_count.id}`)
    })

    // Check revenue this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const monthlyRevenue = await prisma.order.aggregate({
      where: {
        status: 'PAID',
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
    })

    console.log(`\n💰 Monthly Revenue: $${monthlyRevenue._sum.totalAmount || 0}`)

    // Show next few events
    const nextEvents = await prisma.event.findMany({
      where: {
        startDateTime: {
          gte: new Date(),
        },
        status: 'SCHEDULED',
      },
      include: {
        location: true,
      },
      orderBy: {
        startDateTime: 'asc',
      },
      take: 5,
    })

    if (nextEvents.length > 0) {
      console.log('\n📅 Next 5 Events:')
      nextEvents.forEach((event) => {
        const dateStr = format(event.startDateTime, 'MMM dd, yyyy HH:mm')
        console.log(`  ${event.title} - ${dateStr} (${event.currentCount}/${event.maxCapacity})`)
      })
    }

    console.log('\n✅ Database health check completed')

  } catch (error) {
    console.error('❌ Database health check failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function showSchema() {
  console.log('\n📋 Database Schema:')
  console.log('='.repeat(30))
  
  const tables = [
    'locations', 'products', 'students', 'events', 
    'bookings', 'orders', 'order_items', 'recurring_templates'
  ]
  
  console.log('Tables:', tables.join(', '))
  
  console.log('\nKey Relations:')
  console.log('  Student -> Booking -> Event -> Location')
  console.log('  Order -> OrderItem -> Product')
  console.log('  RecurringTemplate -> Event (recurring sessions)')
}

async function main() {
  const command = process.argv[2]
  
  console.log('🔍 TinkerTank Market Database Status')
  
  switch (command) {
    case 'health':
    case undefined:
      await checkDatabaseHealth()
      break
    case 'schema':
      await showSchema()
      break
    default:
      console.log('\nUsage:')
      console.log('  tsx scripts/db-status.ts [health|schema]')
      console.log('    health  - Check database connection and data counts (default)')
      console.log('    schema  - Show database schema information')
  }
}

main().catch(console.error)
