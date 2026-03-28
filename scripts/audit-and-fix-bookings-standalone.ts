/**
 * Audit & Fix Bookings Script (Standalone - no external deps except Prisma)
 *
 * This script does TWO things:
 * 1. AUDIT: Compares Stripe paid sessions against the database to find gaps
 * 2. FIX: Creates missing bookings (ONLY additions, never deletes)
 *
 * Run audit only:   npx tsx scripts/audit-and-fix-bookings-standalone.ts
 * Run with fixes:   npx tsx scripts/audit-and-fix-bookings-standalone.ts --fix
 *
 * It checks:
 * - Paid Stripe checkout sessions that have no order or are still PENDING
 * - PAID orders where order items have no corresponding booking
 * - 3-day camp purchases (3 separate Day Camp / All Day Camp items) with missing bookings
 */

import { PrismaClient, Prisma } from '@prisma/client'

const DRY_RUN = !process.argv.includes('--fix')
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment')
  process.exit(1)
}

const prisma = new PrismaClient()

// ─── INLINE HELPERS (no external deps) ───────────────────────────────────

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// ─── STRIPE API via fetch ────────────────────────────────────────────────

async function stripeGet(path: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`https://api.stripe.com/v1${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
  }
  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` }
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Stripe API error ${resp.status}: ${text}`)
  }
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
  description: string
  quantity: number
  amount_total: number
}

async function fetchAllPaidPaymentSessions(): Promise<StripeSession[]> {
  const sessions: StripeSession[] = []
  let startingAfter: string | undefined
  let hasMore = true

  while (hasMore) {
    // Only fetch sessions from March 2026 onwards
    const marchStart = Math.floor(new Date('2026-03-01T00:00:00Z').getTime() / 1000)
    const params: Record<string, string> = { limit: '100', status: 'complete', 'created[gte]': String(marchStart) }
    if (startingAfter) params.starting_after = startingAfter

    const data = await stripeGet('/checkout/sessions', params)
    for (const s of data.data) {
      if (s.payment_status === 'paid' && s.mode === 'payment') {
        sessions.push(s)
      }
    }
    hasMore = data.has_more
    if (data.data.length > 0) {
      startingAfter = data.data[data.data.length - 1].id
    }
  }
  return sessions
}

async function fetchLineItems(sessionId: string): Promise<StripeLineItem[]> {
  const data = await stripeGet(`/checkout/sessions/${sessionId}/line_items`, { limit: '100' })
  return data.data
}

// ─── TYPES ───────────────────────────────────────────────────────────────

interface AuditIssue {
  type: 'MISSING_ORDER' | 'PENDING_ORDER_PAID_IN_STRIPE' | 'ORDER_ITEM_NO_BOOKING' | 'BUNDLE_INCOMPLETE'
  description: string
  details: Record<string, unknown>
}

interface FixAction {
  type: 'UPDATE_ORDER_STATUS' | 'CREATE_BOOKING' | 'CREATE_ORDER_ITEM_AND_BOOKING'
  description: string
  executed: boolean
  details: Record<string, unknown>
}

// ─── HELPERS ─────────────────────────────────────────────────────────────

function getCampTimes(productName: string): { startHour: number; endHour: number } {
  const isAllDay = productName.toLowerCase().includes('all day')
  return { startHour: 9, endHour: isAllDay ? 17 : 15 }
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function isWeekday(d: Date): boolean {
  const day = d.getDay()
  return day !== 0 && day !== 6
}

// ─── PART 1: AUDIT STRIPE vs DATABASE ────────────────────────────────────

async function auditStripeVsDatabase(): Promise<{ issues: AuditIssue[]; fixes: FixAction[] }> {
  const issues: AuditIssue[] = []
  const fixes: FixAction[] = []

  console.log('═══════════════════════════════════════════════════════')
  console.log('  PART 1: Checking Stripe paid sessions vs Database')
  console.log('═══════════════════════════════════════════════════════\n')

  const allSessions = await fetchAllPaidPaymentSessions()
  console.log(`📋 Found ${allSessions.length} paid payment checkout sessions in Stripe\n`)

  for (const session of allSessions) {
    const orderId = session.metadata?.orderId
    const customerEmail = session.customer_details?.email || 'unknown'
    const customerName = session.customer_details?.name || 'unknown'
    const amount = ((session.amount_total || 0) / 100).toFixed(2)

    // Try to find the order in our database
    let order = orderId
      ? await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: { include: { product: true, student: true } } }
      })
      : null

    // Also try by stripePaymentIntentId
    if (!order) {
      order = await prisma.order.findFirst({
        where: {
          OR: [
            ...(session.payment_intent ? [{ stripePaymentIntentId: session.payment_intent }] : []),
            { stripePaymentIntentId: session.id }
          ]
        },
        include: { orderItems: { include: { product: true, student: true } } }
      })
    }

    if (!order) {
      // Fetch line items for context
      let lineItemDesc = ''
      try {
        const lineItems = await fetchLineItems(session.id)
        lineItemDesc = lineItems.map(li => `${li.description} x${li.quantity}`).join(', ')
      } catch { /* ignore */ }

      issues.push({
        type: 'MISSING_ORDER',
        description: `Stripe session ${session.id} ($${amount}) for ${customerName} (${customerEmail}) has NO order in database. Items: ${lineItemDesc}`,
        details: {
          sessionId: session.id,
          paymentIntent: session.payment_intent,
          customerEmail,
          customerName,
          amount,
          lineItems: lineItemDesc,
          created: new Date(session.created * 1000).toISOString()
        }
      })
      continue
    }

    // Check if order is still PENDING but paid in Stripe
    if (order.status === 'PENDING') {
      issues.push({
        type: 'PENDING_ORDER_PAID_IN_STRIPE',
        description: `Order ${order.id} is PENDING but paid in Stripe (session ${session.id})`,
        details: {
          orderId: order.id,
          sessionId: session.id,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          amount
        }
      })

      fixes.push({
        type: 'UPDATE_ORDER_STATUS',
        description: `Update order ${order.id} from PENDING to PAID`,
        executed: false,
        details: { orderId: order.id }
      })
    }

    // For PAID (or about-to-be-fixed) orders, check that each order item has a booking
    if (order.status === 'PAID' || order.status === 'PENDING') {
      for (const item of order.orderItems) {
        if (item.product.type !== 'CAMP' && item.product.type !== 'BIRTHDAY') continue

        const bookingDateStr = dateStr(item.bookingDate)
        const existingBooking = await prisma.booking.findFirst({
          where: {
            studentId: item.studentId,
            productId: item.productId,
            startDate: {
              gte: new Date(bookingDateStr + 'T00:00:00.000Z'),
              lt: new Date(bookingDateStr + 'T23:59:59.999Z')
            }
          }
        })

        if (!existingBooking) {
          const { startHour, endHour } = getCampTimes(item.product.name)

          issues.push({
            type: 'ORDER_ITEM_NO_BOOKING',
            description: `Order ${order.id}: No booking for ${item.student.name} - ${item.product.name} on ${bookingDateStr}`,
            details: {
              orderId: order.id,
              orderItemId: item.id,
              studentId: item.studentId,
              studentName: item.student.name,
              productId: item.productId,
              productName: item.product.name,
              bookingDate: bookingDateStr,
              price: Number(item.price),
              startHour,
              endHour
            }
          })

          fixes.push({
            type: 'CREATE_BOOKING',
            description: `Create booking for ${item.student.name} - ${item.product.name} on ${bookingDateStr}`,
            executed: false,
            details: {
              orderId: order.id,
              studentId: item.studentId,
              productId: item.productId,
              bookingDate: bookingDateStr,
              price: Number(item.price),
              startHour,
              endHour
            }
          })
        }
      }
    }
  }

  return { issues, fixes }
}

// ─── PART 2: AUDIT 3-DAY CAMP PURCHASES ─────────────────────────────────

async function auditBundles(): Promise<{ issues: AuditIssue[]; fixes: FixAction[] }> {
  const issues: AuditIssue[] = []
  const fixes: FixAction[] = []

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  PART 2: Checking 3-Day camp purchases for missing days')
  console.log('═══════════════════════════════════════════════════════\n')

  const campOrders = await prisma.order.findMany({
    where: {
      status: 'PAID',
      orderItems: {
        some: {
          product: { type: 'CAMP' }
        }
      }
    },
    include: {
      orderItems: {
        include: { product: true, student: true },
        orderBy: { bookingDate: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`📋 Found ${campOrders.length} PAID orders with camp products\n`)

  for (const order of campOrders) {
    const groupKey = (item: typeof order.orderItems[0]) => `${item.studentId}::${item.productId}`
    const groups = new Map<string, typeof order.orderItems>()

    for (const item of order.orderItems) {
      if (item.product.type !== 'CAMP') continue
      const key = groupKey(item)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }

    for (const [, items] of groups) {
      const studentName = items[0].student.name
      const productName = items[0].product.name
      const singleDayPrice = Number(items[0].product.price)

      const totalPaidForThisGroup = items.reduce((sum, i) => sum + Number(i.price), 0)
      const estimatedDays = Math.round(totalPaidForThisGroup / singleDayPrice)
      const actualDays = items.length

      // If they have 3+, just verify bookings exist
      if (actualDays >= 3) {
        for (const item of items) {
          const bDateStr = dateStr(item.bookingDate)
          const existingBooking = await prisma.booking.findFirst({
            where: {
              studentId: item.studentId,
              productId: item.productId,
              startDate: {
                gte: new Date(bDateStr + 'T00:00:00.000Z'),
                lt: new Date(bDateStr + 'T23:59:59.999Z')
              }
            }
          })

          if (!existingBooking) {
            const { startHour, endHour } = getCampTimes(productName)
            issues.push({
              type: 'ORDER_ITEM_NO_BOOKING',
              description: `Order ${order.id}: No booking for ${studentName} - ${productName} on ${bDateStr}`,
              details: {
                orderId: order.id, studentId: item.studentId, productId: item.productId,
                bookingDate: bDateStr, price: Number(item.price), startHour, endHour
              }
            })
            fixes.push({
              type: 'CREATE_BOOKING',
              description: `Create booking for ${studentName} - ${productName} on ${bDateStr}`,
              executed: false,
              details: {
                orderId: order.id, studentId: item.studentId, productId: item.productId,
                bookingDate: bDateStr, price: Number(item.price), startHour, endHour
              }
            })
          }
        }
        continue
      }

      // If they paid for 3 days but only have 1 or 2 order items
      if (estimatedDays >= 3 && actualDays < 3) {
        const existingDates = items.map(i => i.bookingDate).sort((a, b) => a.getTime() - b.getTime())
        const firstDate = existingDates[0]
        const existingDateStrs = existingDates.map(d => dateStr(d))

        // Calculate 3 consecutive weekdays starting from first date
        const targetDates: Date[] = []
        let currentDate = new Date(firstDate)
        while (targetDates.length < 3) {
          if (isWeekday(currentDate)) {
            targetDates.push(new Date(currentDate))
          }
          currentDate = addDays(currentDate, 1)
        }
        const targetDateStrs = targetDates.map(d => dateStr(d))
        const missingDateStrs = targetDateStrs.filter(d => !existingDateStrs.includes(d))

        if (missingDateStrs.length > 0) {
          const { startHour, endHour } = getCampTimes(productName)
          const pricePerDay = totalPaidForThisGroup / 3

          issues.push({
            type: 'BUNDLE_INCOMPLETE',
            description: `Order ${order.id}: ${studentName} - ${productName} paid for ~3 days ($${totalPaidForThisGroup.toFixed(2)}) but has ${actualDays} order items. Existing: [${existingDateStrs.join(', ')}]. Missing: [${missingDateStrs.join(', ')}]`,
            details: {
              orderId: order.id, customerName: order.customerName,
              studentId: items[0].studentId, studentName,
              productId: items[0].productId, productName,
              existingDates: existingDateStrs, missingDates: missingDateStrs,
              totalPaid: totalPaidForThisGroup, pricePerDay
            }
          })

          for (const missDate of missingDateStrs) {
            fixes.push({
              type: 'CREATE_ORDER_ITEM_AND_BOOKING',
              description: `Create order item + booking for ${studentName} - ${productName} on ${missDate}`,
              executed: false,
              details: {
                orderId: order.id, studentId: items[0].studentId, productId: items[0].productId,
                bookingDate: missDate, price: pricePerDay, startHour, endHour
              }
            })
          }
        }
      }

      // Also verify bookings exist for whatever items they do have
      for (const item of items) {
        const bDateStr = dateStr(item.bookingDate)
        const existingBooking = await prisma.booking.findFirst({
          where: {
            studentId: item.studentId,
            productId: item.productId,
            startDate: {
              gte: new Date(bDateStr + 'T00:00:00.000Z'),
              lt: new Date(bDateStr + 'T23:59:59.999Z')
            }
          }
        })

        if (!existingBooking) {
          const { startHour, endHour } = getCampTimes(productName)
          const alreadyFlagged = issues.some(
            i => i.details.orderItemId === item.id ||
              (i.details.orderId === order.id && i.details.studentId === item.studentId && i.details.bookingDate === bDateStr)
          )
          if (!alreadyFlagged) {
            issues.push({
              type: 'ORDER_ITEM_NO_BOOKING',
              description: `Order ${order.id}: No booking for ${studentName} - ${productName} on ${bDateStr}`,
              details: {
                orderId: order.id, studentId: item.studentId, productId: item.productId,
                bookingDate: bDateStr, price: Number(item.price), startHour, endHour
              }
            })
            fixes.push({
              type: 'CREATE_BOOKING',
              description: `Create booking for ${studentName} - ${productName} on ${bDateStr}`,
              executed: false,
              details: {
                orderId: order.id, studentId: item.studentId, productId: item.productId,
                bookingDate: bDateStr, price: Number(item.price), startHour, endHour
              }
            })
          }
        }
      }
    }
  }

  return { issues, fixes }
}

// ─── PART 3: EXECUTE FIXES ───────────────────────────────────────────────

async function executeFixes(fixes: FixAction[]): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  EXECUTING FIXES (additions only, no deletions)')
  console.log('═══════════════════════════════════════════════════════\n')

  const location = await prisma.location.findFirst({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })

  if (!location) {
    console.error('❌ No active location found! Cannot create bookings.')
    return
  }

  let fixedCount = 0
  let errorCount = 0

  for (const fix of fixes) {
    try {
      if (fix.type === 'UPDATE_ORDER_STATUS') {
        const orderId = fix.details.orderId as string
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'PAID' }
        })
        fix.executed = true
        fixedCount++
        console.log(`   ✅ ${fix.description}`)

      } else if (fix.type === 'CREATE_BOOKING') {
        const { studentId, productId, bookingDate, price, startHour, endHour } = fix.details as {
          studentId: string; productId: string; bookingDate: string; price: number; startHour: number; endHour: number
        }
        const orderId = fix.details.orderId as string

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
          console.log(`   ⏭️  Booking already exists (safe skip): ${fix.description}`)
          continue
        }

        const startDate = new Date(bookingDate + 'T00:00:00.000Z')
        startDate.setUTCHours(startHour, 0, 0, 0)
        const endDate = new Date(bookingDate + 'T00:00:00.000Z')
        endDate.setUTCHours(endHour, 0, 0, 0)

        await prisma.booking.create({
          data: {
            studentId, productId,
            locationId: location.id,
            startDate, endDate,
            status: 'CONFIRMED',
            totalPrice: new Prisma.Decimal(price),
            notes: `Reconciled - Order: ${orderId}`
          }
        })
        fix.executed = true
        fixedCount++
        console.log(`   ✅ ${fix.description}`)

      } else if (fix.type === 'CREATE_ORDER_ITEM_AND_BOOKING') {
        const { orderId, studentId, productId, bookingDate, price, startHour, endHour } = fix.details as {
          orderId: string; studentId: string; productId: string; bookingDate: string; price: number; startHour: number; endHour: number
        }

        // Double-check no duplicate order item
        const existingItem = await prisma.orderItem.findFirst({
          where: {
            orderId, studentId, productId,
            bookingDate: {
              gte: new Date(bookingDate + 'T00:00:00.000Z'),
              lt: new Date(bookingDate + 'T23:59:59.999Z')
            }
          }
        })

        if (existingItem) {
          console.log(`   ⏭️  Order item already exists: ${fix.description}`)
        } else {
          await prisma.orderItem.create({
            data: {
              orderId, productId, studentId,
              bookingDate: new Date(bookingDate + 'T00:00:00.000Z'),
              price: new Prisma.Decimal(price)
            }
          })
        }

        // Double-check no duplicate booking
        const existingBooking = await prisma.booking.findFirst({
          where: {
            studentId, productId,
            startDate: {
              gte: new Date(bookingDate + 'T00:00:00.000Z'),
              lt: new Date(bookingDate + 'T23:59:59.999Z')
            }
          }
        })

        if (existingBooking) {
          console.log(`   ⏭️  Booking already exists: ${fix.description}`)
        } else {
          const startDate = new Date(bookingDate + 'T00:00:00.000Z')
          startDate.setUTCHours(startHour, 0, 0, 0)
          const endDate = new Date(bookingDate + 'T00:00:00.000Z')
          endDate.setUTCHours(endHour, 0, 0, 0)

          await prisma.booking.create({
            data: {
              studentId, productId,
              locationId: location.id,
              startDate, endDate,
              status: 'CONFIRMED',
              totalPrice: new Prisma.Decimal(price),
              notes: `Bundle auto-fill reconciled - Order: ${orderId}`
            }
          })
        }

        fix.executed = true
        fixedCount++
        console.log(`   ✅ ${fix.description}`)
      }
    } catch (error) {
      errorCount++
      console.error(`   ❌ Failed: ${fix.description} - ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.log(`\n   Fixed: ${fixedCount} | Errors: ${errorCount}`)
}

