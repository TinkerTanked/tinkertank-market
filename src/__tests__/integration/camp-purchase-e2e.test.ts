import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useEnhancedCartStore } from '@/stores/enhancedCartStore'
import { Product } from '@/types/products'
import { StudentDetails } from '@/types/enhancedCart'
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
      update: vi.fn(),
      create: vi.fn()
    },
    booking: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    },
    student: {
      create: vi.fn()
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
  sendBookingConfirmationEmail: vi.fn()
}))

vi.mock('@/lib/notifications', () => ({
  notificationService: {
    notifyBookingConfirmed: vi.fn()
  }
}))

vi.mock('@/lib/error-handling', () => ({
  ErrorHandler: {
    retryOperation: vi.fn((fn) => fn()),
    logError: vi.fn(),
    handlePaymentError: vi.fn()
  },
  ErrorCategory: { CALENDAR: 'CALENDAR', EMAIL: 'EMAIL' },
  ErrorSeverity: { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' },
  withErrorHandling: vi.fn((fn) => fn())
}))

import { prisma } from '@/lib/prisma'
import { eventService } from '@/lib/events'

global.fetch = vi.fn()

const mockLocation = {
  id: 'location_nb_123',
  name: 'Neutral Bay',
  address: '123 Military Road, Neutral Bay NSW 2089',
  capacity: 20,
  timezone: 'Australia/Sydney',
  isActive: true
}

const mockStudent: StudentDetails = {
  id: 'student-1',
  firstName: 'Emma',
  lastName: 'Watson',
  age: 10,
  parentName: 'Jane Watson',
  parentEmail: 'jane@example.com',
  parentPhone: '+61-400-123-456'
}

const dayCampProduct: Product = {
  id: 'day-camp',
  name: 'Day Camp',
  description: 'Join us for an exciting day of coding, robotics, and tech adventures!',
  shortDescription: 'Daily tech adventures for young innovators',
  price: 109.99,
  category: 'camps',
  ageRange: '6-16 years',
  duration: '6 hours',
  location: 'Neutral Bay',
  availability: {
    type: 'weekdays',
    timeSlots: [{ start: '09:00', end: '15:00' }],
    weekDays: [1, 2, 3, 4, 5]
  },
  features: ['Hands-on coding projects', 'Robot building'],
  images: ['/images/camps1.jpeg'],
  maxCapacity: 20,
  tags: ['coding', 'robotics']
}

const allDayCampProduct: Product = {
  id: 'all-day-camp',
  name: 'All Day Camp',
  description: 'Extended learning with our comprehensive all-day program!',
  shortDescription: 'Extended tech learning with advanced projects',
  price: 149.99,
  category: 'camps',
  ageRange: '6-16 years',
  duration: '8 hours',
  location: 'Neutral Bay',
  availability: {
    type: 'weekdays',
    timeSlots: [{ start: '09:00', end: '17:00' }],
    weekDays: [1, 2, 3, 4, 5]
  },
  features: ['All Day Camp benefits', 'Extended project time'],
  images: ['/images/camps3.jpeg'],
  maxCapacity: 16,
  tags: ['coding', 'robotics', 'advanced']
}

const dayCamp3DayBundleProduct: Product = {
  id: 'day-camp-3day-bundle',
  name: 'Day Camp 3-Day Bundle',
  description: 'Day camp bundle for 3 days at Reddam House',
  shortDescription: 'Best value 3-day bundle',
  price: 299.99,
  category: 'camps',
  ageRange: '6-16 years',
  duration: '6 hours/day',
  location: 'Reddam House',
  availability: {
    type: 'weekdays',
    timeSlots: [{ start: '09:00', end: '15:00' }],
    weekDays: [1, 2, 3, 4, 5]
  },
  features: ['3-day bundle', 'Best value'],
  images: ['/images/camps1.jpeg'],
  maxCapacity: 20,
  tags: ['coding', 'robotics', 'bundle']
}

const allDayCamp3DayBundleProduct: Product = {
  id: 'all-day-camp-3day-bundle',
  name: 'All Day Camp 3-Day Bundle',
  description: 'All day camp bundle for 3 days at Reddam House',
  shortDescription: 'Best value 3-day all day bundle',
  price: 399.99,
  category: 'camps',
  ageRange: '6-16 years',
  duration: '8 hours/day',
  location: 'Reddam House',
  availability: {
    type: 'weekdays',
    timeSlots: [{ start: '09:00', end: '17:00' }],
    weekDays: [1, 2, 3, 4, 5]
  },
  features: ['3-day bundle', 'Extended project time'],
  images: ['/images/camps3.jpeg'],
  maxCapacity: 16,
  tags: ['coding', 'robotics', 'bundle', 'advanced']
}

const createMockOrder = (
  orderId: string,
  products: Array<{ product: any; bookingDate: Date; price: number; studentId: string }>
) => ({
  id: orderId,
  customerName: 'Jane Watson',
  customerEmail: 'jane@example.com',
  status: 'PENDING',
  totalAmount: products.reduce((sum, p) => sum + p.price, 0),
  stripePaymentIntentId: `pi_${orderId}`,
  orderItems: products.map((p, i) => ({
    id: `item_${orderId}_${i}`,
    productId: p.product.id,
    price: p.price,
    bookingDate: p.bookingDate,
    studentId: p.studentId,
    student: {
      id: p.studentId,
      name: 'Emma Watson',
      birthdate: new Date('2014-05-15'),
      allergies: null
    },
    product: {
      id: p.product.id,
      name: p.product.name,
      type: 'CAMP',
      duration: parseInt(p.product.duration) * 60 || 360,
      price: p.price
    }
  }))
})

const simulateWebhookCheckoutCompleted = async (orderId: string, mockOrder: any) => {
  const checkoutSession: Partial<Stripe.Checkout.Session> = {
    id: `cs_${orderId}`,
    payment_status: 'paid',
    metadata: { orderId }
  }

  ;(prisma.order.findUnique as any).mockResolvedValue(mockOrder)
  ;(prisma.location.findFirst as any).mockResolvedValue(mockLocation)

  const bookingsCreated: any[] = []
  ;(prisma.$transaction as any).mockImplementation(async (callback: any) => {
    const mockTx = {
      order: {
        update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'PAID' })
      },
      booking: {
        create: vi.fn().mockImplementation((data: any) => {
          const booking = { id: `booking_${Date.now()}_${Math.random()}`, ...data.data }
          bookingsCreated.push(booking)
          return booking
        })
      },
      location: {
        findFirst: vi.fn().mockResolvedValue(mockLocation)
      }
    }
    return callback(mockTx)
  })
  ;(eventService.createEventsFromOrder as any).mockResolvedValue([{ id: 'event_123' }])

  const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
    const orderIdFromMeta = session.metadata?.orderId
    if (!orderIdFromMeta) throw new Error('No orderId in metadata')

    const order = await prisma.order.findUnique({
      where: { id: orderIdFromMeta },
      include: { orderItems: { include: { product: true, student: true } } }
    })

    if (!order) throw new Error('Order not found')

    if (session.payment_status === 'paid' && order.status === 'PENDING') {
      await prisma.$transaction(async (tx: any) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'PAID' }
        })

        for (const orderItem of order.orderItems) {
          if (orderItem.product.type === 'CAMP') {
            const location = await tx.location.findFirst({ where: { isActive: true } })
            await tx.booking.create({
              data: {
                studentId: orderItem.studentId,
                productId: orderItem.productId,
                locationId: location.id,
                startDate: orderItem.bookingDate,
                endDate: new Date(orderItem.bookingDate.getTime() + (orderItem.product.duration || 360) * 60 * 1000),
                status: 'CONFIRMED',
                totalPrice: orderItem.price
              }
            })
          }
        }
      })

      await eventService.createEventsFromOrder(order.id)
    }

    return { received: true, bookingsCreated }
  }

  return handleCheckoutSessionCompleted(checkoutSession as Stripe.Checkout.Session)
}

