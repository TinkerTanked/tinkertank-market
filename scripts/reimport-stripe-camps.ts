// Reimport Stripe camp orders
// Usage: npx tsx scripts/reimport-stripe-camps.ts

// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv/config')
  } catch {
    // dotenv not available in production
  }
}

import Stripe from 'stripe'
import { PrismaClient, Prisma } from '@prisma/client'
import { setHours, setMinutes } from 'date-fns'

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia'
})

const prisma = new PrismaClient()

// Camp time configurations
const CAMP_TIMES = {
  DAY_CAMP: { startHour: 9, startMinute: 0, endHour: 15, endMinute: 0 },
  ALL_DAY_CAMP: { startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 }
}

interface ImportStats {
  sessionsProcessed: number
  ordersCreated: number
  ordersUpdated: number
  bookingsCreated: number
  eventsCreated: number
  studentsDeduped: number
  errors: string[]
}

// Normalize name for deduplication
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

// Extract birth year from birthdate
function getBirthYear(birthdate: Date): number {
  return birthdate.getFullYear()
}

// Check if product is all-day camp
function isAllDayCamp(productName: string, duration?: number | null): boolean {
  const lowerName = productName.toLowerCase()
  if (lowerName.includes('all day') || lowerName.includes('all-day')) {
    return true
  }
  if (duration && duration > 360) {
    return true
  }
  return false
}

// Create start/end times for a booking date
function createCampTimes(date: Date, isAllDay: boolean): { startDate: Date; endDate: Date } {
  const times = isAllDay ? CAMP_TIMES.ALL_DAY_CAMP : CAMP_TIMES.DAY_CAMP
  const startDate = setMinutes(setHours(new Date(date), times.startHour), times.startMinute)
  const endDate = setMinutes(setHours(new Date(date), times.endHour), times.endMinute)
  return { startDate, endDate }
}

// Parse selected dates from metadata
function parseSelectedDates(metadata: Stripe.Metadata | null): Date[] {
  if (!metadata) return []

  const dates: Date[] = []

  // Try various metadata keys
  const dateFields = ['selectedDates', 'dates', 'bookingDates', 'campDates']

  for (const field of dateFields) {
    if (metadata[field]) {
      try {
        const parsed = JSON.parse(metadata[field])
        if (Array.isArray(parsed)) {
          for (const d of parsed) {
            const date = new Date(d)
            if (!isNaN(date.getTime())) {
              dates.push(date)
            }
          }
        }
      } catch {
        // Try comma-separated
        const parts = metadata[field].split(',')
        for (const part of parts) {
          const date = new Date(part.trim())
          if (!isNaN(date.getTime())) {
            dates.push(date)
          }
        }
      }
    }
  }

  // Also check for single date
  if (dates.length === 0 && metadata.bookingDate) {
    const date = new Date(metadata.bookingDate)
    if (!isNaN(date.getTime())) {
      dates.push(date)
    }
  }

  return dates
}

async function clearCampData(stats: ImportStats) {
  console.log('🧹 Clearing existing camp data...\n')

  // Get all camp products
  const campProducts = await prisma.product.findMany({
    where: { type: 'CAMP' },
    select: { id: true }
  })
  const campProductIds = campProducts.map(p => p.id)

  if (campProductIds.length === 0) {
    console.log('   No camp products found - skipping cleanup')
    return
  }

  console.log(`   Found ${campProductIds.length} camp products`)

  // Delete bookings for camp products
  const deletedBookings = await prisma.booking.deleteMany({
    where: { productId: { in: campProductIds } }
  })
  console.log(`   Deleted ${deletedBookings.count} camp bookings`)

  // Delete events where type is CAMP
  const deletedEvents = await prisma.event.deleteMany({
    where: { type: 'CAMP' }
  })
  console.log(`   Deleted ${deletedEvents.count} camp events`)

  // Delete order items for camp products
  const deletedOrderItems = await prisma.orderItem.deleteMany({
    where: { productId: { in: campProductIds } }
  })
  console.log(`   Deleted ${deletedOrderItems.count} camp order items`)

  // Delete orders that now have no items
  const ordersWithItems = await prisma.order.findMany({
    select: {
      id: true,
      _count: { select: { orderItems: true } }
    }
  })
  const emptyOrderIds = ordersWithItems
    .filter(o => o._count.orderItems === 0)
    .map(o => o.id)

  if (emptyOrderIds.length > 0) {
    const deletedOrders = await prisma.order.deleteMany({
      where: { id: { in: emptyOrderIds } }
    })
    console.log(`   Deleted ${deletedOrders.count} empty orders`)
  }

  console.log('')
}

