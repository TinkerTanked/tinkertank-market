/**
 * Preflight seed for Ignite subscriptions (Phase 1).
 *
 * Ignite sessions are defined in code (src/config/igniteProducts.ts) but the
 * booking pipeline needs real Product + Location rows for the Booking/OrderItem
 * foreign keys. This script is ADDITIVE and IDEMPOTENT — it never deletes.
 *
 *   - Upserts one Product per Ignite session, using the config session id as
 *     the Product.id (e.g. "ignite-balgowlah-wed"), type SUBSCRIPTION.
 *   - Ensures an active Location row exists (exact name match) for every
 *     distinct Ignite session location.
 *
 * MUST be run before deploying the Ignite Phase 1 code, and before any live
 * Ignite purchase, so checkout can resolve the location before charging.
 *
 * Run locally:  npx tsx scripts/seed-ignite-products-locations.ts
 */
import { PrismaClient, ProductType } from '@prisma/client'
import { IGNITE_SESSIONS } from '../src/config/igniteProducts'

const prisma = new PrismaClient()

function durationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

async function main() {
  console.log('🌱 Seeding Ignite Products + Locations (additive, idempotent)\n')

  // 1. Products — one per session, keyed by config id.
  for (const session of IGNITE_SESSIONS) {
    await prisma.product.upsert({
      where: { id: session.id },
      create: {
        id: session.id,
        name: session.name,
        type: ProductType.SUBSCRIPTION,
        price: session.priceWeekly,
        duration: durationMinutes(session.startTime, session.endTime),
        description: `${session.name} — weekly Ignite subscription`,
        ageMin: 5,
        ageMax: 16,
        isActive: true
      },
      update: {
        name: session.name,
        type: ProductType.SUBSCRIPTION,
        price: session.priceWeekly,
        duration: durationMinutes(session.startTime, session.endTime),
        isActive: true
      }
    })
    console.log(`  ✓ Product ${session.id} (${session.name})`)
  }

  // 2. Locations — ensure an active row per distinct session location.
  const byLocation = new Map<string, string | undefined>()
  for (const session of IGNITE_SESSIONS) {
    if (!byLocation.has(session.location)) {
      byLocation.set(session.location, session.address)
    }
  }

  console.log('')
  for (const [name, address] of byLocation) {
    const existing = await prisma.location.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })
    if (existing) {
      await prisma.location.update({
        where: { id: existing.id },
        data: { isActive: true, ...(address && !existing.address ? { address } : {}) }
      })
      console.log(`  ✓ Location activated: ${existing.name}`)
    } else {
      await prisma.location.create({
        data: {
          name,
          address: address || name,
          capacity: 20,
          isActive: true
        }
      })
      console.log(`  ✓ Location created:   ${name}`)
    }
  }

  console.log('\n✅ Done.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
