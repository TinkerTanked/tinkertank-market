import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findUnique: vi.fn() },
    booking: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    event: { create: vi.fn(), update: vi.fn() },
    location: { findFirst: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { eventService } from '@/lib/events'

describe('calendar event fulfilment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the confirmed booking location rather than a legacy default', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order-1',
      orderItems: [
        {
          id: 'item-1',
          orderId: 'order-1',
          studentId: 'student-1',
          productId: 'day-camp',
          bookingDate: new Date('2026-08-26T00:00:00.000Z'),
          price: 119.99,
          product: { id: 'day-camp', name: 'Day Camp', type: 'CAMP', duration: 360, ageMin: 6, ageMax: 16 },
          student: { id: 'student-1', name: 'Test Purchase', allergies: null },
        },
      ],
    } as never)
    vi.mocked(prisma.booking.findFirst).mockResolvedValue({ id: 'booking-1', locationId: 'neutral-bay-id' } as never)
    vi.mocked(prisma.event.create).mockResolvedValue({ id: 'event-1', locationId: 'neutral-bay-id' } as never)
    vi.mocked(prisma.booking.update).mockResolvedValue({ id: 'booking-1', eventId: 'event-1' } as never)
    vi.mocked(prisma.event.update).mockResolvedValue({ id: 'event-1', currentCount: 1 } as never)

    await eventService.createEventsFromOrder('order-1')

    expect(prisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ locationId: 'neutral-bay-id' }),
      })
    )
    expect(prisma.location.findFirst).not.toHaveBeenCalled()
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { eventId: 'event-1', status: 'CONFIRMED' },
    })
  })
})