async function getOrCreateLocation(): Promise<string> {
  let location = await prisma.location.findFirst({
    where: {
      OR: [{ name: { contains: 'Neutral Bay', mode: 'insensitive' } }, { name: { contains: 'TinkerTank', mode: 'insensitive' } }]
    }
  })

  if (!location) {
    location = await prisma.location.create({
      data: {
        name: 'TinkerTank Neutral Bay',
        address: '123 Neutral Bay Road, Neutral Bay NSW 2089',
        capacity: 20,
        timezone: 'Australia/Sydney'
      }
    })
    console.log('📍 Created default location: TinkerTank Neutral Bay\n')
  }

  return location.id
}

async function findOrCreateStudent(
  name: string,
  birthdate: Date,
  allergies?: string | null,
  stats?: ImportStats
): Promise<string> {
  const normalizedName = normalizeName(name)
  const birthYear = getBirthYear(birthdate)

  // Find existing student by normalized name and birth year
  const existingStudents = await prisma.student.findMany({
    where: {
      birthdate: {
        gte: new Date(birthYear, 0, 1),
        lt: new Date(birthYear + 1, 0, 1)
      }
    }
  })

  const matchingStudent = existingStudents.find(s => normalizeName(s.name) === normalizedName)

  if (matchingStudent) {
    if (stats) stats.studentsDeduped++
    return matchingStudent.id
  }

  // Create new student
  const student = await prisma.student.create({
    data: {
      name,
      birthdate,
      allergies
    }
  })

  return student.id
}

async function findCampProduct(productName: string): Promise<{ id: string; name: string; duration: number | null } | null> {
  // Try exact match first
  let product = await prisma.product.findFirst({
    where: {
      type: 'CAMP',
      name: { contains: productName, mode: 'insensitive' }
    },
    select: { id: true, name: true, duration: true }
  })

  if (product) return product

  // Try matching by type keywords
  const lowerName = productName.toLowerCase()
  if (lowerName.includes('all day') || lowerName.includes('all-day')) {
    product = await prisma.product.findFirst({
      where: {
        type: 'CAMP',
        name: { contains: 'All Day', mode: 'insensitive' }
      },
      select: { id: true, name: true, duration: true }
    })
  } else if (lowerName.includes('day camp') || lowerName.includes('day-camp')) {
    product = await prisma.product.findFirst({
      where: {
        type: 'CAMP',
        name: { contains: 'Day Camp', mode: 'insensitive' },
        NOT: { name: { contains: 'All Day', mode: 'insensitive' } }
      },
      select: { id: true, name: true, duration: true }
    })
  }

  if (product) return product

  // Fallback to any camp product
  return await prisma.product.findFirst({
    where: { type: 'CAMP' },
    select: { id: true, name: true, duration: true }
  })
}

async function processCheckoutSession(
  session: Stripe.Checkout.Session,
  locationId: string,
  stats: ImportStats
): Promise<void> {
  const metadata = session.metadata || {}
  const customerEmail = session.customer_details?.email || metadata.customerEmail || 'unknown@email.com'
  const customerName = session.customer_details?.name || metadata.customerName || 'Unknown Customer'

  // Try to find existing order
  let order = await prisma.order.findFirst({
    where: {
      OR: [
        { stripePaymentIntentId: session.payment_intent as string },
        { stripePaymentIntentId: session.id },
        ...(metadata.orderId ? [{ id: metadata.orderId }] : [])
      ]
    },
    include: { orderItems: true }
  })

  // Get line items from Stripe
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ['data.price.product']
  })

  // Filter to camp products only
  const campLineItems = lineItems.data.filter(item => {
    const productName = (item.description || '').toLowerCase()
    return (
      productName.includes('camp') ||
      productName.includes('day camp') ||
      productName.includes('all day') ||
      productName.includes('holiday')
    )
  })

  if (campLineItems.length === 0) {
    return // Not a camp order
  }

  // Parse dates from metadata
  let selectedDates = parseSelectedDates(metadata)
  if (selectedDates.length === 0) {
    // Use session creation date as fallback
    selectedDates = [new Date(session.created * 1000)]
  }

  // Create order if not exists
  if (!order) {
    order = await prisma.order.create({
      data: {
        customerEmail,
        customerName,
        stripePaymentIntentId: (session.payment_intent as string) || session.id,
        status: 'PAID',
        totalAmount: new Prisma.Decimal((session.amount_total || 0) / 100)
      },
      include: { orderItems: true }
    })
    stats.ordersCreated++
    console.log(`   ✅ Created order ${order.id}`)
  } else {
    // Update to PAID if needed
    if (order.status !== 'PAID') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID' }
      })
      stats.ordersUpdated++
      console.log(`   📝 Updated order ${order.id} to PAID`)
    }
  }

  // Process each line item
  for (const lineItem of campLineItems) {
    const productName = lineItem.description || 'Day Camp'
    const quantity = lineItem.quantity || 1

    // Find matching product
    const product = await findCampProduct(productName)
    if (!product) {
      stats.errors.push(`No camp product found for: ${productName}`)
      continue
    }

    const isAllDay = isAllDayCamp(product.name, product.duration)
    const pricePerDay = new Prisma.Decimal((lineItem.amount_total || 0) / 100 / Math.max(selectedDates.length, 1))

    // Parse student info from metadata
    const studentName = metadata.studentName || metadata.childName || `Student - ${customerName}`
    const studentBirthYear = parseInt(metadata.studentBirthYear || metadata.childAge || '2015')
    const studentBirthdate = new Date(studentBirthYear, 0, 1)
    const studentAllergies = metadata.allergies || metadata.medicalNotes || null

    // Find or create student (with deduplication)
    const studentId = await findOrCreateStudent(studentName, studentBirthdate, studentAllergies, stats)

    // Create bookings and events for each date
    for (const bookingDate of selectedDates) {
      const { startDate, endDate } = createCampTimes(bookingDate, isAllDay)

      // Check if booking already exists
      const existingBooking = await prisma.booking.findFirst({
        where: {
          studentId,
          productId: product.id,
          startDate
        }
      })

      if (existingBooking) {
        console.log(`      ⏭️  Booking already exists for ${studentName} on ${bookingDate.toDateString()}`)
        continue
      }

      // Create order item if not exists
      const existingOrderItem = await prisma.orderItem.findFirst({
        where: {
          orderId: order.id,
          productId: product.id,
          studentId,
          bookingDate: startDate
        }
      })

      if (!existingOrderItem) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            studentId,
            bookingDate: startDate,
            price: pricePerDay
          }
        })
      }

      // Create event
      const event = await prisma.event.create({
        data: {
          title: `${product.name} - ${studentName}`,
          type: 'CAMP',
          startDateTime: startDate,
          endDateTime: endDate,
          locationId,
          maxCapacity: 15,
          currentCount: 1,
          status: 'SCHEDULED'
        }
      })
      stats.eventsCreated++

      // Create booking linked to event
      await prisma.booking.create({
        data: {
          studentId,
          productId: product.id,
          locationId,
          eventId: event.id,
          startDate,
          endDate,
          status: 'CONFIRMED',
          totalPrice: pricePerDay,
          notes: `Imported from Stripe session ${session.id}`
        }
      })
      stats.bookingsCreated++

      console.log(`      ✅ Created booking for ${studentName} on ${bookingDate.toDateString()} (${isAllDay ? 'All Day' : 'Day'} Camp)`)
    }
  }
}

