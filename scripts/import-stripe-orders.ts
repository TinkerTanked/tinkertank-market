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

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

async function importStripeOrders(): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] }

  console.log('🔍 Fetching paid checkout sessions from Stripe...')

  let hasMore = true
  let startingAfter: string | undefined

  while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete',
      ...(startingAfter && { starting_after: startingAfter })
    })

    console.log(`Processing ${sessions.data.length} sessions...`)

    for (const session of sessions.data) {
      if (session.payment_status !== 'paid') {
        result.skipped++
        continue
      }

      try {
        // Check if order already exists
        const existingOrder = await prisma.orders.findFirst({
          where: {
            OR: [
              { stripe_checkout_session_id: session.id },
              { stripe_payment_intent_id: session.payment_intent as string }
            ]
          }
        })

        if (existingOrder) {
          console.log(`⏭️  Order already exists for session ${session.id}`)
          result.skipped++
          continue
        }

        // Get line items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          limit: 100
        })

        // Get customer email
        const customerEmail = session.customer_details?.email || 'unknown@email.com'
        const customerName = session.customer_details?.name || 'Unknown Customer'

        // Create order
        const order = await prisma.orders.create({
          data: {
            customer_email: customerEmail,
            customer_name: customerName,
            customer_phone: session.customer_details?.phone || null,
            total_amount: (session.amount_total || 0) / 100,
            status: 'PAID',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            created_at: new Date(session.created * 1000),
            updated_at: new Date()
          }
        })

        console.log(`✅ Imported order ${order.id} for ${customerEmail} - $${(session.amount_total || 0) / 100}`)

        // Create order items from line items
        for (const item of lineItems.data) {
          // Try to find matching product
          const productName = item.description || 'Camp Booking'
          let product = await prisma.products.findFirst({
            where: {
              name: { contains: productName.split(' - ')[0], mode: 'insensitive' }
            }
          })

          // If no product found, use first camp product as default
          if (!product) {
            product = await prisma.products.findFirst({
              where: { type: 'CAMP' }
            })
          }

          if (product) {
            // Try to find or create student
            let student = await prisma.students.findFirst({
              where: { parent_email: customerEmail }
            })

            if (!student) {
              student = await prisma.students.create({
                data: {
                  name: session.metadata?.studentName || 'Student',
                  parent_email: customerEmail,
                  parent_name: customerName,
                  parent_phone: session.customer_details?.phone || null,
                  age: parseInt(session.metadata?.studentAge || '8'),
                  created_at: new Date(),
                  updated_at: new Date()
                }
              })
            }

            // Parse booking date from metadata or use session date
            let bookingDate = new Date(session.created * 1000)
            if (session.metadata?.dates) {
              try {
                const dates = JSON.parse(session.metadata.dates)
                if (Array.isArray(dates) && dates.length > 0) {
                  bookingDate = new Date(dates[0])
                }
              } catch (e) {
                // Use session date as fallback
              }
            }

            await prisma.order_items.create({
              data: {
                order_id: order.id,
                product_id: product.id,
                student_id: student.id,
                quantity: item.quantity || 1,
                price: (item.amount_total || 0) / 100,
                booking_date: bookingDate,
                created_at: new Date()
              }
            })
          }
        }

        result.imported++
      } catch (error) {
        const errorMsg = `Failed to import session ${session.id}: ${error}`
        console.error(`❌ ${errorMsg}`)
        result.errors.push(errorMsg)
      }
    }

    hasMore = sessions.has_more
    if (sessions.data.length > 0) {
      startingAfter = sessions.data[sessions.data.length - 1].id
    }
  }

  return result
}

async function main() {
  console.log('🚀 Starting Stripe order import...\n')

  try {
    const result = await importStripeOrders()

    console.log('\n📊 Import Summary:')
    console.log(`   ✅ Imported: ${result.imported}`)
    console.log(`   ⏭️  Skipped: ${result.skipped}`)
    console.log(`   ❌ Errors: ${result.errors.length}`)

    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors:')
      result.errors.forEach(e => console.log(`   - ${e}`))
    }
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
