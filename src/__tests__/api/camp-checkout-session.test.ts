import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockStripe = {
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
}

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: { findMany: vi.fn() },
    student: { create: vi.fn() },
    order: { create: vi.fn(), update: vi.fn() },
  },
}))

vi.mock('@/lib/campCapacity', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/campCapacity')>()),
  assertCampCapacity: vi.fn(),
}))

vi.mock('@/lib/birthdayAvailability', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/birthdayAvailability')>()),
  assertBirthdaySlotAvailable: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { assertCampCapacity } from '@/lib/campCapacity'

const campProduct = {
  id: 'day-camp',
  name: 'Day Camp',
  type: 'CAMP',
  price: 119.99,
  duration: 360,
  description: 'A day of coding and robotics',
  ageMin: 6,
  ageMax: 16,
  isActive: true,
}

function checkoutBody(dateOfBirth = '2010-07-14') {
  return {
    bookingSchemaVersion: 1,
    items: [
      {
        productId: 'day-camp',
        quantity: 1,
        students: [
          {
            firstName: 'Dragan',
            lastName: 'McDowell',
            dateOfBirth,
            age: 16,
            school: '',
            parentName: 'Jamie McDowell',
            parentEmail: 'jamie@example.com',
            parentPhone: '0412 345 678',
            emergencyContact: { name: 'Jamie McDowell', phone: '0412 345 678' },
          },
        ],
        selectedDate: '2026-09-29',
        selectedDates: ['2026-09-29'],
        productName: 'Forged client name',
        productPrice: 1,
        location: 'TinkerTank Neutral Bay',
      },
    ],
    customerInfo: {
      name: 'Jamie McDowell',
      firstName: 'Jamie',
      lastName: 'McDowell',
      email: 'jamie@example.com',
      phone: '0412 345 678',
    },
    emergencyContact: { name: 'Jamie McDowell', phone: '0412 345 678' },
  }
}

async function postCheckout(body: ReturnType<typeof checkoutBody>) {
  const { POST } = await import('@/app/api/stripe/create-checkout-session/route')
  return POST(
    new NextRequest('http://localhost:3000/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  )
}

describe('camp checkout session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.product.findMany).mockResolvedValue([campProduct] as never)
    vi.mocked(prisma.student.create).mockResolvedValue({ id: 'student-1' } as never)
    vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-1' } as never)
    vi.mocked(prisma.order.update).mockResolvedValue({ id: 'order-1' } as never)
    vi.mocked(assertCampCapacity).mockResolvedValue(undefined)
    mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_test_1', url: 'https://checkout.stripe.test/session' })
  })

  it('uses server pricing and creates an optional-school camp order for a 16-year-old', async () => {
    const response = await postCheckout(checkoutBody())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      sessionId: 'cs_test_1',
      orderId: 'order-1',
      url: 'https://checkout.stripe.test/session',
    })
    expect(assertCampCapacity).toHaveBeenCalledWith(prisma, 'TinkerTank Neutral Bay', new Date('2026-09-29T00:00:00.000Z'), 1)
    expect(prisma.student.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        firstName: 'Dragan',
        lastName: 'McDowell',
        birthdate: new Date('2010-07-14T00:00:00.000Z'),
        school: null,
        emergencyContactName: 'Jamie McDowell',
        emergencyContactPhone: '0412 345 678',
      }),
    })
    expect(prisma.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerEmail: 'jamie@example.com',
        customerPhone: '0412 345 678',
        bookingSchemaVersion: 1,
        totalAmount: 119.99,
        orderItems: {
          create: [
            expect.objectContaining({
              productId: 'day-camp',
              studentId: 'student-1',
              bookingDate: new Date('2026-09-29T00:00:00.000Z'),
              price: 119.99,
              location: 'TinkerTank Neutral Bay',
            }),
          ],
        },
      }),
    })
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        customer_email: 'jamie@example.com',
        client_reference_id: 'order-1',
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 11999 }),
            quantity: 1,
          }),
        ],
      })
    )
  })

  it('rejects an ineligible participant before creating an order or Stripe session', async () => {
    const response = await postCheckout(checkoutBody('2009-07-14'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Day Camp is for children aged 6–16.' })
    expect(prisma.student.create).not.toHaveBeenCalled()
    expect(prisma.order.create).not.toHaveBeenCalled()
    expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('prices multiple children and dates from the database without losing order items', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { ...campProduct, id: 'all-day-camp', name: 'All Day Camp', price: 149.99 },
    ] as never)
    vi.mocked(prisma.student.create)
      .mockReset()
      .mockResolvedValueOnce({ id: 'student-1' } as never)
      .mockResolvedValueOnce({ id: 'student-2' } as never)

    const body = checkoutBody()
    body.items[0].productId = 'all-day-camp'
    body.items[0].selectedDates = ['2026-09-29', '2026-09-30']
    body.items[0].students.push({
      ...body.items[0].students[0],
      firstName: 'Alex',
      dateOfBirth: '2014-03-12',
      age: 12,
    })

    const response = await postCheckout(body)

    expect(response.status).toBe(200)
    expect(assertCampCapacity).toHaveBeenCalledTimes(2)
    expect(assertCampCapacity).toHaveBeenCalledWith(prisma, 'TinkerTank Neutral Bay', new Date('2026-09-29T00:00:00.000Z'), 2)
    expect(assertCampCapacity).toHaveBeenCalledWith(prisma, 'TinkerTank Neutral Bay', new Date('2026-09-30T00:00:00.000Z'), 2)
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 14999 }), quantity: 4 })],
      })
    )
    expect(prisma.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        totalAmount: 599.96,
        orderItems: {
          create: expect.arrayContaining([
            expect.objectContaining({ studentId: 'student-1' }),
            expect.objectContaining({ studentId: 'student-2' }),
          ]),
        },
      }),
    })
    const orderCreate = vi.mocked(prisma.order.create).mock.calls[0][0]
    expect(orderCreate.data.orderItems?.create).toHaveLength(4)
  })
})
