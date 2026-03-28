/**
 * Check Manly Library Bookings Script
 *
 * Queries all PAID orders with camp bookings on April 14, 15, 16 (2026)
 * and checks the Stripe checkout session metadata for location info.
 *
 * Since Stripe metadata may be empty, also dumps raw metadata so we can inspect.
 * Also checks for duplicate bookings (same student + product + date).
 *
 * Usage:
 *   npx tsx scripts/check-manly-bookings.ts
 */

import { PrismaClient } from '@prisma/client'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment')
  process.exit(1)
}

const prisma = new PrismaClient()

const MANLY_DATES = ['2026-04-14', '2026-04-15', '2026-04-16']

// ─── STRIPE API via fetch ────────────────────────────────────────────────

async function stripeGet(path: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`https://api.stripe.com/v1${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
  }
  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Stripe API error ${resp.status}: ${text}`)
  }
  return resp.json()
}

async function fetchStripeSession(sessionId: string): Promise<any> {
  try {
    return await stripeGet(`/checkout/sessions/${sessionId}`)
  } catch (e) {
    return null
  }
}

async function fetchSessionByPaymentIntent(paymentIntentId: string): Promise<any> {
  try {
    const data = await stripeGet('/checkout/sessions', { payment_intent: paymentIntentId })
    return data.data?.[0] || null
  } catch {
    return null
  }
}

