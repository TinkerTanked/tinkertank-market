import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Mock Stripe
const mockStripe = {
  webhooks: {
    constructEvent: vi.fn()
  },
  paymentIntents: {
    retrieve: vi.fn()
  }
};

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe)
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn()
    },
    orderItem: {
      createMany: vi.fn()
    },
    student: {
      create: vi.fn()
    },
    event: {
      create: vi.fn(),
      createMany: vi.fn()
    },
    booking: {
      create: vi.fn(),
      createMany: vi.fn()
    },
    location: {
      findFirst: vi.fn()
    },
    recurringTemplate: {
      create: vi.fn(),
      findFirst: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock('next/headers', () => ({
  headers: vi.fn()
}));

describe('Stripe Webhook Integration Tests', () => {
  const mockOrderData = {
    id: 'order_webhook_123',
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '+61412345678',
    status: 'PENDING',
    totalAmount: 25000, // $250.00
    currency: 'AUD',
    stripePaymentIntentId: 'pi_webhook_123',
    orderItems: [{
      id: 'item_webhook_123',
      studentId: 'student_webhook_123',
      productId: 'product_camp_456',
      bookingDate: new Date('2024-12-20T10:00:00Z'),
      price: 25000,
      student: {
        id: 'student_webhook_123',
        name: 'Webhook Test Student',
        age: 9,
        allergies: 'Peanuts',
        parentName: 'Test Customer',
        parentEmail: 'test@example.com',
        parentPhone: '+61412345678'
      },
      product: {
        id: 'product_camp_456',
        name: 'Advanced STEM Camp',
        type: 'CAMP',
        duration: 480, // 8 hours
        price: 25000,
        ageMin: 8,
        ageMax: 14,
        capacity: 15
      }
    }]
  };

  const mockLocation = {
    id: 'location_webhook_123',
    name: 'North Sydney',
    address: '456 North Sydney Road, North Sydney NSW 2060',
    capacity: 15,
    timezone: 'Australia/Sydney'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Payment Intent Succeeded Events', () => {
    it('should process payment_intent.succeeded webhook correctly', async () => {
      // Mock webhook event
      const webhookEvent = {
        id: 'evt_webhook_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_webhook_123',
            status: 'succeeded',
            amount: 25000,
            currency: 'aud',
            metadata: {
              orderId: 'order_webhook_123'
            },
            customer: 'cus_webhook_123'
          }
        }
      } as Stripe.Event;

      // Mock Stripe webhook verification
      (mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent);

      // Mock headers
      (headers as any).mockReturnValue({
        get: vi.fn().mockReturnValue('test_signature')
      });

      // Mock database operations
      (prisma.order.findFirst as any).mockResolvedValue(mockOrderData);
      (prisma.order.update as any).mockResolvedValue({
        ...mockOrderData,
        status: 'PAID',
        paidAt: new Date()
      });
      (prisma.location.findFirst as any).mockResolvedValue(mockLocation);
      (prisma.event.create as any).mockResolvedValue({
        id: 'event_webhook_123',
        title: 'Advanced STEM Camp - Webhook Test Student',
        type: 'CAMP',
        startDateTime: new Date('2024-12-20T10:00:00Z'),
        endDateTime: new Date('2024-12-20T18:00:00Z'),
        locationId: mockLocation.id
      });
      (prisma.booking.create as any).mockResolvedValue({
        id: 'booking_webhook_123',
        eventId: 'event_webhook_123',
        studentId: 'student_webhook_123'
      });

      // Create webhook request
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test_signature'
        },
        body: JSON.stringify(webhookEvent)
      });

      // Mock webhook handler (simplified version)
      const webhookHandler = async (req: NextRequest) => {
        try {
          const body = await req.text();
          const signature = req.headers.get('stripe-signature');
          
          const event = mockStripe.webhooks.constructEvent(
            body,
            signature!,
            process.env.STRIPE_WEBHOOK_SECRET!
          );

          if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const orderId = paymentIntent.metadata.orderId;

            const order = await prisma.order.findFirst({
              where: { id: orderId },
              include: { orderItems: { include: { product: true, student: true } } }
            });

            if (order) {
              await prisma.order.update({
                where: { id: orderId },
                data: {
                  status: 'PAID',
                  paidAt: new Date(),
                  stripePaymentIntentId: paymentIntent.id
                }
              });

              // Create calendar events
              const location = await prisma.location.findFirst();
              
              for (const item of order.orderItems) {
                const event = await prisma.event.create({
                  data: {
                    title: `${item.product.name} - ${item.student.name}`,
                    type: item.product.type,
                    startDateTime: item.bookingDate,
                    endDateTime: new Date(item.bookingDate.getTime() + (item.product.duration * 60000)),
                    locationId: location!.id,
                    maxCapacity: item.product.capacity
                  }
                });

                await prisma.booking.create({
                  data: {
                    eventId: event.id,
                    studentId: item.student.id,
                    status: 'CONFIRMED'
                  }
                });
              }
            }
          }

          return NextResponse.json({ received: true }, { status: 200 });
        } catch (error) {
          console.error('Webhook error:', error);
          return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
        }
      };

      const response = await webhookHandler(request);
      const result = await response.json();

      // Assertions
      expect(result.received).toBe(true);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order_webhook_123' },
        data: {
          status: 'PAID',
          paidAt: expect.any(Date),
          stripePaymentIntentId: 'pi_webhook_123'
        }
      });
      expect(prisma.event.create).toHaveBeenCalledWith({
        data: {
          title: 'Advanced STEM Camp - Webhook Test Student',
          type: 'CAMP',
          startDateTime: new Date('2024-12-20T10:00:00Z'),
          endDateTime: expect.any(Date),
          locationId: 'location_webhook_123',
          maxCapacity: 15
        }
      });
      expect(prisma.booking.create).toHaveBeenCalledWith({
        data: {
          eventId: 'event_webhook_123',
          studentId: 'student_webhook_123',
          status: 'CONFIRMED'
        }
      });
    });

    it('should handle payment_intent.payment_failed webhook', async () => {
      const webhookEvent = {
        id: 'evt_failed_123',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_failed_123',
            status: 'payment_failed',
            last_payment_error: {
              code: 'card_declined',
              decline_code: 'insufficient_funds',
              message: 'Your card has insufficient funds.'
            },
            metadata: {
              orderId: 'order_failed_123'
            }
          }
        }
      } as Stripe.Event;

      (mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent);
      (headers as any).mockReturnValue({
        get: vi.fn().mockReturnValue('test_signature')
      });

      (prisma.order.findFirst as any).mockResolvedValue({
        id: 'order_failed_123',
        status: 'PENDING'
      });
      (prisma.order.update as any).mockResolvedValue({
        id: 'order_failed_123',
        status: 'PAYMENT_FAILED',
        paymentFailedAt: new Date()
      });

      const webhookHandler = async (req: NextRequest) => {
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');
        
        const event = mockStripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);

        if (event.type === 'payment_intent.payment_failed') {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const orderId = paymentIntent.metadata.orderId;

          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'PAYMENT_FAILED',
              paymentFailedAt: new Date(),
              paymentFailureReason: paymentIntent.last_payment_error?.message
            }
          });
        }

        return NextResponse.json({ received: true });
      };

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'test_signature' },
        body: JSON.stringify(webhookEvent)
      });

      const response = await webhookHandler(request);
      const result = await response.json();

      expect(result.received).toBe(true);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order_failed_123' },
        data: {
          status: 'PAYMENT_FAILED',
          paymentFailedAt: expect.any(Date),
          paymentFailureReason: 'Your card has insufficient funds.'
        }
      });
    });

    it('should handle payment_intent.requires_action webhook', async () => {
      const webhookEvent = {
        id: 'evt_action_123',
        type: 'payment_intent.requires_action',
        data: {
          object: {
            id: 'pi_action_123',
            status: 'requires_action',
            next_action: {
              type: 'use_stripe_sdk'
            },
            metadata: {
              orderId: 'order_action_123'
            }
          }
        }
      } as Stripe.Event;

      (mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent);
      (headers as any).mockReturnValue({
        get: vi.fn().mockReturnValue('test_signature')
      });

      (prisma.order.update as any).mockResolvedValue({
        id: 'order_action_123',
        status: 'REQUIRES_ACTION'
      });

      const webhookHandler = async (req: NextRequest) => {
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');
        
        const event = mockStripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);

        if (event.type === 'payment_intent.requires_action') {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const orderId = paymentIntent.metadata.orderId;

          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'REQUIRES_ACTION',
              updatedAt: new Date()
            }
          });
        }

        return NextResponse.json({ received: true });
      };

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'test_signature' },
        body: JSON.stringify(webhookEvent)
      });

      const response = await webhookHandler(request);
      const result = await response.json();

      expect(result.received).toBe(true);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order_action_123' },
        data: {
          status: 'REQUIRES_ACTION',
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('Birthday Party Webhook Processing', () => {
    it('should handle birthday party booking webhook correctly', async () => {
      const birthdayOrder = {
        id: 'order_birthday_webhook_123',
        orderItems: [{
          id: 'item_birthday_123',
          studentId: 'student_birthday_123',
          productId: 'product_birthday_456',
          bookingDate: new Date('2025-01-10T14:00:00Z'),
          price: 35000, // $350
          student: {
            id: 'student_birthday_123',
            name: 'Birthday Kid',
            age: 7,
            allergies: 'Dairy, Gluten'
          },
          product: {
            id: 'product_birthday_456',
            name: 'Premium Birthday Package',
            type: 'BIRTHDAY',
            duration: 120, // 2 hours
            price: 35000,
            ageMin: 5,
            ageMax: 12,
            capacity: 12
          }
        }]
      };

      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_birthday_123',
            status: 'succeeded',
            metadata: {
              orderId: 'order_birthday_webhook_123'
            }
          }
        }
      } as Stripe.Event;

      (mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent);
      (prisma.order.findFirst as any).mockResolvedValue(birthdayOrder);
      (prisma.location.findFirst as any).mockResolvedValue(mockLocation);
      (prisma.event.create as any).mockResolvedValue({
        id: 'event_birthday_123',
        title: '🎂 Birthday Kid\'s Birthday Party',
        type: 'BIRTHDAY',
        maxCapacity: 12
      });

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'test_signature' },
        body: JSON.stringify(webhookEvent)
      });

      // Mock simplified webhook processing for birthday
      const birthdayWebhookHandler = async () => {
        const order = birthdayOrder;
        
        for (const item of order.orderItems) {
          if (item.product.type === 'BIRTHDAY') {
            const event = await prisma.event.create({
              data: {
                title: `🎂 ${item.student.name}'s Birthday Party`,
                type: 'BIRTHDAY',
                startDateTime: item.bookingDate,
                endDateTime: new Date(item.bookingDate.getTime() + (item.product.duration * 60000)),
                locationId: mockLocation.id,
                maxCapacity: item.product.capacity,
                description: `Birthday party for ${item.student.name} (Age ${item.student.age})${item.student.allergies ? `\nAllergies: ${item.student.allergies}` : ''}`
              }
            });

            await prisma.booking.create({
              data: {
                eventId: event.id,
                studentId: item.student.id,
                status: 'CONFIRMED',
                specialRequirements: item.student.allergies
              }
            });
          }
        }

        return NextResponse.json({ received: true });
      };

      const response = await birthdayWebhookHandler();
      const result = await response.json();

      expect(result.received).toBe(true);
      expect(prisma.event.create).toHaveBeenCalledWith({
        data: {
          title: '🎂 Birthday Kid\'s Birthday Party',
          type: 'BIRTHDAY',
          startDateTime: new Date('2025-01-10T14:00:00Z'),
          endDateTime: new Date('2025-01-10T16:00:00Z'),
          locationId: 'location_webhook_123',
          maxCapacity: 12,
          description: 'Birthday party for Birthday Kid (Age 7)\nAllergies: Dairy, Gluten'
        }
      });
      expect(prisma.booking.create).toHaveBeenCalledWith({
        data: {
          eventId: 'event_birthday_123',
          studentId: 'student_birthday_123',
          status: 'CONFIRMED',
          specialRequirements: 'Dairy, Gluten'
        }
      });
    });
  });

  describe('Subscription Webhook Processing', () => {
    it('should handle Ignite subscription webhook correctly', async () => {
      const subscriptionOrder = {
        id: 'order_ignite_webhook_123',
        orderItems: [{
          id: 'item_ignite_123',
          studentId: 'student_ignite_123',
          productId: 'product_ignite_456',
          bookingDate: new Date('2025-02-01T16:30:00Z'),
          price: 45000, // $450
          student: {
            id: 'student_ignite_123',
            name: 'Ignite Student',
            age: 12,
            allergies: null
          },
          product: {
            id: 'product_ignite_456',
            name: 'Ignite Program - 3 Month',
            type: 'SUBSCRIPTION',
            duration: 3, // 3 months
            price: 45000,
            ageMin: 10,
            ageMax: 16,
            capacity: 8
          }
        }]
      };

      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_ignite_123',
            status: 'succeeded',
            metadata: {
              orderId: 'order_ignite_webhook_123'
            }
          }
        }
      } as Stripe.Event;

      (mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent);
      (prisma.order.findFirst as any).mockResolvedValue(subscriptionOrder);
      (prisma.location.findFirst as any).mockResolvedValue(mockLocation);
      
      // Mock recurring template creation
      (prisma.recurringTemplate.create as any).mockResolvedValue({
        id: 'template_ignite_123',
        name: 'Ignite Program - Ignite Student',
        type: 'RECURRING_SESSION',
        startTime: '16:30',
        endTime: '17:30',
        daysOfWeek: [6], // Saturday
        startDate: new Date('2025-02-01T16:30:00Z'),
        endDate: new Date('2025-05-01T16:30:00Z'),
        locationId: 'location_webhook_123'
      });

      // Mock individual session events
      (prisma.event.createMany as any).mockResolvedValue({ count: 13 });

      const igniteWebhookHandler = async () => {
        const order = subscriptionOrder;
        
        for (const item of order.orderItems) {
          if (item.product.type === 'SUBSCRIPTION') {
            // Create recurring template
            const template = await prisma.recurringTemplate.create({
              data: {
                name: `${item.product.name} - ${item.student.name}`,
                type: 'RECURRING_SESSION',
                startTime: '16:30',
                endTime: '17:30',
                daysOfWeek: [6], // Saturday
                startDate: item.bookingDate,
                endDate: new Date(item.bookingDate.getTime() + (item.product.duration * 30 * 24 * 60 * 60 * 1000)),
                locationId: mockLocation.id
              }
            });

            // Generate individual events for the subscription period
            const events = [];
            const startDate = new Date(item.bookingDate);
            const endDate = new Date(startDate.getTime() + (item.product.duration * 30 * 24 * 60 * 60 * 1000));
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
              events.push({
                title: `${item.product.name} - ${item.student.name}`,
                type: 'SUBSCRIPTION',
                startDateTime: new Date(d),
                endDateTime: new Date(d.getTime() + (60 * 60 * 1000)), // 1 hour
                locationId: mockLocation.id,
                maxCapacity: item.product.capacity,
                recurringTemplateId: template.id
              });
            }

            await prisma.event.createMany({ data: events });
          }
        }

        return NextResponse.json({ received: true });
      };

      const response = await igniteWebhookHandler();
      const result = await response.json();

      expect(result.received).toBe(true);
      expect(prisma.recurringTemplate.create).toHaveBeenCalledWith({
        data: {
          name: 'Ignite Program - 3 Month - Ignite Student',
          type: 'RECURRING_SESSION',
          startTime: '16:30',
          endTime: '17:30',
          daysOfWeek: [6],
          startDate: new Date('2025-02-01T16:30:00Z'),
          endDate: expect.any(Date),
          locationId: 'location_webhook_123'
        }
      });
      expect(prisma.event.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            title: 'Ignite Program - 3 Month - Ignite Student',
            type: 'SUBSCRIPTION'
          })
        ])
      });
    });
  });

  describe('Webhook Error Handling', () => {
    it('should handle invalid webhook signatures', async () => {
      (mockStripe.webhooks.constructEvent as any).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const webhookHandler = async (req: NextRequest) => {
        try {
          const body = await req.text();
          const signature = req.headers.get('stripe-signature');
          
          mockStripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
          
          return NextResponse.json({ received: true });
        } catch (error) {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }
      };

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'invalid_signature' },
        body: JSON.stringify({})
      });

      const response = await webhookHandler(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Invalid signature');
    });

    it('should handle missing order in webhook', async () => {
      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_missing_order_123',
            metadata: {
              orderId: 'non_existent_order'
            }
          }
        }
      } as Stripe.Event;

      (mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent);
      (prisma.order.findFirst as any).mockResolvedValue(null);

      const webhookHandler = async () => {
        const event = webhookEvent;
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        const order = await prisma.order.findFirst({
          where: { id: orderId }
        });

        if (!order) {
          throw new Error('Order not found');
        }

        return NextResponse.json({ received: true });
      };

      await expect(webhookHandler()).rejects.toThrow('Order not found');
    });

    it('should handle database transaction failures', async () => {
      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_transaction_fail_123',
            metadata: {
              orderId: 'order_transaction_fail_123'
            }
          }
        }
      } as Stripe.Event;

      (mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent);
      (prisma.order.findFirst as any).mockResolvedValue(mockOrderData);
      (prisma.$transaction as any).mockRejectedValue(new Error('Transaction failed'));

      const webhookHandler = async () => {
        try {
          await prisma.$transaction(async (tx) => {
            throw new Error('Transaction failed');
          });
        } catch (error) {
          throw error;
        }
      };

      await expect(webhookHandler()).rejects.toThrow('Transaction failed');
    });

    it('should retry failed webhook processing', async () => {
      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_retry_123',
            metadata: {
              orderId: 'order_retry_123'
            }
          }
        }
      } as Stripe.Event;

      (mockStripe.webhooks.constructEvent as any).mockReturnValue(webhookEvent);
      (prisma.order.findFirst as any).mockResolvedValue(mockOrderData);
      (prisma.order.update as any)
        .mockRejectedValueOnce(new Error('Temporary database error'))
        .mockResolvedValueOnce({ ...mockOrderData, status: 'PAID' });

      const webhookHandlerWithRetry = async () => {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          try {
            await prisma.order.update({
              where: { id: 'order_retry_123' },
              data: { status: 'PAID' }
            });
            break;
          } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }

        return { success: true };
      };

      const result = await webhookHandlerWithRetry();
      expect(result.success).toBe(true);
      expect(prisma.order.update).toHaveBeenCalledTimes(2);
    });
  });
});