// ─── MAIN ────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Booking Reconciliation Audit')
  console.log(`   Mode: ${DRY_RUN ? '🔎 DRY RUN (audit only)' : '🔧 FIX MODE (will create missing records)'}`)
  console.log(`   Time: ${new Date().toISOString()}\n`)

  const totalOrders = await prisma.order.count()
  const paidOrders = await prisma.order.count({ where: { status: 'PAID' } })
  const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } })
  const totalBookings = await prisma.booking.count()
  const totalOrderItems = await prisma.orderItem.count()

  console.log('📊 Current Database State:')
  console.log(`   Orders: ${totalOrders} total (${paidOrders} PAID, ${pendingOrders} PENDING)`)
  console.log(`   Order Items: ${totalOrderItems}`)
  console.log(`   Bookings: ${totalBookings}\n`)

  const stripe1 = await auditStripeVsDatabase()
  const bundles = await auditBundles()

  const allIssues = [...stripe1.issues, ...bundles.issues]
  const allFixes = [...stripe1.fixes, ...bundles.fixes]

  // Deduplicate fixes (same orderId + studentId + bookingDate)
  const seenFixes = new Set<string>()
  const dedupedFixes: FixAction[] = []
  for (const fix of allFixes) {
    const key = `${fix.type}::${fix.details.orderId}::${fix.details.studentId}::${fix.details.bookingDate}`
    if (!seenFixes.has(key)) {
      seenFixes.add(key)
      dedupedFixes.push(fix)
    }
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  AUDIT SUMMARY')
  console.log('═══════════════════════════════════════════════════════\n')

  const issuesByType = new Map<string, AuditIssue[]>()
  for (const issue of allIssues) {
    if (!issuesByType.has(issue.type)) issuesByType.set(issue.type, [])
    issuesByType.get(issue.type)!.push(issue)
  }

  if (allIssues.length === 0) {
    console.log('   ✅ No issues found! All Stripe payments have corresponding bookings.')
    console.log('   ✅ All 3-day camp purchases have the correct number of bookings.')
  } else {
    console.log(`   Found ${allIssues.length} issues:\n`)

    for (const [type, typeIssues] of issuesByType) {
      console.log(`   📌 ${type} (${typeIssues.length}):`)
      for (const issue of typeIssues) {
        console.log(`      • ${issue.description}`)
      }
      console.log('')
    }
  }

  if (dedupedFixes.length > 0) {
    console.log(`\n   🔧 ${dedupedFixes.length} fixes needed:\n`)
    for (const fix of dedupedFixes) {
      console.log(`      • [${fix.type}] ${fix.description}`)
    }
  }

  if (!DRY_RUN && dedupedFixes.length > 0) {
    await executeFixes(dedupedFixes)
  } else if (DRY_RUN && dedupedFixes.length > 0) {
    console.log(`\n   ℹ️  Run with --fix to apply these changes:`)
    console.log(`      npx tsx scripts/audit-and-fix-bookings-standalone.ts --fix`)
  }

  if (!DRY_RUN && dedupedFixes.length > 0) {
    const newBookings = await prisma.booking.count()
    const newOrderItems = await prisma.orderItem.count()
    console.log('\n📊 Updated Database State:')
    console.log(`   Bookings: ${totalBookings} → ${newBookings} (+${newBookings - totalBookings})`)
    console.log(`   Order Items: ${totalOrderItems} → ${newOrderItems} (+${newOrderItems - totalOrderItems})`)
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
