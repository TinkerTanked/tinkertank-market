import 'dotenv/config'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia'
})

async function reconcilePendingOrders() {
  console.log('🔄 Reconciling PENDING orders with Stripe...\n')

  const pendingOrders = await prisma.order.findMany({
    where: { status: 'PENDING' },
    include: {
      orderItems: {
        include: {
          product: true,
          student: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`Found ${pendingOrders.length} PENDING orders\n`)

  let updated = 0
  let notPaid = 0
  let errors = 0

  for (const order of pendingOrders) {
    console.log(`\n📋 Order ${order.id}`)
    console.log(`   Customer: ${order.customerName} (${order.customerEmail})`)
    console.log(`   Amount: $${order.totalAmount}`)
    console.log(`   Created: ${order.createdAt.toISOString()}`)

    const sessionId = order.stripePaymentIntentId

    if (!sessionId || sessionId === 'pending') {
      console.log(`   ⚠️  No Stripe session ID - skipping`)
      errors++
      continue
    }

    try {
      // Check if it's a checkout session ID (starts with cs_)
      if (sessionId.startsWith('cs_')) {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        
        console.log(`   Stripe status: ${session.payment_status}`)

        if (session.payment_status === 'paid') {
          // Update order to PAID
          await prisma.order.update({
            where: { id: order.id },
            data: { 
              status: 'PAID',
              stripePaymentIntentId: session.payment_intent as string || sessionId
            }
          })

          // Get default location for bookings
          const defaultLocation = await prisma.location.findFirst({
            where: { isActive: true },
            orderBy: { name: 'asc' }
          })

          if (defaultLocation) {
            // Create bookings for each order item if they don't exist
            for (const item of order.orderItems) {
              const existingBooking = await prisma.booking.findFirst({
                where: {
                  studentId: item.studentId,
                  productId: item.productId,
                  startDate: item.bookingDate
                }
              })

              if (!existingBooking) {
                const duration = item.product.duration || 360 // default 6 hours
                await prisma.booking.create({
                  data: {
                    studentId: item.studentId,
                    productId: item.productId,
                    locationId: defaultLocation.id,
                    startDate: item.bookingDate,
                    endDate: new Date(item.bookingDate.getTime() + duration * 60 * 1000),
                    status: 'CONFIRMED',
                    totalPrice: item.price,
                    notes: `Reconciled from order ${order.id}`,
                  }
                })
                console.log(`   ✅ Created booking for ${item.student.name} - ${item.product.name}`)
              } else {
                console.log(`   ⏭️  Booking already exists for ${item.student.name}`)
              }
            }
          }

          console.log(`   ✅ Order updated to PAID`)
          updated++
        } else if (session.payment_status === 'unpaid') {
          console.log(`   ⏳ Payment not completed - keeping as PENDING`)
          notPaid++
        } else {
          console.log(`   ⚠️  Unknown payment status: ${session.payment_status}`)
          notPaid++
        }
      } else if (sessionId.startsWith('pi_')) {
        // It's a payment intent ID
        const paymentIntent = await stripe.paymentIntents.retrieve(sessionId)
        console.log(`   Stripe status: ${paymentIntent.status}`)

        if (paymentIntent.status === 'succeeded') {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'PAID' }
          })
          console.log(`   ✅ Order updated to PAID`)
          updated++
        } else {
          console.log(`   ⏳ Payment not succeeded - keeping as PENDING`)
          notPaid++
        }
      } else {
        console.log(`   ⚠️  Unknown session ID format: ${sessionId}`)
        errors++
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
      errors++
    }
  }

  console.log(`\n📊 Reconciliation Summary:`)
  console.log(`   Updated to PAID: ${updated}`)
  console.log(`   Not paid yet: ${notPaid}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total processed: ${pendingOrders.length}`)
}

reconcilePendingOrders()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
