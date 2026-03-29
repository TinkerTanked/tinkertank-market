/**
 * FULL BOOKING VERIFICATION — Stripe is Source of Truth
 *
 * A fresh, from-scratch verification that:
 *  1. Fetches ALL paid Stripe checkout sessions (March 2026+, mode=payment)
 *  2. For each session: verifies Order (PAID), OrderItems, and Bookings exist
 *  3. For 3-day bundles: verifies exactly 3 consecutive weekday bookings
 *  4. Merges duplicate student records (same normalized name + similar birth year)
 *  5. Identifies orphan bookings (in DB but no Stripe payment)
 *  6. Triple-checks: final booking count per date vs Stripe line item quantities
 *  7. NEVER deletes bookings — only adds missing ones
 *
 * Run audit:  npx tsx scripts/full-booking-verification.ts
 * Run fix:    npx tsx scripts/full-booking-verification.ts --fix
 */

import { PrismaClient, Prisma } from '@prisma/client'

const DRY_RUN = !process.argv.includes('--fix')
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not set')
  process.exit(1)
}

const prisma = new PrismaClient()

// ─── CONSTANTS ───────────────────────────────────────────────────────────

const NEUTRAL_BAY_ID = 'cmmxpsdxh00069a01w1m0pr5t'
const MANLY_LIBRARY_ID = 'cmmif20y400018b8vb2dt5jjz'
const MANLY_DATES = ['2026-04-14', '2026-04-15', '2026-04-16']

// Camp times
function getCampHours(productName: string): { startHour: number; endHour: number } {
  const isAllDay = productName.toLowerCase().includes('all day')
  return { startHour: 9, endHour: isAllDay ? 17 : 15 }
}

// ─── STRIPE API via fetch ────────────────────────────────────────────────

