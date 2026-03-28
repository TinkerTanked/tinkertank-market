/**
 * Audit & Fix Bookings Script
 * 
 * This script does TWO things:
 * 1. AUDIT: Compares Stripe paid sessions against the database to find gaps
 * 2. FIX: Creates missing bookings (ONLY additions, never deletes)
 * 
 * Run audit only:   npx tsx scripts/audit-and-fix-bookings.ts
 * Run with fixes:   npx tsx scripts/audit-and-fix-bookings.ts --fix
 * 
 * It checks:
 * - Paid Stripe checkout sessions that have no order or are still PENDING
 * - PAID orders where order items have no corresponding booking
 * - 3-day bundle orders that have fewer than 3 order items / bookings
 */

// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv/config') } catch { /* dotenv not available in production */ }
}
import Stripe from 'stripe'
import { PrismaClient, Prisma } from '@prisma/client'
import { addDays } from 'date-fns'

const DRY_RUN = !process.argv.includes('--fix')

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia'
})

const prisma = new PrismaClient()

// 3-day purchases are 3 separate Day Camp or All Day Camp order items in the same order for the same student
const CAMP_PRODUCT_NAMES = ['Day Camp', 'All Day Camp']

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

  // Fetch ALL completed checkout sessions from Stripe (not subscriptions)
  let allSessions: Stripe.Checkout.Session[] = []
  let hasMore = true
  let startingAfter: string | undefined

  while (hasMore) {
    const batch = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete',
      ...(startingAfter && { starting_after: startingAfter })
    })

    const paymentSessions = batch.data.filter(
      s => s.payment_status === 'paid' && s.mode === 'payment'
    )
    allSessions.push(...paymentSessions)

    hasMore = batch.has_more
    if (batch.data.length > 0) {
      startingAfter = batch.data[batch.data.length - 1].id
    }
  }

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
            { stripePaymentIntentId: session.payment_intent as string },
            { stripePaymentIntentId: session.id }
          ]
        },
        include: { orderItems: { include: { product: true, student: true } } }
      })
    }

    if (!order) {
      issues.push({
        type: 'MISSING_ORDER',
        description: `Stripe session ${session.id} ($${amount}) for ${customerName} (${customerEmail}) has NO order in database`,
        details: {
          sessionId: session.id,
          paymentIntent: session.payment_intent,
          customerEmail,
          customerName,
          amount,
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

        // Find a booking matching this order item
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

// ─── PART 2: AUDIT 3-DAY BUNDLES ─────────────────────────────────────────

async function auditBundles(): Promise<{ issues: AuditIssue[]; fixes: FixAction[] }> {
  const issues: AuditIssue[] = []
  const fixes: FixAction[] = []

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  PART 2: Checking 3-Day camp purchases for missing days')
  console.log('═══════════════════════════════════════════════════════\n')

  // Find all PAID orders that have camp items
  const campOrders = await prisma.order.findMany({
    where: {
      status: 'PAID',
      orderItems: {
        some: {
          product: {
            type: 'CAMP'
          }
        }
      }
    },
    include: {
      orderItems: {
        include: {
          product: true,
          student: true
        },
        orderBy: { bookingDate: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`📋 Found ${campOrders.length} PAID orders with camp products\n`)

  // Look at the order total vs product price to detect 3-day purchases
  // A 3-day purchase would have total ~= 3 * single day price for that student
  // OR it has exactly 3 camp order items for the same student+product
  // OR it has fewer than 3 but the total suggests 3 days were purchased

  for (const order of campOrders) {
    // Group camp order items by student+product
    const groupKey = (item: typeof order.orderItems[0]) => `${item.studentId}::${item.productId}`
    const groups = new Map<string, typeof order.orderItems>()

    for (const item of order.orderItems) {
      if (item.product.type !== 'CAMP') continue
      const key = groupKey(item)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }

    for (const [key, items] of groups) {
      const studentName = items[0].student.name
      const productName = items[0].product.name
      const singleDayPrice = Number(items[0].product.price)

      // Check if this looks like a 3-day purchase:
      // - The order total for this student's camp items suggests 3 days
      // - OR the Stripe line item description includes "3 days" or quantity 3
      const totalPaidForThisGroup = items.reduce((sum, i) => sum + Number(i.price), 0)
      const estimatedDays = Math.round(totalPaidForThisGroup / singleDayPrice)
      const actualDays = items.length

      // If they have exactly 3, just verify bookings exist
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
                orderId: order.id,
                studentId: item.studentId,
                productId: item.productId,
                bookingDate: bDateStr,
                price: Number(item.price),
                startHour,
                endHour
              }
            })

            fixes.push({
              type: 'CREATE_BOOKING',
              description: `Create booking for ${studentName} - ${productName} on ${bDateStr}`,
              executed: false,
              details: {
                orderId: order.id,
                studentId: item.studentId,
                productId: item.productId,
                bookingDate: bDateStr,
                price: Number(item.price),
                startHour,
                endHour
              }
            })
          }
        }
        continue
      }

      // If they paid for 3 days but only have 1 or 2 order items, fill in the rest
      if (estimatedDays >= 3 && actualDays < 3) {
        const existingDates = items.map(i => i.bookingDate).sort((a, b) => a.getTime() - b.getTime())
        const firstDate = existingDates[0]
        const existingDateStrs = existingDates.map(d => dateStr(d))

        // Calculate 3 consecutive weekdays starting from the first date
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
              orderId: order.id,
              customerName: order.customerName,
              studentId: items[0].studentId,
              studentName,
              productId: items[0].productId,
              productName,
              existingDates: existingDateStrs,
              missingDates: missingDateStrs,
              totalPaid: totalPaidForThisGroup,
              pricePerDay
            }
          })

          for (const missDate of missingDateStrs) {
            fixes.push({
              type: 'CREATE_ORDER_ITEM_AND_BOOKING',
              description: `Create order item + booking for ${studentName} - ${productName} on ${missDate}`,
              executed: false,
              details: {
                orderId: order.id,
                studentId: items[0].studentId,
                productId: items[0].productId,
                bookingDate: missDate,
                price: pricePerDay,
                startHour,
                endHour
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
          // Check if this was already flagged from Part 1
          const alreadyFlagged = issues.some(
            i => i.details.orderItemId === item.id || 
              (i.details.orderId === order.id && i.details.studentId === item.studentId && i.details.bookingDate === bDateStr)
          )
          if (!alreadyFlagged) {
            issues.push({
              type: 'ORDER_ITEM_NO_BOOKING',
              description: `Order ${order.id}: No booking for ${studentName} - ${productName} on ${bDateStr}`,
              details: {
                orderId: order.id,
                studentId: item.studentId,
                productId: item.productId,
                bookingDate: bDateStr,
                price: Number(item.price),
                startHour,
                endHour
              }
            })

            fixes.push({
              type: 'CREATE_BOOKING',
              description: `Create booking for ${studentName} - ${productName} on ${bDateStr}`,
              executed: false,
              details: {
                orderId: order.id,
                studentId: item.studentId,
                productId: item.productId,
                bookingDate: bDateStr,
                price: Number(item.price),
                startHour,
                endHour
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
            studentId,
            productId,
            startDate: {
              gte: new Date(bookingDate + 'T00:00:00.000Z'),
              lt: new Date(bookingDate + 'T23:59:59.999Z')
            }
          }
        })

        if (existing) {
          console.log(`   ⏭️  Booking already exists (race condition safe): ${fix.description}`)
          continue
        }

        const startDate = new Date(bookingDate + 'T00:00:00.000Z')
        startDate.setUTCHours(startHour, 0, 0, 0)
        const endDate = new Date(bookingDate + 'T00:00:00.000Z')
        endDate.setUTCHours(endHour, 0, 0, 0)

        await prisma.booking.create({
          data: {
            studentId,
            productId,
            locationId: location.id,
            startDate,
            endDate,
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
            orderId,
            studentId,
            productId,
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
              orderId,
              productId,
              studentId,
              bookingDate: new Date(bookingDate + 'T00:00:00.000Z'),
              price: new Prisma.Decimal(price)
            }
          })
        }

        // Double-check no duplicate booking
        const existingBooking = await prisma.booking.findFirst({
          where: {
            studentId,
            productId,
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
              studentId,
              productId,
              locationId: location.id,
              startDate,
              endDate,
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

  // Current state
  const totalOrders = await prisma.order.count()
  const paidOrders = await prisma.order.count({ where: { status: 'PAID' } })
  const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } })
  const totalBookings = await prisma.booking.count()
  const totalOrderItems = await prisma.orderItem.count()

  console.log('📊 Current Database State:')
  console.log(`   Orders: ${totalOrders} total (${paidOrders} PAID, ${pendingOrders} PENDING)`)
  console.log(`   Order Items: ${totalOrderItems}`)
  console.log(`   Bookings: ${totalBookings}\n`)

  // Run audits
  const stripe1 = await auditStripeVsDatabase()
  const bundles = await auditBundles()

  // Combine results
  const allIssues = [...stripe1.issues, ...bundles.issues]
  const allFixes = [...stripe1.fixes, ...bundles.fixes]

  // Print summary
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
    console.log('   ✅ All 3-day bundles have 3 bookings.')
  } else {
    console.log(`   Found ${allIssues.length} issues:\n`)

    for (const [type, issues] of issuesByType) {
      console.log(`   📌 ${type} (${issues.length}):`)
      for (const issue of issues) {
        console.log(`      • ${issue.description}`)
      }
      console.log('')
    }
  }

  if (allFixes.length > 0) {
    console.log(`\n   🔧 ${allFixes.length} fixes needed:\n`)
    for (const fix of allFixes) {
      console.log(`      • [${fix.type}] ${fix.description}`)
    }
  }

  // Execute fixes if not dry run
  if (!DRY_RUN && allFixes.length > 0) {
    await executeFixes(allFixes)
  } else if (DRY_RUN && allFixes.length > 0) {
    console.log(`\n   ℹ️  Run with --fix to apply these changes:`)
    console.log(`      npx tsx scripts/audit-and-fix-bookings.ts --fix`)
  }

  // Final state (if fixes were applied)
  if (!DRY_RUN && allFixes.length > 0) {
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
