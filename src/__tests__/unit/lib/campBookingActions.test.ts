import { describe, expect, it, vi } from 'vitest'
import { BookingActionError, issueCampCredit, moveCampBooking } from '@/lib/campBookingActions'

const NOW = new Date('2026-10-16T01:00:00.000Z') // Fri 16 Oct, Sydney
const NEUTRAL_BAY = { id: 'loc-nb', name: 'TinkerTank Neutral Bay', capacity: 35 }

function campBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bk_1',
    studentId: 'st_1',
    productId: 'day-camp',
    locationId: 'loc-manly',
    startDate: new Date('2026-10-06T09:00:00.000Z'),
    endDate: new Date('2026-10-06T15:00:00.000Z'),
    status: 'CONFIRMED',
    notes: null,
    product: { type: 'CAMP', name: 'Day Camp' },
    location: { name: 'Manly Library' },
    student: { name: 'Ava Chen' },
    attendance: null,
    campCredit: null,
    ...overrides,
  }
}

function fakeDb({
  booking = campBooking(),
  booked = 0,
  clash = null as unknown,
}: { booking?: unknown; booked?: number; clash?: unknown } = {}) {
  const orderItem = {
    id: 'oi_1',
    orderId: 'ord_1',
    price: 119.99,
    bookingDate: new Date('2026-10-06T00:00:00.000Z'),
    order: { customerEmail: 'Parent@Example.com ', customerName: 'Mia Chen' },
  }
  const db: any = {
    booking: {
      findUnique: vi.fn().mockResolvedValue(booking),
      findFirst: vi.fn().mockResolvedValue(clash),
      count: vi.fn().mockResolvedValue(booked),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...(booking as object), ...data })),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    location: { findFirst: vi.fn().mockResolvedValue(NEUTRAL_BAY) },
    orderItem: { findFirst: vi.fn().mockResolvedValue(orderItem), update: vi.fn().mockResolvedValue(orderItem) },
    campCredit: { create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'cc_1', ...data })) },
    $executeRaw: vi.fn().mockResolvedValue(1),
  }
  db.$transaction = vi.fn().mockImplementation((fn: (tx: unknown) => unknown) => fn(db))
  return db
}

function fakeStripe() {
  return {
    coupons: { create: vi.fn().mockResolvedValue({ id: 'co_1' }), del: vi.fn().mockResolvedValue({}) },
    promotionCodes: { create: vi.fn().mockImplementation(({ code }) => Promise.resolve({ id: 'promo_1', code })) },
  } as any
}

