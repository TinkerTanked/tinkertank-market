/**
 * Fix Weekend Bookings — Camps don't run on weekends.
 *
 * Pattern 1: Single-day bookings on Sunday that already have a Monday booking
 *   → Delete the Sunday booking (Monday is the correct one)
 *
 * Pattern 2: 3-day bundles starting on Sunday (Sun+Mon+Tue)
 *   → Delete Sunday, add Wednesday (result: Mon+Tue+Wed)
 *
 * Run audit:  npx tsx scripts/fix-weekend-bookings.ts
 * Run fix:    npx tsx scripts/fix-weekend-bookings.ts --fix
 */

import { PrismaClient, Prisma } from '@prisma/client'

const DRY_RUN = !process.argv.includes('--fix')
const prisma = new PrismaClient()

const NEUTRAL_BAY_ID = 'cmmxpsdxh00069a01w1m0pr5t'
const MANLY_LIBRARY_ID = 'cmmif20y400018b8vb2dt5jjz'
const MANLY_DATES = ['2026-04-14', '2026-04-15', '2026-04-16']

function dateStr(d: Date): string { return d.toISOString().split('T')[0] }
function dayName(d: Date): string { return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()] }
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function isWeekend(d: Date): boolean { const day = d.getUTCDay(); return day === 0 || day === 6 }
function getLocationForDate(ds: string): string { return MANLY_DATES.includes(ds) ? MANLY_LIBRARY_ID : NEUTRAL_BAY_ID }

