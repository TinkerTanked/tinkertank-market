import { PrismaClient } from '@prisma/client'
import { eventService } from '../src/lib/events'
import { sendBookingConfirmationEmail } from '../src/lib/email'

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

    // Create calendar events
    try {
      const events = await eventService.createEventsFromOrder(order.id)
      eventsCreated += events.length
      console.log(`  📅 Created ${events.length} calendar events`)
    } catch (error) {
      console.log(`  ⚠️  Could not create events: ${error}`)
    }

    // Send confirmation email
    try {
      await sendBookingConfirmationEmail({
        ...order,
        totalAmount: Number(order.totalAmount),
        orderItems: order.orderItems.map(item => ({
          id: item.id,
          product: {
            name: item.product.name,
            type: item.product.type
          },
          student: {
            name: item.student.name,
            allergies: null
          },
          bookingDate: item.bookingDate,
          price: Number(item.price)
        }))
      })
      console.log(`  📧 Sent confirmation email to ${order.customerEmail}`)
    } catch (error) {
      console.log(`  ⚠️  Could not send email: ${error}`)
    }
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