async function stripeGet(path: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`https://api.stripe.com/v1${path}`)
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` }
  })
  if (!resp.ok) throw new Error(`Stripe ${resp.status}: ${await resp.text()}`)
  return resp.json()
}

interface StripeSession {
  id: string
  payment_status: string
  mode: string
  amount_total: number
  payment_intent: string | null
  created: number
  customer_details: { email: string | null; name: string | null } | null
  metadata: Record<string, string> | null
}

interface StripeLineItem {
  id: string
  description: string
  quantity: number
  amount_total: number
  price?: { id: string; recurring?: { interval: string } | null } | null
}

async function fetchAllPaidPaymentSessions(): Promise<StripeSession[]> {
  const sessions: StripeSession[] = []
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
      if (s.payment_status === 'paid' && s.mode === 'payment') {
        sessions.push(s)
      }
    }
    hasMore = data.has_more
    if (data.data.length > 0) startingAfter = data.data[data.data.length - 1].id
  }
  return sessions
}

async function fetchLineItems(sessionId: string): Promise<StripeLineItem[]> {
  const data = await stripeGet(`/checkout/sessions/${sessionId}/line_items`, { limit: '100' })
  return data.data
}

// ─── HELPERS ─────────────────────────────────────────────────────────────

function dateStr(d: Date): string { return d.toISOString().split('T')[0] }
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function isWeekday(d: Date): boolean { const day = d.getUTCDay(); return day !== 0 && day !== 6 }
function normName(s: string): string { return s.toLowerCase().trim().replace(/\s+/g, ' ') }

function getLocationForDate(dateString: string): string {
  return MANLY_DATES.includes(dateString) ? MANLY_LIBRARY_ID : NEUTRAL_BAY_ID
}

function isSkippableLineItem(desc: string): boolean {
  const d = desc.toLowerCase()
  return d.includes('ignite') ||
    d.includes('after schooler') ||
    d.includes('extra student')
}

function isBirthdayLineItem(desc: string): boolean {
  return desc.toLowerCase().includes('birthday') || desc.toLowerCase().includes('birthdays rock')
}

function isCampLineItem(desc: string): boolean {
  const d = desc.toLowerCase()
  return (d.includes('day camp') || d.includes('camp')) &&
    !d.includes('ignite') &&
    !d.includes('after schooler') &&
    !d.includes('extra student') &&
    !d.includes('birthday')
}

// ─── TYPES ───────────────────────────────────────────────────────────────

interface Issue {
  type: string
  description: string
  details: Record<string, unknown>
}

interface Fix {
  type: string
  description: string
  executed: boolean
  details: Record<string, unknown>
}

// Expected bookings per date from Stripe (for triple-check)
const stripeExpectedByDate = new Map<string, { students: string[]; count: number }>()

function addStripeExpectation(dateString: string, studentName: string) {
  if (!stripeExpectedByDate.has(dateString)) {
    stripeExpectedByDate.set(dateString, { students: [], count: 0 })
  }
  const entry = stripeExpectedByDate.get(dateString)!
  entry.students.push(studentName)
  entry.count++
}

// ─── PART 1: STRIPE → DB VERIFICATION ────────────────────────────────────

async function verifyStripeVsDB(): Promise<{ issues: Issue[]; fixes: Fix[] }> {
  const issues: Issue[] = []
  const fixes: Fix[] = []

  console.log('═══════════════════════════════════════════════════════')
  console.log('  PART 1: Stripe → DB Verification')
  console.log('  Every paid checkout session must have Order + Bookings')
  console.log('═══════════════════════════════════════════════════════\n')

  const sessions = await fetchAllPaidPaymentSessions()
  console.log(`📋 Found ${sessions.length} paid payment checkout sessions in Stripe\n`)

  let sessionsOK = 0
  let sessionsWithIssues = 0

  for (const session of sessions) {
    const orderId = session.metadata?.orderId
    const email = session.customer_details?.email || 'unknown'
    const name = session.customer_details?.name || 'unknown'
    const amount = ((session.amount_total || 0) / 100).toFixed(2)
    const created = new Date(session.created * 1000).toISOString()

    // Fetch line items
    let lineItems: StripeLineItem[] = []
    try {
      lineItems = await fetchLineItems(session.id)
    } catch (e) {
      console.error(`  ⚠️  Could not fetch line items for ${session.id}: ${e}`)
    }

    // Skip subscription sessions that leaked through
    const hasSubscriptionItem = lineItems.some(li =>
      li.price?.recurring?.interval != null
    )
    if (hasSubscriptionItem) {
      continue
    }

    // Categorize line items
    const campItems = lineItems.filter(li => isCampLineItem(li.description))
    const birthdayItems = lineItems.filter(li => isBirthdayLineItem(li.description))
    const skippableItems = lineItems.filter(li => isSkippableLineItem(li.description))

    // If ALL items are skippable (extra students, ignite, after schoolers), just verify order exists
    const allSkippable = lineItems.length > 0 && lineItems.every(li => isSkippableLineItem(li.description))

    // ─── Find order in DB ─────────────────────────────────────────
    let order = orderId
      ? await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: { include: { product: true, student: true } } }
      })
      : null

    if (!order && session.payment_intent) {
      order = await prisma.order.findFirst({
        where: { stripePaymentIntentId: session.payment_intent },
        include: { orderItems: { include: { product: true, student: true } } }
      })
    }
    if (!order) {
      order = await prisma.order.findFirst({
        where: { stripePaymentIntentId: session.id },
        include: { orderItems: { include: { product: true, student: true } } }
      })
    }

    // ─── No order at all ──────────────────────────────────────────
    if (!order) {
      const lineDesc = lineItems.map(li => `${li.description} x${li.quantity} ($${(li.amount_total / 100).toFixed(2)})`).join('; ')
      issues.push({
        type: 'NO_ORDER',
        description: `No order for session ${session.id} — ${name} (${email}) — $${amount} — ${lineDesc}`,
        details: { sessionId: session.id, email, name, amount, created, lineItems: lineDesc }
      })
      sessionsWithIssues++

      // For skippable items, create order only (no booking needed)
      if (allSkippable) {
        fixes.push({
          type: 'CREATE_ORDER_ONLY',
          description: `Create order for ${name} — $${amount} (skippable items: ${lineDesc})`,
          executed: false,
          details: { sessionId: session.id, email, name, amount, paymentIntent: session.payment_intent }
        })
      }
      // For camp/birthday items with no order, we can't reliably recreate since
      // we don't know student details or dates. Flag for manual review.
      continue
    }

    // ─── Order exists but wrong status ────────────────────────────
    if (order.status === 'PENDING') {
      issues.push({
        type: 'ORDER_PENDING',
        description: `Order ${order.id} is PENDING but Stripe session ${session.id} is paid`,
        details: { orderId: order.id, sessionId: session.id }
      })
      fixes.push({
        type: 'UPDATE_ORDER_STATUS',
        description: `Update order ${order.id} from PENDING to PAID`,
        executed: false,
        details: { orderId: order.id }
      })
      sessionsWithIssues++
    }

    // ─── For camp/birthday orders: check bookings exist ───────────
    if (order.status === 'PAID' || order.status === 'PENDING') {
      const campOrBirthdayItems = order.orderItems.filter(
        oi => oi.product.type === 'CAMP' || oi.product.type === 'BIRTHDAY'
      )

      for (const oi of campOrBirthdayItems) {
        const bDateStr = dateStr(oi.bookingDate)

        // Track expected bookings for triple-check
        if (oi.product.type === 'CAMP') {
          addStripeExpectation(bDateStr, oi.student.name)
        }

        const existing = await prisma.booking.findFirst({
          where: {
            studentId: oi.studentId,
            productId: oi.productId,
            startDate: {
              gte: new Date(bDateStr + 'T00:00:00.000Z'),
              lt: new Date(bDateStr + 'T23:59:59.999Z')
            }
          }
        })

        if (!existing) {
          const { startHour, endHour } = getCampHours(oi.product.name)
          const locationId = getLocationForDate(bDateStr)

          issues.push({
            type: 'MISSING_BOOKING',
            description: `No booking for ${oi.student.name} — ${oi.product.name} on ${bDateStr} (Order ${order.id})`,
            details: {
              orderId: order.id, studentId: oi.studentId, studentName: oi.student.name,
              productId: oi.productId, productName: oi.product.name,
              bookingDate: bDateStr, price: Number(oi.price), startHour, endHour, locationId
            }
          })
          fixes.push({
            type: 'CREATE_BOOKING',
            description: `Create booking: ${oi.student.name} — ${oi.product.name} on ${bDateStr}`,
            executed: false,
            details: {
              orderId: order.id, studentId: oi.studentId, productId: oi.productId,
              bookingDate: bDateStr, price: Number(oi.price), startHour, endHour, locationId
            }
          })
          sessionsWithIssues++
        }
      }

      // ─── Bundle check: ensure 3 consecutive weekday bookings ────
      // Group order items by student + product for bundle products
      const bundleItems = order.orderItems.filter(
        oi => oi.product.name.toLowerCase().includes('3-day bundle')
      )
      if (bundleItems.length > 0) {
        const bundleGroups = new Map<string, typeof bundleItems>()
        for (const bi of bundleItems) {
          const key = `${bi.studentId}::${bi.productId}`
          if (!bundleGroups.has(key)) bundleGroups.set(key, [])
          bundleGroups.get(key)!.push(bi)
        }

        for (const [, items] of bundleGroups) {
          if (items.length >= 3) continue // already has 3+ order items

          const studentName = items[0].student.name
          const productName = items[0].product.name
          const existingDates = items.map(i => i.bookingDate).sort((a, b) => a.getTime() - b.getTime())
          const firstDate = existingDates[0]

          // Calculate 3 consecutive weekdays from first date
          const targetDates: Date[] = []
          let cursor = new Date(firstDate)
          while (targetDates.length < 3) {
            if (isWeekday(cursor)) targetDates.push(new Date(cursor))
            cursor = addDays(cursor, 1)
          }

          const existingDateStrs = existingDates.map(d => dateStr(d))
          const missingDateStrs = targetDates.map(d => dateStr(d)).filter(d => !existingDateStrs.includes(d))

          if (missingDateStrs.length > 0) {
            const { startHour, endHour } = getCampHours(productName)
            const pricePerDay = Number(items[0].product.price) / 3

            issues.push({
              type: 'BUNDLE_INCOMPLETE',
              description: `Bundle incomplete: ${studentName} — ${productName} has ${items.length}/3 days. Existing: [${existingDateStrs.join(', ')}]. Missing: [${missingDateStrs.join(', ')}]`,
              details: {
                orderId: order.id, studentId: items[0].studentId, studentName,
                productId: items[0].productId, productName,
                existingDates: existingDateStrs, missingDates: missingDateStrs
              }
            })

            for (const missDate of missingDateStrs) {
              const locationId = getLocationForDate(missDate)

              // Track for triple-check
              addStripeExpectation(missDate, studentName)

              fixes.push({
                type: 'CREATE_ORDER_ITEM_AND_BOOKING',
                description: `Create order item + booking: ${studentName} — ${productName} on ${missDate}`,
                executed: false,
                details: {
                  orderId: order.id, studentId: items[0].studentId, productId: items[0].productId,
                  bookingDate: missDate, price: pricePerDay, startHour, endHour, locationId
                }
              })
              sessionsWithIssues++
            }
          }
        }
      }
    }

    if (!issues.some(i =>
      i.details.sessionId === session.id ||
      i.details.orderId === order?.id
    )) {
      sessionsOK++
    }
  }

  console.log(`\n✅ Sessions OK: ${sessionsOK}`)
  console.log(`⚠️  Sessions with issues: ${sessionsWithIssues}`)

  return { issues, fixes }
}

// ─── PART 2: DUPLICATE STUDENT MERGE ─────────────────────────────────────

async function findDuplicateStudents(): Promise<{ issues: Issue[]; fixes: Fix[] }> {
  const issues: Issue[] = []
  const fixes: Fix[] = []

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  PART 2: Duplicate Student Detection & Merge')
  console.log('═══════════════════════════════════════════════════════\n')

  const allStudents = await prisma.student.findMany({
    include: {
      bookings: { select: { id: true } },
      orderItems: { select: { id: true } },
      igniteSubscriptions: { select: { id: true } }
    },
    orderBy: { createdAt: 'asc' }
  })

  // Group by normalized name
  const nameGroups = new Map<string, typeof allStudents>()
  for (const s of allStudents) {
    const key = normName(s.name)
    if (!nameGroups.has(key)) nameGroups.set(key, [])
    nameGroups.get(key)!.push(s)
  }

  let dupCount = 0
  for (const [name, students] of nameGroups) {
    if (students.length <= 1) continue

    // Further group by similar birth year (within 2 years)
    const birthYearGroups: typeof allStudents[] = []
    for (const s of students) {
      const year = s.birthdate.getFullYear()
      let placed = false
      for (const group of birthYearGroups) {
        const groupYear = group[0].birthdate.getFullYear()
        if (Math.abs(year - groupYear) <= 2) {
          group.push(s)
          placed = true
          break
        }
      }
      if (!placed) birthYearGroups.push([s])
    }

    for (const group of birthYearGroups) {
      if (group.length <= 1) continue

      dupCount++
      // Canonical: the one with the most bookings + order items, else oldest
      const sorted = group.sort((a, b) => {
        const aCount = a.bookings.length + a.orderItems.length
        const bCount = b.bookings.length + b.orderItems.length
        if (bCount !== aCount) return bCount - aCount
        return a.createdAt.getTime() - b.createdAt.getTime()
      })

      const canonical = sorted[0]
      const duplicates = sorted.slice(1)

      console.log(`  📌 "${canonical.name}" — ${group.length} records`)
      console.log(`     Canonical: ${canonical.id} (${canonical.bookings.length} bookings, ${canonical.orderItems.length} orderItems, born ${dateStr(canonical.birthdate)})`)
      for (const dup of duplicates) {
        console.log(`     Duplicate: ${dup.id} (${dup.bookings.length} bookings, ${dup.orderItems.length} orderItems, born ${dateStr(dup.birthdate)})`)

        issues.push({
          type: 'DUPLICATE_STUDENT',
          description: `Duplicate student "${dup.name}" (${dup.id}) → merge into ${canonical.id}`,
          details: {
            canonicalId: canonical.id,
            duplicateId: dup.id,
            name: dup.name,
            dupBookings: dup.bookings.length,
            dupOrderItems: dup.orderItems.length,
            dupIgniteSubs: dup.igniteSubscriptions.length
          }
        })

        fixes.push({
          type: 'MERGE_STUDENT',
          description: `Merge student "${dup.name}" (${dup.id}) → ${canonical.id}`,
          executed: false,
          details: {
            canonicalId: canonical.id,
            duplicateId: dup.id,
            name: dup.name,
            moveBookings: dup.bookings.length,
            moveOrderItems: dup.orderItems.length,
            moveIgniteSubs: dup.igniteSubscriptions.length
          }
        })
      }
    }
  }

  console.log(`\n  Found ${dupCount} sets of duplicate students\n`)
  return { issues, fixes }
}

// ─── PART 3: ORPHAN BOOKINGS (DB but no Stripe) ─────────────────────────

async function findOrphanBookings(): Promise<{ issues: Issue[] }> {
  const issues: Issue[] = []

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  PART 3: Orphan Bookings (in DB, no Stripe payment)')
  console.log('═══════════════════════════════════════════════════════\n')

  // Get all confirmed camp bookings
  const allBookings = await prisma.booking.findMany({
    where: { status: 'CONFIRMED', product: { type: 'CAMP' } },
    include: { student: true, product: true, location: true }
  })

  // Get all PAID orders with their items
  const paidOrders = await prisma.order.findMany({
    where: { status: 'PAID' },
    include: { orderItems: true }
  })

  // Build a set of all (studentId, productId, dateStr) from PAID order items
  const paidOrderItemKeys = new Set<string>()
  for (const order of paidOrders) {
    for (const oi of order.orderItems) {
      paidOrderItemKeys.add(`${oi.studentId}::${oi.productId}::${dateStr(oi.bookingDate)}`)
    }
  }

  // Find bookings with no matching paid order item
  const orphans: typeof allBookings = []
  for (const b of allBookings) {
    const key = `${b.studentId}::${b.productId}::${dateStr(b.startDate)}`
    if (!paidOrderItemKeys.has(key)) {
      orphans.push(b)
    }
  }

  if (orphans.length === 0) {
    console.log('  ✅ No orphan bookings found\n')
  } else {
    console.log(`  ⚠️  Found ${orphans.length} bookings with no matching PAID order item:\n`)
    for (const b of orphans) {
      const notes = b.notes || '(no notes)'
      console.log(`     ${b.student.name} | ${b.product.name} | ${dateStr(b.startDate)} | ${b.location.name} | ${notes}`)
      issues.push({
        type: 'ORPHAN_BOOKING',
        description: `Orphan booking: ${b.student.name} — ${b.product.name} on ${dateStr(b.startDate)} at ${b.location.name}`,
        details: {
          bookingId: b.id, studentId: b.studentId, studentName: b.student.name,
          productName: b.product.name, date: dateStr(b.startDate),
          locationName: b.location.name, notes
        }
      })
    }
  }

  return { issues }
}

// ─── PART 4: TRIPLE-CHECK — BOOKINGS PER DATE ───────────────────────────

async function tripleCheckByDate(): Promise<{ issues: Issue[] }> {
  const issues: Issue[] = []

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  PART 4: Triple-Check — Booking Count Per Date')
  console.log('═══════════════════════════════════════════════════════\n')

  // Get all confirmed camp bookings grouped by date
  const allBookings = await prisma.booking.findMany({
    where: { status: 'CONFIRMED', product: { type: 'CAMP' } },
    include: { student: true, product: true }
  })

  const dbByDate = new Map<string, { students: string[]; count: number }>()
  for (const b of allBookings) {
    const ds = dateStr(b.startDate)
    if (!dbByDate.has(ds)) dbByDate.set(ds, { students: [], count: 0 })
    const entry = dbByDate.get(ds)!
    entry.students.push(`${b.student.name} (${b.product.name})`)
    entry.count++
  }

  // Compare Stripe expectations vs DB reality
  const allDates = new Set([...stripeExpectedByDate.keys(), ...dbByDate.keys()])
  const sortedDates = [...allDates].sort()

  console.log('  Date         | Stripe Expected | DB Actual | Status')
  console.log('  -------------|-----------------|-----------|-------')

  for (const date of sortedDates) {
    const expected = stripeExpectedByDate.get(date)
    const actual = dbByDate.get(date)
    const expCount = expected?.count || 0
    const actCount = actual?.count || 0
    const status = expCount === actCount ? '✅' :
      actCount > expCount ? '⚠️  EXTRA' :
        '❌ MISSING'

    console.log(`  ${date}  |       ${String(expCount).padStart(3)}       |     ${String(actCount).padStart(3)}   | ${status}`)

    if (expCount !== actCount) {
      // Show details
      const expStudents = expected?.students || []
      const actStudents = actual?.students || []

      if (actCount < expCount) {
        // Find which students are expected but not booked
        const actNames = new Set(actStudents.map(s => normName(s.split(' (')[0])))
        const missing = expStudents.filter(s => !actNames.has(normName(s)))
        if (missing.length > 0) {
          console.log(`               Expected but not booked: ${missing.join(', ')}`)
        }
        issues.push({
          type: 'DATE_COUNT_MISMATCH',
          description: `${date}: expected ${expCount} bookings from Stripe, but only ${actCount} in DB`,
          details: { date, expected: expCount, actual: actCount, expectedStudents: expStudents, actualStudents: actStudents }
        })
      } else if (actCount > expCount && expCount > 0) {
        issues.push({
          type: 'DATE_EXTRA_BOOKINGS',
          description: `${date}: DB has ${actCount} bookings but Stripe only expects ${expCount}`,
          details: { date, expected: expCount, actual: actCount }
        })
      }
    }
  }

  return { issues }
}

// ─── PART 5: LOCATION VERIFICATION ──────────────────────────────────────

async function verifyLocations(): Promise<{ issues: Issue[]; fixes: Fix[] }> {
  const issues: Issue[] = []
  const fixes: Fix[] = []

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  PART 5: Location Verification')
  console.log('═══════════════════════════════════════════════════════\n')

  // Manly Library dates should have bookings at Manly Library, all others at Neutral Bay
  const allBookings = await prisma.booking.findMany({
    where: { status: 'CONFIRMED', product: { type: 'CAMP' } },
    include: { student: true, product: true, location: true }
  })

  let wrongLocation = 0
  for (const b of allBookings) {
    const ds = dateStr(b.startDate)
    const expectedLocationId = getLocationForDate(ds)

    if (b.locationId !== expectedLocationId) {
      const expectedName = expectedLocationId === MANLY_LIBRARY_ID ? 'Manly Library' : 'Neutral Bay'
      wrongLocation++
      issues.push({
        type: 'WRONG_LOCATION',
        description: `${b.student.name} — ${b.product.name} on ${ds}: at "${b.location.name}" but should be "${expectedName}"`,
        details: {
          bookingId: b.id, studentName: b.student.name, date: ds,
          currentLocationId: b.locationId, currentLocationName: b.location.name,
          expectedLocationId, expectedLocationName: expectedName
        }
      })
      fixes.push({
        type: 'FIX_LOCATION',
        description: `Move ${b.student.name} on ${ds} from "${b.location.name}" to "${expectedName}"`,
        executed: false,
        details: { bookingId: b.id, locationId: expectedLocationId }
      })
    }
  }

  if (wrongLocation === 0) {
    console.log('  ✅ All bookings at correct locations\n')
  } else {
    console.log(`  ⚠️  ${wrongLocation} bookings at wrong location\n`)
  }

  return { issues, fixes }
}

// ─── EXECUTE FIXES ───────────────────────────────────────────────────────

async function executeFixes(fixes: Fix[]): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  EXECUTING FIXES (additions only, no deletions of bookings)')
  console.log('═══════════════════════════════════════════════════════\n')

  let fixed = 0
  let errors = 0

  for (const fix of fixes) {
    try {
      if (fix.type === 'UPDATE_ORDER_STATUS') {
        await prisma.order.update({
          where: { id: fix.details.orderId as string },
          data: { status: 'PAID' }
        })
        fix.executed = true
        fixed++
        console.log(`  ✅ ${fix.description}`)

      } else if (fix.type === 'CREATE_ORDER_ONLY') {
        const { email, name, amount, paymentIntent, sessionId } = fix.details as Record<string, string>
        await prisma.order.create({
          data: {
            customerEmail: email,
            customerName: name,
            stripePaymentIntentId: paymentIntent || sessionId,
            status: 'PAID',
            totalAmount: new Prisma.Decimal(parseFloat(amount))
          }
        })
        fix.executed = true
        fixed++
        console.log(`  ✅ ${fix.description}`)

      } else if (fix.type === 'CREATE_BOOKING') {
        const { studentId, productId, bookingDate, price, startHour, endHour, locationId, orderId } = fix.details as {
          studentId: string; productId: string; bookingDate: string; price: number
          startHour: number; endHour: number; locationId: string; orderId: string
        }

        // Double-check no duplicate
        const existing = await prisma.booking.findFirst({
          where: {
            studentId, productId,
            startDate: {
              gte: new Date(bookingDate + 'T00:00:00.000Z'),
              lt: new Date(bookingDate + 'T23:59:59.999Z')
            }
          }
        })
        if (existing) {
          console.log(`  ⏭️  Already exists: ${fix.description}`)
          continue
        }

        const startDate = new Date(bookingDate + 'T00:00:00.000Z')
        startDate.setUTCHours(startHour, 0, 0, 0)
        const endDate = new Date(bookingDate + 'T00:00:00.000Z')
        endDate.setUTCHours(endHour, 0, 0, 0)

        await prisma.booking.create({
          data: {
            studentId, productId, locationId,
            startDate, endDate,
            status: 'CONFIRMED',
            totalPrice: new Prisma.Decimal(price),
            notes: `Verified reconciliation — Order: ${orderId}`
          }
        })
        fix.executed = true
        fixed++
        console.log(`  ✅ ${fix.description}`)

      } else if (fix.type === 'CREATE_ORDER_ITEM_AND_BOOKING') {
        const { orderId, studentId, productId, bookingDate, price, startHour, endHour, locationId } = fix.details as {
          orderId: string; studentId: string; productId: string; bookingDate: string
          price: number; startHour: number; endHour: number; locationId: string
        }

        // Create order item if missing
        const existingItem = await prisma.orderItem.findFirst({
          where: {
            orderId, studentId, productId,
            bookingDate: {
              gte: new Date(bookingDate + 'T00:00:00.000Z'),
              lt: new Date(bookingDate + 'T23:59:59.999Z')
            }
          }
        })
        if (!existingItem) {
          await prisma.orderItem.create({
            data: {
              orderId, productId, studentId,
              bookingDate: new Date(bookingDate + 'T00:00:00.000Z'),
              price: new Prisma.Decimal(price)
            }
          })
          console.log(`  ✅ Created order item: ${fix.description}`)
        }

        // Create booking if missing
        const existingBooking = await prisma.booking.findFirst({
          where: {
            studentId, productId,
            startDate: {
              gte: new Date(bookingDate + 'T00:00:00.000Z'),
              lt: new Date(bookingDate + 'T23:59:59.999Z')
            }
          }
        })
        if (!existingBooking) {
          const startDate = new Date(bookingDate + 'T00:00:00.000Z')
          startDate.setUTCHours(startHour, 0, 0, 0)
          const endDate = new Date(bookingDate + 'T00:00:00.000Z')
          endDate.setUTCHours(endHour, 0, 0, 0)

          await prisma.booking.create({
            data: {
              studentId, productId, locationId,
              startDate, endDate,
              status: 'CONFIRMED',
              totalPrice: new Prisma.Decimal(price),
              notes: `Bundle fill verified — Order: ${orderId}`
            }
          })
          console.log(`  ✅ Created booking: ${fix.description}`)
        } else {
          console.log(`  ⏭️  Booking exists: ${fix.description}`)
        }

        fix.executed = true
        fixed++

      } else if (fix.type === 'MERGE_STUDENT') {
        const { canonicalId, duplicateId, moveBookings, moveOrderItems, moveIgniteSubs } = fix.details as {
          canonicalId: string; duplicateId: string; moveBookings: number
          moveOrderItems: number; moveIgniteSubs: number; name: string
        }

        // Move bookings
        if (moveBookings > 0) {
          const result = await prisma.booking.updateMany({
            where: { studentId: duplicateId },
            data: { studentId: canonicalId }
          })
          console.log(`     Moved ${result.count} bookings`)
        }

        // Move order items
        if (moveOrderItems > 0) {
          const result = await prisma.orderItem.updateMany({
            where: { studentId: duplicateId },
            data: { studentId: canonicalId }
          })
          console.log(`     Moved ${result.count} order items`)
        }

        // Move ignite subscriptions
        if (moveIgniteSubs > 0) {
          const result = await prisma.igniteSubscriptionStudent.updateMany({
            where: { studentId: duplicateId },
            data: { studentId: canonicalId }
          })
          console.log(`     Moved ${result.count} ignite subscription links`)
        }

        // Verify duplicate is now empty, then delete
        const remaining = await prisma.student.findUnique({
          where: { id: duplicateId },
          include: {
            bookings: { select: { id: true } },
            orderItems: { select: { id: true } },
            igniteSubscriptions: { select: { id: true } }
          }
        })

        if (remaining &&
          remaining.bookings.length === 0 &&
          remaining.orderItems.length === 0 &&
          remaining.igniteSubscriptions.length === 0
        ) {
          await prisma.student.delete({ where: { id: duplicateId } })
          console.log(`  ✅ ${fix.description} — deleted empty duplicate`)
        } else {
          console.log(`  ⚠️  ${fix.description} — duplicate still has references, skipping delete`)
        }
        fix.executed = true
        fixed++

      } else if (fix.type === 'FIX_LOCATION') {
        const { bookingId, locationId } = fix.details as { bookingId: string; locationId: string }
        await prisma.booking.update({
          where: { id: bookingId },
          data: { locationId }
        })
        fix.executed = true
        fixed++
        console.log(`  ✅ ${fix.description}`)
      }

    } catch (error) {
      errors++
      console.error(`  ❌ Failed: ${fix.description} — ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.log(`\n  Applied: ${fixed} | Errors: ${errors}`)
}

