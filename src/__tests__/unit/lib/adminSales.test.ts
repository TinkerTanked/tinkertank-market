import { describe, expect, it, vi } from 'vitest'
import { SCHOOL_TERMS } from '@/config/schoolTerms'
import { campHolidayWindow } from '@/lib/adminAnalytics'
import { createManualBooking } from '@/lib/adminManualBooking'
import { metaTotals } from '@/lib/metaAds'

describe('campHolidayWindow', () => {
  it('sells the next holidays during term, starting the day after term ends', () => {
    expect(campHolidayWindow(SCHOOL_TERMS, '2026-10-13')).toEqual({ name: 'Summer holidays', start: '2026-12-18', end: '2027-02-02' })
  })

  it('starts from today while the holidays are running', () => {
    expect(campHolidayWindow(SCHOOL_TERMS, '2026-10-01')).toEqual({ name: 'Spring holidays', start: '2026-10-01', end: '2026-10-12' })
  })

  it('still shows the holidays on their last day', () => {
    expect(campHolidayWindow(SCHOOL_TERMS, '2026-10-12')?.name).toBe('Spring holidays')
  })
})

function fakeDb({ booked = 0 } = {}) {
  const db: any = {
    $executeRaw: vi.fn().mockResolvedValue(0),
    student: { findUnique: vi.fn().mockResolvedValue({ id: 'st_1' }), create: vi.fn() },
    location: { findFirst: vi.fn().mockResolvedValue({ id: 'loc-nb', name: 'Neutral Bay', capacity: 35 }) },
    product: {
      findUnique: vi.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve({ id: where.id, name: where.id, price: 119.99, type: 'CAMP' })
      )
    },
    booking: {
      count: vi.fn().mockResolvedValue(booked),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn().mockResolvedValue({ count: 0 })
    },
    order: { create: vi.fn().mockResolvedValue({ id: 'ord_1' }) }
  }
  db.$transaction = (run: (tx: unknown) => unknown) => run(db)
  return db
}

const parent = { name: 'Mia Chen', email: 'Mia@Example.com' }

describe('createManualBooking', () => {
  it('records invoiced camp days as a paid order whose day prices add up to the invoice', async () => {
    const db = fakeDb()
    await createManualBooking(db, {
      student: { id: 'st_1' },
      parent,
      booking: { kind: 'camp', locationId: 'neutral-bay', dates: ['2026-12-23', '2026-12-21', '2026-12-22'], allDay: false },
      payment: { kind: 'invoiced', amount: 100 }
    })

    const order = db.order.create.mock.calls[0][0].data
    expect(order).toMatchObject({ status: 'PAID', totalAmount: 100, customerEmail: 'mia@example.com' })
    expect(order.orderItems.create.map((item: { price: number }) => item.price)).toEqual([33.33, 33.33, 33.34])

    const bookings = db.booking.createMany.mock.calls[0][0].data
    expect(bookings.map((booking: { startDate: Date }) => booking.startDate.toISOString())).toEqual([
      '2026-12-21T09:00:00.000Z',
      '2026-12-22T09:00:00.000Z',
      '2026-12-23T09:00:00.000Z'
    ])
    expect(bookings.every((booking: { rosterOverride: boolean }) => !booking.rosterOverride)).toBe(true)
  })

  it('refuses a camp day that is already full', async () => {
    const db = fakeDb({ booked: 35 })
    await expect(
      createManualBooking(db, {
        student: { id: 'st_1' },
        parent,
        booking: { kind: 'camp', locationId: 'neutral-bay', dates: ['2026-12-21'], allDay: false },
        payment: { kind: 'complimentary' }
      })
    ).rejects.toThrow('full on Mon 21 Dec')
    expect(db.order.create).not.toHaveBeenCalled()
  })

  it('puts Ignite term bookings on the roster without a Stripe subscription', async () => {
    const db = fakeDb()
    await createManualBooking(db, {
      student: { id: 'st_1' },
      parent,
      booking: { kind: 'ignite', sessionId: 'ignite-nb-sat', fromDate: '2026-10-17' },
      payment: { kind: 'invoiced', amount: 300 }
    })

    const bookings = db.booking.createMany.mock.calls[0][0].data
    expect(bookings.length).toBeGreaterThan(1)
    expect(bookings.every((booking: { rosterOverride: boolean }) => booking.rosterOverride)).toBe(true)
    expect(bookings.reduce((sum: number, booking: { totalPrice: number }) => sum + booking.totalPrice, 0)).toBeCloseTo(300, 2)
  })
})

describe('metaTotals', () => {
  it('counts each purchase once although Meta reports it under several action types', () => {
    const totals = metaTotals({
      spend: '456.21',
      inline_link_clicks: '127',
      actions: [
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '6' },
        { action_type: 'onsite_web_purchase', value: '6' },
        { action_type: 'omni_purchase', value: '6' },
        { action_type: 'purchase', value: '6' }
      ],
      action_values: [
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '828.94' },
        { action_type: 'omni_purchase', value: '828.94' }
      ]
    })
    expect(totals).toEqual({ spend: 456.21, impressions: 0, linkClicks: 127, purchases: 6, purchaseValue: 828.94 })
  })
})
