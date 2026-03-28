/**
 * Fix missing orders (no order in DB for paid Stripe session)
 * and incomplete 3-day bundles (only 1 order item instead of 3).
 *
 * Run audit:  npx tsx scripts/fix-missing-and-bundles.ts
 * Run fix:    npx tsx scripts/fix-missing-and-bundles.ts --fix
 */

import { PrismaClient, Prisma } from '@prisma/client'

const DRY_RUN = !process.argv.includes('--fix')
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!

const prisma = new PrismaClient()

// ─── STRIPE fetch helpers ────────────────────────────────────────────────

async function stripeGet(path: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`https://api.stripe.com/v1${path}`)
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` }
  })
  if (!resp.ok) throw new Error(`Stripe ${resp.status}: ${await resp.text()}`)
  return resp.json()
}

function addDays(date: Date, days: number): Date {
  const r = new Date(date); r.setDate(r.getDate() + days); return r
}

function isWeekday(d: Date): boolean {
  const day = d.getDay(); return day !== 0 && day !== 6
}

function dateStr(d: Date): string { return d.toISOString().split('T')[0] }

// ─── PART 1: CREATE MISSING ORDERS ──────────────────────────────────────

async function fixMissingOrders() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  PART 1: Investigate & fix 3 missing orders')
  console.log('═══════════════════════════════════════════════════════\n')

  // Fetch all paid sessions from March onwards and find ones with no order
  const marchStart = Math.floor(new Date('2026-03-01T00:00:00Z').getTime() / 1000)
  let allSessions: any[] = []
  let hasMore = true
  let startingAfter: string | undefined

  while (hasMore) {
    const params: Record<string, string> = {
      limit: '100', status: 'complete', 'created[gte]': String(marchStart)
    }
    if (startingAfter) params.starting_after = startingAfter
    const data = await stripeGet('/checkout/sessions', params)
    for (const s of data.data) {
      if (s.payment_status === 'paid') allSessions.push(s)
    }
    hasMore = data.has_more
    if (data.data.length > 0) startingAfter = data.data[data.data.length - 1].id
  }

  // Find sessions with no matching order
  const missingSessions: any[] = []
  for (const session of allSessions) {
    const orderId = session.metadata?.orderId
    let order = orderId
      ? await prisma.order.findUnique({ where: { id: orderId } })
      : null
    if (!order && session.payment_intent) {
      order = await prisma.order.findFirst({
        where: { stripePaymentIntentId: session.payment_intent }
      })
    }
    if (!order) {
      order = await prisma.order.findFirst({
        where: { stripePaymentIntentId: session.id }
      })
    }
    if (!order) {
      missingSessions.push(session)
    }
  }

  console.log(`Found ${missingSessions.length} paid Stripe sessions with no order in DB:\n`)

  const location = await prisma.location.findFirst({ where: { isActive: true }, orderBy: { name: 'asc' } })
  if (!location) { console.error('No active location!'); return }

  for (const session of missingSessions) {
    const lineItems = await stripeGet(`/checkout/sessions/${session.id}/line_items`, { limit: '100' })
    const email = session.customer_details?.email || 'unknown'
    const name = session.customer_details?.name || 'unknown'
    const amount = (session.amount_total || 0) / 100
    const created = new Date(session.created * 1000)

    console.log(`📋 Session: ${session.id}`)
    console.log(`   Customer: ${name} (${email})`)
    console.log(`   Amount: $${amount}`)
    console.log(`   Created: ${created.toISOString()}`)
    console.log(`   Metadata: ${JSON.stringify(session.metadata || {})}`)
    console.log(`   Line items:`)
    for (const li of lineItems.data) {
      console.log(`     - ${li.description} x${li.quantity} = $${(li.amount_total || 0) / 100}`)
    }

    if (DRY_RUN) {
      console.log(`   🔎 DRY RUN - would create order + booking\n`)
      continue
    }

    // Determine product type from line item description
    const desc = (lineItems.data[0]?.description || '').toLowerCase()
    let productId: string | null = null
    let bookingDate: Date | null = null

    if (desc.includes('birthday') || desc.includes('birthdays rock')) {
      // Birthday product
      const product = await prisma.product.findFirst({
        where: { type: 'BIRTHDAY', isActive: true },
        orderBy: { price: 'desc' }
      })
      productId = product?.id || null

      // Try to get date from metadata
      if (session.metadata?.bookingDate) {
        bookingDate = new Date(session.metadata.bookingDate)
      } else if (session.metadata?.selectedDate) {
        bookingDate = new Date(session.metadata.selectedDate)
      } else {
        // Use session creation date as fallback
        bookingDate = created
      }
    } else if (desc.includes('day camp') || desc.includes('camp')) {
      // Day Camp
      const isAllDay = desc.includes('all day')
      const product = await prisma.product.findFirst({
        where: {
          type: 'CAMP',
          name: isAllDay
            ? { contains: 'All Day', mode: 'insensitive' }
            : { equals: 'Day Camp' }
        }
      })
      productId = product?.id || null

      if (session.metadata?.selectedDate) {
        bookingDate = new Date(session.metadata.selectedDate)
      } else if (session.metadata?.bookingDate) {
        bookingDate = new Date(session.metadata.bookingDate)
      } else {
        bookingDate = created
      }
    } else if (desc.includes('extra student')) {
      // Extra student add-on — linked to a birthday, no separate booking
      if (!DRY_RUN) {
        const order = await prisma.order.create({
          data: {
            customerEmail: email, customerName: name,
            stripePaymentIntentId: (session.payment_intent as string) || session.id,
            status: 'PAID', totalAmount: new Prisma.Decimal(amount)
          }
        })
        console.log(`   ✅ Created order ${order.id} (no booking needed for add-on)\n`)
      } else {
        console.log(`   🔎 DRY RUN - would create order only (no booking for add-on)\n`)
      }
      continue
    } else if (desc.includes('ignite') || desc.includes('after schooler')) {
      // Ignite/After Schoolers subscription — handled via subscription webhooks
      if (!DRY_RUN) {
        const order = await prisma.order.create({
          data: {
            customerEmail: email, customerName: name,
            stripePaymentIntentId: (session.payment_intent as string) || session.id,
            status: 'PAID', totalAmount: new Prisma.Decimal(amount)
          }
        })
        console.log(`   ✅ Created order ${order.id} (subscription - no camp booking needed)\n`)
      } else {
        console.log(`   🔎 DRY RUN - would create order only (subscription)\n`)
      }
      continue
    }

    if (!productId) {
      console.log(`   ❌ Could not match product for: ${desc}`)
      continue
    }

    // Parse student info from metadata
    const studentName = session.metadata?.studentName
      || session.metadata?.childName
      || `Student - ${name}`
    const studentAge = parseInt(session.metadata?.studentAge || session.metadata?.age || '8')
    const allergies = session.metadata?.allergies || null

    // Create student
    const student = await prisma.student.create({
      data: {
        name: studentName,
        birthdate: new Date(new Date().getFullYear() - studentAge, 0, 1),
        allergies
      }
    })

    // Create order
    const order = await prisma.order.create({
      data: {
        customerEmail: email,
        customerName: name,
        stripePaymentIntentId: (session.payment_intent as string) || session.id,
        status: 'PAID',
        totalAmount: new Prisma.Decimal(amount),
        orderItems: {
          create: [{
            productId,
            studentId: student.id,
            bookingDate: bookingDate!,
            price: new Prisma.Decimal(amount)
          }]
        }
      }
    })

    // Create booking
    const product = await prisma.product.findUnique({ where: { id: productId } })
    const isAllDay = product?.name.toLowerCase().includes('all day') || false
    const isBirthday = product?.type === 'BIRTHDAY'
    const startHour = isBirthday ? 10 : 9
    const endHour = isBirthday ? 13 : (isAllDay ? 17 : 15)

    const startDate = new Date(bookingDate!)
    startDate.setUTCHours(startHour, 0, 0, 0)
    const endDate = new Date(bookingDate!)
    endDate.setUTCHours(endHour, 0, 0, 0)

    await prisma.booking.create({
      data: {
        studentId: student.id,
        productId,
        locationId: location.id,
        startDate,
        endDate,
        status: 'CONFIRMED',
        totalPrice: new Prisma.Decimal(amount),
        notes: `Reconciled missing order - Stripe session ${session.id}`
      }
    })

    console.log(`   ✅ Created order ${order.id} + student ${student.name} + booking\n`)
  }
}

// ─── PART 2: FIX INCOMPLETE 3-DAY BUNDLES ────────────────────────────────

async function fixIncompleteBundles() {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  PART 2: Fix incomplete 3-day bundle purchases')
  console.log('═══════════════════════════════════════════════════════\n')

  // Find orders with "3-Day Bundle" products that have fewer than 3 order items per student
  const bundleOrders = await prisma.order.findMany({
    where: {
      status: 'PAID',
      orderItems: {
        some: {
          product: {
            name: { contains: '3-Day Bundle', mode: 'insensitive' }
          }
        }
      }
    },
    include: {
      orderItems: {
        include: { product: true, student: true },
        orderBy: { bookingDate: 'asc' }
      }
    }
  })

  console.log(`Found ${bundleOrders.length} orders with 3-Day Bundle products\n`)

  const location = await prisma.location.findFirst({ where: { isActive: true }, orderBy: { name: 'asc' } })
  if (!location) { console.error('No active location!'); return }

  for (const order of bundleOrders) {
    // Group by student+product
    const groups = new Map<string, typeof order.orderItems>()
    for (const item of order.orderItems) {
      if (!item.product.name.toLowerCase().includes('3-day bundle')) continue
      const key = `${item.studentId}::${item.productId}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }

    for (const [, items] of groups) {
      const studentName = items[0].student.name
      const productName = items[0].product.name
      const actualDays = items.length

      if (actualDays >= 3) {
        console.log(`   ✅ ${studentName} - ${productName}: already has ${actualDays} days`)
        continue
      }

      const existingDates = items.map(i => i.bookingDate).sort((a, b) => a.getTime() - b.getTime())
      const firstDate = existingDates[0]
      const existingDateStrs = existingDates.map(d => dateStr(d))

      // Calculate 3 consecutive calendar days from first date
      // (school holiday camps run consecutive days including the start date)
      const targetDates: Date[] = []
      for (let i = 0; i < 3; i++) {
        targetDates.push(addDays(firstDate, i))
      }

      const missingDates = targetDates.filter(d => !existingDateStrs.includes(dateStr(d)))

      console.log(`   📌 ${studentName} - ${productName} (Order ${order.id})`)
      console.log(`      Has ${actualDays}/3 days: [${existingDateStrs.join(', ')}]`)
      console.log(`      Target 3 days: [${targetDates.map(d => dateStr(d)).join(', ')}]`)
      console.log(`      Missing: [${missingDates.map(d => dateStr(d)).join(', ')}]`)

      if (DRY_RUN) {
        console.log(`      🔎 DRY RUN - would create ${missingDates.length} order items + bookings\n`)
        continue
      }

      const isAllDay = productName.toLowerCase().includes('all day')
      const startHour = 9
      const endHour = isAllDay ? 17 : 15
      const pricePerDay = Number(items[0].product.price) / 3

      for (const missDate of missingDates) {
        const missDateStr = dateStr(missDate)

        // Check for existing order item
        const existingItem = await prisma.orderItem.findFirst({
          where: {
            orderId: order.id,
            studentId: items[0].studentId,
            productId: items[0].productId,
            bookingDate: {
              gte: new Date(missDateStr + 'T00:00:00.000Z'),
              lt: new Date(missDateStr + 'T23:59:59.999Z')
            }
          }
        })

        if (!existingItem) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: items[0].productId,
              studentId: items[0].studentId,
              bookingDate: new Date(missDateStr + 'T00:00:00.000Z'),
              price: new Prisma.Decimal(pricePerDay)
            }
          })
          console.log(`      ✅ Created order item for ${missDateStr}`)
        } else {
          console.log(`      ⏭️  Order item already exists for ${missDateStr}`)
        }

        // Check for existing booking
        const existingBooking = await prisma.booking.findFirst({
          where: {
            studentId: items[0].studentId,
            productId: items[0].productId,
            startDate: {
              gte: new Date(missDateStr + 'T00:00:00.000Z'),
              lt: new Date(missDateStr + 'T23:59:59.999Z')
            }
          }
        })

        if (!existingBooking) {
          const startDate = new Date(missDateStr + 'T00:00:00.000Z')
          startDate.setUTCHours(startHour, 0, 0, 0)
          const endDate = new Date(missDateStr + 'T00:00:00.000Z')
          endDate.setUTCHours(endHour, 0, 0, 0)

          await prisma.booking.create({
            data: {
              studentId: items[0].studentId,
              productId: items[0].productId,
              locationId: location.id,
              startDate,
              endDate,
              status: 'CONFIRMED',
              totalPrice: new Prisma.Decimal(pricePerDay),
              notes: `Bundle auto-fill - Order: ${order.id}`
            }
          })
          console.log(`      ✅ Created booking for ${missDateStr}`)
        } else {
          console.log(`      ⏭️  Booking already exists for ${missDateStr}`)
        }
      }
      console.log('')
    }
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Fix Missing Orders & Incomplete Bundles')
  console.log(`   Mode: ${DRY_RUN ? '🔎 DRY RUN' : '🔧 FIX MODE'}\n`)

  const beforeBookings = await prisma.booking.count()
  const beforeOrders = await prisma.order.count()
  const beforeItems = await prisma.orderItem.count()

  await fixMissingOrders()
  await fixIncompleteBundles()

  if (!DRY_RUN) {
    const afterBookings = await prisma.booking.count()
    const afterOrders = await prisma.order.count()
    const afterItems = await prisma.orderItem.count()
    console.log('\n📊 Final State:')
    console.log(`   Orders: ${beforeOrders} → ${afterOrders} (+${afterOrders - beforeOrders})`)
    console.log(`   Order Items: ${beforeItems} → ${afterItems} (+${afterItems - beforeItems})`)
    console.log(`   Bookings: ${beforeBookings} → ${afterBookings} (+${afterBookings - beforeBookings})`)
  }
}

main()
  .catch(e => { console.error('❌ Fatal:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