async function fetchLineItems(sessionId: string): Promise<any[]> {
  try {
    const data = await stripeGet(`/checkout/sessions/${sessionId}/line_items`, { limit: '100' })
    return data.data || []
  } catch {
    return []
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ─── MAIN ────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Manly Library Booking Check (v2 - deep Stripe inspection)')
  console.log(`   Checking bookings on: ${MANLY_DATES.join(', ')}`)
  console.log(`   Time: ${new Date().toISOString()}\n`)

  // Get all locations
  const locations = await prisma.location.findMany()
  console.log('📍 Locations in database:')
  for (const loc of locations) {
    console.log(`   • ${loc.name} (${loc.id})`)
  }
  console.log('')

  // Query all bookings on the target dates
  const targetDateStart = new Date('2026-04-14T00:00:00.000Z')
  const targetDateEnd = new Date('2026-04-17T00:00:00.000Z')

  const bookings = await prisma.booking.findMany({
    where: {
      startDate: { gte: targetDateStart, lt: targetDateEnd },
      status: { in: ['CONFIRMED', 'PENDING'] },
    },
    include: { student: true, product: true, location: true },
    orderBy: [{ startDate: 'asc' }, { student: { name: 'asc' } }],
  })

  console.log(`📋 Found ${bookings.length} bookings on April 14-16\n`)

  // Check for duplicates
  const dupeKey = (b: typeof bookings[0]) => `${b.studentId}|${b.productId}|${dateStr(b.startDate)}`
  const seen = new Map<string, typeof bookings>()
  for (const b of bookings) {
    const key = dupeKey(b)
    if (!seen.has(key)) seen.set(key, [])
    seen.get(key)!.push(b)
  }
  const duplicates = [...seen.entries()].filter(([, v]) => v.length > 1)
  if (duplicates.length > 0) {
    console.log(`⚠️  Found ${duplicates.length} DUPLICATE booking groups (same student + product + date):`)
    for (const [, dupes] of duplicates) {
      console.log(`   • ${dupes[0].student.name} - ${dupes[0].product.name} on ${dateStr(dupes[0].startDate)} (${dupes.length} copies)`)
      for (const d of dupes) {
        console.log(`     ID: ${d.id} | Location: ${d.location.name} | Notes: ${d.notes || 'none'}`)
      }
    }
    console.log('')
  }

  // Deduplicate for analysis - use unique student+product+date combos
  const uniqueBookings = [...seen.values()].map((v) => v[0])
  console.log(`📋 ${uniqueBookings.length} unique student-product-date combinations\n`)

  // For each unique booking, find the order and check Stripe
  const orderCache = new Map<string, any>()
  const sessionCache = new Map<string, any>()

  for (const booking of uniqueBookings) {
    const bDateStr = dateStr(booking.startDate)

    // Find order item
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        studentId: booking.studentId,
        productId: booking.productId,
        bookingDate: {
          gte: new Date(bDateStr + 'T00:00:00.000Z'),
          lt: new Date(bDateStr + 'T23:59:59.999Z'),
        },
      },
      include: { order: true },
    })

    const order = orderItem?.order
    if (!order) continue

    if (!orderCache.has(order.id)) {
      orderCache.set(order.id, order)
    }

    // Fetch Stripe session (once per order)
    if (order.stripePaymentIntentId && !sessionCache.has(order.id)) {
      const stripeId = order.stripePaymentIntentId
      let session: any = null
      if (stripeId.startsWith('cs_')) {
        session = await fetchStripeSession(stripeId)
      } else if (stripeId.startsWith('pi_')) {
        session = await fetchSessionByPaymentIntent(stripeId)
      }
      if (session) {
        // Also fetch line items to see product names
        const lineItems = await fetchLineItems(session.id)
        session._lineItems = lineItems
      }
      sessionCache.set(order.id, session)
    }
  }

  // Print per-order analysis
  console.log('═══════════════════════════════════════════════════════════════════════════════════════')
  console.log('  PER-ORDER STRIPE ANALYSIS')
  console.log('═══════════════════════════════════════════════════════════════════════════════════════\n')

  for (const [orderId, session] of sessionCache) {
    const order = orderCache.get(orderId)!
    const orderBookings = uniqueBookings.filter((b) => {
      // Match via order items
      return true // we'll filter below
    })

    console.log(`📦 Order: ${orderId}`)
    console.log(`   Customer: ${order.customerName} (${order.customerEmail})`)
    console.log(`   Stripe ID: ${order.stripePaymentIntentId}`)

    if (session) {
      console.log(`   Stripe metadata: ${JSON.stringify(session.metadata || {})}`)

      if (session._lineItems?.length > 0) {
        console.log(`   Line items:`)
        for (const li of session._lineItems) {
          console.log(`     • ${li.description} x${li.quantity} ($${((li.amount_total || 0) / 100).toFixed(2)})`)
        }
      }
    } else {
      console.log(`   ⚠️  Could not fetch Stripe session`)
    }

    // Show bookings for this order
    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderId,
        bookingDate: { gte: targetDateStart, lt: targetDateEnd },
      },
      include: { student: true, product: true },
    })

    if (orderItems.length > 0) {
      console.log(`   Bookings on Apr 14-16:`)
      for (const oi of orderItems) {
        console.log(`     • ${oi.student.name} - ${oi.product.name} on ${dateStr(oi.bookingDate)}`)
      }
    }
    console.log('')
  }

  // Now check: are there orders with bookings on Apr 14-16 that DON'T have a Stripe session?
  // Get all order items on those dates
  const allOrderItems = await prisma.orderItem.findMany({
    where: {
      bookingDate: { gte: targetDateStart, lt: targetDateEnd },
      order: { status: 'PAID' },
    },
    include: { order: true, student: true, product: true },
    orderBy: { bookingDate: 'asc' },
  })

  const orderIds = [...new Set(allOrderItems.map((oi) => oi.orderId))]
  const missingOrders = orderIds.filter((id) => !sessionCache.has(id))

  if (missingOrders.length > 0) {
    console.log(`\n⚠️  ${missingOrders.length} additional orders with bookings on Apr 14-16 (not found via booking join):`)
    for (const oid of missingOrders) {
      const items = allOrderItems.filter((oi) => oi.orderId === oid)
      const order = items[0].order
      console.log(`   Order: ${oid} | ${order.customerName} (${order.customerEmail})`)
      console.log(`   Stripe ID: ${order.stripePaymentIntentId}`)

      // Fetch Stripe session
      if (order.stripePaymentIntentId) {
        const stripeId = order.stripePaymentIntentId
        let session: any = null
        if (stripeId.startsWith('cs_')) {
          session = await fetchStripeSession(stripeId)
        } else if (stripeId.startsWith('pi_')) {
          session = await fetchSessionByPaymentIntent(stripeId)
        }
        if (session) {
          console.log(`   Stripe metadata: ${JSON.stringify(session.metadata || {})}`)
          const lineItems = await fetchLineItems(session.id)
          if (lineItems.length > 0) {
            console.log(`   Line items:`)
            for (const li of lineItems) {
              console.log(`     • ${li.description} x${li.quantity} ($${((li.amount_total || 0) / 100).toFixed(2)})`)
            }
          }
        }
      }

      for (const oi of items) {
        console.log(`   • ${oi.student.name} - ${oi.product.name} on ${dateStr(oi.bookingDate)}`)
      }
      console.log('')
    }
  }

  // Final summary
  console.log('═══════════════════════════════════════════════════════════════════════════════════════')
  console.log('  FINAL SUMMARY')
  console.log('═══════════════════════════════════════════════════════════════════════════════════════\n')

  const allSessions = [...sessionCache.values()].filter(Boolean)
  const withLocationMeta = allSessions.filter((s) => s.metadata?.location)
  const manlyMeta = allSessions.filter((s) => s.metadata?.location?.toLowerCase().includes('manly'))

  console.log(`   Total unique orders checked: ${sessionCache.size + missingOrders.length}`)
  console.log(`   Sessions with location metadata: ${withLocationMeta.length}`)
  console.log(`   Sessions with "Manly" in location: ${manlyMeta.length}`)
  console.log(`   Total bookings (inc. dupes): ${bookings.length}`)
  console.log(`   Unique bookings: ${uniqueBookings.length}`)
  console.log(`   Duplicate groups: ${duplicates.length}`)

  if (withLocationMeta.length > 0) {
    console.log(`\n   Location metadata values found:`)
    for (const s of withLocationMeta) {
      console.log(`     • "${s.metadata.location}" (session: ${s.id})`)
    }
  }

  console.log('\n   ℹ️  This is a DRY RUN — no changes were made.')
}

main()
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