async function importStripeCamps(): Promise<ImportStats> {
  const stats: ImportStats = {
    sessionsProcessed: 0,
    ordersCreated: 0,
    ordersUpdated: 0,
    bookingsCreated: 0,
    eventsCreated: 0,
    studentsDeduped: 0,
    errors: []
  }

  // Clear existing camp data
  await clearCampData(stats)

  // Get default location
  const locationId = await getOrCreateLocation()

  console.log('🔍 Fetching completed checkout sessions from Stripe...\n')

  let hasMore = true
  let startingAfter: string | undefined

  while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete',
      ...(startingAfter && { starting_after: startingAfter })
    })

    console.log(`Processing batch of ${sessions.data.length} sessions...`)

    for (const session of sessions.data) {
      // Only process paid sessions in payment mode (not subscriptions)
      if (session.payment_status !== 'paid') {
        continue
      }

      if (session.mode === 'subscription') {
        continue // Skip subscription sessions (Ignite)
      }

      stats.sessionsProcessed++

      try {
        console.log(`\n📋 Session ${session.id}`)
        console.log(`   Customer: ${session.customer_details?.email || 'unknown'}`)
        console.log(`   Amount: $${(session.amount_total || 0) / 100}`)

        await processCheckoutSession(session, locationId, stats)
      } catch (error) {
        const errorMsg = `Session ${session.id}: ${error instanceof Error ? error.message : String(error)}`
        stats.errors.push(errorMsg)
        console.log(`   ❌ Error: ${errorMsg}`)
      }
    }

    hasMore = sessions.has_more
    if (sessions.data.length > 0) {
      startingAfter = sessions.data[sessions.data.length - 1].id
    }
  }

  return stats
}

async function main() {
  console.log('🚀 Reimporting Stripe camp orders...\n')
  console.log('=' .repeat(60) + '\n')

  try {
    const stats = await importStripeCamps()

    console.log('\n' + '=' .repeat(60))
    console.log('\n📊 Import Summary:\n')
    console.log(`   Sessions processed: ${stats.sessionsProcessed}`)
    console.log(`   Orders created: ${stats.ordersCreated}`)
    console.log(`   Orders updated: ${stats.ordersUpdated}`)
    console.log(`   Bookings created: ${stats.bookingsCreated}`)
    console.log(`   Events created: ${stats.eventsCreated}`)
    console.log(`   Students deduped: ${stats.studentsDeduped}`)
    console.log(`   Errors: ${stats.errors.length}`)

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:')
      stats.errors.forEach((e, i) => console.log(`   ${i + 1}. ${e}`))
    }

    console.log('\n✅ Import complete!')
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
