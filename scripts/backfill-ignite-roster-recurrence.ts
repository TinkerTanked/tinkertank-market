/**
 * Backfills weekly term occurrences for students created by the approved
 * Ignite roster repair. Dry-run is the default.
 *
 * Preview:
 *   node backfill-ignite-roster-recurrence.js --seed-date 2026-08-26
 *
 * Apply only after reviewing the preview:
 *   node backfill-ignite-roster-recurrence.js --seed-date 2026-08-26 --apply --confirm-through 2026-09-23
 */
import { Prisma, PrismaClient } from '@prisma/client'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { buildWeeklyRosterOccurrences } from '../src/lib/ignite-roster-repair'

const prisma = new PrismaClient()
const SYDNEY_TZ = 'Australia/Sydney'
const REPAIR_NOTE = 'Approved Ignite roster repair'
const VISIBLE_SUBSCRIPTION_STATUSES = new Set(['ACTIVE', 'TRIALING'])

interface Arguments {
  seedDate: string
  apply: boolean
  confirmThrough?: string
}

function parseArguments(argv: string[]): Arguments {
  const seedIndex = argv.indexOf('--seed-date')
  if (seedIndex === -1 || !/^\d{4}-\d{2}-\d{2}$/.test(argv[seedIndex + 1] || '')) {
    throw new Error('Usage: --seed-date YYYY-MM-DD [--apply --confirm-through YYYY-MM-DD]')
  }
  const confirmIndex = argv.indexOf('--confirm-through')
  return {
    seedDate: argv[seedIndex + 1],
    apply: argv.includes('--apply'),
    confirmThrough: confirmIndex === -1 ? undefined : argv[confirmIndex + 1]
  }
}

function bookingKey(studentId: string, productId: string, startDate: Date): string {
  return `${studentId}|${productId}|${startDate.toISOString()}`
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2))
  const seedStart = fromZonedTime(`${args.seedDate}T00:00:00`, SYDNEY_TZ)
  const seedEnd = fromZonedTime(`${args.seedDate}T23:59:59.999`, SYDNEY_TZ)
  const seeds = await prisma.booking.findMany({
    where: {
      notes: REPAIR_NOTE,
      startDate: { gte: seedStart, lte: seedEnd },
      product: { type: 'SUBSCRIPTION' },
      status: { in: ['CONFIRMED', 'PENDING'] }
    },
    include: { igniteSubscription: { select: { status: true } }, product: { select: { name: true } } },
    orderBy: [{ startDate: 'asc' }, { studentId: 'asc' }]
  })
  if (seeds.length === 0) throw new Error(`No approved Ignite roster repair bookings found on ${args.seedDate}`)

  const excludedByStatus: Record<string, number> = {}
  const eligible = seeds.filter(seed => {
    if (seed.rosterOverride) return true
    const status = seed.igniteSubscription?.status || 'MISSING_SUBSCRIPTION'
    if (VISIBLE_SUBSCRIPTION_STATUSES.has(status)) return true
    excludedByStatus[status] = (excludedByStatus[status] || 0) + 1
    return false
  })

  const candidates = eligible.flatMap(seed =>
    buildWeeklyRosterOccurrences(seed.startDate, seed.endDate).slice(1).map(occurrence => ({ seed, occurrence }))
  )
  if (candidates.length === 0) throw new Error('The repaired roster has no later term occurrences')

  const through = formatInTimeZone(
    candidates.reduce((latest, candidate) => candidate.occurrence.start > latest ? candidate.occurrence.start : latest, candidates[0].occurrence.start),
    SYDNEY_TZ,
    'yyyy-MM-dd'
  )
  const studentIds = [...new Set(candidates.map(candidate => candidate.seed.studentId))]
  const productIds = [...new Set(candidates.map(candidate => candidate.seed.productId))]
  const starts = candidates.map(candidate => candidate.occurrence.start)
  const existing = await prisma.booking.findMany({
    where: {
      studentId: { in: studentIds },
      productId: { in: productIds },
      startDate: { gte: starts.reduce((a, b) => a < b ? a : b), lte: starts.reduce((a, b) => a > b ? a : b) },
      status: { in: ['CONFIRMED', 'PENDING'] }
    },
    select: { studentId: true, productId: true, startDate: true }
  })
  const existingKeys = new Set(existing.map(booking => bookingKey(booking.studentId, booking.productId, booking.startDate)))
  const missing = candidates.filter(candidate => !existingKeys.has(
    bookingKey(candidate.seed.studentId, candidate.seed.productId, candidate.occurrence.start)
  ))

  const missingByDate: Record<string, number> = {}
  const missingBySession: Record<string, number> = {}
  for (const candidate of missing) {
    const date = formatInTimeZone(candidate.occurrence.start, SYDNEY_TZ, 'yyyy-MM-dd')
    missingByDate[date] = (missingByDate[date] || 0) + 1
    missingBySession[candidate.seed.product.name] = (missingBySession[candidate.seed.product.name] || 0) + 1
  }

  console.log(JSON.stringify({
    mode: args.apply ? 'apply' : 'dry-run',
    seedDate: args.seedDate,
    through,
    seedBookings: seeds.length,
    eligibleStudents: eligible.length,
    rosterOverrides: eligible.filter(seed => seed.rosterOverride).length,
    excludedByStatus,
    expectedOccurrencesAfterSeed: candidates.length,
    alreadyPresent: candidates.length - missing.length,
    bookingsToCreate: missing.length,
    missingByDate,
    missingBySession
  }, null, 2))

  if (!args.apply) {
    console.log('Dry-run complete. No database writes performed.')
    return
  }
  if (args.confirmThrough !== through) {
    throw new Error(`Apply requires --confirm-through ${through}`)
  }

  await prisma.$transaction(async tx => {
    for (const candidate of missing) {
      const seed = candidate.seed
      const data = {
        studentId: seed.studentId,
        productId: seed.productId,
        locationId: seed.locationId,
        igniteSubscriptionId: seed.igniteSubscriptionId,
        rosterOverride: seed.rosterOverride,
        startDate: candidate.occurrence.start,
        endDate: candidate.occurrence.end,
        status: 'CONFIRMED' as const,
        totalPrice: new Prisma.Decimal(0),
        notes: REPAIR_NOTE
      }

      if (seed.igniteSubscriptionId) {
        await tx.booking.upsert({
          where: {
            igniteSubscriptionId_studentId_startDate: {
              igniteSubscriptionId: seed.igniteSubscriptionId,
              studentId: seed.studentId,
              startDate: candidate.occurrence.start
            }
          },
          create: data,
          update: {}
        })
      } else {
        const duplicate = await tx.booking.findFirst({
          where: {
            studentId: seed.studentId,
            productId: seed.productId,
            startDate: candidate.occurrence.start,
            status: { in: ['CONFIRMED', 'PENDING'] }
          },
          select: { id: true }
        })
        if (!duplicate) await tx.booking.create({ data })
      }
    }
  }, { timeout: 30_000 })

  console.log(`Apply complete. Created ${missing.length} missing bookings.`)
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
