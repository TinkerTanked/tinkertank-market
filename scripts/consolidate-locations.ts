/**
 * Consolidate duplicate Neutral Bay locations into one.
 * Reassign all bookings from "Neutral Bay Studio", "TinkerTank Neutral Bay",
 * and "Balgowlah Heights Public" (camp bookings only) to the canonical "Neutral Bay" location.
 *
 * Run audit:  npx tsx scripts/consolidate-locations.ts
 * Run fix:    npx tsx scripts/consolidate-locations.ts --fix
 */

import { PrismaClient } from '@prisma/client'

const DRY_RUN = !process.argv.includes('--fix')
const prisma = new PrismaClient()

const CANONICAL_NAME = 'Neutral Bay'

// Location names that should all be "Neutral Bay"
const NEUTRAL_BAY_ALIASES = ['Neutral Bay Studio', 'TinkerTank Neutral Bay', 'Neutral Bay Public School']

async function main() {
  console.log('🔍 Consolidate Locations')
  console.log(`   Mode: ${DRY_RUN ? '🔎 DRY RUN' : '🔧 FIX MODE'}\n`)

  // Find or identify the canonical location
  const allLocations = await prisma.location.findMany({ orderBy: { name: 'asc' } })
  console.log('=== Current Locations ===')
  for (const loc of allLocations) {
    const bookingCount = await prisma.booking.count({ where: { locationId: loc.id } })
    console.log(`   ${loc.id} | ${loc.name} | ${bookingCount} bookings | active=${loc.isActive}`)
  }

  const canonicalLoc = allLocations.find(l => l.name === CANONICAL_NAME)
  if (!canonicalLoc) {
    console.error(`\n❌ Canonical location "${CANONICAL_NAME}" not found!`)
    return
  }
  console.log(`\n📍 Canonical location: ${canonicalLoc.name} (${canonicalLoc.id})`)

  // Find alias locations to merge
  const aliasLocations = allLocations.filter(l => NEUTRAL_BAY_ALIASES.includes(l.name))
  console.log(`\n=== Alias locations to merge into "${CANONICAL_NAME}" ===`)
  for (const alias of aliasLocations) {
    const bookingCount = await prisma.booking.count({ where: { locationId: alias.id } })
    console.log(`   ${alias.name} (${alias.id}): ${bookingCount} bookings → will reassign`)
  }

  // Also reassign CAMP bookings at Balgowlah Heights that were wrongly assigned
  // (from the reconciliation script using alphabetical first location)
  const balgowlahLoc = allLocations.find(l => l.name === 'Balgowlah Heights Public')
  let balgowlahCampBookings: any[] = []
  if (balgowlahLoc) {
    balgowlahCampBookings = await prisma.booking.findMany({
      where: {
        locationId: balgowlahLoc.id,
        product: { type: 'CAMP' }
      },
      include: { product: true, student: true }
    })
    console.log(`\n=== Balgowlah Heights camp bookings to reassign ===`)
    console.log(`   ${balgowlahCampBookings.length} camp bookings will move to "${CANONICAL_NAME}"`)
    // Check what should stay (subscriptions/ignite)
    const subCount = await prisma.booking.count({
      where: { locationId: balgowlahLoc.id, product: { type: 'SUBSCRIPTION' } }
    })
    const bdayCount = await prisma.booking.count({
      where: { locationId: balgowlahLoc.id, product: { type: 'BIRTHDAY' } }
    })
    console.log(`   ${subCount} subscription + ${bdayCount} birthday bookings will stay at Balgowlah`)
  }

  // Summary
  const aliasIds = aliasLocations.map(l => l.id)
  let totalToReassign = 0
  for (const alias of aliasLocations) {
    totalToReassign += await prisma.booking.count({ where: { locationId: alias.id } })
  }
  totalToReassign += balgowlahCampBookings.length

  console.log(`\n📊 Total bookings to reassign: ${totalToReassign}`)

  if (DRY_RUN) {
    console.log('\n   ℹ️  Run with --fix to apply changes')
    await prisma.$disconnect()
    return
  }

  // Execute fixes
  console.log('\n=== Executing fixes ===')

  // 1. Reassign all bookings from alias locations to canonical
  for (const alias of aliasLocations) {
    const result = await prisma.booking.updateMany({
      where: { locationId: alias.id },
      data: { locationId: canonicalLoc.id }
    })
    console.log(`   ✅ Moved ${result.count} bookings from "${alias.name}" → "${CANONICAL_NAME}"`)
  }

  // 2. Reassign CAMP bookings from Balgowlah to canonical
  if (balgowlahLoc && balgowlahCampBookings.length > 0) {
    const result = await prisma.booking.updateMany({
      where: {
        locationId: balgowlahLoc.id,
        product: { type: 'CAMP' }
      },
      data: { locationId: canonicalLoc.id }
    })
    console.log(`   ✅ Moved ${result.count} camp bookings from "Balgowlah Heights" → "${CANONICAL_NAME}"`)
  }

  // 3. Also reassign BIRTHDAY bookings from Balgowlah (Jing Yeoh birthday was wrongly assigned)
  if (balgowlahLoc) {
    const bdayResult = await prisma.booking.updateMany({
      where: {
        locationId: balgowlahLoc.id,
        product: { type: 'BIRTHDAY' }
      },
      data: { locationId: canonicalLoc.id }
    })
    if (bdayResult.count > 0) {
      console.log(`   ✅ Moved ${bdayResult.count} birthday bookings from "Balgowlah Heights" → "${CANONICAL_NAME}"`)
    }
  }

  // 4. Deactivate alias locations (don't delete - keep for reference)
  for (const alias of aliasLocations) {
    await prisma.location.update({
      where: { id: alias.id },
      data: { isActive: false }
    })
    console.log(`   ✅ Deactivated "${alias.name}"`)
  }

  // Final state
  console.log('\n=== Final State ===')
  const finalLocations = await prisma.location.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  for (const loc of finalLocations) {
    const count = await prisma.booking.count({ where: { locationId: loc.id } })
    console.log(`   ${loc.name}: ${count} bookings`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error('❌', e); process.exit(1) })
