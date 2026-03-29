/**
 * Fix Ghost Orders — Orders marked PAID whose Stripe sessions actually expired/failed.
 *
 * Root cause: The checkout flow creates Order + Student + OrderItems on EVERY
 * checkout attempt. If the user abandons payment, the Stripe session expires
 * but the Order stays in the DB. Previous reconciliation scripts then incorrectly
 * marked these as PAID.
 *
 * This script:
 * 1. Gets all PAID orders
 * 2. Checks each order's Stripe session — was it actually paid?
 * 3. Cancels ghost orders (expired/unpaid sessions)
 * 4. Removes bookings that were created from ghost orders
 * 5. NEVER touches orders/bookings from genuinely paid sessions
 *
 * Run audit:  npx tsx scripts/fix-ghost-orders.ts
 * Run fix:    npx tsx scripts/fix-ghost-orders.ts --fix
 */

import { PrismaClient } from '@prisma/client'

const DRY_RUN = !process.argv.includes('--fix')
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not set')
  process.exit(1)
}

const prisma = new PrismaClient()

// ─── STRIPE API ──────────────────────────────────────────────────────────

async function stripeGet(path: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`https://api.stripe.com/v1${path}`)
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` }
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Stripe ${resp.status}: ${text}`)
  }
  return resp.json()
}

function dateStr(d: Date): string { return d.toISOString().split('T')[0] }

