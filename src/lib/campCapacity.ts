import { Prisma } from '@prisma/client'
import { getLocationAvailability } from '@/data/locationAvailability'

type CapacityClient = Pick<Prisma.TransactionClient, 'booking' | 'location' | '$executeRaw'>

interface CapacityLocation {
  id: string
  name: string
  capacity: number
}

export class CampCapacityExceededError extends Error {
  constructor(
    readonly locationName: string,
    readonly date: string,
    readonly capacity: number,
    readonly remaining: number
  ) {
    super(`${locationName} is sold out on ${date}`)
    this.name = 'CampCapacityExceededError'
  }
}

export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function utcDayRange(date: Date) {
  const dateKey = utcDateKey(date)
  const start = new Date(`${dateKey}T00:00:00.000Z`)
  return {
    gte: start,
    lt: new Date(start.getTime() + 24 * 60 * 60 * 1000)
  }
}

export async function lockCampCapacity(db: CapacityClient, locationId: string, date: Date) {
  const lockKey = `camp-capacity:${locationId}:${utcDateKey(date)}`
  await db.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`)
}

export async function resolveCampLocation(db: CapacityClient, selectedLocationName: string): Promise<CapacityLocation | null> {
  const configuredLocation = getLocationAvailability(selectedLocationName)
  if (!configuredLocation) return null

  return db.location.findFirst({
    where: {
      name: configuredLocation.locationName,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      capacity: true
    }
  })
}

export async function assertCampCapacityForLocation(
  db: CapacityClient,
  location: CapacityLocation,
  date: Date,
  requestedSpots: number,
  lock = false
) {
  const dateKey = utcDateKey(date)

  if (lock) {
    await lockCampCapacity(db, location.id, date)
  }

  const bookedSpots = await db.booking.count({
    where: {
      locationId: location.id,
      startDate: utcDayRange(date),
      status: { in: ['CONFIRMED', 'PENDING'] },
      product: { type: 'CAMP' }
    }
  })

  const capacity = location.capacity
  const remaining = Math.max(0, capacity - bookedSpots)

  if (requestedSpots > remaining) {
    throw new CampCapacityExceededError(location.name, dateKey, capacity, remaining)
  }

  return { capacity, bookedSpots, remaining }
}

export async function assertCampCapacity(
  db: CapacityClient,
  selectedLocationName: string,
  date: Date,
  requestedSpots: number
) {
  const location = await resolveCampLocation(db, selectedLocationName)
  if (!location) {
    throw new Error(`Configured camp location not found: ${selectedLocationName}`)
  }

  return assertCampCapacityForLocation(db, location, date, requestedSpots)
}
