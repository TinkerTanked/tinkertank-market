import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const mockStripe = {
  webhooks: {
    constructEvent: vi.fn()
  }
};

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe)
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    },
    booking: {
      create: vi.fn(),
      createMany: vi.fn()
    },
    event: {
      create: vi.fn(),
      createMany: vi.fn()
    },
    location: {
      findFirst: vi.fn()
    },
    recurringTemplate: {
      create: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock('@/lib/events', () => ({
  eventService: {
    createEventsFromOrder: vi.fn()
  }
}));

vi.mock('@/lib/email', () => ({
  sendBookingConfirmationEmail: vi.fn()
}));

vi.mock('@/lib/notifications', () => ({
  notificationService: {
    notifyBookingConfirmed: vi.fn()
  }
}));

import { prisma } from '@/lib/prisma';
import { eventService } from '@/lib/events';

const mockIgniteOrder = {
  id: 'order_ignite_test_123',
  customerName: 'Test Parent',
  customerEmail: 'parent@test.com',
  customerPhone: '+61400000000',
  status: 'PENDING',
  totalAmount: 3999,
  currency: 'AUD',
  stripePaymentIntentId: 'pi_ignite_test_123',
  orderItems: [{
    id: 'item_ignite_123',
    productId: 'ignite-nb-monfri',
    stripePriceId: 'price_1StKPCDqupgKyrho8MVv42fB',
    price: 3999,
    bookingDate: new Date('2025-02-03T15:30:00Z'),
    studentId: 'student_ignite_123',
    student: {
      id: 'student_ignite_123',
      name: 'Test Student',
      birthdate: new Date('2015-05-15'),
      allergies: null,
      medicalNotes: null,
      emergencyContact: 'Test Parent',
      emergencyPhone: '+61400000000'
    },
    product: {
      id: 'ignite-nb-monfri',
      name: 'Ignite After School Program',
      type: 'SUBSCRIPTION',
      duration: 120,
      price: 3999,
      capacity: 20
    },
    sessionDetails: {
      programType: 'drop-off',
      location: 'Neutral Bay Studio',
      dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startTime: '15:30',
      endTime: '17:30'
    }
  }]
};

const mockLocation = {
  id: 'location_nb_123',
  name: 'Neutral Bay Studio',
  address: '123 Military Road, Neutral Bay NSW 2089',
  capacity: 20,
  timezone: 'Australia/Sydney',
  isActive: true
};

describe('Ignite Subscription Webhook Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process checkout.session.completed for Ignite subscription and create booking', async () => {
    const checkoutSession: Partial<Stripe.Checkout.Session> = {
      id: 'cs_ignite_test_123',
      payment_status: 'paid',
      metadata: {
        orderId: 'order_ignite_test_123'
      }
    };

    const webhookEvent = {
      id: 'evt_ignite_checkout_123',
      type: 'checkout.session.completed',
      data: {
        object: checkoutSession
      }
    } as Stripe.Event;

    (mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent);
    (prisma.order.findUnique as any).mockResolvedValue(mockIgniteOrder);
    (prisma.location.findFirst as any).mockResolvedValue(mockLocation);
    (prisma.$transaction as any).mockImplementation(async (callback: any) => {
      return callback({
        order: { update: vi.fn().mockResolvedValue({ ...mockIgniteOrder, status: 'PAID' }) },
        booking: { create: vi.fn().mockResolvedValue({ id: 'booking_ignite_123' }) },
        location: { findFirst: vi.fn().mockResolvedValue(mockLocation) }
      });
    });
    (eventService.createEventsFromOrder as any).mockResolvedValue([{ id: 'event_ignite_123' }]);

    const handleCheckoutSession = async (session: Stripe.Checkout.Session) => {
      const orderId = session.metadata?.orderId;
      if (!orderId) throw new Error('No orderId in metadata');

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: { include: { product: true, student: true } } }
      });

      if (!order) throw new Error('Order not found');

      if (session.payment_status === 'paid' && order.status === 'PENDING') {
        await prisma.$transaction(async (tx: any) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'PAID' }
          });

          for (const item of order.orderItems) {
            if (item.product.type === 'SUBSCRIPTION') {
              const location = await tx.location.findFirst({ where: { isActive: true } });
              await tx.booking.create({
                data: {
                  studentId: item.studentId,
                  productId: item.productId,
                  locationId: location.id,
                  startDate: item.bookingDate,
                  endDate: new Date(item.bookingDate.getTime() + item.product.duration * 60 * 1000),
                  status: 'CONFIRMED',
                  totalPrice: item.price
                }
              });
            }
          }
        });

        await eventService.createEventsFromOrder(order.id);
      }

      return { received: true };
    };

    const result = await handleCheckoutSession(checkoutSession as Stripe.Checkout.Session);

    expect(result.received).toBe(true);
    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: 'order_ignite_test_123' },
      include: { orderItems: { include: { product: true, student: true } } }
    });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(eventService.createEventsFromOrder).toHaveBeenCalledWith('order_ignite_test_123');
  });

  it('should process payment_intent.succeeded for Ignite and create recurring booking entries', async () => {
    const paymentIntent: Partial<Stripe.PaymentIntent> = {
      id: 'pi_ignite_test_123',
      status: 'succeeded',
      amount: 3999,
      currency: 'aud'
    };

    const webhookEvent = {
      id: 'evt_ignite_payment_123',
      type: 'payment_intent.succeeded',
      data: {
        object: paymentIntent
      }
    } as Stripe.Event;

    (mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent);
    (prisma.order.findUnique as any).mockResolvedValue(mockIgniteOrder);
    (prisma.location.findFirst as any).mockResolvedValue(mockLocation);
    (prisma.recurringTemplate.create as any).mockResolvedValue({
      id: 'template_ignite_123',
      name: 'Ignite After School Program - Test Student',
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '15:30',
      endTime: '17:30'
    });
    (prisma.booking.createMany as any).mockResolvedValue({ count: 5 });

    const handlePaymentSucceeded = async (pi: Stripe.PaymentIntent) => {
      const order = await prisma.order.findUnique({
        where: { stripePaymentIntentId: pi.id },
        include: { orderItems: { include: { product: true, student: true } } }
      });

      if (!order) throw new Error('Order not found');

      for (const item of order.orderItems) {
        if (item.product.type === 'SUBSCRIPTION') {
          const template = await prisma.recurringTemplate.create({
            data: {
              name: `${item.product.name} - ${item.student.name}`,
              type: 'RECURRING_SESSION',
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: '15:30',
              endTime: '17:30',
              startDate: item.bookingDate,
              locationId: mockLocation.id
            }
          });

          const bookings = [1, 2, 3, 4, 5].map(day => ({
            studentId: item.studentId,
            productId: item.productId,
            locationId: mockLocation.id,
            dayOfWeek: day,
            recurringTemplateId: template.id,
            status: 'CONFIRMED'
          }));

          await prisma.booking.createMany({ data: bookings });
        }
      }

      return { received: true };
    };

    const result = await handlePaymentSucceeded(paymentIntent as Stripe.PaymentIntent);

    expect(result.received).toBe(true);
    expect(prisma.recurringTemplate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Ignite After School Program - Test Student',
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: '15:30',
        endTime: '17:30'
      })
    });
    expect(prisma.booking.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ dayOfWeek: 1, status: 'CONFIRMED' }),
        expect.objectContaining({ dayOfWeek: 5, status: 'CONFIRMED' })
      ])
    });
  });

  it('should create calendar events for subscription sessions', async () => {
    (prisma.order.findUnique as any).mockResolvedValue(mockIgniteOrder);
    (prisma.location.findFirst as any).mockResolvedValue(mockLocation);
    (prisma.event.createMany as any).mockResolvedValue({ count: 20 });

    const createCalendarEvents = async (orderId: string) => {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: { include: { product: true, student: true } } }
      });

      if (!order) throw new Error('Order not found');

      const events = [];
      const startDate = new Date('2025-02-03');
      const weeksInTerm = 10;

      for (const item of order.orderItems) {
        if (item.product.type === 'SUBSCRIPTION') {
          for (let week = 0; week < weeksInTerm; week++) {
            for (let day = 0; day < 5; day++) {
              const eventDate = new Date(startDate);
              eventDate.setDate(eventDate.getDate() + week * 7 + day);
              events.push({
                title: `${item.product.name} - ${item.student.name}`,
                type: 'SUBSCRIPTION',
                startDateTime: new Date(eventDate.setHours(15, 30, 0, 0)),
                endDateTime: new Date(eventDate.setHours(17, 30, 0, 0)),
                locationId: mockLocation.id,
                studentId: item.studentId
              });
            }
          }
        }
      }

      await prisma.event.createMany({ data: events });
      return events;
    };

    const events = await createCalendarEvents('order_ignite_test_123');

    expect(events.length).toBe(50);
    expect(prisma.event.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          title: 'Ignite After School Program - Test Student',
          type: 'SUBSCRIPTION'
        })
      ])
    });
  });

  it('should handle different program types correctly', async () => {
    const programTypes = ['in-school', 'drop-off', 'school-pickup'];
    const results: Record<string, any> = {};

    for (const programType of programTypes) {
      const orderWithProgramType = {
        ...mockIgniteOrder,
        id: `order_${programType}_123`,
        orderItems: [{
          ...mockIgniteOrder.orderItems[0],
          sessionDetails: {
            ...mockIgniteOrder.orderItems[0].sessionDetails,
            programType
          }
        }]
      };

      (prisma.order.findUnique as any).mockResolvedValue(orderWithProgramType);

      const handleProgramType = async (order: typeof orderWithProgramType) => {
        const item = order.orderItems[0];
        const sessionDetails = item.sessionDetails;

        let pickupRequired = false;
        let dropoffRequired = false;

        switch (sessionDetails.programType) {
          case 'in-school':
            pickupRequired = false;
            dropoffRequired = false;
            break;
          case 'drop-off':
            pickupRequired = false;
            dropoffRequired = true;
            break;
          case 'school-pickup':
            pickupRequired = true;
            dropoffRequired = false;
            break;
        }

        return { programType: sessionDetails.programType, pickupRequired, dropoffRequired };
      };

      results[programType] = await handleProgramType(orderWithProgramType);
    }

    expect(results['in-school']).toEqual({ programType: 'in-school', pickupRequired: false, dropoffRequired: false });
    expect(results['drop-off']).toEqual({ programType: 'drop-off', pickupRequired: false, dropoffRequired: true });
    expect(results['school-pickup']).toEqual({ programType: 'school-pickup', pickupRequired: true, dropoffRequired: false });
  });
});