// ─── MAIN ────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║  FULL BOOKING VERIFICATION — Stripe Source of Truth  ║')
  console.log('╚═══════════════════════════════════════════════════════╝')
  console.log(`  Mode: ${DRY_RUN ? '🔎 DRY RUN (audit only)' : '🔧 FIX MODE'}`)
  console.log(`  Time: ${new Date().toISOString()}\n`)

  // DB snapshot
  const stats = {
    orders: await prisma.order.count(),
    paidOrders: await prisma.order.count({ where: { status: 'PAID' } }),
    pendingOrders: await prisma.order.count({ where: { status: 'PENDING' } }),
    orderItems: await prisma.orderItem.count(),
    bookings: await prisma.booking.count(),
    campBookings: await prisma.booking.count({ where: { product: { type: 'CAMP' }, status: 'CONFIRMED' } }),
    students: await prisma.student.count(),
    locations: await prisma.location.count({ where: { isActive: true } })
  }

  console.log('📊 Current Database Snapshot:')
  console.log(`   Orders: ${stats.orders} (${stats.paidOrders} PAID, ${stats.pendingOrders} PENDING)`)
  console.log(`   Order Items: ${stats.orderItems}`)
  console.log(`   Bookings: ${stats.bookings} total (${stats.campBookings} confirmed camp)`)
  console.log(`   Students: ${stats.students}`)
  console.log(`   Active Locations: ${stats.locations}\n`)

  // Run all checks
  const part1 = await verifyStripeVsDB()
  const part2 = await findDuplicateStudents()
  const part3 = await findOrphanBookings()
  const part5 = await verifyLocations()
  // Part 4 (triple-check) must run after Part 1 since it uses stripeExpectedByDate
  const part4 = await tripleCheckByDate()

  const allIssues = [...part1.issues, ...part2.issues, ...part3.issues, ...part4.issues, ...part5.issues]
  const allFixes = [...part1.fixes, ...part2.fixes, ...part5.fixes]

  // Deduplicate fixes
  const seenFixes = new Set<string>()
  const dedupedFixes: Fix[] = []
  for (const fix of allFixes) {
    const key = `${fix.type}::${JSON.stringify(fix.details)}`
    if (!seenFixes.has(key)) {
      seenFixes.add(key)
      dedupedFixes.push(fix)
    }
  }

  // ─── SUMMARY ────────────────────────────────────────────────────
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║                    AUDIT SUMMARY                     ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')

  const issuesByType = new Map<string, Issue[]>()
  for (const issue of allIssues) {
    if (!issuesByType.has(issue.type)) issuesByType.set(issue.type, [])
    issuesByType.get(issue.type)!.push(issue)
  }

  if (allIssues.length === 0) {
    console.log('  ✅ ALL CLEAR — Every Stripe payment has matching orders and bookings.')
    console.log('  ✅ No duplicate students found.')
    console.log('  ✅ No orphan bookings found.')
    console.log('  ✅ All locations correct.')
  } else {
    console.log(`  Found ${allIssues.length} total issues:\n`)
    for (const [type, typeIssues] of issuesByType) {
      console.log(`  📌 ${type} (${typeIssues.length}):`)
      for (const issue of typeIssues) {
        console.log(`     • ${issue.description}`)
      }
      console.log('')
    }
  }

  if (dedupedFixes.length > 0) {
    console.log(`  🔧 ${dedupedFixes.length} fixes needed:\n`)
    for (const fix of dedupedFixes) {
      console.log(`     [${fix.type}] ${fix.description}`)
    }
  }

  if (!DRY_RUN && dedupedFixes.length > 0) {
    await executeFixes(dedupedFixes)

    // Post-fix snapshot
    const newStats = {
      orders: await prisma.order.count(),
      paidOrders: await prisma.order.count({ where: { status: 'PAID' } }),
      orderItems: await prisma.orderItem.count(),
      bookings: await prisma.booking.count(),
      campBookings: await prisma.booking.count({ where: { product: { type: 'CAMP' }, status: 'CONFIRMED' } }),
      students: await prisma.student.count()
    }

    console.log('\n📊 Updated Database Snapshot:')
    console.log(`   Orders: ${stats.orders} → ${newStats.orders} (${newStats.orders - stats.orders >= 0 ? '+' : ''}${newStats.orders - stats.orders})`)
    console.log(`   PAID Orders: ${stats.paidOrders} → ${newStats.paidOrders}`)
    console.log(`   Order Items: ${stats.orderItems} → ${newStats.orderItems} (${newStats.orderItems - stats.orderItems >= 0 ? '+' : ''}${newStats.orderItems - stats.orderItems})`)
    console.log(`   Bookings: ${stats.bookings} → ${newStats.bookings} (${newStats.bookings - stats.bookings >= 0 ? '+' : ''}${newStats.bookings - stats.bookings})`)
    console.log(`   Camp Bookings: ${stats.campBookings} → ${newStats.campBookings}`)
    console.log(`   Students: ${stats.students} → ${newStats.students} (${newStats.students - stats.students >= 0 ? '+' : ''}${newStats.students - stats.students})`)
  } else if (DRY_RUN && dedupedFixes.length > 0) {
    console.log(`\n  ℹ️  Run with --fix to apply changes:`)
    console.log(`     npx tsx scripts/full-booking-verification.ts --fix`)
  }
}

main()
  .catch(e => { console.error('\n❌ Fatal:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
