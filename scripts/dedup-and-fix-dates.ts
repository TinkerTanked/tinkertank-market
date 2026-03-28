/**
 * Deduplicate bookings and fix UTC date issues.
 * 
 * Problems:
 * 1. Duplicate bookings: same student+product+date appearing multiple times
 * 2. Sunday/Saturday bookings: dates stored as UTC midnight, which shows as
 *    wrong day in AEST (UTC+10/+11). E.g. "2026-04-19T00:00:00Z" is actually
 *    April 18 at 2pm AEST — but booking was for April 19.
 *    The fix: set booking start times to 9am UTC (which is ~7-8pm AEST previous
 *    day) — actually the real fix is to ensure the DATE portion is correct.
 *    Bookings at 00:00 UTC for April 19 mean the booking IS for April 19.
 *    The schedule API queries by startDate range, so the dates ARE correct.
 *    The issue is that April 19, 2026 is a SUNDAY - camps don't run on Sundays.
 *    These bookings need their dates shifted to the correct weekday.
 *
 * Run audit:  npx tsx scripts/dedup-and-fix-dates.ts
 * Run fix:    npx tsx scripts/dedup-and-fix-dates.ts --fix
 */

import { PrismaClient } from '@prisma/client'

const DRY_RUN = !process.argv.includes('--fix')
const prisma = new PrismaClient()

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ')
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function dayName(d: Date): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()]
}

function isWeekend(d: Date): boolean {
  const day = d.getUTCDay()
  return day === 0 || day === 6
}