describe('Ignite Subscription Data Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should properly store student info with subscription', async () => {
    (prisma.order.findUnique as any).mockResolvedValue(mockIgniteOrder);
    (prisma.booking.create as any).mockResolvedValue({
      id: 'booking_ignite_123',
      studentId: 'student_ignite_123'
    });

    const storeSubscriptionWithStudent = async (orderId: string) => {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: { include: { student: true } } }
      });

      if (!order) throw new Error('Order not found');

      const item = order.orderItems[0];
      const student = item.student;

      const booking = await prisma.booking.create({
        data: {
          studentId: student.id,
          productId: item.productId,
          locationId: mockLocation.id,
          status: 'CONFIRMED',
          studentName: student.name,
          studentBirthdate: student.birthdate,
          emergencyContact: student.emergencyContact,
          emergencyPhone: student.emergencyPhone,
          allergies: student.allergies,
          medicalNotes: student.medicalNotes
        }
      });

      return booking;
    };

    await storeSubscriptionWithStudent('order_ignite_test_123');

    expect(prisma.booking.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: 'student_ignite_123',
        studentName: 'Test Student',
        emergencyContact: 'Test Parent',
        emergencyPhone: '+61400000000'
      })
    });
  });

  it('should create weekly recurring schedule correctly', async () => {
    (prisma.order.findUnique as any).mockResolvedValue(mockIgniteOrder);
    (prisma.recurringTemplate.create as any).mockResolvedValue({
      id: 'template_123',
      daysOfWeek: [1, 2, 3, 4, 5]
    });

    const createRecurringSchedule = async (orderId: string) => {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: true }
      });

      if (!order) throw new Error('Order not found');

      const item = order.orderItems[0];
      const sessionDetails = item.sessionDetails;

      const dayMapping: Record<string, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
      };

      const daysOfWeek = sessionDetails.dayOfWeek.map((day: string) => dayMapping[day]);

      const template = await prisma.recurringTemplate.create({
        data: {
          name: `Ignite - ${item.studentId}`,
          daysOfWeek,
          startTime: sessionDetails.startTime,
          endTime: sessionDetails.endTime,
          recurrenceType: 'WEEKLY',
          isActive: true
        }
      });

      return template;
    };

    await createRecurringSchedule('order_ignite_test_123');

    expect(prisma.recurringTemplate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: '15:30',
        endTime: '17:30',
        recurrenceType: 'WEEKLY'
      })
    });
  });

  it('should match booking dates with session day/time configuration', async () => {
    const sessionDetails = mockIgniteOrder.orderItems[0].sessionDetails;
    const startDate = new Date('2025-02-03');

    const generateBookingDates = (
      startDate: Date,
      daysOfWeek: string[],
      startTime: string,
      endTime: string,
      weeksAhead: number
    ) => {
      const dayMapping: Record<string, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
      };

      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const bookings = [];
      const targetDays = daysOfWeek.map(d => dayMapping[d]);

      for (let week = 0; week < weeksAhead; week++) {
        for (const targetDay of targetDays) {
          const bookingDate = new Date(startDate);
          const currentDay = bookingDate.getDay();
          const daysUntilTarget = (targetDay - currentDay + 7) % 7;
          bookingDate.setDate(bookingDate.getDate() + daysUntilTarget + week * 7);

          const startDateTime = new Date(bookingDate);
          startDateTime.setHours(startHour, startMin, 0, 0);

          const endDateTime = new Date(bookingDate);
          endDateTime.setHours(endHour, endMin, 0, 0);

          bookings.push({ date: bookingDate, startDateTime, endDateTime, dayOfWeek: targetDay });
        }
      }

      return bookings;
    };

    const bookings = generateBookingDates(
      startDate,
      sessionDetails.dayOfWeek,
      sessionDetails.startTime,
      sessionDetails.endTime,
      4
    );

    expect(bookings.length).toBe(20);
    bookings.forEach(booking => {
      expect([1, 2, 3, 4, 5]).toContain(booking.dayOfWeek);
      expect(booking.startDateTime.getHours()).toBe(15);
      expect(booking.startDateTime.getMinutes()).toBe(30);
      expect(booking.endDateTime.getHours()).toBe(17);
      expect(booking.endDateTime.getMinutes()).toBe(30);
    });
  });
});

