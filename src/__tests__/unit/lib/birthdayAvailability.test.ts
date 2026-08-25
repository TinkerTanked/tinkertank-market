import { describe, expect, it, vi } from 'vitest'
import {
  assertBirthdaySlotAvailable,
  birthdaySlotStart,
  BirthdaySlotUnavailableError
} from '@/lib/birthdayAvailability'

function availabilityDb(existingBooking: { id: string } | null) {
  return {
    booking: {
      findFirst: vi.fn().mockResolvedValue(existingBooking)
    },
    $executeRaw: vi.fn().mockResolvedValue(1)
  } as any
}

describe('birthday availability', () => {
  it('builds the stored UTC time from the selected local slot', () => {
    expect(birthdaySlotStart('2026-09-19', '15:30')?.toISOString()).toBe('2026-09-19T15:30:00.000Z')
    expect(birthdaySlotStart('2026-02-31', '15:30')).toBeNull()
    expect(birthdaySlotStart('2026-09-19', '25:00')).toBeNull()
  })

  it('checks birthday bookings globally rather than by location', async () => {
    const db = availabilityDb(null)
    const startDate = new Date('2026-09-19T15:30:00.000Z')

    await expect(assertBirthdaySlotAvailable(db, startDate)).resolves.toBeUndefined()
    expect(db.booking.findFirst).toHaveBeenCalledWith({
      where: {
        startDate,
        status: { in: ['CONFIRMED', 'PENDING'] },
        product: { type: 'BIRTHDAY' }
      },
      select: { id: true }
    })
  })

  it('rejects an occupied slot after acquiring the transaction lock', async () => {
    const db = availabilityDb({ id: 'existing-party' })
    const startDate = new Date('2026-09-19T15:30:00.000Z')

    await expect(assertBirthdaySlotAvailable(db, startDate, true)).rejects.toBeInstanceOf(BirthdaySlotUnavailableError)
    expect(db.$executeRaw).toHaveBeenCalledOnce()
  })
})
