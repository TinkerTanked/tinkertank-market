import { describe, expect, it, vi } from 'vitest'
import {
  assertCampCapacityForLocation,
  CampCapacityExceededError,
  resolveCampLocation
} from '@/lib/campCapacity'
import {
  DEFAULT_CAMP_DAILY_CAPACITY,
  getDailyCapacity
} from '@/data/locationAvailability'

function capacityDb(bookedSpots: number) {
  return {
    booking: {
      count: vi.fn().mockResolvedValue(bookedSpots)
    },
    location: {
      findFirst: vi.fn()
    },
    $executeRaw: vi.fn().mockResolvedValue(1)
  } as any
}

describe('camp capacity', () => {
  it('defaults configured camp locations to 35 places', () => {
    expect(DEFAULT_CAMP_DAILY_CAPACITY).toBe(35)
    expect(getDailyCapacity('TinkerTank Neutral Bay')).toBe(35)
    expect(getDailyCapacity('Manly Library')).toBe(35)
  })

  it('resolves the legacy Neutral Bay database name', async () => {
    const db = capacityDb(0)
    const location = { id: 'neutral-bay', name: 'Neutral Bay', capacity: 35 }
    db.location.findFirst.mockResolvedValue(location)

    await expect(resolveCampLocation(db, 'TinkerTank Neutral Bay')).resolves.toEqual(location)
    expect(db.location.findFirst).toHaveBeenCalledWith({
      where: {
        name: { in: ['TinkerTank Neutral Bay', 'Neutral Bay'] },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        capacity: true
      }
    })
  })

  it('allows the final available place', async () => {
    const db = capacityDb(34)

    await expect(assertCampCapacityForLocation(
      db,
      { id: 'neutral-bay', name: 'TinkerTank Neutral Bay', capacity: 35 },
      new Date('2026-09-29T00:00:00.000Z'),
      1
    )).resolves.toEqual({ capacity: 35, bookedSpots: 34, remaining: 1 })
  })

  it('rejects a booking beyond the location capacity', async () => {
    const db = capacityDb(35)

    await expect(assertCampCapacityForLocation(
      db,
      { id: 'manly-library', name: 'Manly Library', capacity: 35 },
      new Date('2026-09-29T00:00:00.000Z'),
      1
    )).rejects.toMatchObject<Partial<CampCapacityExceededError>>({
      locationName: 'Manly Library',
      date: '2026-09-29',
      capacity: 35,
      remaining: 0
    })
  })

  it('respects a per-location override and acquires a transaction lock', async () => {
    const db = capacityDb(18)

    await expect(assertCampCapacityForLocation(
      db,
      { id: 'small-venue', name: 'Small Venue', capacity: 20 },
      new Date('2026-10-01T00:00:00.000Z'),
      2,
      true
    )).resolves.toEqual({ capacity: 20, bookedSpots: 18, remaining: 2 })
    expect(db.$executeRaw).toHaveBeenCalledOnce()
  })
})