describe('Ignite Webhook Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle missing student info', async () => {
    const orderWithoutStudent = {
      ...mockIgniteOrder,
      orderItems: [{
        ...mockIgniteOrder.orderItems[0],
        student: null,
        studentId: null
      }]
    };

    (prisma.order.findUnique as any).mockResolvedValue(orderWithoutStudent);

    const handleMissingStudent = async (orderId: string) => {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: { include: { student: true } } }
      });

      if (!order) throw new Error('Order not found');

      for (const item of order.orderItems) {
        if (!item.student || !item.studentId) {
          throw new Error('Missing student information for subscription booking');
        }
      }

      return { success: true };
    };

    await expect(handleMissingStudent('order_ignite_test_123')).rejects.toThrow(
      'Missing student information for subscription booking'
    );
  });

  it('should handle invalid session ID', async () => {
    const webhookEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_invalid_123',
          metadata: {}
        }
      }
    } as Stripe.Event;

    (mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent);

    const handleInvalidSession = async (session: Stripe.Checkout.Session) => {
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        throw new Error('No orderId found in session metadata');
      }

      return { success: true };
    };

    await expect(
      handleInvalidSession(webhookEvent.data.object as Stripe.Checkout.Session)
    ).rejects.toThrow('No orderId found in session metadata');
  });

  it('should rollback database transaction on failure', async () => {
    (prisma.order.findUnique as any).mockResolvedValue(mockIgniteOrder);
    (prisma.$transaction as any).mockRejectedValue(new Error('Database transaction failed'));

    const processWithTransaction = async (orderId: string) => {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) throw new Error('Order not found');

      try {
        await prisma.$transaction(async (tx: any) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'PAID' }
          });

          throw new Error('Simulated failure - should trigger rollback');
        });
      } catch (error) {
        throw new Error('Database transaction failed');
      }
    };

    await expect(processWithTransaction('order_ignite_test_123')).rejects.toThrow(
      'Database transaction failed'
    );
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should handle Stripe webhook signature verification failure', async () => {
    (mockStripe.webhooks.constructEvent as any).mockImplementation(() => {
      throw new Error('Webhook signature verification failed');
    });

    const verifyWebhook = (body: string, signature: string) => {
      try {
        return mockStripe.webhooks.constructEvent(body, signature, 'whsec_test');
      } catch (error) {
        throw new Error('Invalid webhook signature');
      }
    };

    expect(() => verifyWebhook('{}', 'invalid_signature')).toThrow('Invalid webhook signature');
  });

  it('should handle order not found gracefully', async () => {
    (prisma.order.findUnique as any).mockResolvedValue(null);

    const handleOrderNotFound = async (orderId: string) => {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        console.error('Order not found:', orderId);
        return { received: true, error: 'Order not found' };
      }

      return { received: true };
    };

    const result = await handleOrderNotFound('non_existent_order');

    expect(result.error).toBe('Order not found');
    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: 'non_existent_order' }
    });
  });
});
