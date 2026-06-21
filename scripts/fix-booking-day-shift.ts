/**
 * Fix Booking Day-Shift — corrects bookings stored one calendar day early.
 *
 * Root cause (see TIMEZONE_TECH_DEBT.md): the checkout flow serialized the
 * user-selected date with `Date.toISOString()`, which converts a Sydney
 * local-midnight date back one day in UTC. Every CAMP booking created via the
 * buggy flow is therefore stored on the previous calendar day (Mon→Sun,
 * Tue→Mon, … Fri→Thu), i.e. it lands on Sun–Thu instead of Mon–Fri.
 *
 * This script shifts affected CAMP bookings (and their matching OrderItems)
 * forward by one day, normalising them to exactly what the FIXED pipeline now
 * stores:
 *   - Booking.startDate  = realDay 09:00Z
 *   - Booking.endDate    = realDay 15:00Z (Day Camp) / 17:00Z (All Day Camp)
 *   - OrderItem.bookingDate = realDay 00:00Z
 *
 * Safety:
 *   - DRY RUN by default. Pass --commit to apply.
 *   - Only touches bookings created before the cutoff (default: now), so it
 *     never modifies bookings created after the checkout fix is deployed.
 *     Override with --before <ISO timestamp>.
 *   - A camp must currently sit on Sun–Thu (the buggy range). Anything on
 *     Fri/Sat is flagged and SKIPPED for manual review (it would otherwise be
 *     pushed onto a weekend).
 *   - Birthdays are reported but NOT modified (they can legitimately fall on
 *     weekends, so the weekday safety net does not apply). Re-run intent can be
 *     widened later if needed.
 *
 * Usage:
 *   npx tsx scripts/fix-booking-day-shift.ts                       # dry run
 *   npx tsx scripts/fix-booking-day-shift.ts --commit              # apply
 *   npx tsx scripts/fix-booking-day-shift.ts --before 2026-06-21T00:00:00Z
 *   npx tsx scripts/fix-booking-day-shift.ts --from 2026-06-01     # only camps dated on/after
 */

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

const DRY_RUN = !process.argv.includes('--commit')
const beforeArgIdx = process.argv.indexOf('--before')
const CUTOFF = beforeArgIdx !== -1 && process.argv[beforeArgIdx + 1]
  ? new Date(process.argv[beforeArgIdx + 1])
  : new Date()

// Optional lower bound on the booking's stored date — only shift bookings on or
// after this date (e.g. --from 2026-06-01 to skip past camps).
const fromArgIdx = process.argv.indexOf('--from')
const FROM = fromArgIdx !== -1 && process.argv[fromArgIdx + 1]
  ? new Date(process.argv[fromArgIdx + 1] + 'T00:00:00.000Z')
  : null