async function main() {
  console.log('🔍 Dedup Bookings & Fix Weekend Dates')
  console.log(`   Mode: ${DRY_RUN ? '🔎 DRY RUN' : '🔧 FIX MODE'}\n`)

  const bookings = await prisma.booking.findMany({
    where: { product: { type: 'CAMP' }, status: 'CONFIRMED' },
    include: { student: true, product: true },
    orderBy: [{ createdAt: 'asc' }]
  })

  console.log(`Total camp bookings: ${bookings.length}\n`)

  // ─── PART 1: Remove duplicates ─────────────────────────────────────
  console.log('═══ PART 1: Remove duplicate bookings ═══\n')

  const groups = new Map<string, typeof bookings>()
  for (const b of bookings) {
    const key = `${norm(b.student.name)}|${b.product.name}|${dateStr(b.startDate)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(b)
  }

  const toDelete: string[] = []
  for (const [key, items] of groups) {
    if (items.length > 1) {
      // Keep the first one (oldest createdAt), delete the rest
      const keep = items[0]
      const dupes = items.slice(1)
      console.log(`  ${items[0].student.name} | ${items[0].product.name} | ${dateStr(items[0].startDate)} → keep 1, remove ${dupes.length}`)
      for (const d of dupes) {
        toDelete.push(d.id)
      }
    }
  }

  console.log(`\n  Total duplicates to remove: ${toDelete.length}\n`)

  if (!DRY_RUN && toDelete.length > 0) {
    const result = await prisma.booking.deleteMany({
      where: { id: { in: toDelete } }
    })
    console.log(`  ✅ Deleted ${result.count} duplicate bookings\n`)
  }

  // ─── PART 2: Fix weekend bookings ──────────────────────────────────
  console.log('═══ PART 2: Fix weekend bookings ═══\n')

  // Re-query after dedup
  const remaining = DRY_RUN
    ? bookings.filter(b => !toDelete.includes(b.id))
    : await prisma.booking.findMany({
        where: { product: { type: 'CAMP' }, status: 'CONFIRMED' },
        include: { student: true, product: true }
      })

  const weekendBookings = remaining.filter(b => isWeekend(b.startDate))
  console.log(`  Weekend bookings found: ${weekendBookings.length}\n`)

  for (const b of weekendBookings) {
    const day = dayName(b.startDate)
    const date = dateStr(b.startDate)
    const isBundleProduct = b.product.name.toLowerCase().includes('bundle')

    // For Sunday April 19 bundle bookings: this is the first day of a 3-day bundle
    // that was stored as April 19. The bundle fill created April 20, 21 from this.
    // The actual camp week starts Monday April 20. So this Sunday booking is wrong
    // and the student already has bookings for Mon, Tue, Wed (April 20-22).
    // We should delete it since the correct 3 weekday bookings already exist.

    // For Sunday April 12: These are supposed to be Monday April 13 bookings
    // (Luke Kennedy, Patrick Parker, Declan Alcorn). April 12 is a Sunday.
    // The order item likely has the correct date but the booking was created
    // with UTC midnight causing it to show on wrong day.

    console.log(`  ${b.student.name} | ${b.product.name} | ${date} (${day})`)

    if (date === '2026-04-19' && isBundleProduct) {
      // Check if this student already has a Monday April 20 booking for same product
      const monBooking = remaining.find(r =>
        norm(r.student.name) === norm(b.student.name) &&
        r.product.name === b.product.name &&
        dateStr(r.startDate) === '2026-04-20' &&
        r.id !== b.id
      )
      if (monBooking) {
        console.log(`    → DELETE: Already has April 20 booking, this Sunday entry is wrong`)
        if (!DRY_RUN) {
          await prisma.booking.delete({ where: { id: b.id } })
          console.log(`    ✅ Deleted`)
        }
      } else {
        // Move to Monday April 20
        console.log(`    → MOVE to 2026-04-20 (Monday)`)
        if (!DRY_RUN) {
          const newStart = new Date('2026-04-20T00:00:00.000Z')
          newStart.setUTCHours(b.startDate.getUTCHours(), 0, 0, 0)
          const newEnd = new Date('2026-04-20T00:00:00.000Z')
          newEnd.setUTCHours(b.endDate.getUTCHours(), 0, 0, 0)
          await prisma.booking.update({
            where: { id: b.id },
            data: { startDate: newStart, endDate: newEnd }
          })
          console.log(`    ✅ Moved`)
        }
      }
    } else if (date === '2026-04-12') {
      // Sunday April 12 should be Monday April 13
      console.log(`    → MOVE to 2026-04-13 (Monday)`)
      if (!DRY_RUN) {
        const newStart = new Date('2026-04-13T00:00:00.000Z')
        newStart.setUTCHours(b.startDate.getUTCHours(), 0, 0, 0)
        const newEnd = new Date('2026-04-13T00:00:00.000Z')
        newEnd.setUTCHours(b.endDate.getUTCHours(), 0, 0, 0)

        // Check no duplicate at destination
        const existing = remaining.find(r =>
          norm(r.student.name) === norm(b.student.name) &&
          r.product.name === b.product.name &&
          dateStr(r.startDate) === '2026-04-13' &&
          r.id !== b.id
        )
        if (existing) {
          console.log(`    → Actually DELETE: already has April 13 booking`)
          await prisma.booking.delete({ where: { id: b.id } })
          console.log(`    ✅ Deleted`)
        } else {
          await prisma.booking.update({
            where: { id: b.id },
            data: { startDate: newStart, endDate: newEnd }
          })
          console.log(`    ✅ Moved`)
        }
      }
    } else {
      console.log(`    → UNKNOWN weekend booking, skipping`)
    }
  }

  // Final count
  if (!DRY_RUN) {
    const finalCount = await prisma.booking.count({
      where: { product: { type: 'CAMP' }, status: 'CONFIRMED' }
    })
    const weekendCount = await prisma.booking.count({
      where: {
        product: { type: 'CAMP' },
        status: 'CONFIRMED',
        startDate: {
          in: [
            new Date('2026-04-12T00:00:00.000Z'),
            new Date('2026-04-19T00:00:00.000Z')
          ]
        }
      }
    })
    console.log(`\n📊 Final state: ${finalCount} camp bookings, ${weekendCount} still on weekends`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error('❌', e); process.exit(1) })