function getCampHours(productName: string): { startHour: number; endHour: number } {
  const isAllDay = productName.toLowerCase().includes('all day')
  return { startHour: 9, endHour: isAllDay ? 17 : 15 }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║  FIX WEEKEND BOOKINGS — No camps on Sat/Sun         ║')
  console.log('╚═══════════════════════════════════════════════════════╝')
  console.log(`  Mode: ${DRY_RUN ? '🔎 DRY RUN' : '🔧 FIX MODE'}\n`)

  const weekendBookings = await prisma.booking.findMany({
    where: { status: 'CONFIRMED', product: { type: 'CAMP' } },
    include: { student: true, product: true },
    orderBy: { startDate: 'asc' }
  })

  const allCampBookings = weekendBookings // we'll filter below
  const onWeekend = allCampBookings.filter(b => isWeekend(b.startDate))

  console.log(`  Total camp bookings: ${allCampBookings.length}`)
  console.log(`  On weekends: ${onWeekend.length}\n`)

  if (onWeekend.length === 0) {
    console.log('  ✅ No weekend bookings found!')
    await prisma.$disconnect()
    return
  }

  const toDelete: string[] = []
  const toCreate: Array<{
    studentId: string; productId: string; locationId: string
    startDate: Date; endDate: Date; totalPrice: number; notes: string; orderId: string
  }> = []

  for (const b of onWeekend) {
    const ds = dateStr(b.startDate)
    const day = dayName(b.startDate)
    const isBundle = b.product.name.toLowerCase().includes('3-day bundle')

    console.log(`  📌 ${b.student.name} | ${b.product.name} | ${ds} (${day})`)

    // Get all bookings for this student+product
    const siblingBookings = allCampBookings.filter(
      bb => bb.studentId === b.studentId && bb.productId === b.productId && bb.id !== b.id
    )
    const siblingDates = siblingBookings.map(bb => dateStr(bb.startDate))

    if (isBundle) {
      // Bundle on Sunday: should be Mon+Tue+Wed instead of Sun+Mon+Tue
      // Delete Sunday, add next available weekday after existing bookings
      const nextDay = addDays(b.startDate, 1) // Monday
      const hasMonday = siblingDates.includes(dateStr(nextDay))
      const hasTuesday = siblingDates.includes(dateStr(addDays(b.startDate, 2)))

      if (hasMonday && hasTuesday) {
        // Need to add Wednesday (day+3)
        const wednesday = addDays(b.startDate, 3)
        const wedStr = dateStr(wednesday)
        const hasWednesday = siblingDates.includes(wedStr)

        console.log(`     Already has Mon+Tue. Delete Sun, ${hasWednesday ? 'Wed exists' : 'add Wed (' + wedStr + ')'}`)

        toDelete.push(b.id)

        if (!hasWednesday) {
          const { startHour, endHour } = getCampHours(b.product.name)
          const startDate = new Date(wedStr + 'T00:00:00.000Z')
          startDate.setUTCHours(startHour, 0, 0, 0)
          const endDate = new Date(wedStr + 'T00:00:00.000Z')
          endDate.setUTCHours(endHour, 0, 0, 0)

          toCreate.push({
            studentId: b.studentId,
            productId: b.productId,
            locationId: getLocationForDate(wedStr),
            startDate,
            endDate,
            totalPrice: Number(b.totalPrice),
            notes: `Weekend fix: moved from ${ds} (${day}) — Bundle day 3`,
            orderId: b.notes?.match(/Order: (\S+)/)?.[1] || 'unknown'
          })
        }
      } else {
        // Unexpected state — just log
        console.log(`     ⚠️  Unexpected sibling dates: [${siblingDates.join(', ')}]`)
        toDelete.push(b.id)
      }
    } else {
      // Single-day on weekend: check if next weekday already has a booking
      const nextWeekday = addDays(b.startDate, 1) // Sunday+1 = Monday
      const nextStr = dateStr(nextWeekday)
      const hasNextDay = siblingDates.includes(nextStr)

      if (hasNextDay) {
        console.log(`     Already has ${nextStr} (${dayName(nextWeekday)}). Delete this Sunday booking.`)
        toDelete.push(b.id)
      } else {
        // Move to Monday
        console.log(`     Move to ${nextStr} (${dayName(nextWeekday)})`)
        toDelete.push(b.id)
        const { startHour, endHour } = getCampHours(b.product.name)
        const startDate = new Date(nextStr + 'T00:00:00.000Z')
        startDate.setUTCHours(startHour, 0, 0, 0)
        const endDate = new Date(nextStr + 'T00:00:00.000Z')
        endDate.setUTCHours(endHour, 0, 0, 0)

        toCreate.push({
          studentId: b.studentId,
          productId: b.productId,
          locationId: getLocationForDate(nextStr),
          startDate,
          endDate,
          totalPrice: Number(b.totalPrice),
          notes: `Weekend fix: moved from ${ds} (${day})`,
          orderId: b.notes?.match(/Order: (\S+)/)?.[1] || 'unknown'
        })
      }
    }
  }

  console.log(`\n  Summary:`)
  console.log(`    Bookings to delete: ${toDelete.length}`)
  console.log(`    Bookings to create: ${toCreate.length}\n`)

  if (DRY_RUN) {
    for (const c of toCreate) {
      console.log(`    + ${dateStr(c.startDate)} | ${c.notes}`)
    }
    console.log(`\n  ℹ️  Run with --fix to apply`)
    await prisma.$disconnect()
    return
  }

  // Execute
  if (toDelete.length > 0) {
    const result = await prisma.booking.deleteMany({ where: { id: { in: toDelete } } })
    console.log(`  ✅ Deleted ${result.count} weekend bookings`)
  }

  for (const c of toCreate) {
    // Double-check no duplicate
    const existing = await prisma.booking.findFirst({
      where: {
        studentId: c.studentId, productId: c.productId,
        startDate: {
          gte: new Date(dateStr(c.startDate) + 'T00:00:00.000Z'),
          lt: new Date(dateStr(c.startDate) + 'T23:59:59.999Z')
        }
      }
    })
    if (existing) {
      console.log(`  ⏭️  Already exists: ${c.notes}`)
      continue
    }

    await prisma.booking.create({
      data: {
        studentId: c.studentId,
        productId: c.productId,
        locationId: c.locationId,
        startDate: c.startDate,
        endDate: c.endDate,
        status: 'CONFIRMED',
        totalPrice: new Prisma.Decimal(c.totalPrice),
        notes: c.notes
      }
    })
    console.log(`  ✅ Created: ${dateStr(c.startDate)} | ${c.notes}`)
  }

  // Also update corresponding order items from Sunday to the correct day
  console.log('\n  Fixing order item dates...')
  for (const b of onWeekend) {
    const ds = dateStr(b.startDate)
    const isBundle = b.product.name.toLowerCase().includes('3-day bundle')
    
    // For bundles on Sunday Apr 19: the order item at Apr 19 should move to Apr 22
    // For singles on Sunday Apr 12: the order item at Apr 12 should move to Apr 13
    const targetDate = isBundle ? addDays(b.startDate, 3) : addDays(b.startDate, 1)
    const targetStr = dateStr(targetDate)

    // Find the order item for this Sunday
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        studentId: b.studentId,
        productId: b.productId,
        bookingDate: {
          gte: new Date(ds + 'T00:00:00.000Z'),
          lt: new Date(ds + 'T23:59:59.999Z')
        },
        order: { status: 'PAID' }
      }
    })

    if (orderItem) {
      // Check if target date already has an order item
      const existingTarget = await prisma.orderItem.findFirst({
        where: {
          studentId: b.studentId,
          productId: b.productId,
          orderId: orderItem.orderId,
          bookingDate: {
            gte: new Date(targetStr + 'T00:00:00.000Z'),
            lt: new Date(targetStr + 'T23:59:59.999Z')
          }
        }
      })

      if (existingTarget) {
        // Target already has an order item, delete the Sunday one
        await prisma.orderItem.delete({ where: { id: orderItem.id } })
        console.log(`  ✅ Deleted Sunday order item for ${b.student.name} on ${ds} (target ${targetStr} already exists)`)
      } else {
        await prisma.orderItem.update({
          where: { id: orderItem.id },
          data: { bookingDate: new Date(targetStr + 'T00:00:00.000Z') }
        })
        console.log(`  ✅ Moved order item for ${b.student.name}: ${ds} → ${targetStr}`)
      }
    }
  }

  // Final state
  const finalWeekend = await prisma.booking.count({
    where: {
      status: 'CONFIRMED',
      product: { type: 'CAMP' },
      OR: [
        // Check all Sundays and Saturdays in April 2026
        ...([4,5,11,12,18,19,25,26].map(d => ({
          startDate: {
            gte: new Date(`2026-04-${String(d).padStart(2,'0')}T00:00:00.000Z`),
            lt: new Date(`2026-04-${String(d+1).padStart(2,'0')}T00:00:00.000Z`)
          }
        })))
      ]
    }
  })

  const finalTotal = await prisma.booking.count({
    where: { status: 'CONFIRMED', product: { type: 'CAMP' } }
  })

  console.log(`\n  📊 Final: ${finalTotal} camp bookings, ${finalWeekend} on weekends`)
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
