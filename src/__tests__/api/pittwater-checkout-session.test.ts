import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { IGNITE_SESSIONS } from '@/config/igniteProducts'

const mockStripe = {
  prices: { retrieve: vi.fn() },
  checkout: { sessions: { create: vi.fn() } }
}

vi.mock('stripe', () => ({ default: vi.fn(() => mockStripe) }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: { findFirst: vi.fn() },
    location: { findFirst: vi.fn() },
    booking: { count: vi.fn() },
    order: { update: vi.fn() },
    $transaction: vi.fn()
  }
}))

import { prisma } from '@/lib/prisma'

const pittwater = IGNITE_SESSIONS.find(session => session.id === 'ignite-pittwater-house')!
const product = { id: pittwater.id, name: pittwater.name, price: 39.99, isActive: true }
const location = { id: 'location-pittwater', name: pittwater.location, capacity: 20, isActive: true }

function body() {
  return {
    items: [{
      productId: pittwater.id,
      quantity: 1,
      isSubscription: true,
      students: [{
        firstName: 'Ada',
        lastName: 'Lovelace',
        dateOfBirth: '2018-01-01',
        parentName: 'Parent Lovelace',
        parentPhone: '0455 400 261',
        emergencyContact: { name: 'Parent Lovelace', phone: '0455 400 261' }
      }]
    }],
    customerInfo: {
      name: 'Parent Lovelace',
      email: 'parent@example.com',
      phone: '0455 400 261'
    }
  }
}

async function checkout(payload = body()) {
  const { POST } = await import('@/app/api/stripe/create-checkout-session/route')
  return POST(new NextRequest('http://localhost:3000/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }))
}

describe('Pittwater fixed-term checkout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-29T00:00:00.000Z'))
    vi.clearAllMocks()
    vi.mocked(prisma.product.findFirst).mockResolvedValue(product as never)
    vi.mocked(prisma.location.findFirst).mockResolvedValue(location as never)
    vi.mocked(prisma.booking.count).mockResolvedValue(0)
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback({
      order: { create: vi.fn().mockResolvedValue({ id: 'order-pittwater' }) },
      student: { create: vi.fn().mockResolvedValue({ id: 'student-ada' }) },
      orderItem: { create: vi.fn().mockResolvedValue({}) }
    }))
    vi.mocked(prisma.order.update).mockResolvedValue({} as never)
    mockStripe.prices.retrieve.mockResolvedValue({
      id: pittwater.stripePriceId,
      active: true,
      currency: 'aud',
      unit_amount: 3999,
      recurring: { interval: 'week' }
    })
    mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_pittwater', url: 'https://checkout.stripe.test/pittwater' })
  })

  afterEach(() => vi.useRealTimers())

  it('charges 19 October now and anchors weekly billing to 26 October', async () => {
    const response = await checkout()

    expect(response.status).toBe(200)
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [
          expect.objectContaining({ price_data: expect.objectContaining({ product: pittwater.stripeProductId, unit_amount: 3999 }) }),
          { price: pittwater.stripePriceId, quantity: 1 }
        ],
        subscription_data: expect.objectContaining({
          trial_end: Math.floor(new Date('2026-10-25T13:00:00.000Z').getTime() / 1000)
        }),
        metadata: expect.objectContaining({
          isSubscription: 'true',
          isIgniteSingleSession: 'false',
          igniteSessionId: pittwater.id
        })
      }),
      { idempotencyKey: 'ignite-checkout-order-pittwater' }
    )
  })

  it('switches to one-time payment when only 7 December remains', async () => {
    vi.setSystemTime(new Date('2026-12-01T00:00:00.000Z'))

    const response = await checkout()

    expect(response.status).toBe(200)
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 3999 }) })],
        metadata: expect.objectContaining({ isSubscription: 'false', isIgniteSingleSession: 'true' })
      }),
      expect.anything()
    )
    const params = mockStripe.checkout.sessions.create.mock.calls[0][0]
    expect(params).not.toHaveProperty('subscription_data')
  })

  it('stops before creating an order when capacity is exhausted', async () => {
    vi.mocked(prisma.booking.count).mockResolvedValue(20)

    const response = await checkout()

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: 'This Ignite session is sold out.' })
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it.each(['ignite-brookvale-cc', 'ignite-brookvale-ps'])(
    'rejects retired session %s from stale or direct checkout requests',
    async productId => {
      const payload = body()
      payload.items[0].productId = productId

      const response = await checkout(payload)

      expect(response.status).toBe(410)
      await expect(response.json()).resolves.toEqual({ error: 'This Ignite session is no longer available.' })
      expect(prisma.product.findFirst).not.toHaveBeenCalled()
      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled()
    }
  )
})