// Optional: only process bookings last modified before this timestamp. Used to
// exclude bookings already corrected by a previous run of this migration
// (Prisma bumps updatedAt on every write), so re-runs never double-shift.
const touchedArgIdx = process.argv.indexOf('--touched-before')
const TOUCHED_BEFORE = touchedArgIdx !== -1 && process.argv[touchedArgIdx + 1]
  ? new Date(process.argv[touchedArgIdx + 1])
  : null

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function utcDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}
function utcDayName(d: Date): string {
  return DAY_NAMES[d.getUTCDay()]
}
function shiftDayStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00.000Z')
  d.setUTCDate(d.getUTCDate() + days)
  return utcDateStr(d)
}
function atUtcHour(dateStr: string, hour: number): Date {
  const d = new Date(dateStr + 'T00:00:00.000Z')
  d.setUTCHours(hour, 0, 0, 0)
  return d
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║  FIX BOOKING DAY-SHIFT — correct bookings stored 1 day early ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log(`  Mode:   ${DRY_RUN ? '🔎 DRY RUN (no changes)' : '🔧 COMMIT (writing changes)'}`)
  console.log(`  Cutoff: only bookings created before ${CUTOFF.toISOString()}`)
  console.log(`  From:   ${FROM ? 'only bookings dated on/after ' + utcDateStr(FROM) : 'all dates'}`)
  console.log(`  Touched-before: ${TOUCHED_BEFORE ? 'only bookings last modified before ' + TOUCHED_BEFORE.toISOString() : 'any'}\n`)

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PENDING'] },
      createdAt: { lt: CUTOFF },
      ...(FROM ? { startDate: { gte: FROM } } : {}),
      ...(TOUCHED_BEFORE ? { updatedAt: { lt: TOUCHED_BEFORE } } : {}),
      product: { type: { in: ['CAMP', 'BIRTHDAY'] } }
    },
    include: { student: true, product: true },
    // Descending so that for multi-day bundles the later day is shifted first,
    // freeing each target day before its earlier sibling is processed. Ascending
    // order makes consecutive-day bundles collide with their own siblings.
    orderBy: { startDate: 'desc' }
  })

  const camps = bookings.filter(b => b.product.type === 'CAMP')
  const birthdays = bookings.filter(b => b.product.type === 'BIRTHDAY')

  console.log(`  Found ${camps.length} camp + ${birthdays.length} birthday bookings before cutoff.\n`)

  type Plan = {
    bookingId: string
    student: string
    product: string
    fromDay: string
    toDay: string
    isAllDay: boolean
  }
  const plans: Plan[] = []
  const skipped: string[] = []

  for (const b of camps) {
    const fromStr = utcDateStr(b.startDate)
    const fromDow = b.startDate.getUTCDay()

    // Buggy camps land on Sun(0)–Thu(4). Anything on Fri(5)/Sat(6) is anomalous.
    if (fromDow === 5 || fromDow === 6) {
      skipped.push(`  ⚠️  SKIP ${b.student.name} | ${b.product.name} | ${fromStr} (${DAY_NAMES[fromDow]}) — not in buggy Sun–Thu range; review manually`)
      continue
    }

    const toStr = shiftDayStr(fromStr, 1)
    const toDow = new Date(toStr + 'T00:00:00.000Z').getUTCDay()
    if (toDow === 0 || toDow === 6) {
      skipped.push(`  ⚠️  SKIP ${b.student.name} | ${b.product.name} | ${fromStr} → ${toStr} would land on ${DAY_NAMES[toDow]}; review manually`)
      continue
    }

    plans.push({
      bookingId: b.id,
      student: b.student.name,
      product: b.product.name,
      fromDay: fromStr,
      toDay: toStr,
      isAllDay: b.product.name.toLowerCase().includes('all day')
    })
  }

  // Report
  console.log(`  Camp bookings to shift +1 day: ${plans.length}`)
  console.log(`  Camp bookings skipped:         ${skipped.length}\n`)

  for (const p of plans) {
    const fromDow = utcDayName(new Date(p.fromDay + 'T00:00:00.000Z'))
    const toDow = utcDayName(new Date(p.toDay + 'T00:00:00.000Z'))
    console.log(`    ${p.fromDay} (${fromDow}) → ${p.toDay} (${toDow})  ${p.student} | ${p.product}`)
  }
  if (skipped.length > 0) {
    console.log('')
    skipped.forEach(s => console.log(s))
  }

  if (birthdays.length > 0) {
    console.log(`\n  ℹ️  ${birthdays.length} birthday booking(s) are also likely affected but are NOT`)
    console.log('     modified by this script (birthdays can fall on weekends). Listed for review:')
    for (const b of birthdays) {
      console.log(`       ${utcDateStr(b.startDate)} (${utcDayName(b.startDate)})  ${b.student.name} | ${b.product.name}`)
    }
  }

  if (DRY_RUN) {
    console.log('\n  ℹ️  DRY RUN — no changes written. Re-run with --commit to apply.')
    await prisma.$disconnect()
    return
  }

  console.log('\n  Applying changes...')
  let bookingsUpdated = 0
  let orderItemsUpdated = 0

  for (const p of plans) {
    const newStart = atUtcHour(p.toDay, 9)
    const newEnd = atUtcHour(p.toDay, p.isAllDay ? 17 : 15)

    // Guard against a post-shift duplicate (another booking already on toDay).
    const b = camps.find(c => c.id === p.bookingId)!
    const dup = await prisma.booking.findFirst({
      where: {
        id: { not: p.bookingId },
        studentId: b.studentId,
        productId: b.productId,
        startDate: {
          gte: atUtcHour(p.toDay, 0),
          lt: new Date(p.toDay + 'T23:59:59.999Z')
        }
      }
    })
    if (dup) {
      console.log(`    ⏭️  Skip (would duplicate existing booking on ${p.toDay}): ${p.student} | ${p.product}`)
      continue
    }

    await prisma.booking.update({
      where: { id: p.bookingId },
      data: { startDate: newStart, endDate: newEnd }
    })
    bookingsUpdated++

    // Shift the matching OrderItem(s) for the same student+product on fromDay.
    const items = await prisma.orderItem.findMany({
      where: {
        studentId: b.studentId,
        productId: b.productId,
        bookingDate: {
          gte: new Date(p.fromDay + 'T00:00:00.000Z'),
          lt: new Date(p.fromDay + 'T23:59:59.999Z')
        }
      }
    })
    for (const item of items) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { bookingDate: new Date(p.toDay + 'T00:00:00.000Z') }
      })
      orderItemsUpdated++
    }
  }

  console.log(`\n  ✅ Updated ${bookingsUpdated} bookings and ${orderItemsUpdated} order items.`)

  // Post-fix sanity check: no remaining camps on weekends before the cutoff.
  const weekendCamps = (await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PENDING'] },
      product: { type: 'CAMP' }
    },
    select: { startDate: true }
  })).filter(b => b.startDate.getUTCDay() === 0 || b.startDate.getUTCDay() === 6)

  console.log(`  📊 Camps now on a weekend: ${weekendCamps.length}`)
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