describe('moving a camp day', () => {
  it('moves to the new date and location, keeping the time of day and the paid order line in step', async () => {
    const db = fakeDb()

    const moved = await moveCampBooking(db, 'bk_1', { dateKey: '2026-10-20', locationId: 'neutral-bay' }, NOW)

    expect(db.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startDate: new Date('2026-10-20T09:00:00.000Z'),
          endDate: new Date('2026-10-20T15:00:00.000Z'),
          locationId: 'loc-nb',
        }),
      })
    )
    expect(db.orderItem.update).toHaveBeenCalledWith({
      where: { id: 'oi_1' },
      data: { bookingDate: new Date('2026-10-20T00:00:00.000Z'), location: 'TinkerTank Neutral Bay' },
    })
    expect(moved.from).toEqual({ dateKey: '2026-10-06', locationName: 'Manly Library' })
  })

  it('refuses a full day and leaves the booking alone', async () => {
    const db = fakeDb({ booked: 35 })

    await expect(moveCampBooking(db, 'bk_1', { dateKey: '2026-10-20', locationId: 'neutral-bay' }, NOW)).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('full'),
    })
    expect(db.booking.update).not.toHaveBeenCalled()
  })

  it('allows the last place', async () => {
    const db = fakeDb({ booked: 34 })

    await expect(moveCampBooking(db, 'bk_1', { dateKey: '2026-10-20', locationId: 'neutral-bay' }, NOW)).resolves.toBeTruthy()
  })

  it.each([
    ['a day Manly Library is not running', { dateKey: '2026-10-20', locationId: 'manly-library' }],
    ['a Neutral Bay closure day', { dateKey: '2026-09-24', locationId: 'neutral-bay' }],
    ['a day already gone in Sydney', { dateKey: '2026-10-15', locationId: 'neutral-bay' }],
  ])('refuses %s', async (_label, target) => {
    const db = fakeDb()

    await expect(moveCampBooking(db, 'bk_1', target, NOW)).rejects.toBeInstanceOf(BookingActionError)
    expect(db.booking.update).not.toHaveBeenCalled()
  })

  it('refuses to move All Day Camp to a location that only runs Day Camp', async () => {
    const db = fakeDb({
      booking: campBooking({ location: { name: 'TinkerTank Neutral Bay' }, product: { type: 'CAMP', name: 'All Day Camp' } }),
    })

    const beforeSpringCamps = new Date('2026-09-20T01:00:00.000Z')
    await expect(moveCampBooking(db, 'bk_1', { dateKey: '2026-10-06', locationId: 'manly-library' }, beforeSpringCamps)).rejects.toThrow(
      'only runs Day Camp'
    )
  })

  it('refuses a day the child is already booked into', async () => {
    const db = fakeDb({ clash: { id: 'bk_2' } })

    await expect(moveCampBooking(db, 'bk_1', { dateKey: '2026-10-20', locationId: 'neutral-bay' }, NOW)).rejects.toThrow('already booked')
  })

  it('refuses a day the child has already attended', async () => {
    const db = fakeDb({ booking: campBooking({ attendance: { id: 'att_1' } }) })

    await expect(moveCampBooking(db, 'bk_1', { dateKey: '2026-10-20', locationId: 'neutral-bay' }, NOW)).rejects.toThrow('checked in')
  })
})

describe('cancelling a camp day for credit', () => {
  it('issues a single-use credit for the day price that expires in one year', async () => {
    const db = fakeDb()
    const stripe = fakeStripe()

    const result = await issueCampCredit(db, stripe, 'bk_1', NOW)

    const oneYear = Math.floor(new Date('2027-10-16T01:00:00.000Z').getTime() / 1000)
    expect(stripe.coupons.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount_off: 11999, currency: 'aud', duration: 'once', max_redemptions: 1, redeem_by: oneYear })
    )
    expect(stripe.promotionCodes.create).toHaveBeenCalledWith(
      expect.objectContaining({ coupon: 'co_1', max_redemptions: 1, expires_at: oneYear })
    )
    expect(db.booking.updateMany).toHaveBeenCalledWith({ where: { id: 'bk_1', status: 'CONFIRMED' }, data: { status: 'CANCELLED' } })
    expect(result.credit).toMatchObject({ amount: 119.99, customerEmail: 'parent@example.com', bookingId: 'bk_1' })
    expect(result.credit.code).toMatch(/^TT-[A-Z2-9]{6}$/)
  })

  it('withdraws the Stripe credit when the booking changed underneath', async () => {
    const db = fakeDb()
    db.booking.updateMany.mockResolvedValue({ count: 0 })
    const stripe = fakeStripe()

    await expect(issueCampCredit(db, stripe, 'bk_1', NOW)).rejects.toThrow('changed')
    expect(stripe.coupons.del).toHaveBeenCalledWith('co_1')
    expect(db.campCredit.create).not.toHaveBeenCalled()
  })

  it('never credits the same day twice', async () => {
    const db = fakeDb({ booking: campBooking({ campCredit: { id: 'cc_0' } }) })
    const stripe = fakeStripe()

    await expect(issueCampCredit(db, stripe, 'bk_1', NOW)).rejects.toThrow('already issued')
    expect(stripe.coupons.create).not.toHaveBeenCalled()
  })
})
