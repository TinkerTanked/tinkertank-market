import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'

const mockStripe = {
  webhooks: {
    constructEvent: vi.fn()
  }
}

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe)
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    booking: {
      create: vi.fn(),
      findMany: vi.fn()
    },
    location: {
      findFirst: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

vi.mock('@/lib/events', () => ({
  eventService: {
    createEventsFromOrder: vi.fn()
  }
}))

vi.mock('@/lib/email', () => ({
  sendBookingConfirmationEmail: vi.fn().mockResolvedValue({ success: true })
}))

vi.mock('@/lib/notifications', () => ({
  notificationService: {
    notifyBookingConfirmed: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@/lib/error-handling', () => ({
  ErrorHandler: {
    retryOperation: vi.fn((fn) => fn()),
    logError: vi.fn(),
    handlePaymentError: vi.fn()
  },
  ErrorCategory: {
    PAYMENT: 'PAYMENT',
    CALENDAR: 'CALENDAR',
    EMAIL: 'EMAIL',
    BOOKING: 'BOOKING',
    SYSTEM: 'SYSTEM'
  },
  ErrorSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  },
  withErrorHandling: vi.fn((fn) => fn())
}))

vi.mock('next/headers', () => ({
  headers: vi.fn()
}))

import { prisma } from '@/lib/prisma'
import { eventService } from '@/lib/events'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { notificationService } from '@/lib/notifications'
import { headers } from 'next/headers'

const mockLocation = {
  id: 'location_nb_123',
  name: 'Neutral Bay Studio',
  address: '123 Military Road, Neutral Bay NSW 2089',
  capacity: 20,
  timezone: 'Australia/Sydney',
  isActive: true
}

const createMockOrder = (overrides = {}) => ({
  id: 'order_test_123',
  customerName: 'Test Parent',
  customerEmail: 'parent@test.com',
  customerPhone: '+61400000000',
  status: 'PENDING',
  totalAmount: 15000,
  currency: 'AUD',
  stripePaymentIntentId: 'pi_test_123',
  createdAt: new Date(),
  updatedAt: new Date(),
  orderItems: [
    {
      id: 'item_camp_123',
      productId: 'product_camp_123',
      price: 15000,
      bookingDate: new Date('2025-04-15T09:00:00Z'),
      studentId: 'student_123',
      student: {
        id: 'student_123',
        name: 'Test Child',
        birthdate: new Date('2017-05-15'),
        allergies: null
      },
      product: {
        id: 'product_camp_123',
        name: 'Day Camp',
        type: 'CAMP',
        duration: 360,
        price: 15000
      }
    }
  ],
  ...overrides
})

const createCheckoutSession = (overrides = {}): Partial<Stripe.Checkout.Session> => ({
  id: 'cs_test_123',
  payment_status: 'paid',
  metadata: {
    orderId: 'order_test_123'
  },
  ...overrides
})

const createWebhookEvent = (type: string, data: any): Stripe.Event => ({
  id: `evt_${Date.now()}`,
  type,
  data: { object: data },
  api_version: '2025-02-24.acacia',
  created: Math.floor(Date.now() / 1000),
  livemode: false,
  object: 'event',
  pending_webhooks: 0,
  request: null
})

async function callWebhook(body: string, signature: string | null) {
  const { POST } = await import('@/app/api/stripe/webhooks/route')

  const request = new NextRequest('http://localhost:3000/api/stripe/webhooks', {
    method: 'POST',
    body,
    headers: signature ? { 'stripe-signature': signature } : {}
  })

  const mockHeaders = new Map()
  if (signature) {
    mockHeaders.set('stripe-signature', signature)
  }
  ;(headers as any).mockResolvedValue({
    get: (key: string) => mockHeaders.get(key) || null
  })

  return POST(request)
}

describe('Stripe Webhook Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Missing stripe-signature header returns 400', () => {
    it('should return 400 when stripe-signature header is missing', async () => {
      const response = await callWebhook('{}', null)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Missing stripe signature')
    })
  })

  describe('2. Invalid signature returns 400', () => {
    it('should return 400 when signature verification fails', async () => {
      ;(mockStripe.webhooks.constructEvent as any).mockImplementation(() => {
        throw new Error('Webhook signature verification failed')
      })

      const response = await callWebhook('{}', 'invalid_signature')

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Invalid signature')
    })
  })

  describe('3. checkout.session.completed with paid status transitions order PENDING → PAID', () => {
    it('should transition order from PENDING to PAID on successful checkout', async () => {
      const mockOrder = createMockOrder()
      const checkoutSession = createCheckoutSession()
      const webhookEvent = createWebhookEvent('checkout.session.completed', checkoutSession)

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)
      ;(prisma.order.findUnique as any).mockResolvedValue(mockOrder)
      ;(prisma.location.findFirst as any).mockResolvedValue(mockLocation)
      ;(prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          order: {
            update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'PAID' })
          },
          booking: {
            create: vi.fn().mockResolvedValue({ id: 'booking_123', status: 'CONFIRMED' })
          },
          location: {
            findFirst: vi.fn().mockResolvedValue(mockLocation)
          }
        })
      })
      ;(eventService.createEventsFromOrder as any).mockResolvedValue([{ id: 'event_123' }])

      const response = await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order_test_123' },
        include: {
          orderItems: {
            include: {
              product: true,
              student: true
            }
          }
        }
      })
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should not process if order status is not PENDING', async () => {
      const mockOrder = createMockOrder({ status: 'PAID' })
      const checkoutSession = createCheckoutSession()
      const webhookEvent = createWebhookEvent('checkout.session.completed', checkoutSession)

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)
      ;(prisma.order.findUnique as any).mockResolvedValue(mockOrder)

      const response = await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      expect(response.status).toBe(200)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should not process if payment status is not paid', async () => {
      const mockOrder = createMockOrder()
      const checkoutSession = createCheckoutSession({ payment_status: 'unpaid' })
      const webhookEvent = createWebhookEvent('checkout.session.completed', checkoutSession)

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)
      ;(prisma.order.findUnique as any).mockResolvedValue(mockOrder)

      const response = await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      expect(response.status).toBe(200)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('4. checkout.session.completed creates bookings for CAMP products', () => {
    it('should create Booking records with status CONFIRMED for CAMP products', async () => {
      const mockOrder = createMockOrder()
      const checkoutSession = createCheckoutSession()
      const webhookEvent = createWebhookEvent('checkout.session.completed', checkoutSession)

      const mockBookingCreate = vi.fn().mockResolvedValue({
        id: 'booking_123',
        studentId: 'student_123',
        productId: 'product_camp_123',
        status: 'CONFIRMED'
      })

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)
      ;(prisma.order.findUnique as any).mockResolvedValue(mockOrder)
      ;(prisma.location.findFirst as any).mockResolvedValue(mockLocation)
      ;(prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          order: {
            update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'PAID' })
          },
          booking: {
            create: mockBookingCreate
          },
          location: {
            findFirst: vi.fn().mockResolvedValue(mockLocation)
          }
        })
      })
      ;(eventService.createEventsFromOrder as any).mockResolvedValue([{ id: 'event_123' }])

      const response = await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      expect(response.status).toBe(200)
      expect(prisma.$transaction).toHaveBeenCalled()

      const transactionCallback = (prisma.$transaction as any).mock.calls[0][0]
      const mockTx = {
        order: { update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'PAID' }) },
        booking: { create: mockBookingCreate },
        location: { findFirst: vi.fn().mockResolvedValue(mockLocation) }
      }
      await transactionCallback(mockTx)

      expect(mockBookingCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          studentId: 'student_123',
          productId: 'product_camp_123',
          locationId: mockLocation.id,
          status: 'CONFIRMED'
        })
      })
    })

    it('should create Booking records for BIRTHDAY products', async () => {
      const mockOrder = createMockOrder({
        orderItems: [
          {
            id: 'item_birthday_123',
            productId: 'product_birthday_123',
            price: 35000,
            bookingDate: new Date('2025-05-20T14:00:00Z'),
            studentId: 'student_123',
            student: {
              id: 'student_123',
              name: 'Birthday Child',
              birthdate: new Date('2018-05-20'),
              allergies: null
            },
            product: {
              id: 'product_birthday_123',
              name: 'Birthday Party',
              type: 'BIRTHDAY',
              duration: 120,
              price: 35000
            }
          }
        ]
      })
      const checkoutSession = createCheckoutSession()
      const webhookEvent = createWebhookEvent('checkout.session.completed', checkoutSession)

      const mockBookingCreate = vi.fn().mockResolvedValue({
        id: 'booking_birthday_123',
        status: 'CONFIRMED'
      })

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)
      ;(prisma.order.findUnique as any).mockResolvedValue(mockOrder)
      ;(prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          order: { update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'PAID' }) },
          booking: { create: mockBookingCreate },
          location: { findFirst: vi.fn().mockResolvedValue(mockLocation) }
        })
      })
      ;(eventService.createEventsFromOrder as any).mockResolvedValue([])

      await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      const transactionCallback = (prisma.$transaction as any).mock.calls[0][0]
      const mockTx = {
        order: { update: vi.fn() },
        booking: { create: mockBookingCreate },
        location: { findFirst: vi.fn().mockResolvedValue(mockLocation) }
      }
      await transactionCallback(mockTx)

      expect(mockBookingCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: 'product_birthday_123',
          status: 'CONFIRMED'
        })
      })
    })
  })

  describe('5. Duplicate webhook call is idempotent', () => {
    it('should not create duplicate bookings when called twice with same session', async () => {
      const mockOrder = createMockOrder()
      const checkoutSession = createCheckoutSession()
      const webhookEvent = createWebhookEvent('checkout.session.completed', checkoutSession)

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)
      ;(prisma.order.findUnique as any).mockResolvedValue(mockOrder)
      ;(prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          order: { update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'PAID' }) },
          booking: { create: vi.fn().mockResolvedValue({ id: 'booking_123' }) },
          location: { findFirst: vi.fn().mockResolvedValue(mockLocation) }
        })
      })
      ;(eventService.createEventsFromOrder as any).mockResolvedValue([])

      await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      const paidOrder = createMockOrder({ status: 'PAID' })
      ;(prisma.order.findUnique as any).mockResolvedValue(paidOrder)

      vi.clearAllMocks()
      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)
      ;(prisma.order.findUnique as any).mockResolvedValue(paidOrder)
      ;(headers as any).mockResolvedValue({
        get: () => 'valid_signature'
      })

      const response = await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      expect(response.status).toBe(200)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should keep order status as PAID on duplicate call', async () => {
      const paidOrder = createMockOrder({ status: 'PAID' })
      const checkoutSession = createCheckoutSession()
      const webhookEvent = createWebhookEvent('checkout.session.completed', checkoutSession)

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)
      ;(prisma.order.findUnique as any).mockResolvedValue(paidOrder)

      const response = await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      expect(response.status).toBe(200)
      expect(prisma.order.update).not.toHaveBeenCalled()
    })
  })

  describe('6. Missing orderId in metadata logs warning but returns 200', () => {
    it('should return 200 when orderId is missing from session metadata', async () => {
      const checkoutSession = createCheckoutSession({ metadata: {} })
      const webhookEvent = createWebhookEvent('checkout.session.completed', checkoutSession)

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const response = await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)
      expect(prisma.order.findUnique).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should return 200 when metadata is null', async () => {
      const checkoutSession = createCheckoutSession({ metadata: null })
      const webhookEvent = createWebhookEvent('checkout.session.completed', checkoutSession)

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)

      const response = await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      expect(response.status).toBe(200)
      expect(prisma.order.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('7. Order not found returns gracefully', () => {
    it('should return 200 when order is not found in database', async () => {
      const checkoutSession = createCheckoutSession({ metadata: { orderId: 'nonexistent_order' } })
      const webhookEvent = createWebhookEvent('checkout.session.completed', checkoutSession)

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)
      ;(prisma.order.findUnique as any).mockResolvedValue(null)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const response = await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)

      expect(prisma.$transaction).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('Additional edge cases', () => {
    it('should send confirmation email after successful payment', async () => {
      const mockOrder = createMockOrder()
      const checkoutSession = createCheckoutSession()
      const webhookEvent = createWebhookEvent('checkout.session.completed', checkoutSession)

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)
      ;(prisma.order.findUnique as any).mockResolvedValue(mockOrder)
      ;(prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          order: { update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'PAID' }) },
          booking: { create: vi.fn().mockResolvedValue({ id: 'booking_123' }) },
          location: { findFirst: vi.fn().mockResolvedValue(mockLocation) }
        })
      })
      ;(eventService.createEventsFromOrder as any).mockResolvedValue([])

      await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      expect(sendBookingConfirmationEmail).toHaveBeenCalled()
    })

    it('should notify staff after successful payment', async () => {
      const mockOrder = createMockOrder()
      const checkoutSession = createCheckoutSession()
      const webhookEvent = createWebhookEvent('checkout.session.completed', checkoutSession)

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)
      ;(prisma.order.findUnique as any).mockResolvedValue(mockOrder)
      ;(prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          order: { update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'PAID' }) },
          booking: { create: vi.fn().mockResolvedValue({ id: 'booking_123' }) },
          location: { findFirst: vi.fn().mockResolvedValue(mockLocation) }
        })
      })
      ;(eventService.createEventsFromOrder as any).mockResolvedValue([])

      await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      expect(notificationService.notifyBookingConfirmed).toHaveBeenCalledWith(
        mockOrder.id,
        mockOrder.customerName,
        Number(mockOrder.totalAmount)
      )
    })

    it('should create calendar events after successful payment', async () => {
      const mockOrder = createMockOrder()
      const checkoutSession = createCheckoutSession()
      const webhookEvent = createWebhookEvent('checkout.session.completed', checkoutSession)

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)
      ;(prisma.order.findUnique as any).mockResolvedValue(mockOrder)
      ;(prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback({
          order: { update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'PAID' }) },
          booking: { create: vi.fn().mockResolvedValue({ id: 'booking_123' }) },
          location: { findFirst: vi.fn().mockResolvedValue(mockLocation) }
        })
      })
      ;(eventService.createEventsFromOrder as any).mockResolvedValue([{ id: 'event_123' }])

      await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      expect(eventService.createEventsFromOrder).toHaveBeenCalledWith(mockOrder.id)
    })

    it('should handle unrecognized event types gracefully', async () => {
      const webhookEvent = createWebhookEvent('unknown.event.type', {})

      ;(mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent)

      const response = await callWebhook(JSON.stringify(webhookEvent), 'valid_signature')

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)
    })
  })
})