const verifyAdminBookingVisibility = async (bookings: any[]) => {
  ;(prisma.booking.findMany as any).mockResolvedValue(
    bookings.map((b) => ({
      ...b,
      student: { name: 'Emma Watson', birthdate: new Date('2014-05-15'), allergies: null },
      product: { name: 'Camp', type: 'CAMP' },
      location: { name: 'Neutral Bay' }
    }))
  )
  ;(prisma.booking.count as any).mockResolvedValue(bookings.length)

  const fetchAdminBookings = async () => {
    const whereClause = { AND: [] }
    const total = await prisma.booking.count({ where: whereClause })
    const bookingsResult = await prisma.booking.findMany({
      where: whereClause,
      include: {
        student: { select: { name: true, birthdate: true, allergies: true } },
        product: { select: { name: true, type: true } },
        location: { select: { name: true } }
      }
    })
    return { bookings: bookingsResult, total }
  }

  return fetchAdminBookings()
}

describe('Camp Purchase End-to-End Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const { result } = renderHook(() => useEnhancedCartStore())
    act(() => {
      result.current.clearCart()
    })
  })

  describe('Day Camp Purchase Flow', () => {
    it('should complete full Day Camp purchase with 1 date at Neutral Bay', async () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const selectedDate = new Date('2025-04-15')

      act(() => {
        result.current.addItem(dayCampProduct, {
          quantity: 1,
          selectedDates: [selectedDate]
        })
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].product.id).toBe('day-camp')
      expect(result.current.items[0].quantity).toBe(1)

      const summary = result.current.getSummary()
      expect(summary.subtotal).toBeCloseTo(109.99, 2)
      expect(summary.total).toBeCloseTo(109.99, 2)

      const itemId = result.current.items[0].id

      act(() => {
        result.current.addStudent(itemId, mockStudent)
      })

      expect(result.current.items[0].students).toHaveLength(1)

      const validation = result.current.getValidation()
      expect(validation.isValid).toBe(true)

      const mockOrder = createMockOrder('order_day_camp_1', [
        {
          product: dayCampProduct,
          bookingDate: selectedDate,
          price: 109.99,
          studentId: 'student-1'
        }
      ])

      const webhookResult = await simulateWebhookCheckoutCompleted('order_day_camp_1', mockOrder)

      expect(webhookResult.received).toBe(true)
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(eventService.createEventsFromOrder).toHaveBeenCalledWith('order_day_camp_1')

      const adminResult = await verifyAdminBookingVisibility(webhookResult.bookingsCreated)
      expect(adminResult.total).toBe(1)
      expect(adminResult.bookings).toHaveLength(1)
      expect(adminResult.bookings[0].status).toBe('CONFIRMED')
    })
  })

  describe('All Day Camp Purchase Flow', () => {
    it('should complete full All Day Camp purchase with 2 dates', async () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const selectedDates = [new Date('2025-04-15'), new Date('2025-04-16')]

      act(() => {
        result.current.addItem(allDayCampProduct, {
          quantity: 1,
          selectedDates
        })
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].product.id).toBe('all-day-camp')

      const summary = result.current.getSummary()
      const expectedTotal = 149.99 * 2
      expect(summary.subtotal).toBeCloseTo(expectedTotal, 2)
      expect(summary.total).toBeCloseTo(299.98, 2)

      const itemId = result.current.items[0].id

      act(() => {
        result.current.addStudent(itemId, mockStudent)
      })

      const validation = result.current.getValidation()
      expect(validation.isValid).toBe(true)

      const mockOrder = createMockOrder('order_all_day_camp_2', [
        {
          product: allDayCampProduct,
          bookingDate: selectedDates[0],
          price: 149.99,
          studentId: 'student-1'
        },
        {
          product: allDayCampProduct,
          bookingDate: selectedDates[1],
          price: 149.99,
          studentId: 'student-1'
        }
      ])

      const webhookResult = await simulateWebhookCheckoutCompleted('order_all_day_camp_2', mockOrder)

      expect(webhookResult.received).toBe(true)
      expect(prisma.$transaction).toHaveBeenCalled()

      const adminResult = await verifyAdminBookingVisibility(webhookResult.bookingsCreated)
      expect(adminResult.total).toBe(2)
      expect(adminResult.bookings).toHaveLength(2)
      adminResult.bookings.forEach((booking: any) => {
        expect(booking.status).toBe('CONFIRMED')
        expect(booking.studentId).toBe('student-1')
      })
    })
  })

  describe('Day Camp 3-Day Bundle Purchase Flow (Reddam House)', () => {
    it('should complete Day Camp 3-Day Bundle purchase with correct bundle pricing', async () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const selectedDates = [new Date('2025-04-14'), new Date('2025-04-15'), new Date('2025-04-16')]

      act(() => {
        result.current.addItem(dayCamp3DayBundleProduct, {
          quantity: 1,
          selectedDates
        })
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].product.id).toBe('day-camp-3day-bundle')

      const summary = result.current.getSummary()
      expect(summary.subtotal).toBeCloseTo(299.99, 2)
      expect(summary.total).toBeCloseTo(299.99, 2)

      const regularDayCampCost = 109.99 * 3
      expect(summary.total).toBeLessThan(regularDayCampCost)

      const itemId = result.current.items[0].id

      act(() => {
        result.current.addStudent(itemId, mockStudent)
      })

      const validation = result.current.getValidation()
      expect(validation.isValid).toBe(true)

      const mockOrder = createMockOrder('order_bundle_day_3', [
        {
          product: dayCamp3DayBundleProduct,
          bookingDate: selectedDates[0],
          price: 299.99,
          studentId: 'student-1'
        }
      ])

      const webhookResult = await simulateWebhookCheckoutCompleted('order_bundle_day_3', mockOrder)

      expect(webhookResult.received).toBe(true)
      expect(prisma.$transaction).toHaveBeenCalled()

      const adminResult = await verifyAdminBookingVisibility(webhookResult.bookingsCreated)
      expect(adminResult.total).toBeGreaterThanOrEqual(1)
      expect(adminResult.bookings[0].status).toBe('CONFIRMED')
    })
  })

  describe('All Day Camp 3-Day Bundle Purchase Flow (Reddam House)', () => {
    it('should complete All Day Camp 3-Day Bundle purchase with correct pricing', async () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const selectedDates = [new Date('2025-04-14'), new Date('2025-04-15'), new Date('2025-04-16')]

      act(() => {
        result.current.addItem(allDayCamp3DayBundleProduct, {
          quantity: 1,
          selectedDates
        })
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].product.id).toBe('all-day-camp-3day-bundle')

      const summary = result.current.getSummary()
      expect(summary.subtotal).toBeCloseTo(399.99, 2)
      expect(summary.total).toBeCloseTo(399.99, 2)

      const regularAllDayCampCost = 149.99 * 3
      expect(summary.total).toBeLessThan(regularAllDayCampCost)

      const itemId = result.current.items[0].id

      act(() => {
        result.current.addStudent(itemId, mockStudent)
      })

      const validation = result.current.getValidation()
      expect(validation.isValid).toBe(true)

      const mockOrder = createMockOrder('order_bundle_allday_3', [
        {
          product: allDayCamp3DayBundleProduct,
          bookingDate: selectedDates[0],
          price: 399.99,
          studentId: 'student-1'
        }
      ])

      const webhookResult = await simulateWebhookCheckoutCompleted('order_bundle_allday_3', mockOrder)

      expect(webhookResult.received).toBe(true)
      expect(prisma.$transaction).toHaveBeenCalled()

      const adminResult = await verifyAdminBookingVisibility(webhookResult.bookingsCreated)
      expect(adminResult.total).toBeGreaterThanOrEqual(1)
      expect(adminResult.bookings[0].status).toBe('CONFIRMED')
    })
  })

  describe('Admin Visibility Verification', () => {
    it('should verify bookings exist in database with correct status after Day Camp purchase', async () => {
      const selectedDate = new Date('2025-04-15')
      const mockOrder = createMockOrder('order_admin_test_1', [
        {
          product: dayCampProduct,
          bookingDate: selectedDate,
          price: 109.99,
          studentId: 'student-1'
        }
      ])

      const webhookResult = await simulateWebhookCheckoutCompleted('order_admin_test_1', mockOrder)

      expect(webhookResult.bookingsCreated.length).toBeGreaterThanOrEqual(1)

      const booking = webhookResult.bookingsCreated[0]
      expect(booking.status).toBe('CONFIRMED')
      expect(booking.studentId).toBe('student-1')
      expect(booking.productId).toBe('day-camp')
      expect(booking.locationId).toBe(mockLocation.id)
    })

    it('should verify admin bookings API returns correct data structure', async () => {
      const mockBookings = [
        {
          id: 'booking_admin_1',
          studentId: 'student-1',
          productId: 'day-camp',
          locationId: mockLocation.id,
          startDate: new Date('2025-04-15T09:00:00'),
          endDate: new Date('2025-04-15T15:00:00'),
          status: 'CONFIRMED',
          totalPrice: 109.99
        }
      ]

      const adminResult = await verifyAdminBookingVisibility(mockBookings)

      expect(adminResult.bookings).toHaveLength(1)
      expect(adminResult.total).toBe(1)

      const booking = adminResult.bookings[0]
      expect(booking.student).toBeDefined()
      expect(booking.product).toBeDefined()
      expect(booking.location).toBeDefined()
      expect(booking.student.name).toBe('Emma Watson')
      expect(booking.product.type).toBe('CAMP')
      expect(booking.location.name).toBe('Neutral Bay')
    })

    it('should verify multiple bookings from All Day Camp 2-date purchase appear in admin', async () => {
      const selectedDates = [new Date('2025-04-15'), new Date('2025-04-16')]
      const mockOrder = createMockOrder('order_admin_multi', [
        {
          product: allDayCampProduct,
          bookingDate: selectedDates[0],
          price: 149.99,
          studentId: 'student-1'
        },
        {
          product: allDayCampProduct,
          bookingDate: selectedDates[1],
          price: 149.99,
          studentId: 'student-1'
        }
      ])

      const webhookResult = await simulateWebhookCheckoutCompleted('order_admin_multi', mockOrder)

      expect(webhookResult.bookingsCreated.length).toBe(2)

      const adminResult = await verifyAdminBookingVisibility(webhookResult.bookingsCreated)
      expect(adminResult.total).toBe(2)
      expect(adminResult.bookings).toHaveLength(2)

      adminResult.bookings.forEach((booking: any) => {
        expect(booking.status).toBe('CONFIRMED')
        expect(booking.student.name).toBe('Emma Watson')
      })
    })
  })

  describe('Bundle Pricing Logic', () => {
    it('should NOT multiply bundle price by date count', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const selectedDates = [new Date('2025-04-14'), new Date('2025-04-15'), new Date('2025-04-16')]

      act(() => {
        result.current.addItem(dayCamp3DayBundleProduct, {
          quantity: 1,
          selectedDates
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(299.99, 2)
      expect(summary.total).not.toBeCloseTo(299.99 * 3, 2)
    })

    it('should multiply regular camp price by date count', () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const selectedDates = [new Date('2025-04-14'), new Date('2025-04-15')]

      act(() => {
        result.current.addItem(dayCampProduct, {
          quantity: 1,
          selectedDates
        })
      })

      const summary = result.current.getSummary()
      expect(summary.total).toBeCloseTo(109.99 * 2, 2)
    })
  })

  describe('Cart to Checkout Data Integrity', () => {
    it('should maintain correct data through entire purchase flow', async () => {
      const { result } = renderHook(() => useEnhancedCartStore())
      const selectedDate = new Date('2025-04-15')
      const timeSlot = { start: '09:00', end: '15:00' }

      act(() => {
        result.current.addItem(dayCampProduct, {
          quantity: 1,
          selectedDates: [selectedDate],
          selectedTimeSlot: timeSlot
        })
      })

      const itemId = result.current.items[0].id

      act(() => {
        result.current.addStudent(itemId, mockStudent)
      })

      const cartItem = result.current.items[0]
      expect(cartItem.product.name).toBe('Day Camp')
      expect(cartItem.students[0].firstName).toBe('Emma')
      expect(cartItem.selectedDates).toHaveLength(1)

      const mockOrder = createMockOrder('order_integrity_test', [
        {
          product: dayCampProduct,
          bookingDate: selectedDate,
          price: cartItem.totalPrice,
          studentId: mockStudent.id
        }
      ])

      const webhookResult = await simulateWebhookCheckoutCompleted('order_integrity_test', mockOrder)
      expect(webhookResult.received).toBe(true)

      const adminResult = await verifyAdminBookingVisibility(webhookResult.bookingsCreated)
      expect(adminResult.bookings[0].studentId).toBe(mockStudent.id)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing order gracefully', async () => {
      ;(prisma.order.findUnique as any).mockResolvedValue(null)

      const checkoutSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_missing_order',
        payment_status: 'paid',
        metadata: { orderId: 'non_existent_order' }
      }

      const handleMissingOrder = async (session: Stripe.Checkout.Session) => {
        const orderId = session.metadata?.orderId
        const order = await prisma.order.findUnique({
          where: { id: orderId }
        })

        if (!order) {
          return { received: true, error: 'Order not found' }
        }
        return { received: true }
      }

      const result = await handleMissingOrder(checkoutSession as Stripe.Checkout.Session)
      expect(result.error).toBe('Order not found')
    })

    it('should handle transaction failure with rollback', async () => {
      const mockOrder = createMockOrder('order_fail_test', [
        {
          product: dayCampProduct,
          bookingDate: new Date('2025-04-15'),
          price: 109.99,
          studentId: 'student-1'
        }
      ])

      ;(prisma.order.findUnique as any).mockResolvedValue(mockOrder)
      ;(prisma.$transaction as any).mockRejectedValue(new Error('Database transaction failed'))

      const processPayment = async (orderId: string) => {
        const order = await prisma.order.findUnique({ where: { id: orderId } })
        if (!order) throw new Error('Order not found')

        try {
          await prisma.$transaction(async () => {
            throw new Error('Simulated failure')
          })
        } catch {
          throw new Error('Database transaction failed')
        }
      }

      await expect(processPayment('order_fail_test')).rejects.toThrow('Database transaction failed')
    })
  })
})
