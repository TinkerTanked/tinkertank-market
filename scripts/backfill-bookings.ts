import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Backfilling bookings from paid orders...')

  // Find all PAID orders
  const paidOrders = await prisma.order.findMany({
    where: {
      status: 'PAID'
    },
    include: {
      orderItems: {
        include: {
          product: true,
          student: true,
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  console.log(`Found ${paidOrders.length} paid orders`)

  // Get first active location (for orders that don't have location data)
  const defaultLocation = await prisma.location.findFirst({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })

  if (!defaultLocation) {
    console.error('No active location found!')
    return
  }

  let bookingsCreated = 0
  let eventsCreated = 0

  for (const order of paidOrders) {
    console.log(`\nProcessing order ${order.id}...`)
    
    // Check if bookings already exist for this order
    const existingBookings = await prisma.booking.findMany({
      where: {
        studentId: {
          in: order.orderItems.map(item => item.studentId)
        }
      }
    })

    if (existingBookings.length > 0) {
      console.log(`  ⏭️  Skipping - ${existingBookings.length} bookings already exist`)
      continue
    }

    // Create bookings for each order item
    for (const orderItem of order.orderItems) {
      if (orderItem.product.type === 'CAMP' || orderItem.product.type === 'BIRTHDAY') {
        const startDate = orderItem.bookingDate
        const endDate = new Date(startDate.getTime() + (orderItem.product.duration || 360) * 60 * 1000)

        const booking = await prisma.booking.create({
          data: {
            studentId: orderItem.studentId,
            productId: orderItem.productId,
            locationId: defaultLocation.id,
            startDate,
            endDate,
            status: 'CONFIRMED',
            totalPrice: orderItem.price,
            notes: `Backfilled from order ${order.id}`,
          }
        })

        bookingsCreated++
        console.log(`  ✅ Created booking for ${orderItem.student.name} - ${orderItem.product.name}`)
      }
    }

    console.log(`  📅 Bookings created (calendar events can be created via webhook on next purchase)`)
  }

  console.log(`\n✅ Backfill complete!`)
  console.log(`   Orders processed: ${paidOrders.length}`)
  console.log(`   Bookings created: ${bookingsCreated}`)
  console.log(`   Events created: ${eventsCreated}`)
}

main()
  .catch((e) => {
    console.error('Backfill error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