// ─── MAIN ────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║  FIX GHOST ORDERS — Verify every PAID order in DB   ║')
  console.log('╚═══════════════════════════════════════════════════════╝')
  console.log(`  Mode: ${DRY_RUN ? '🔎 DRY RUN' : '🔧 FIX MODE'}`)
  console.log(`  Time: ${new Date().toISOString()}\n`)

  // Step 1: Build a map of ALL paid Stripe sessions (source of truth)
  console.log('Step 1: Fetching all paid Stripe checkout sessions...')
  const paidSessionIds = new Set<string>()
  const paidPaymentIntents = new Set<string>()
  const marchStart = Math.floor(new Date('2026-03-01T00:00:00Z').getTime() / 1000)
  let startingAfter: string | undefined
  let hasMore = true

  while (hasMore) {
    const params: Record<string, string> = {
      limit: '100',
      status: 'complete',
      'created[gte]': String(marchStart)
    }
    if (startingAfter) params.starting_after = startingAfter
    const data = await stripeGet('/checkout/sessions', params)
    for (const s of data.data) {
      if (s.payment_status === 'paid') {
        paidSessionIds.add(s.id)
        if (s.payment_intent) paidPaymentIntents.add(s.payment_intent)
        // Also store orderId from metadata for cross-reference
        if (s.metadata?.orderId) paidSessionIds.add(`order:${s.metadata.orderId}`)
      }
    }
    hasMore = data.has_more
    if (data.data.length > 0) startingAfter = data.data[data.data.length - 1].id
  }

  console.log(`  Found ${paidPaymentIntents.size} paid sessions in Stripe\n`)

  // Step 2: Get all PAID orders from DB
  const paidOrders = await prisma.order.findMany({
    where: { status: 'PAID' },
    include: {
      orderItems: { include: { product: true, student: true } }
    },
    orderBy: { createdAt: 'asc' }
  })

  console.log(`Step 2: Checking ${paidOrders.length} PAID orders against Stripe...\n`)

  const ghostOrders: typeof paidOrders = []
  const legitimateOrders: typeof paidOrders = []

  for (const order of paidOrders) {
    const ref = order.stripePaymentIntentId

    // Check if this order's Stripe reference is among the paid sessions
    const isPaidInStripe =
      (ref && paidSessionIds.has(ref)) ||
      (ref && paidPaymentIntents.has(ref)) ||
      paidSessionIds.has(`order:${order.id}`)

    if (isPaidInStripe) {
      legitimateOrders.push(order)
    } else {
      // Double-check: try to fetch the session directly from Stripe
      let confirmedGhost = true

      if (ref) {
        try {
          // ref could be a session ID (cs_...) or payment intent (pi_...)
          if (ref.startsWith('cs_')) {
            const session = await stripeGet(`/checkout/sessions/${ref}`)
            if (session.payment_status === 'paid') {
              confirmedGhost = false
              legitimateOrders.push(order)
            }
          } else if (ref.startsWith('pi_')) {
            const pi = await stripeGet(`/payment_intents/${ref}`)
            if (pi.status === 'succeeded') {
              confirmedGhost = false
              legitimateOrders.push(order)
            }
          }
        } catch (e) {
          // Session/PI not found or error — treat as ghost
        }
      }

      if (confirmedGhost) {
        ghostOrders.push(order)
      }
    }
  }

  console.log(`  ✅ Legitimate (paid in Stripe): ${legitimateOrders.length}`)
  console.log(`  👻 Ghost (NOT paid in Stripe): ${ghostOrders.length}\n`)

  if (ghostOrders.length === 0) {
    console.log('  No ghost orders found! All PAID orders are legitimate.')
    await prisma.$disconnect()
    return
  }

  // Step 3: Report ghost orders grouped by customer
  console.log('═══════════════════════════════════════════════════════')
  console.log('  GHOST ORDERS (will be CANCELLED)')
  console.log('═══════════════════════════════════════════════════════\n')

  const byCustomer = new Map<string, typeof ghostOrders>()
  for (const o of ghostOrders) {
    const key = o.customerEmail
    if (!byCustomer.has(key)) byCustomer.set(key, [])
    byCustomer.get(key)!.push(o)
  }

  let totalGhostBookings = 0
  const bookingsToDelete: string[] = []

  for (const [email, orders] of byCustomer) {
    const name = orders[0].customerName
    console.log(`  📧 ${name} (${email}) — ${orders.length} ghost order(s)`)

    for (const o of orders) {
      const items = o.orderItems.map(oi =>
        `${oi.student.name} | ${oi.product.name} | ${dateStr(oi.bookingDate)}`
      ).join('; ')
      console.log(`     Order ${o.id} | $${Number(o.totalAmount)} | ref: ${o.stripePaymentIntentId?.substring(0, 30)}...`)
      console.log(`       Items: ${items}`)

      // Find bookings created from this ghost order's items
      for (const oi of o.orderItems) {
        if (oi.product.type !== 'CAMP' && oi.product.type !== 'BIRTHDAY') continue

        const bDateStr = dateStr(oi.bookingDate)
        const bookings = await prisma.booking.findMany({
          where: {
            studentId: oi.studentId,
            productId: oi.productId,
            startDate: {
              gte: new Date(bDateStr + 'T00:00:00.000Z'),
              lt: new Date(bDateStr + 'T23:59:59.999Z')
            }
          }
        })

        // Only delete if this booking is NOT also covered by a legitimate order
        for (const b of bookings) {
          const hasLegitCoverage = legitimateOrders.some(lo =>
            lo.orderItems.some(loi =>
              loi.studentId === oi.studentId &&
              loi.productId === oi.productId &&
              dateStr(loi.bookingDate) === bDateStr
            )
          )

          if (!hasLegitCoverage) {
            // This booking exists ONLY because of the ghost order — delete it
            bookingsToDelete.push(b.id)
            totalGhostBookings++
            console.log(`       🗑️  Booking ${b.id} (${bDateStr}) — no legitimate order covers this`)
          } else {
            // A legitimate order also has this student+product+date, keep the booking
            // but we still need to check if there are DUPLICATE bookings
            // (one from legit, one from ghost). If so, keep only one.
            if (bookings.length > 1) {
              // Mark all but the first as duplicates
              const isFirstForThisDate = bookings.indexOf(b) === 0
              if (!isFirstForThisDate) {
                bookingsToDelete.push(b.id)
                totalGhostBookings++
                console.log(`       🗑️  Duplicate booking ${b.id} (${bDateStr}) — keeping one from legitimate order`)
              }
            }
          }
        }
      }
    }
    console.log()
  }

  // Deduplicate bookingsToDelete
  const uniqueBookingsToDelete = [...new Set(bookingsToDelete)]

  console.log('═══════════════════════════════════════════════════════')
  console.log('  SUMMARY')
  console.log('═══════════════════════════════════════════════════════\n')
  console.log(`  Ghost orders to cancel: ${ghostOrders.length}`)
  console.log(`  Ghost bookings to delete: ${uniqueBookingsToDelete.length}`)
  console.log(`  Affected customers: ${byCustomer.size}\n`)

  if (DRY_RUN) {
    console.log('  ℹ️  Run with --fix to apply:')
    console.log('     npx tsx scripts/fix-ghost-orders.ts --fix')
    await prisma.$disconnect()
    return
  }

  // Step 4: Execute fixes
  console.log('═══════════════════════════════════════════════════════')
  console.log('  EXECUTING FIXES')
  console.log('═══════════════════════════════════════════════════════\n')

  // Cancel ghost orders
  for (const o of ghostOrders) {
    await prisma.order.update({
      where: { id: o.id },
      data: { status: 'CANCELLED' }
    })
    console.log(`  ✅ Cancelled order ${o.id} (${o.customerName})`)
  }

  // Delete ghost bookings
  if (uniqueBookingsToDelete.length > 0) {
    const result = await prisma.booking.deleteMany({
      where: { id: { in: uniqueBookingsToDelete } }
    })
    console.log(`  ✅ Deleted ${result.count} ghost/duplicate bookings`)
  }

  // Step 5: Post-fix verification
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  POST-FIX STATE')
  console.log('═══════════════════════════════════════════════════════\n')

  const finalPaidOrders = await prisma.order.count({ where: { status: 'PAID' } })
  const finalCancelledOrders = await prisma.order.count({ where: { status: 'CANCELLED' } })
  const finalBookings = await prisma.booking.count({ where: { status: 'CONFIRMED', product: { type: 'CAMP' } } })

  console.log(`  PAID orders: ${finalPaidOrders}`)
  console.log(`  CANCELLED orders: ${finalCancelledOrders}`)
  console.log(`  Confirmed camp bookings: ${finalBookings}`)

  // Show booking count per date
  console.log('\n  Bookings per date:')
  const allBookings = await prisma.booking.findMany({
    where: { status: 'CONFIRMED', product: { type: 'CAMP' } },
    orderBy: { startDate: 'asc' }
  })
  const byDate = new Map<string, number>()
  for (const b of allBookings) {
    const ds = dateStr(b.startDate)
    byDate.set(ds, (byDate.get(ds) || 0) + 1)
  }
  for (const [date, count] of [...byDate.entries()].sort()) {
    console.log(`    ${date}: ${count}`)
  }
}

main()
  .catch(e => { console.error('\n❌ Fatal:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
